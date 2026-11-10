import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useTransition, useRef } from "react";
import {
  Search,
  MapPin,
  RefreshCw,
  Heart,
  Droplets,
  Wind,
  Sun,
  Compass,
  Shirt,
  Loader2,
  X,
  Menu,
  Beer,
  Globe,
  ExternalLink,
  Palette,
  Play,
  Sparkles,
  Camera,
  Lock,
  Check,
} from "lucide-react";
import {
  type Place,
  type Weather,
  type WeatherUnit,
  type CityResult,
  DEFAULT_PLACE,
  fetchWeather,
  readSavedPlace,
  savePlace,
  readUnit,
  saveUnit,
  readCachedWeather,
  loadFavorites,
  saveFavorites,
  isSamePlace,
  searchCities,
  formatForecastTime,
  formatForecastDay,
  uvCategory,
  aqiCategory,
  getWeatherAlert,
  describeWeather,
  skyKey,
} from "@/lib/weather";
import { WeatherIcon } from "@/components/WeatherIcon";
import {
  ROOT_BEER_TIERS_DEEPER_AMBER_NO_PRICE,
  unlockWithAd24h,
  isAdUnlocked,
  saveThankYouBackgroundForever,
  isThankYouBackgroundUnlocked,
} from "@/lib/monetization";
import {
  LANDMARK_WATERCOLORS,
  WEATHER_WATERCOLORS,
} from "@/lib/aiWatercolorGenerator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Weather Pal · Local weather, made easy" },
      {
        name: "description",
        content:
          "Current weather, hourly forecast, and 7-day outlook with curated city art.",
      },
      {
        property: "og:title",
        content: "My Weather Pal · Local weather, made easy",
      },
      {
        property: "og:description",
        content:
          "Current weather, hourly forecast, and 7-day outlook with curated city art.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WeatherHome,
});

const LANGUAGES = [
  { code: "en", flag: "🇺🇸", name: "English" },
  { code: "th", flag: "🇹🇭", name: "Thai (ไทย)" },
  { code: "es", flag: "🇪🇸", name: "Spanish (Español)" },
  { code: "ja", flag: "🇯🇵", name: "Japanese (日本語)" },
  { code: "zh", flag: "🇨🇳", name: "Chinese (中文)" },
  { code: "hi", flag: "🇮🇳", name: "Hindi (हिन्दी)" },
  { code: "fr", flag: "🇫🇷", name: "French (Français)" },
  { code: "de", flag: "🇩🇪", name: "German (Deutsch)" },
  { code: "pt", flag: "🇧🇷", name: "Portuguese (Português)" },
  { code: "ru", flag: "🇷🇺", name: "Russian (Русский)" },
  { code: "ar", flag: "🇸🇦", name: "Arabic (العربية)" },
  { code: "ko", flag: "🇰🇷", name: "Korean (한국어)" },
  { code: "id", flag: "🇮🇩", name: "Indonesian (Indonesia)" },
  { code: "vi", flag: "🇻🇳", name: "Vietnamese (Tiếng Việt)" },
];

const SKY_OPTIONS = [
  { id: "auto", label: "Auto (weather)", locked: false },
  { id: "day", label: "Sunny day", locked: false },
  { id: "night", label: "Clear night", locked: false },
  { id: "cloudy", label: "Cloudy day", locked: false },
  { id: "rain", label: "Rain (Ad / Supporter)", locked: true },
  { id: "sunset", label: "Sunset (Ad / Supporter)", locked: true },
];

const FONT_OPTIONS = [
  { id: "100%", label: "Normal (100%)" },
  { id: "115%", label: "Large (115%)" },
  { id: "130%", label: "Extra Large (130%)" },
];

function isPlaceInList(p: Place, list: Place[]): boolean {
  return list.some((item) => isSamePlace(item, p));
}

