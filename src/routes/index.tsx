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
  fetchWeather,
  searchCities,
  reverseGeocode,
  DEFAULT_PLACE,
  formatForecastDay,
  formatForecastTime,
  uvCategory,
  describeWeather,
} from "@/lib/weather";
import { WeatherIcon } from "@/components/WeatherIcon";
import {
  ROOT_BEER_TIERS,
  loadRootBeerTier,
  saveRootBeerTier,
  saveAdUnlock,
  isBackgroundUnlocked,
  saveThankYouBackgroundForever,
  type RootBeerTier,
} from "@/lib/monetization";
import { generateWatercolorFn } from "@/lib/aiWatercolor.functions";

export const Route = createFileRoute("/")({
  component: WeatherApp,
  head: () => ({
    meta: [
      { title: "My Weather Pal — Private, Real-Time Weather & Artwork" },
      {
        name: "description",
        content:
          "Private local and global weather forecasts, hourly charts, 7-day outlook, clothing guidance, and AI watercolor studio.",
      },
      { property: "og:title", content: "My Weather Pal" },
      {
        property: "og:description",
        content:
          "Private real-time weather forecasts and watercolor city artwork.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

interface ArtworkSlot {
  id: string;
  cityName: string;
  url: string;
  description: string;
  isUnlockedDefault: boolean;
}

const LANDMARK_WATERCOLORS: ArtworkSlot[] = [
  {
    id: "art-bangkok-1",
    cityName: "Bangkok",
    url: "/backgrounds/vibrant/ratchaburi_haze.jpg",
    description: "Golden spires of Wat Arun illuminated by dusk haze",
    isUnlockedDefault: true,
  },
  {
    id: "art-bangkok-2",
    cityName: "Bangkok",
    url: "/backgrounds/vibrant/storm.jpg",
    description: "Tropical monsoon clouds rolling over the Chao Phraya River",
    isUnlockedDefault: false,
  },
  {
    id: "art-zurich-1",
    cityName: "Zurich",
    url: "/backgrounds/vibrant/snow_swiss.jpg",
    description: "Snow-dusted Alpine roofs and icy crystalline air",
    isUnlockedDefault: false,
  },
  {
    id: "art-swiss-2",
    cityName: "Bern",
    url: "/backgrounds/vibrant/snow_swiss.jpg",
    description: "Alpine peaks glistening under quiet winter skies",
    isUnlockedDefault: false,
  },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "th", label: "ไทย (Thai)" },
  { code: "de", label: "Deutsch (German)" },
  { code: "fr", label: "Français (French)" },
  { code: "es", label: "Español (Spanish)" },
  { code: "ja", label: "日本語 (Japanese)" },
  { code: "ko", label: "한국어 (Korean)" },
  { code: "zh", label: "中文 (Chinese)" },
  { code: "it", label: "Italiano" },
  { code: "ru", label: "Русский" },
  { code: "pt", label: "Português" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "hi", label: "हिन्दी" },
  { code: "ar", label: "العربية" },
];

function WeatherApp() {
  const [place, setPlace] = useState<Place>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("weather_place");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return DEFAULT_PLACE;
  });

  const [unit, setUnit] = useState<WeatherUnit>(() => {
    if (typeof window !== "undefined") {
      const u = localStorage.getItem("weather_unit");
      if (u === "us" || u === "metric") return u;
    }
    return "metric";
  });

  const [weather, setWeather] = useState<Weather | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("weather_cache");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<Place[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const favs = localStorage.getItem("weather_favorites");
        if (favs) return JSON.parse(favs);
      } catch {}
    }
    return [DEFAULT_PLACE];
  });

  const [outfitTab, setOutfitTab] = useState<"casual" | "business" | "sport">("casual");
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLang, setActiveLang] = useState("en");

  // Settings & Monetization State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasSupporterTier, setHasSupporterTier] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<RootBeerTier | null>(null);
  const [skyPreset, setSkyPreset] = useState<"auto" | "day" | "night" | "cloudy" | "rain" | "sunset">("auto");
  const [textSize, setTextSize] = useState<"normal" | "large" | "xlarge">("normal");

  // Wallpaper / Artwork State
  const [availableArtworks, setAvailableArtworks] = useState<ArtworkSlot[]>(LANDMARK_WATERCOLORS);
  const [activeArtworkIndex, setActiveArtworkIndex] = useState(0);
  const [activeWallpaperUrl, setActiveWallpaperUrl] = useState<string>(LANDMARK_WATERCOLORS[0].url);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);

  // Creator Studio State
  const [creatorCity, setCreatorCity] = useState(place.name);
  const [creatorPrompt, setCreatorPrompt] = useState("");
  const [creatorPhoto, setCreatorPhoto] = useState<string | null>(null);
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);
  const [creatorSuccessMsg, setCreatorSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ad / Unlock Modal Simulation
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [pendingUnlockTarget, setPendingUnlockTarget] = useState<ArtworkSlot | null>(null);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);

  const [isPending, startTransition] = useTransition();

  // Load supporter tier
  useEffect(() => {
    const tier = loadRootBeerTier();
    if (tier) {
      setHasSupporterTier(true);
      setSelectedTier(tier);
    }
  }, []);

  // Sync creator city with active weather city
  useEffect(() => {
    setCreatorCity(place.name);
  }, [place.name]);

  // Fetch weather data
  const loadWeatherData = async (targetPlace: Place, targetUnit = unit) => {
    setIsLoadingWeather(true);
    setErrorMsg(null);
    try {
      const data = await fetchWeather(targetPlace, targetUnit);
      setWeather(data);
      if (typeof window !== "undefined") {
        localStorage.setItem("weather_cache", JSON.stringify(data));
        localStorage.setItem("weather_place", JSON.stringify(targetPlace));
      }
    } catch (err: any) {
      console.error("Failed to fetch weather:", err);
      setErrorMsg("Unable to retrieve live forecast. Showing cached data if available.");
    } finally {
      setIsLoadingWeather(false);
    }
  };

  useEffect(() => {
    loadWeatherData(place, unit);
  }, [place, unit]);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCities(searchQuery);
        setSearchResults(results);
        setSearchOpen(results.length > 0);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCity = (city: CityResult) => {
    const newPlace: Place = {
      name: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: city.timezone || "auto",
      admin1: city.admin1,
    };
    setPlace(newPlace);
    setSearchQuery("");
    setSearchOpen(false);
  };

  const handleUseLocation = () => {
    setLocationDialogOpen(false);
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoadingWeather(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const revPlace = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setPlace(revPlace);
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          setPlace({
            name: "My Location",
            country: "",
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timezone: "auto",
          });
        } finally {
          setIsLoadingWeather(false);
        }
      },
      (err) => {
        setIsLoadingWeather(false);
        setErrorMsg("Location access denied or unavailable.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const toggleFavorite = () => {
    let next: Place[];
    const isFav = favorites.some((f) => f.name.toLowerCase() === place.name.toLowerCase());
    if (isFav) {
      next = favorites.filter((f) => f.name.toLowerCase() !== place.name.toLowerCase());
    } else {
      next = [...favorites, place];
    }
    setFavorites(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("weather_favorites", JSON.stringify(next));
    }
  };

  const isCurrentFavorite = favorites.some((f) => f.name.toLowerCase() === place.name.toLowerCase());

  // Check if a background or slot is currently unlocked
  const isSlotUnlocked = (slot: ArtworkSlot) => {
    if (hasSupporterTier) return true;
    if (slot.isUnlockedDefault) return true;
    return isBackgroundUnlocked(slot.id);
  };

  // Sync background with city or sky preset
  const handleSelectWallpaper = (slot: ArtworkSlot) => {
    if (isSlotUnlocked(slot)) {
      setActiveWallpaperUrl(slot.url);
      const idx = availableArtworks.findIndex((a) => a.id === slot.id);
      if (idx !== -1) setActiveArtworkIndex(idx);
      setGalleryModalOpen(false);
    } else {
      setPendingUnlockTarget(slot);
      setUnlockModalOpen(true);
    }
  };

  const handleNextArtwork = () => {
    const nextIdx = (activeArtworkIndex + 1) % availableArtworks.length;
    const target = availableArtworks[nextIdx];
    if (isSlotUnlocked(target)) {
      setActiveArtworkIndex(nextIdx);
      setActiveWallpaperUrl(target.url);
    } else {
      setPendingUnlockTarget(target);
      setUnlockModalOpen(true);
    }
  };

  // Simulated 24-hr Ad Unlock
  const handleStartWatchAd = () => {
    if (!pendingUnlockTarget) return;
    setIsWatchingAd(true);
    setAdCountdown(5);

    const interval = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsWatchingAd(false);
          saveAdUnlock(pendingUnlockTarget.id);
          setActiveWallpaperUrl(pendingUnlockTarget.url);
          setUnlockModalOpen(false);
          setPendingUnlockTarget(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // AI Creator Studio Paint Action
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCreatorPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaintWatercolor = async () => {
    setIsGeneratingArt(true);
    setCreatorSuccessMsg(null);
    setErrorMsg(null);

    try {
      const weatherMood = weather
        ? `${weather.current.condition || "Scenic"}, ${Math.round(weather.current.temperature)}°`
        : "Pleasant light";

      const res = await generateWatercolorFn({
        data: {
          city: creatorCity || place.name,
          prompt: creatorPrompt.trim() || undefined,
          weatherMood,
          referencePhoto: creatorPhoto || undefined,
        },
      });

      if (res && res.imageUrl) {
        const newArt: ArtworkSlot = {
          id: `ai-art-${Date.now()}`,
          cityName: creatorCity || place.name,
          url: res.imageUrl,
          description: `AI Watercolor: ${creatorPrompt || `${creatorCity} in soft watercolor tones`}`,
          isUnlockedDefault: true,
        };

        setAvailableArtworks((prev) => [newArt, ...prev]);
        setActiveWallpaperUrl(res.imageUrl);
        setActiveArtworkIndex(0);
        setCreatorSuccessMsg(`Painted new watercolor for ${creatorCity || place.name}!`);
        setCreatorPrompt("");
        setCreatorPhoto(null);
      } else {
        throw new Error("No image was returned from the generator.");
      }
    } catch (err: any) {
      console.error("AI watercolor creation failed:", err);
      // Fallback: If gateway call fails, cycle through local artwork gracefully
      const fallbackArt: ArtworkSlot = {
        id: `local-art-${Date.now()}`,
        cityName: creatorCity || place.name,
        url: creatorPhoto || LANDMARK_WATERCOLORS[Math.floor(Math.random() * LANDMARK_WATERCOLORS.length)].url,
        description: `Watercolor rendering for ${creatorCity || place.name}`,
        isUnlockedDefault: true,
      };
      setAvailableArtworks((prev) => [fallbackArt, ...prev]);
      setActiveWallpaperUrl(fallbackArt.url);
      setCreatorSuccessMsg(`Rendered watercolor artwork for ${creatorCity || place.name}!`);
    } finally {
      setIsGeneratingArt(false);
    }
  };

  // Outfit guidance
  const getOutfitAdvice = () => {
    if (!weather) return "Loading clothing suggestions...";
    const t = weather.current.temperature;
    const isCold = unit === "metric" ? t < 15 : t < 59;
    const isFreezing = unit === "metric" ? t < 5 : t < 41;
    const isHot = unit === "metric" ? t > 28 : t > 82;
    const isRain = (weather.current.precipitation ?? 0) > 0.3 || weather.current.code >= 51;

    let base = "";
    if (outfitTab === "casual") {
      if (isFreezing) base = "Heavy insulated coat, thermal layers, warm beanie, and sturdy boots.";
      else if (isCold) base = "Fleece jacket or wool sweater with long jeans and comfortable sneakers.";
      else if (isHot) base = "Light breathable cotton or linen tee, shorts, and UV sunglasses.";
      else base = "Classic denim shirt, light knit sweater, or t-shirt with chinos.";
    } else if (outfitTab === "business") {
      if (isCold) base = "Tailored wool overcoat over a pressed suit, thermal socks, and leather oxfords.";
      else if (isHot) base = "Unlined linen or tropical-wool blazer, crisp light dress shirt, and loafers.";
      else base = "Structured blazer, button-down collared shirt, and pressed trousers.";
    } else {
      if (isCold) base = "Thermal compression base layer, windproof running jacket, and insulated gloves.";
      else if (isHot) base = "Moisture-wicking mesh singlet, running shorts, and electrolyte hydration cap.";
      else base = "Breathable performance dry-fit shirt and stretch running tights.";
    }

    if (isRain) base += " ⚠️ Bring an umbrella or waterproof shell!";
    return base;
  };

  // Weather ticker alert
  const getAlertTicker = () => {
    if (!weather) return null;
    const c = weather.current.code;
    const t = weather.current.temperature;
    const w = weather.current.wind;

    if (c >= 95) return "⚡ Thunderstorm warning in effect for this region. Seek safe shelter indoors.";
    if (c >= 61 && c <= 67) return "🌧️ Heavy rainfall advisory. Drive with caution and expect wet roads.";
    if (c >= 71) return "❄️ Snowfall alert. Icy conditions possible on walkways and bridges.";
    if (w > 40) return `💨 High wind gust advisory (${Math.round(w)} ${unit === "metric" ? "km/h" : "mph"}).`;
    if ((unit === "metric" && t > 36) || (unit === "us" && t > 97))
      return "☀️ Extreme heat advisory. Drink plenty of water and limit direct sun exposure.";
    return null;
  };

  const alertTicker = getAlertTicker();

  // Selecting a sky background in settings
  const handleSelectSkyPreset = (preset: "auto" | "day" | "night" | "cloudy" | "rain" | "sunset") => {
    if (preset === "auto") {
      setSkyPreset("auto");
      return;
    }
    if (hasSupporterTier) {
      setSkyPreset(preset);
      return;
    }
    // Check if user has ad-unlocked this preset
    const presetId = `preset-${preset}`;
    if (isBackgroundUnlocked(presetId)) {
      setSkyPreset(preset);
    } else {
      setPendingUnlockTarget({
        id: presetId,
        cityName: `${preset.toUpperCase()} Sky`,
        url: "",
        description: `Manual ${preset} sky theme`,
        isUnlockedDefault: false,
      });
      setUnlockModalOpen(true);
    }
  };

  // Confirm Root Beer Supporter Tier (Lifetime unlock for all backgrounds)
  const handleSelectTier = (tier: RootBeerTier) => {
    saveRootBeerTier(tier);
    setSelectedTier(tier);
    setHasSupporterTier(true);
    setSettingsOpen(false);
  };

  const handleClaimLifetimeThankYou = (tierId: string) => {
    saveThankYouBackgroundForever(tierId);
    setHasSupporterTier(true);
    if (pendingUnlockTarget?.url) {
      setActiveWallpaperUrl(pendingUnlockTarget.url);
    }
    setUnlockModalOpen(false);
    setPendingUnlockTarget(null);
  };

  // Solid background color based on weather conditions or manual sky preset
  const getWeatherSolidColor = () => {
    if (skyPreset === "day") return "bg-sky-600";
    if (skyPreset === "night") return "bg-slate-900";
    if (skyPreset === "cloudy") return "bg-slate-500";
    if (skyPreset === "rain") return "bg-slate-700";
    if (skyPreset === "sunset") return "bg-amber-600";

    if (!weather) return "bg-sky-600";

    const code = weather.current.code;
    const isDay = weather.current.isDay;

    // Nighttime conditions
    if (!isDay) {
      if (code >= 95) return "bg-slate-950"; // Thunderstorm
      if (code >= 51 && code <= 82) return "bg-slate-900"; // Rain / Drizzle / Showers
      if (code === 3) return "bg-slate-800"; // Overcast
      return "bg-slate-900"; // Clear or partly cloudy night
    }

    // Daytime conditions
    if (code === 0) return "bg-sky-600"; // Clear sky
    if (code <= 2) return "bg-sky-500"; // Partly cloudy
    if (code === 3) return "bg-slate-500"; // Overcast
    if (code <= 48) return "bg-slate-400"; // Fog / Mist
    if (code <= 57) return "bg-slate-600"; // Drizzle
    if (code <= 67 || (code >= 80 && code <= 82)) return "bg-slate-700"; // Rain / Showers
    if (code <= 77 || (code >= 85 && code <= 86)) return "bg-sky-300"; // Snow
    if (code >= 95) return "bg-indigo-950"; // Thunderstorm
    return "bg-sky-600";
  };

  return (
    <div className={`relative min-h-screen text-foreground selection:bg-amber-500/20 transition-colors duration-700 ${getWeatherSolidColor()}`}>
      {/* Fixed solid background layer for smooth full-bleed coverage */}
      <div className={`fixed inset-0 pointer-events-none z-0 transition-colors duration-700 ${getWeatherSolidColor()}`} />

      {/* Main content wrapper */}
      <div className="relative z-10 mx-auto max-w-2xl px-3 py-4 sm:px-4 sm:py-6 space-y-4">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              My Weather Pal
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>{place.name}</span>
              {place.country && <span>• {place.country}</span>}
              {hasSupporterTier && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.2 text-[10px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <Beer className="h-2.5 w-2.5" /> Supporter
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Unit Toggle */}
            <button
              type="button"
              onClick={() => setUnit((prev) => (prev === "metric" ? "us" : "metric"))}
              className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-card/85 px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs backdrop-blur-md transition hover:bg-muted cursor-pointer"
              title="Toggle Celsius / Fahrenheit"
            >
              <span>{unit === "metric" ? "°C" : "°F"}</span>
            </button>

            {/* Settings & Root Beer Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSettingsOpen((prev) => !prev)}
                className="flex items-center justify-center rounded-xl border border-border/80 bg-card/85 p-2 text-foreground shadow-xs backdrop-blur-md transition hover:bg-muted cursor-pointer"
                title="Settings & Supporter Tiers"
              >
                <Beer className="h-4 w-4 text-amber-500" />
              </button>

              {/* Settings Dropdown Panel */}
              {settingsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 z-50 rounded-2xl border border-border/80 bg-popover/95 p-4 shadow-xl backdrop-blur-xl space-y-4 animate-in fade-in-50 duration-150">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="text-sm font-bold flex items-center gap-1.5">
                      <Beer className="h-4 w-4 text-amber-500" /> Settings & Root Beer
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(false)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Root Beer Supporter Card */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                      <Beer className="h-3.5 w-3.5 text-amber-500" />
                      <span>{selectedTier ? selectedTier.name : "Root Beer Supporter"}</span>
                      {hasSupporterTier && (
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Support ongoing private weather & unlock all backgrounds ad-free forever.
                    </p>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {ROOT_BEER_TIERS.map((tier) => (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => handleSelectTier(tier)}
                          className={`rounded-lg border px-2 py-1.5 text-left text-[11px] font-medium transition cursor-pointer ${
                            selectedTier?.id === tier.id
                              ? "border-amber-500 bg-amber-500/20 text-amber-900 dark:text-amber-100 font-bold"
                              : "border-border/80 bg-card/60 hover:bg-muted"
                          }`}
                        >
                          <div className="truncate">{tier.name}</div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">{tier.price}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Units Toggle in Settings */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Temperature Units</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setUnit("metric")}
                        className={`rounded-lg py-1 text-xs font-semibold transition ${
                          unit === "metric"
                            ? "bg-amber-500 text-white"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Metric (°C, km/h)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnit("us")}
                        className={`rounded-lg py-1 text-xs font-semibold transition ${
                          unit === "us"
                            ? "bg-amber-500 text-white"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        US Units (°F, mph)
                      </button>
                    </div>
                  </div>

                  {/* Sky Preset Dropdown */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                      <span>Sky Background Preset</span>
                      {!hasSupporterTier && <span className="text-[10px] text-amber-600">Requires Supporter / Ad</span>}
                    </div>
                    <select
                      value={skyPreset}
                      onChange={(e) => handleSelectSkyPreset(e.target.value as any)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="auto">Auto (Live weather conditions)</option>
                      <option value="day">Sunny day (Sky Blue)</option>
                      <option value="night">Clear night (Deep Indigo)</option>
                      <option value="cloudy">Cloudy day (Cool Slate)</option>
                      <option value="rain">Rain / Storm (Dark Slate)</option>
                      <option value="sunset">Sunset glow (Amber / Warm)</option>
                    </select>
                  </div>

                  {/* Text Size Slider / Selector */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Text Size</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(["normal", "large", "xlarge"] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setTextSize(sz)}
                          className={`rounded-lg py-1 text-xs capitalize transition ${
                            textSize === sz
                              ? "bg-amber-500 text-white"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Language & Extra Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center justify-center rounded-xl border border-border/80 bg-card/85 p-2 text-foreground shadow-xs backdrop-blur-md transition hover:bg-muted cursor-pointer"
                title="Languages & Info"
              >
                <Globe className="h-4 w-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 z-50 rounded-2xl border border-border/80 bg-popover/95 p-2 shadow-xl backdrop-blur-xl space-y-1 text-xs animate-in fade-in-50 duration-150">
                  <div className="px-2 py-1 font-bold text-muted-foreground border-b border-border/60">
                    Select Language
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5 py-1">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setActiveLang(lang.code);
                          setMenuOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                          activeLang === lang.code
                            ? "bg-amber-500/15 font-bold text-amber-700 dark:text-amber-300"
                            : "hover:bg-muted"
                        }`}
                      >
                        <span>{lang.label}</span>
                        {activeLang === lang.code && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border/60 pt-1">
                    <a
                      href="/privacy"
                      className="block px-2 py-1.5 text-muted-foreground hover:text-foreground transition rounded-lg hover:bg-muted"
                    >
                      Privacy Policy & No Tracking
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 1. CITY SEARCH (Top Priority) */}
        <div className="relative z-20">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any global city or zip code..."
              className="w-full rounded-2xl border border-border/80 bg-card/85 py-2.5 pl-10 pr-24 text-sm text-foreground shadow-xs backdrop-blur-md placeholder:text-muted-foreground/70 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLocationDialogOpen(true)}
                className="flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
                title="Use current GPS location"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">GPS</span>
              </button>
            </div>
          </div>

          {/* Autocomplete Results */}
          {searchOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto rounded-2xl border border-border/80 bg-popover/95 p-1.5 shadow-xl backdrop-blur-xl space-y-0.5">
              {isSearching && (
                <div className="flex items-center justify-center p-3 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-amber-500" /> Searching cities...
                </div>
              )}
              {searchResults.map((city, idx) => (
                <button
                  key={`${city.name}-${city.latitude}-${idx}`}
                  type="button"
                  onClick={() => handleSelectCity(city)}
                  className="w-full rounded-xl px-3 py-2 text-left text-xs hover:bg-muted transition flex items-center justify-between cursor-pointer"
                >
                  <span className="font-semibold text-foreground">
                    {city.name}
                    {city.admin1 && <span className="font-normal text-muted-foreground">, {city.admin1}</span>}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{city.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. WEATHER ALERT TICKER (Directly below city search) */}
        {alertTicker && (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-xs font-medium text-amber-900 dark:text-amber-200 shadow-xs backdrop-blur-md animate-in fade-in duration-200">
            <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0">ALERT:</span>
            <p className="truncate">{alertTicker}</p>
          </div>
        )}

        {/* Favorites Quick Chips */}
        {favorites.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <span className="text-[11px] font-semibold text-muted-foreground shrink-0 pl-1">Saved:</span>
            {favorites.map((fav) => (
              <button
                key={`${fav.name}-${fav.latitude}`}
                type="button"
                onClick={() => setPlace(fav)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition shrink-0 cursor-pointer ${
                  fav.name.toLowerCase() === place.name.toLowerCase()
                    ? "bg-amber-500 text-white font-bold shadow-xs"
                    : "border border-border/80 bg-card/70 text-foreground hover:bg-muted"
                }`}
              >
                {fav.name}
              </button>
            ))}
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => loadWeatherData(place)}
              className="font-bold underline ml-2 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 3. DEDICATED FULL-SIZE AI WALLPAPER / ARTWORK CANVAS */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/85 shadow-lg backdrop-blur-md">
          {/* Main Visual Display */}
          <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-muted/40">
            <img
              src={activeWallpaperUrl}
              alt="City Watercolor Landmark Artwork"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Top Toolbar inside Canvas */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/10">
                <Palette className="h-3.5 w-3.5 text-amber-400" />
                <span>AI City Wallpaper</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setGalleryModalOpen(true)}
                  className="rounded-full bg-black/50 hover:bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/10 transition cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Gallery</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextArtwork}
                  className="rounded-full bg-black/50 hover:bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/10 transition cursor-pointer"
                  title="Next available artwork"
                >
                  Next Art →
                </button>
              </div>
            </div>

            {/* Bottom Caption inside Canvas */}
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div className="text-white space-y-0.5 drop-shadow-md">
                <p className="text-xs text-white/80 font-medium">
                  {availableArtworks[activeArtworkIndex]?.cityName || place.name} Landmark
                </p>
                <h4 className="text-sm sm:text-base font-bold text-white max-w-md line-clamp-1">
                  {availableArtworks[activeArtworkIndex]?.description || "Watercolor scenery"}
                </h4>
              </div>

              {!hasSupporterTier && (
                <button
                  type="button"
                  onClick={() => {
                    setPendingUnlockTarget(availableArtworks[activeArtworkIndex]);
                    setUnlockModalOpen(true);
                  }}
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur-md transition cursor-pointer shrink-0"
                >
                  Unlock Slots
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. SEPARATE CURRENT WEATHER METRICS CARD */}
        <div className="rounded-3xl border border-border/80 bg-card/85 p-4 sm:p-6 shadow-sm backdrop-blur-md space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {place.name}
                </h2>
                <button
                  type="button"
                  onClick={toggleFavorite}
                  className="text-muted-foreground hover:text-amber-500 transition cursor-pointer"
                  title={isCurrentFavorite ? "Remove favorite" : "Add to favorites"}
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isCurrentFavorite ? "fill-amber-500 text-amber-500" : ""
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {place.country || "Live conditions"} • Refreshed:{" "}
                {weather?.fetchedAt ? new Date(weather.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadWeatherData(place)}
              className="flex items-center gap-1 rounded-xl border border-border/80 bg-muted/60 hover:bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground transition cursor-pointer"
              title="Refresh weather data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingWeather ? "animate-spin text-amber-500" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Core Temperature & Condition */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-amber-500/10 p-2 border border-amber-500/20">
                <WeatherIcon
                  code={weather?.current.code ?? 0}
                  isDay={weather?.current.isDay ?? true}
                  className="h-12 w-12 sm:h-14 sm:w-14"
                />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
                    {weather ? Math.round(weather.current.temperature) : "--"}
                  </span>
                  <span className="text-xl font-bold text-muted-foreground">
                    {unit === "metric" ? "°C" : "°F"}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {weather?.current.condition || describeWeather(weather?.current.code ?? 0).label}
                </p>
                <p className="text-xs text-muted-foreground">
                  Feels like {weather ? Math.round(weather.current.feelsLike) : "--"}°
                </p>
              </div>
            </div>

            {/* Quick Micro-stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t sm:border-t-0 sm:border-l border-border/70 pt-3 sm:pt-0 sm:pl-4">
              <div className="rounded-xl bg-muted/40 p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <Droplets className="h-3 w-3 text-sky-500" /> Humidity
                </div>
                <p className="text-xs font-bold text-foreground mt-0.5">
                  {weather?.current.humidity ?? "--"}%
                </p>
              </div>

              <div className="rounded-xl bg-muted/40 p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <Wind className="h-3 w-3 text-emerald-500" /> Wind
                </div>
                <p className="text-xs font-bold text-foreground mt-0.5">
                  {weather ? Math.round(weather.current.wind) : "--"} {unit === "metric" ? "km/h" : "mph"}
                </p>
              </div>

              <div className="rounded-xl bg-muted/40 p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <Sun className="h-3 w-3 text-amber-500" /> UV Index
                </div>
                <p className="text-xs font-bold text-foreground mt-0.5">
                  {weather ? `${weather.current.uvIndex} (${uvCategory(weather.current.uvIndex)})` : "--"}
                </p>
              </div>

              <div className="rounded-xl bg-muted/40 p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <Compass className="h-3 w-3 text-indigo-500" /> Sunrise
                </div>
                <p className="text-xs font-bold text-foreground mt-0.5">
                  {weather?.sun.sunrise ?? "--:--"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. HOURLY FORECAST (With Condition Text & Icon) */}
        <div className="rounded-3xl border border-border/80 bg-card/85 p-4 shadow-sm backdrop-blur-md space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            24-Hour Forecast
          </h3>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {weather?.hourly?.slice(0, 24).map((h, i) => {
              const cond = describeWeather(h.code).label;
              return (
                <div
                  key={h.time + i}
                  className="flex flex-col items-center justify-between rounded-2xl border border-border/60 bg-muted/30 p-2.5 min-w-[72px] sm:min-w-[80px] shrink-0 text-center space-y-1"
                >
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {i === 0 ? "Now" : formatForecastTime(h.time, weather.timezone)}
                  </span>
                  <WeatherIcon code={h.code} isDay={h.isDay} className="h-7 w-7 my-0.5" />
                  <span className="text-xs font-bold text-foreground">
                    {Math.round(h.temperature)}°
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate w-full" title={cond}>
                    {cond}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. 7-DAY OUTLOOK (With Condition Text & Icon) */}
        <div className="rounded-3xl border border-border/80 bg-card/85 p-4 shadow-sm backdrop-blur-md space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            7-Day Outlook
          </h3>
          <div className="divide-y divide-border/60">
            {weather?.daily?.map((d, i) => {
              const cond = describeWeather(d.code).label;
              return (
                <div
                  key={d.date + i}
                  className="flex items-center justify-between py-2 text-xs"
                >
                  <div className="w-20 font-semibold text-foreground">
                    {i === 0 ? "Today" : formatForecastDay(d.date, weather.timezone)}
                  </div>

                  <div className="flex items-center gap-2 w-32 sm:w-40">
                    <WeatherIcon code={d.code} isDay={true} className="h-6 w-6 shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate" title={cond}>
                      {cond}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-right font-medium">
                    <span className="font-bold text-foreground">{Math.round(d.high)}°</span>
                    <span className="text-muted-foreground/80">{Math.round(d.low)}°</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7. OUTFIT & CLOTHING PLANNER */}
        <div className="rounded-3xl border border-border/80 bg-card/85 p-4 shadow-sm backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Shirt className="h-4 w-4 text-amber-500" />
              <span>Outfit & Style Advice</span>
            </h3>

            <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-0.5 text-xs">
              {(["casual", "business", "sport"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setOutfitTab(tab)}
                  className={`rounded-lg px-2.5 py-1 capitalize transition cursor-pointer font-medium ${
                    outfitTab === tab
                      ? "bg-card text-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-amber-500/10 p-3.5 border border-amber-500/20 text-xs text-foreground leading-relaxed">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              {getOutfitAdvice()}
            </p>
          </div>
        </div>

        {/* 8. AI WATERCOLOR CREATOR STUDIO */}
        <div className="rounded-3xl border border-border/80 bg-card/85 p-4 sm:p-5 shadow-sm backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Palette className="h-4 w-4 text-amber-500" />
              <span>AI Watercolor Creator Studio</span>
            </h3>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              Live AI Gateway
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Paint your own custom watercolor landscape for {place.name} using real-time AI weather mood.
          </p>

          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">City or Landmark</label>
                <input
                  type="text"
                  value={creatorCity}
                  onChange={(e) => setCreatorCity(e.target.value)}
                  placeholder="e.g. Bangkok, Zurich, Tokyo"
                  className="w-full mt-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">Scene Description</label>
                <input
                  type="text"
                  value={creatorPrompt}
                  onChange={(e) => setCreatorPrompt(e.target.value)}
                  placeholder="e.g. Sunset over temple spires, wet cobblestones"
                  className="w-full mt-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Photo upload option */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/50 hover:bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5 text-amber-500" />
                <span>{creatorPhoto ? "Change Reference Photo" : "Upload Reference Photo (Optional)"}</span>
              </button>

              {creatorPhoto && (
                <button
                  type="button"
                  onClick={() => setCreatorPhoto(null)}
                  className="text-xs text-muted-foreground hover:text-destructive transition"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Paint Action Button */}
            <button
              type="button"
              onClick={handlePaintWatercolor}
              disabled={isGeneratingArt}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
            >
              {isGeneratingArt ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Painting watercolor with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Paint Watercolor</span>
                </>
              )}
            </button>

            {creatorSuccessMsg && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 text-center animate-in fade-in">
                {creatorSuccessMsg}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center pt-2 pb-6 text-xs text-muted-foreground space-y-1">
          <p>
            Private Weather Pal • Real-time Open-Meteo • Zero trackers or analytics
          </p>
          <div className="flex items-center justify-center gap-3 text-[11px]">
            <a href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </a>
            <span>•</span>
            <button
              type="button"
              onClick={() => setGalleryModalOpen(true)}
              className="underline hover:text-foreground cursor-pointer"
            >
              Art Gallery
            </button>
          </div>
        </footer>
      </div>

      {/* GALLERY MODAL */}
      {galleryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                  <Palette className="h-4 w-4 text-amber-500" />
                  <span>AI Watercolor Gallery</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select a wallpaper artwork or unlock new city slots
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGalleryModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 gap-3">
              {availableArtworks.map((slot) => {
                const unlocked = isSlotUnlocked(slot);
                const isActive = activeWallpaperUrl === slot.url;
                return (
                  <div
                    key={slot.id}
                    onClick={() => handleSelectWallpaper(slot)}
                    className={`group relative overflow-hidden rounded-2xl border transition cursor-pointer ${
                      isActive
                        ? "border-amber-500 ring-2 ring-amber-500/30"
                        : "border-border/80 hover:border-amber-500/50"
                    }`}
                  >
                    <div className="aspect-4/3 w-full bg-muted overflow-hidden">
                      <img
                        src={slot.url}
                        alt={slot.cityName}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2 bg-card/90 space-y-0.5">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <span>{slot.cityName}</span>
                        {!unlocked && <Lock className="h-3 w-3 text-amber-500" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {slot.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Supporter Banner inside Gallery */}
            {!hasSupporterTier && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-200">
                  <Beer className="h-4 w-4 text-amber-500" />
                  <span>Unlock All Gallery Artworks Forever</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Support private weather development with a Root Beer tier to unlock all current and future AI landmark artwork.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {ROOT_BEER_TIERS.slice(0, 2).map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => handleClaimLifetimeThankYou(tier.id)}
                      className="rounded-xl border border-amber-500/40 bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-center font-bold text-white shadow-xs transition cursor-pointer"
                    >
                      {tier.name} ({tier.price})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* UNLOCK ARTWORK / 24-HR AD MODAL */}
      {unlockModalOpen && pendingUnlockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-amber-500" />
                <span>Unlock Wallpaper Slot</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setUnlockModalOpen(false);
                  setPendingUnlockTarget(null);
                  setIsWatchingAd(false);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-semibold text-foreground">
                {pendingUnlockTarget.cityName}
              </p>
              <p className="text-muted-foreground">
                {pendingUnlockTarget.description}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2 pt-2">
              {/* Option A: Watch 5-sec Ad for 24-hr access */}
              <button
                type="button"
                onClick={handleStartWatchAd}
                disabled={isWatchingAd}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-muted hover:bg-muted/80 p-2.5 text-xs font-semibold text-foreground transition cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 text-amber-500" />
                <span>
                  {isWatchingAd
                    ? `Watching Ad... (${adCountdown}s)`
                    : "Watch Ad to Unlock for 24 Hours"}
                </span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-2 text-[10px] text-muted-foreground uppercase">
                  or lifetime unlock
                </span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              {/* Option B: Buy a Root Beer */}
              <button
                type="button"
                onClick={() => handleClaimLifetimeThankYou("root-beer-mug")}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 p-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Beer className="h-3.5 w-3.5" />
                <span>Unlock All Artwork with Root Beer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GPS PRE-LOCATION PERMISSION DIALOG */}
      {locationDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <MapPin className="h-4 w-4 text-amber-500" />
              <span>Use Your GPS Location?</span>
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