function WeatherHome() {
  const [place, setPlace] = useState<Place>(() => readSavedPlace() || DEFAULT_PLACE);
  const [unit, setUnit] = useState<WeatherUnit>(() => readUnit());
  const [weather, setWeather] = useState<Weather | null>(() => readCachedWeather(place));
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  // Search autocomplete
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityResult[]>([]);
  const [, startSearch] = useTransition();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Favorites
  const [favorites, setFavorites] = useState<Place[]>(() => loadFavorites() || []);

  // UI state
  const [wearTab, setWearTab] = useState<"casual" | "business" | "sports">("casual");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [skyPreset, setSkyPreset] = useState("auto");
  const [fontSize, setFontSize] = useState("100%");

  // Wallpaper Art
  const [activeWallpaperUrl, setActiveWallpaperUrl] = useState<string | null>(null);

  // Ad & Root Beer Unlock Modal state
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [pendingUnlockTarget, setPendingUnlockTarget] = useState<{
    key: string;
    url: string;
    title: string;
  } | null>(null);
  const [watchingAd, setWatchingAd] = useState(false);
  const [adUnlockCount, setAdUnlockCount] = useState(0);

  // Root Beer Supporter status
  const [hasSupporterTier, setHasSupporterTier] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return (
      localStorage.getItem("no_ads_forever") === "true" ||
      ROOT_BEER_TIERS_DEEPER_AMBER_NO_PRICE.some((t) =>
        isThankYouBackgroundUnlocked(t.id)
      )
    );
  });

  // AI Studio state
  const [studioCity, setStudioCity] = useState("");
  const [studioScene, setStudioScene] = useState("");
  const [studioUploadedPhoto, setStudioUploadedPhoto] = useState<string | null>(null);
  const [studioPainting, setStudioPainting] = useState(false);

  // Apply font scale
  useEffect(() => {
    document.documentElement.style.fontSize = fontSize;
  }, [fontSize]);

  // Load weather
  const loadForecast = async (targetPlace: Place, targetUnit: WeatherUnit) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeather(targetPlace, targetUnit);
      setWeather(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load weather forecast");
      const cached = readCachedWeather(targetPlace);
      if (cached) setWeather(cached);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast(place, unit);
  }, [place.lat, place.lon, unit]);

  // Check if a background or slot is currently unlocked
  const isBackgroundUnlocked = (targetKey: string): boolean => {
    if (hasSupporterTier) return true;
    return isAdUnlocked(targetKey);
  };

  // Sync background with city or sky preset
  useEffect(() => {
    if (skyPreset === "day") {
      setActiveWallpaperUrl(WEATHER_WATERCOLORS.clear[0] || null);
      return;
    }
    if (skyPreset === "night") {
      setActiveWallpaperUrl(WEATHER_WATERCOLORS.clear[1] || WEATHER_WATERCOLORS.clear[0] || null);
      return;
    }
    if (skyPreset === "cloudy") {
      setActiveWallpaperUrl(WEATHER_WATERCOLORS.clouds[0] || null);
      return;
    }
    if (skyPreset === "rain") {
      setActiveWallpaperUrl(WEATHER_WATERCOLORS.rain[0] || null);
      return;
    }
    if (skyPreset === "sunset") {
      setActiveWallpaperUrl(WEATHER_WATERCOLORS.clear[1] || WEATHER_WATERCOLORS.clear[0] || null);
      return;
    }

    // Auto: select city artwork or weather fallback
    const cityKey = place.name.toLowerCase().trim();
    const cityArts = LANDMARK_WATERCOLORS[cityKey];
    if (cityArts && cityArts.length > 0) {
      setActiveWallpaperUrl(cityArts[0]);
    } else if (weather) {
      const key = skyKey(weather.current.code, weather.current.is_day);
      const cat = key.includes("rain")
        ? "rain"
        : key.includes("snow")
        ? "snow"
        : key.includes("storm") || key.includes("thunder")
        ? "thunderstorm"
        : key.includes("fog") || key.includes("mist")
        ? "fog"
        : key.includes("cloud")
        ? "clouds"
        : "clear";
      const fallbackList = WEATHER_WATERCOLORS[cat] || WEATHER_WATERCOLORS.clear;
      setActiveWallpaperUrl(fallbackList[0] || null);
    }
  }, [place.name, weather?.current.code, skyPreset]);

  // Search debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      startSearch(async () => {
        try {
          const res = await searchCities(query);
          setResults(res);
          setSearchOpen(true);
        } catch {
          setResults([]);
        }
      });
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  // Click outside search
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleSelectCity = (city: CityResult) => {
    const newPlace: Place = {
      name: city.name,
      country: city.country,
      lat: city.lat,
      lon: city.lon,
    };
    setPlace(newPlace);
    savePlace(newPlace);
    setQuery("");
    setResults([]);
    setSearchOpen(false);
  };

  const handleToggleFavorite = () => {
    const exists = isPlaceInList(place, favorites);
    const updated = exists
      ? favorites.filter((f) => !isSamePlace(f, place))
      : [...favorites, place];
    setFavorites(updated);
    saveFavorites(updated);
  };

  const handleUseLocation = () => {
    setLocationDialogOpen(false);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let locName = "Current Location";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data?.address) {
            locName =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.suburb ||
              "Current Location";
          }
        } catch {}
        const locPlace: Place = {
          name: locName,
          lat: latitude,
          lon: longitude,
        };
        setPlace(locPlace);
        savePlace(locPlace);
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
        alert("Location access was denied or timed out.");
      },
      { timeout: 10000 }
    );
  };

  const getClothingAdvice = (): string => {
    if (!weather) return "Loading outfit guidance...";
    const tempC =
      unit === "imperial"
        ? ((weather.current.temp - 32) * 5) / 9
        : weather.current.temp;
    const code = weather.current.code;
    const isRain =
      code >= 95 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
    const isSnow = (code >= 71 && code <= 77) || (code >= 85 && code <= 86);

    if (wearTab === "business") {
      if (isRain) {
        return "Commuter trench coat, polished water-resistant dress shoes, and a sturdy business umbrella.";
      }
      if (isSnow || tempC <= 5) {
        return "Tailored wool overcoat over suit, cashmere knit scarf, and insulated dress leather gloves.";
      }
      if (tempC <= 14) {
        return "Structured wool blazer, crisp dress shirt, and optional fine-knit sweater layer.";
      }
      if (tempC >= 26) {
        return "Breathable linen-blend trousers, lightweight short-sleeve dress shirt, and loafers.";
      }
      return "Lightweight tailored blazer, breathable poplin dress shirt, and classic chinos.";
    }

    if (wearTab === "sports") {
      if (isRain) {
        return "Water-repellent running shell, brimmed cap to shield eyes, and high-traction athletic shoes.";
      }
      if (isSnow || tempC <= 5) {
        return "Thermal compression base layer, windproof running tights, light sports gloves, and ear warmer.";
      }
      if (tempC <= 14) {
        return "Long-sleeve technical athletic shirt, breathable training tights, and lightweight wind shell.";
      }
      if (tempC >= 26) {
        return "Ultra-breathable mesh singlet, anti-chafing running shorts, sweatband, and electrolyte hydration.";
      }
      return "Moisture-wicking technical tee, lightweight running shorts, and cushioned trainers.";
    }

    // Casual
    if (isRain) {
      return "Carry a sturdy umbrella or rain jacket, water-resistant sneakers, and a water-safe bag.";
    }
    if (isSnow || tempC <= 5) {
      return "Heavy winter coat, thermal layers, warm knit beanie, scarf, and insulated boots.";
    }
    if (tempC <= 14) {
      return "Light jacket, denim layered over a hoodie, and comfortable sneakers.";
    }
    if (tempC >= 26) {
      return "Breathable cotton tee, lightweight shorts, sunglasses, and comfortable sneakers or sandals.";
    }
    return "Comfortable layered tee, light cardigan, and casual jeans.";
  };

  const alertItem = weather ? getWeatherAlert(weather) : null;
  const isFav = isPlaceInList(place, favorites);

  // Artwork list for AI Gallery & Next Art cycling
  const cityKey = place.name.toLowerCase().trim();
  const availableArtworks = (cityKey && LANDMARK_WATERCOLORS[cityKey]) || [
    ...WEATHER_WATERCOLORS.clear,
    ...WEATHER_WATERCOLORS.clouds,
    ...WEATHER_WATERCOLORS.rain,
  ];

  // Cycling artwork: slot 0 is free; slots 1+ require an ad or supporter tier
  const handleNextArtwork = () => {
    if (!availableArtworks.length) return;
    const currentIdx = availableArtworks.indexOf(activeWallpaperUrl || "");
    const nextIdx = (currentIdx + 1) % availableArtworks.length;
    const nextUrl = availableArtworks[nextIdx];
    const slotKey = `slot_${place.name.toLowerCase().trim()}_${nextIdx}`;

    if (nextIdx > 0 && !isBackgroundUnlocked(slotKey)) {
      setPendingUnlockTarget({
        key: slotKey,
        url: nextUrl,
        title: `${place.name} Artwork #${nextIdx + 1}`,
      });
      setUnlockModalOpen(true);
      return;
    }

    setActiveWallpaperUrl(nextUrl);
  };

  // Selecting a slot in the gallery
  const handleSelectGallerySlot = (idx: number, artUrl: string) => {
    const slotKey = `slot_${place.name.toLowerCase().trim()}_${idx}`;
    if (idx > 0 && !isBackgroundUnlocked(slotKey)) {
      setPendingUnlockTarget({
        key: slotKey,
        url: artUrl,
        title: `${place.name} Slot #${idx + 1}`,
      });
      setUnlockModalOpen(true);
      return;
    }
    setActiveWallpaperUrl(artUrl);
    setGalleryOpen(false);
  };

  // Selecting a sky background in settings
  const handleSelectSkyPreset = (presetId: string) => {
    const option = SKY_OPTIONS.find((s) => s.id === presetId);
    if (option?.locked && presetId !== "auto" && presetId !== "day" && presetId !== "night") {
      const presetKey = `sky_${presetId}`;
      if (!isBackgroundUnlocked(presetKey)) {
        const targetUrl =
          presetId === "rain"
            ? WEATHER_WATERCOLORS.rain[0]
            : WEATHER_WATERCOLORS.clear[1] || WEATHER_WATERCOLORS.clouds[0];
        setPendingUnlockTarget({
          key: presetKey,
          url: targetUrl || "",
          title: `${option.label} Sky`,
        });
        setUnlockModalOpen(true);
        return;
      }
    }
    setSkyPreset(presetId);
  };

  // Complete ad watch (24h unlock)
  const handleCompleteWatchAd = () => {
    if (!pendingUnlockTarget) return;
    setWatchingAd(true);
    setTimeout(() => {
      unlockWithAd24h(pendingUnlockTarget.key);
      if (pendingUnlockTarget.url) {
        setActiveWallpaperUrl(pendingUnlockTarget.url);
      }
      setAdUnlockCount((c) => c + 1);
      setWatchingAd(false);
      setUnlockModalOpen(false);
      setPendingUnlockTarget(null);
    }, 2200);
  };

  // Confirm Root Beer Supporter Tier (Lifetime unlock for all backgrounds)
  const handleClaimSupporterTier = (tierId: string) => {
    saveThankYouBackgroundForever(tierId);
    setHasSupporterTier(true);
    if (pendingUnlockTarget?.url) {
      setActiveWallpaperUrl(pendingUnlockTarget.url);
    }
    setUnlockModalOpen(false);
    setPendingUnlockTarget(null);
  };

  // Ambient sky background style
  const getSkyBackgroundClass = () => {
    if (skyPreset === "day") return "from-sky-400/20 via-amber-200/10 to-background";
    if (skyPreset === "night") return "from-indigo-950/40 via-slate-900/30 to-background";
    if (skyPreset === "cloudy") return "from-slate-400/20 via-zinc-300/10 to-background";
    if (skyPreset === "rain") return "from-slate-700/30 via-sky-900/20 to-background";
    if (skyPreset === "sunset") return "from-orange-500/25 via-rose-500/15 to-background";
    if (weather && !weather.current.isDay) return "from-indigo-950/30 via-slate-900/20 to-background";
    return "from-amber-500/10 via-sky-500/10 to-background";
  };

  return (
    <div className="relative min-h-screen text-foreground selection:bg-amber-500/20">
      {/* 1. SEPARATE AMBIENT FULL-APP BACKGROUND */}
      <div
        className={`fixed inset-0 pointer-events-none z-0 transition-all duration-700 bg-gradient-to-b ${getSkyBackgroundClass()}`}
      />
      {activeWallpaperUrl && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 bg-cover bg-center opacity-[0.08]"
          style={{ backgroundImage: `url("${activeWallpaperUrl}")` }}
        />
      )}

      {/* Main content wrapper */}
      <div className="relative z-10 mx-auto max-w-2xl px-3 py-4 sm:px-4 sm:py-6 space-y-4">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              My Weather Pal
            </h1>
            <p className="text-xs text-muted-foreground">
              Private • Accurate • Curated Art
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Gallery Studio Button */}
            <button
              type="button"
              onClick={() => {
                setStudioCity(place.name);
                setGalleryOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-card/85 px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs backdrop-blur-md transition hover:bg-muted cursor-pointer"
            >
              <Palette className="h-4 w-4 text-amber-500" />
              <span>City Art</span>
            </button>

            {/* Settings Menu Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="flex items-center justify-center rounded-xl border border-border/80 bg-card/85 p-2 text-foreground shadow-xs backdrop-blur-md transition hover:bg-muted cursor-pointer"
                title="Settings & Support"
              >
                <Menu className="h-4 w-4" />
              </button>

              {/* Settings Dropdown Panel */}
              {settingsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 z-50 rounded-2xl border border-border/80 bg-popover/95 p-4 shadow-xl backdrop-blur-xl space-y-4 animate-in fade-in-50 duration-150">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-sm font-bold text-foreground">Settings</span>
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Supporter Card */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs">
                      <Beer className="h-4 w-4" />
                      <span>Root Beer Supporter Tiers</span>
                      {hasSupporterTier && (
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          <Check className="h-3 w-3" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Support ongoing private weather & unlock all backgrounds ad-free forever.
                    </p>
                    <a
                      href="https://buymeacoffee.com/rod1974b"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline pt-1"
                    >
                      <span>View Supporter Tiers</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* Units Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Units
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setUnit("metric");
                          saveUnit("metric");
                        }}
                        className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                          unit === "metric"
                            ? "bg-amber-500 text-white"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Metric (°C, km/h)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUnit("imperial");
                          saveUnit("imperial");
                        }}
                        className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                          unit === "imperial"
                            ? "bg-amber-500 text-white"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        US (°F, mph)
                      </button>
                    </div>
                  </div>

                  {/* Sky Background Preset */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Sky Background
                    </label>
                    <select
                      value={skyPreset}
                      onChange={(e) => handleSelectSkyPreset(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {SKY_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Text Size Scale */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Text Size
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {FONT_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFontSize(opt.id)}
                          className={`rounded-lg py-1 text-[11px] font-semibold transition ${
                            fontSize === opt.id
                              ? "bg-amber-500 text-white"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {opt.label.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language Selector */}
                  <div className="space-y-1.5 pt-1 border-t border-border/60">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-amber-500" />
                      <span>Language</span>
                    </label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 2. CITY SEARCH BAR & LOCATION */}
        <section className="space-y-2">
          <div ref={searchRef} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setSearchOpen(true)}
                placeholder="Search city or landmark..."
                className="w-full rounded-xl border border-border/80 bg-card/90 pl-10 pr-9 py-2.5 text-sm text-foreground shadow-xs backdrop-blur-md transition placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    setSearchOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Location GPS */}
            <button
              type="button"
              onClick={() => setLocationDialogOpen(true)}
              disabled={locationLoading}
              className="flex items-center justify-center rounded-xl border border-border/80 bg-card/90 p-2.5 text-foreground shadow-xs backdrop-blur-md transition hover:bg-muted disabled:opacity-50 cursor-pointer"
              title="Use My Location"
            >
              {locationLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
              ) : (
                <Compass className="h-4 w-4 text-amber-500" />
              )}
            </button>

            {/* Autocomplete list */}
            {searchOpen && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-border/90 bg-popover/95 p-1.5 shadow-lg backdrop-blur-xl max-h-64 overflow-y-auto">
                {results.map((res, i) => (
                  <button
                    key={`${res.name}-${res.lat}-${i}`}
                    type="button"
                    onClick={() => handleSelectCity(res)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded-lg hover:bg-muted/80 transition cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-foreground">{res.name}</span>
                      {res.country && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {res.country}
                        </span>
                      )}
                    </div>
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Saved Favorites */}
          {favorites.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-muted-foreground font-medium shrink-0 flex items-center gap-1 mr-1">
                <Heart className="h-3 w-3 text-amber-500 fill-amber-500" />
                Saved:
              </span>
              {favorites.map((fav) => (
                <button
                  key={`${fav.name}-${fav.lat}`}
                  type="button"
                  onClick={() => {
                    setPlace(fav);
                    savePlace(fav);
                  }}
                  className={`rounded-lg border px-2.5 py-1 font-medium transition shrink-0 cursor-pointer ${
                    isSamePlace(fav, place)
                      ? "border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-200"
                      : "border-border/70 bg-card/80 text-foreground hover:bg-muted"
                  }`}
                >
                  {fav.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 3. WEATHER ALERT TICKER */}
        <section className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs text-card-foreground">
          {alertItem ? (
            <div className="flex items-center px-3 py-2 bg-amber-500/10 text-amber-900 dark:text-amber-200 border-b border-amber-500/20 text-xs">
              <span className="font-bold flex items-center gap-1.5 shrink-0 mr-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping inline-block" />
                <span>WEATHER ADVISORY</span>
              </span>
              <div className="overflow-hidden relative w-full">
                <span className="font-medium">{alertItem.message}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              <span>
                ALL CLEAR — No severe weather watches active in this region
              </span>
            </div>
          )}
        </section>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {place.name}
            {place.country ? `, ${place.country}` : ""}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadForecast(place, unit)}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-card/85 px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs backdrop-blur-md transition hover:bg-muted disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-xs backdrop-blur-md transition cursor-pointer ${
                isFav
                  ? "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "border-border/80 bg-card/85 text-foreground hover:bg-muted"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-amber-500 text-amber-500" : ""}`} />
              <span>{isFav ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>

        {/* 4. DEDICATED AI WALLPAPER HERO CANVAS (Separated from Current Weather) */}
        {activeWallpaperUrl && (
          <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md">
            <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-muted">
              <img
                key={activeWallpaperUrl}
                src={activeWallpaperUrl}
                alt={`${place.name} watercolor landscape`}
                className="h-full w-full object-cover transition-opacity duration-700 select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/35 pointer-events-none" />

              {/* Artwork quick action buttons (top right) */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleNextArtwork}
                  className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md transition hover:bg-black/65 cursor-pointer shadow-xs"
                  title="Next Artwork (Requires Ad or Supporter)"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Next Art</span>
                  {!hasSupporterTier && (
                    <Lock className="h-2.5 w-2.5 text-amber-400" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudioCity(place.name);
                    setGalleryOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md transition hover:bg-black/65 cursor-pointer shadow-xs"
                  title="Open Gallery & Studio"
                >
                  <Palette className="h-3 w-3 text-amber-300" />
                  <span>Gallery</span>
                </button>
              </div>

              {/* Artwork Landmark Caption (bottom) */}
              <div className="absolute bottom-3 left-4 right-4 z-10 flex items-end justify-between text-white pointer-events-none">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold tracking-tight drop-shadow-sm">
                      {place.name}
                    </span>
                    {place.country && (
                      <span className="text-xs text-white/80 font-medium">
                        · {place.country}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/75 drop-shadow-xs">
                    Hand-painted AI watercolor cityscape
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className="pointer-events-auto p-2 rounded-full bg-black/45 border border-white/20 text-white hover:text-amber-400 transition cursor-pointer shadow-xs"
                  title={isFav ? "Saved in Favorites" : "Add to Favorites"}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      isFav ? "fill-amber-500 text-amber-500" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 5. CURRENT WEATHER CONDITIONS CARD (SEPARATE FROM AI WALLPAPER) */}
        {weather && (
          <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-md backdrop-blur-md p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Current Conditions
                </span>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-foreground">
                    {Math.round(weather.current.temp)}°
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    Feels like {Math.round(weather.current.feelsLike)}°
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground capitalize">
                  {describeWeather(weather.current.code).label}
                </p>
              </div>

              <div className="p-2.5 rounded-2xl bg-amber-500/10 shrink-0">
                <WeatherIcon
                  code={weather.current.code}
                  isDay={weather.current.isDay}
                  className="size-14"
                />
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-border/60">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Droplets className="h-3 w-3 text-sky-500" /> Humidity
                </span>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {weather.current.humidity}%
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Wind className="h-3 w-3 text-teal-500" /> Wind
                </span>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {Math.round(weather.current.wind)} {unit === "imperial" ? "mph" : "km/h"}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Sun className="h-3 w-3 text-amber-500" /> UV Index
                </span>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {weather.current.uvIndex} ({uvCategory(weather.current.uvIndex)})
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Air Quality
                </span>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {weather.current.aqi ? aqiCategory(weather.current.aqi).label : "Good"}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 6. HOURLY FORECAST */}
        {weather && weather.hourly.length > 0 && (
          <section className="rounded-xl border border-border/70 bg-card/85 p-4 shadow-xs backdrop-blur-md">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Hourly Forecast (Next 24 Hours)
            </h3>
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {weather.hourly.map((h, i) => (
                <div
                  key={h.time}
                  className="flex flex-col items-center gap-1.5 shrink-0 min-w-[62px] text-center"
                >
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {i === 0 ? "Now" : formatForecastTime(h.time, weather.timezone)}
                  </span>
                  <WeatherIcon code={h.code} isDay={h.isDay} className="size-8" />
                  <span className="text-xs font-bold text-foreground">
                    {Math.round(h.temp)}°
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[62px]">
                    {describeWeather(h.code).label}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. 7-DAY FORECAST */}
        {weather && weather.daily.length > 0 && (
          <section className="rounded-xl border border-border/70 bg-card/85 p-4 shadow-xs backdrop-blur-md">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              7-Day Forecast
            </h3>
            <div className="divide-y divide-border/60">
              {weather.daily.map((d, i) => (
                <div
                  key={d.date}
                  className="flex items-center justify-between py-2.5 text-xs"
                >
                  <span className="w-24 font-medium text-foreground">
                    {i === 0 ? "Today" : formatForecastDay(d.date, weather.timezone)}
                  </span>

                  <div className="flex items-center gap-2 flex-1 px-2">
                    <WeatherIcon code={d.code} isDay={true} className="size-6" />
                    <span className="text-muted-foreground truncate">
                      {describeWeather(d.code).label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-bold text-foreground w-16 justify-end">
                    <span>{Math.round(d.high)}°</span>
                    <span className="text-muted-foreground/70 font-normal">
                      {Math.round(d.low)}°
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. WHAT TO WEAR RECOMMENDATIONS */}
        <section className="rounded-xl border border-border/70 bg-card/85 p-4 shadow-xs backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Shirt className="h-4 w-4 text-amber-500" />
              <span>What to Wear Today</span>
            </h3>

            {/* Tabs for Casual, Business, Sports */}
            <div className="flex rounded-lg border border-border/70 bg-muted/40 p-0.5 text-xs">
              {(["casual", "business", "sports"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setWearTab(tab)}
                  className={`rounded-md px-2.5 py-1 font-semibold capitalize transition ${
                    wearTab === tab
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs leading-relaxed text-foreground bg-muted/30 rounded-xl p-3 border border-border/50">
            {getClothingAdvice()}
          </p>
        </section>

        {/* Footer */}
        <footer className="pt-4 pb-2 text-center text-xs text-muted-foreground/80">
          <p>Weather data by Open-Meteo • AI Watercolor Art</p>
        </footer>
      </div>

      {/* REWARDED AD / ROOT BEER UNLOCK MODAL */}
      {unlockModalOpen && pendingUnlockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-amber-500/40 bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Lock className="h-4 w-4" />
                <h3 className="text-sm font-bold text-foreground">
                  Unlock Background
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUnlockModalOpen(false);
                  setPendingUnlockTarget(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <p className="font-semibold text-foreground">
                {pendingUnlockTarget.title}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Watch a quick 24-hour sponsored ad to unlock this artwork, or get a Root Beer Supporter Tier to unlock all backgrounds forever.
              </p>
            </div>

            {/* Unlock Options */}
            <div className="space-y-2 pt-1">
              {/* Option 1: Watch Ad (24 Hours) */}
              <button
                type="button"
                disabled={watchingAd}
                onClick={handleCompleteWatchAd}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-4 text-xs shadow-xs transition cursor-pointer disabled:opacity-60"
              >
                {watchingAd ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Viewing Ad (Unlocking 24h)...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>Watch Ad (Unlock for 24 Hours)</span>
                  </>
                )}
              </button>

              {/* Option 2: Buy a Root Beer Supporter Tier */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Beer className="h-3.5 w-3.5" />
                    <span>Root Beer Supporter</span>
                  </span>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    Forever Ad-Free
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Unlock all sky & city wallpapers permanently without needing ads.
                </p>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <a
                    href="https://buymeacoffee.com/rod1974b"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1 rounded-lg border border-amber-500/40 bg-card py-1.5 px-2 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 transition"
                  >
                    <span>Buy Root Beer</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleClaimSupporterTier("small_root_beer_tier")}
                    className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white py-1.5 px-2 text-[11px] font-semibold transition cursor-pointer"
                  >
                    <span>Claim Lifetime</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI WATERCOLOR STUDIO MODAL */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-bold text-foreground">
                  AI Watercolor Creator Studio
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGalleryOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Creator Inputs */}
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-3">
              <span className="text-xs font-bold text-foreground">
                Paint Custom City Art
              </span>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  City Name
                </label>
                <input
                  type="text"
                  value={studioCity}
                  onChange={(e) => setStudioCity(e.target.value)}
                  placeholder="e.g. Bangkok, Tokyo, Zurich..."
                  className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Scene Description
                </label>
                <input
                  type="text"
                  value={studioScene}
                  onChange={(e) => setStudioScene(e.target.value)}
                  placeholder="e.g. Old town canal at sunset with warm lantern glow"
                  className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Photo Upload Simulation */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 cursor-pointer hover:underline">
                  <Camera className="h-3.5 w-3.5" />
                  <span>{studioUploadedPhoto ? "Photo selected" : "Upload reference photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setStudioUploadedPhoto(url);
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  disabled={studioPainting}
                  onClick={() => {
                    setStudioPainting(true);
                    setTimeout(() => {
                      setStudioPainting(false);
                      if (studioUploadedPhoto) {
                        setActiveWallpaperUrl(studioUploadedPhoto);
                      } else {
                        const nextArt =
                          availableArtworks[
                            Math.floor(Math.random() * availableArtworks.length)
                          ];
                        setActiveWallpaperUrl(nextArt);
                      }
                      setGalleryOpen(false);
                    }, 800);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-60"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{studioPainting ? "Painting..." : "Paint Watercolor"}</span>
                </button>
              </div>
            </div>

            {/* City Artwork Collection & 24h Gated Slots */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground">
                {place.name} Artworks & Slots
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                {availableArtworks.map((artUrl, idx) => {
                  const slotKey = `slot_${place.name.toLowerCase().trim()}_${idx}`;
                  const isUnlocked = idx === 0 || isBackgroundUnlocked(slotKey);

                  return (
                    <div
                      key={`${artUrl}-${idx}-${adUnlockCount}`}
                      className="group relative rounded-xl border border-border/80 overflow-hidden bg-muted aspect-video shadow-xs"
                    >
                      <img
                        src={artUrl}
                        alt={`City art ${idx + 1}`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 flex flex-col justify-end text-white">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1">
                            <span>Slot #{idx + 1}</span>
                            {!isUnlocked && (
                              <Lock className="h-3 w-3 text-amber-400" />
                            )}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleSelectGallerySlot(idx, artUrl)}
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold text-white shadow-xs transition cursor-pointer ${
                              isUnlocked
                                ? "bg-amber-500 hover:bg-amber-600"
                                : "bg-amber-600/90 hover:bg-amber-600 flex items-center gap-1"
                            }`}
                          >
                            {isUnlocked ? (
                              "Apply"
                            ) : (
                              <>
                                <Play className="h-2.5 w-2.5" />
                                <span>Unlock</span>
                              </>
                            )}
                          </button>
                        </div>

                        {idx > 0 && isUnlocked && (
                          <span className="text-[9px] text-amber-300 mt-0.5">
                            {hasSupporterTier ? "Unlocked (Lifetime)" : "Unlocked (24h)"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Supporter Tiers embedded in Gallery */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Beer className="h-4 w-4" />
                Root Beer Supporter Tiers
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {ROOT_BEER_TIERS_DEEPER_AMBER_NO_PRICE.map((tier) => (
                  <a
                    key={tier.id}
                    href="https://buymeacoffee.com/rod1974b"
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col p-2 rounded-lg bg-card/80 border border-border/80 hover:border-amber-500 transition"
                  >
                    <span className="font-bold text-foreground text-[11px]">
                      {tier.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">
                      {tier.tagline || tier.displayPrice}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Rationale Dialog */}
      {locationDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <Compass className="h-5 w-5" />
              <h3 className="text-sm font-bold text-foreground">
                Location Permission
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We request your GPS location only to fetch your immediate local
              forecast. We do not store or track your coordinates anywhere.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLocationDialogOpen(false)}
                className="rounded-xl border border-border/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUseLocation}
                className="rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
              >
                Allow Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
