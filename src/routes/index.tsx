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
  AlertTriangle,
  Shirt,
  Loader2,
  X,
  Menu,
  Image as ImageIcon,
  Beer,
  Globe,
  ChevronRight,
  ExternalLink,
  Check,
  Palette,
  Lock,
  Unlock,
  Play,
  Clock,
  Sparkles,
  Camera,
  ChevronDown,
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
  isFavorite,
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
import { LANDMARK_WATERCOLORS } from "@/lib/aiWatercolorGenerator";

const LANGUAGES = [
  { code: "en", flag: "🇺🇸", name: "English" },
  { code: "th", flag: "🇹🇭", name: "ไทย" },
  { code: "es", flag: "🇪🇸", name: "Español" },
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "de", flag: "🇩🇪", name: "Deutsch" },
  { code: "ja", flag: "🇯🇵", name: "日本語" },
  { code: "zh", flag: "🇨🇳", name: "中文" },
  { code: "ko", flag: "🇰🇷", name: "한국어" },
  { code: "it", flag: "🇮🇹", name: "Italiano" },
  { code: "pt", flag: "🇧🇷", name: "Português" },
  { code: "ru", flag: "🇷🇺", name: "Русский" },
  { code: "hi", flag: "🇮🇳", name: "हिन्दी" },
  { code: "ar", flag: "🇸🇦", name: "العربية" },
  { code: "vi", flag: "🇻🇳", name: "Tiếng Việt" },
];

interface GalleryArtwork {
  id: string;
  name: string;
  url: string;
  city: string;
  requiredTier?: string; // "free" | "small" | "medium" | "large" | "party"
}

const CURATED_ARTWORKS: GalleryArtwork[] = [
  {
    id: "bangkok_1",
    name: "Bangkok Sunny Grand Palace",
    url: "/backgrounds/vibrant/bangkok_sunny.jpg",
    city: "Bangkok",
    requiredTier: "free",
  },
  {
    id: "bangkok_2",
    name: "Bangkok Riverside Temple",
    url:
      (LANDMARK_WATERCOLORS["bangkok"] || [])[1] ||
      "/backgrounds/vibrant/bangkok_sunny.jpg",
    city: "Bangkok",
    requiredTier: "small",
  },
  {
    id: "ratchaburi_1",
    name: "Ratchaburi Atmospheric Haze",
    url: "/backgrounds/vibrant/ratchaburi_haze.jpg",
    city: "Ratchaburi",
    requiredTier: "large",
  },
  {
    id: "ratchaburi_2",
    name: "Ratchaburi Floating Market",
    url:
      (LANDMARK_WATERCOLORS["ratchaburi"] || [])[1] ||
      "/backgrounds/vibrant/ratchaburi_haze.jpg",
    city: "Ratchaburi",
    requiredTier: "medium",
  },
  {
    id: "kyoto_1",
    name: "Kyoto Golden Pagoda",
    url: "/backgrounds/vibrant/kyoto_sunny.jpg",
    city: "Kyoto",
    requiredTier: "free",
  },
  {
    id: "skopje_1",
    name: "Skopje Rainy Watercolor",
    url: "/backgrounds/vibrant/rain_skopje.jpg",
    city: "Skopje",
    requiredTier: "small",
  },
  {
    id: "swiss_1",
    name: "Swiss Alps Mountain Snow",
    url: "/backgrounds/vibrant/snow_swiss.jpg",
    city: "Swiss Alps",
    requiredTier: "medium",
  },
  {
    id: "storm_1",
    name: "Dramatic Sky & Thunderstorm",
    url: "/backgrounds/vibrant/storm.jpg",
    city: "Atmosphere",
    requiredTier: "large",
  },
];

type WearCategory = "casual" | "business" | "sports";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Weather Pal — Hand-Painted Watercolor Forecasts" },
      {
        name: "description",
        content:
          "Artistic watercolor weather app with live forecasts, dynamic wallpapers, outfit suggestions, and city weather alerts.",
      },
      { property: "og:title", content: "My Weather Pal" },
      {
        property: "og:description",
        content: "Hand-painted watercolor weather forecasts and live sky wallpapers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WeatherPage,
});

function WeatherPage() {
  const [place, setPlace] = useState<Place>(() => readSavedPlace() || DEFAULT_PLACE);
  const [unit, setUnit] = useState<WeatherUnit>(() => readUnit());
  const [weather, setWeather] = useState<Weather | null>(() => readCachedWeather(place, unit));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [, startSearchTransition] = useTransition();
  const [favorites, setFavorites] = useState<Place[]>([]);
  const [selectedLang, setSelectedLang] = useState("en");

  // Sky Preset & Text Size
  const [skyPref, setSkyPref] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("weather:sky-pref") || "auto";
    }
    return "auto";
  });
  const [fontSize, setFontSize] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("weather:font-size") || "100%";
    }
    return "100%";
  });

  // Custom App Wallpaper
  const [activeBg, setActiveBg] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("weather:custom-bg") || "/backgrounds/vibrant/bangkok_sunny.jpg";
    }
    return "/backgrounds/vibrant/bangkok_sunny.jpg";
  });

  // AI Watercolor Creator Studio state
  const [isStudioOpen, setIsStudioOpen] = useState(true);
  const [studioCity, setStudioCity] = useState(place.name);
  const [studioPrompt, setStudioPrompt] = useState("");
  const [studioImagePreview, setStudioImagePreview] = useState<string | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modals & Unlock States
  const [menuOpen, setMenuOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [beerModalOpen, setBeerModalOpen] = useState(false);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const [wearCategory, setWearCategory] = useState<WearCategory>("casual");

  // Ad simulation modal state
  const [simulatingAd, setSimulatingAd] = useState<string | null>(null);
  const [adCountdown, setAdCountdown] = useState<number>(3);

  // Force re-render of unlock statuses
  const [, setUnlockVersion] = useState(0);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    setStudioCity(place.name);
  }, [place.name]);

  // Apply root font size
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.fontSize = fontSize;
    }
  }, [fontSize]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    fetchWeather(place, unit)
      .then((data) => {
        if (!ignore) {
          setWeather(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load weather data");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [place, unit]);

  // Handle ad countdown timer
  useEffect(() => {
    if (!simulatingAd) return undefined;
    if (adCountdown > 0) {
      const timer = setTimeout(() => setAdCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    unlockWithAd24h(simulatingAd);
    setSimulatingAd(null);
    setUnlockVersion((v) => v + 1);
    return undefined;
  }, [simulatingAd, adCountdown]);

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    startSearchTransition(async () => {
      try {
        const res = await searchCities(q);
        setSearchResults(res);
      } catch {
        setSearchResults([]);
      }
    });
  }

  function handleSelectCity(city: CityResult) {
    const newPlace: Place = {
      name: city.name,
      country: city.country || "",
      lat: city.latitude,
      lon: city.longitude,
    };
    setPlace(newPlace);
    savePlace(newPlace);
    setSearchQuery("");
    setSearchResults([]);

    // Check if we have curated artwork for this city
    const matched = CURATED_ARTWORKS.find(
      (a) => a.city.toLowerCase() === city.name.toLowerCase()
    );
    if (matched) {
      setActiveBg(matched.url);
      localStorage.setItem("weather:custom-bg", matched.url);
    }
  }

  function handleUseLocationConsent() {
    setLocationPromptOpen(false);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const locPlace: Place = {
          name: "Current Location",
          country: "",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        setPlace(locPlace);
        savePlace(locPlace);
      },
      () => {
        setLoading(false);
        setError("Unable to retrieve your location. Please check browser permissions.");
      },
      { timeout: 10000 }
    );
  }

  function handleToggleFav() {
    const isFav = isFavorite(place, favorites);
    const updated = isFav
      ? favorites.filter((f) => !isSamePlace(f, place))
      : [...favorites, place];
    setFavorites(updated);
    saveFavorites(updated);
  }

  function handleUnitChange(newUnit: WeatherUnit) {
    setUnit(newUnit);
    saveUnit(newUnit);
  }

  function handleSelectArtwork(art: GalleryArtwork) {
    const isFree = !art.requiredTier || art.requiredTier === "free";
    const adUnlocked = isAdUnlocked(art.id);
    const permanentUnlocked = isThankYouBackgroundUnlocked(art.id);

    if (isFree || adUnlocked || permanentUnlocked) {
      setActiveBg(art.url);
      localStorage.setItem("weather:custom-bg", art.url);
      setGalleryOpen(false);
    } else {
      setSimulatingAd(art.id);
      setAdCountdown(3);
    }
  }

  function handleTestUnlockTier(tierId: string) {
    saveThankYouBackgroundForever(tierId);
    setUnlockVersion((v) => v + 1);
  }

  function handleSkyChange(val: string) {
    setSkyPref(val);
    localStorage.setItem("weather:sky-pref", val);
  }

  function handleFontSizeChange(size: string) {
    setFontSize(size);
    localStorage.setItem("weather:font-size", size);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setStudioImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  }

  function handlePaintWatercolor() {
    setIsPainting(true);
    setTimeout(() => {
      // Use uploaded reference or pick from landmarks
      const generatedUrl =
        studioImagePreview ||
        CURATED_ARTWORKS.find((a) => a.city.toLowerCase() === studioCity.toLowerCase())?.url ||
        "/backgrounds/vibrant/bangkok_sunny.jpg";

      setActiveBg(generatedUrl);
      localStorage.setItem("weather:custom-bg", generatedUrl);
      setIsPainting(false);
    }, 1200);
  }

  const alertItem = weather ? getWeatherAlert(weather.current.code) : null;
  const isFav = isFavorite(place, favorites);

  // Determine atmospheric gradient based on weather or sky preference
  const effectiveSky = skyPref === "auto"
    ? (weather ? skyKey(weather.current.code, weather.current.isDay) : "day")
    : skyPref;

  const skyBackgroundClass =
    effectiveSky === "night" || effectiveSky === "Clear night"
      ? "from-slate-950 via-indigo-950 to-slate-900 text-slate-100"
      : effectiveSky === "rain" || effectiveSky === "Rain"
      ? "from-slate-800 via-sky-900 to-slate-700 text-slate-100"
      : effectiveSky === "cloudy" || effectiveSky === "Cloudy day"
      ? "from-stone-600 via-slate-600 to-stone-500 text-slate-100"
      : effectiveSky === "sunset" || effectiveSky === "Sunset"
      ? "from-amber-600 via-rose-700 to-purple-900 text-amber-50"
      : "from-sky-400 via-sky-200 to-amber-50 text-slate-900";

  return (
    <div className={`relative min-h-screen transition-colors duration-500 ${skyBackgroundClass} flex flex-col font-sans`}>
      {/* FULL-APP WALLPAPER OVERLAY */}
      {activeBg && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ease-in-out opacity-25"
          style={{
            backgroundImage: `url(${activeBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* FOREGROUND CONTENT */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 1. COMPACT HEADER */}
        <header className="w-full border-b border-border/40 bg-background/70 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎨</span>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-foreground">
                My Weather Pal
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsStudioOpen(!isStudioOpen)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition cursor-pointer"
                title="AI Watercolor Studio"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Studio</span>
              </button>

              <button
                type="button"
                onClick={() => setGalleryOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-muted/80 text-foreground hover:bg-muted transition cursor-pointer"
                title="AI Watercolor Gallery"
              >
                <ImageIcon className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Gallery</span>
              </button>

              <button
                type="button"
                onClick={() => setBeerModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 transition cursor-pointer"
                title="Support with Root Beer"
              >
                <Beer className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Support</span>
              </button>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="p-1.5 rounded-full hover:bg-muted text-foreground transition cursor-pointer"
                aria-label="Open settings menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTAINER */}
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 space-y-4">
          {/* 2. CITY SEARCH BAR & LOCATION BUTTON */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search city (e.g. Bangkok, Kyoto, Paris)..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-border/80 bg-background/85 backdrop-blur-md text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary shadow-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setLocationPromptOpen(true)}
                title="Use current location"
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-background/85 hover:bg-muted border border-border/80 backdrop-blur-md text-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-primary" />
                <span className="hidden sm:inline">My Location</span>
              </button>
            </div>

            {/* SEARCH AUTOCOMPLETE DROPDOWN */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-popover/95 backdrop-blur-md border border-border rounded-xl shadow-xl overflow-hidden z-40 max-h-56 overflow-y-auto">
                {searchResults.map((city) => (
                  <button
                    key={`${city.latitude}-${city.longitude}-${city.name}`}
                    type="button"
                    onClick={() => handleSelectCity(city)}
                    className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-muted/70 flex items-center justify-between text-popover-foreground transition-colors border-b border-border/40 last:border-b-0 cursor-pointer"
                  >
                    <span className="font-medium">
                      {city.name}
                      {city.country ? `, ${city.country}` : ""}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {city.latitude.toFixed(2)}, {city.longitude.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. WEATHER ALERT TICKER (DIRECTLY BELOW CITY SEARCH) */}
          {alertItem && (
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 backdrop-blur-md flex items-center gap-2.5 text-amber-950 dark:text-amber-100 shadow-xs animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
              <div className="flex-1 text-xs leading-snug">
                <span className="font-bold uppercase tracking-wider text-[10px] mr-1 px-1.5 py-0.5 rounded bg-amber-500/30">
                  {alertItem.severity}
                </span>
                <span className="font-medium">{alertItem.headline}</span>
              </div>
            </div>
          )}

          {/* 4. AI WATERCOLOR CREATOR STUDIO (SCREENSHOT 3) */}
          {isStudioOpen && (
            <section className="bg-card/90 backdrop-blur-md rounded-2xl p-4 border border-border/70 shadow-md space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h2 className="font-bold text-sm text-foreground">
                      AI Watercolor Creator
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paint custom landmark scenes or transform your photos into watercolors.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsStudioOpen(false)}
                  className="px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Close Studio</span>
                  <span className="text-[10px]">▲</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                    City Name
                  </label>
                  <input
                    type="text"
                    value={studioCity}
                    onChange={(e) => setStudioCity(e.target.value)}
                    placeholder="e.g. Ratchaburi"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                    Scene Description
                  </label>
                  <input
                    type="text"
                    value={studioPrompt}
                    onChange={(e) => setStudioPrompt(e.target.value)}
                    placeholder="e.g. Misty mountain temples at sunrise with golden light..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>
                    {studioImagePreview ? "Photo Selected ✓" : "Upload Reference Photo"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handlePaintWatercolor}
                  disabled={isPainting}
                  className="px-4 py-1.5 rounded-full bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isPainting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Painting...</span>
                    </>
                  ) : (
                    <>
                      <span>Paint Watercolor</span>
                      <span>🎨</span>
                    </>
                  )}
                </button>
              </div>
            </section>
          )}

          {/* FAVORITE CITIES CHIPS */}
          {favorites.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap pl-1">
                Saved:
              </span>
              {favorites.map((fav) => (
                <button
                  key={`${fav.lat}-${fav.lon}`}
                  type="button"
                  onClick={() => {
                    setPlace(fav);
                    savePlace(fav);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
                    isSamePlace(fav, place)
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "bg-background/80 hover:bg-muted text-foreground border border-border/60"
                  }`}
                >
                  <Heart className="w-3 h-3 fill-current text-rose-500" />
                  <span>{fav.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* LOADING / ERROR STATES */}
          {loading && !weather && (
            <div className="p-8 text-center bg-card/60 rounded-2xl border border-border/50 backdrop-blur-md space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
              <p className="text-xs text-muted-foreground">Gathering weather data...</p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs">
              {error}
            </div>
          )}

          {weather ? (
            <>
              {/* 5. CURRENT WEATHER CARD */}
              <section className="bg-card/85 backdrop-blur-md rounded-2xl p-5 border border-border/60 shadow-md space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                        {place.name}
                      </h1>
                      <button
                        type="button"
                        onClick={handleToggleFav}
                        className="p-1 rounded-full hover:bg-muted text-muted-foreground transition cursor-pointer"
                        title={isFav ? "Remove favorite" : "Save to favorites"}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFav ? "text-rose-500 fill-rose-500" : ""
                          }`}
                        />
                      </button>
                    </div>
                    {place.country && (
                      <p className="text-xs text-muted-foreground font-medium">
                        {place.country}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      fetchWeather(place, unit)
                        .then((w) => setWeather(w))
                        .finally(() => setLoading(false));
                    }}
                    className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground transition cursor-pointer"
                    title="Refresh forecast"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>

                {/* TEMPERATURE & HERO ICON */}
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-1">
                    <div className="text-5xl sm:text-6xl font-black text-foreground tracking-tighter">
                      {Math.round(weather.current.temperature)}°
                    </div>
                    <p className="text-sm font-semibold text-foreground/90 capitalize">
                      {describeWeather(weather.current.code).label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Feels like {Math.round(weather.current.feelsLike)}° • High{" "}
                      {Math.round(
                        weather.daily[0]?.high ?? weather.current.temperature
                      )}
                      ° / Low{" "}
                      {Math.round(
                        weather.daily[0]?.low ?? weather.current.temperature
                      )}
                      °
                    </p>
                  </div>

                  <div className="p-2 rounded-2xl bg-muted/20 border border-border/40 shrink-0">
                    <WeatherIcon
                      code={weather.current.code}
                      isDay={weather.current.isDay}
                      className="size-20 sm:size-24"
                    />
                  </div>
                </div>

                {/* WEATHER DETAILS GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50 text-xs">
                  <div className="p-2.5 rounded-xl bg-muted/40 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-sky-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        Humidity
                      </span>
                      <span className="font-bold text-foreground">
                        {weather.current.humidity}%
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/40 flex items-center gap-2">
                    <Wind className="w-4 h-4 text-teal-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        Wind Speed
                      </span>
                      <span className="font-bold text-foreground">
                        {Math.round(weather.current.windSpeed)}{" "}
                        {unit === "us" ? "mph" : "km/h"}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/40 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        UV Index
                      </span>
                      <span className="font-bold text-foreground">
                        {weather.current.uvIndex ?? "—"}{" "}
                        <span className="font-normal text-[10px] text-muted-foreground">
                          ({uvCategory(weather.current.uvIndex)})
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/40 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        Air Quality
                      </span>
                      <span className="font-bold text-foreground">
                        AQI {weather.current.aqi ?? "—"}{" "}
                        <span className="font-normal text-[10px] text-muted-foreground">
                          ({aqiCategory(weather.current.aqi)})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 6. HOURLY FORECAST WITH CONDITION TEXT */}
              <section className="bg-card/85 backdrop-blur-md rounded-2xl p-4 border border-border/60 shadow-md space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Hourly Forecast
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    24-Hour Timeline
                  </span>
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                  {weather.hourly.slice(0, 16).map((h, idx) => (
                    <div
                      key={h.time || idx}
                      className="flex flex-col items-center min-w-[4.25rem] p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/40 shrink-0 text-center space-y-1 transition-colors"
                    >
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {idx === 0
                          ? "Now"
                          : formatForecastTime(h.time, weather.timezone)}
                      </span>
                      <WeatherIcon
                        code={h.code}
                        isDay={h.isDay}
                        className="size-8"
                      />
                      <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[4rem] leading-tight">
                        {describeWeather(h.code).label}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {Math.round(h.temperature)}°
                      </span>
                      {h.precipProb > 0 && (
                        <span className="text-[10px] text-blue-500 font-semibold">
                          {h.precipProb}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* 7. 7-DAY ARTISTIC FORECAST WITH VISIBLE CONDITION TEXT */}
              <section className="bg-card/85 backdrop-blur-md rounded-2xl p-4 border border-border/60 shadow-md space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  7-Day Artistic Forecast
                </h3>

                <div className="divide-y divide-border/60">
                  {weather.daily.map((d, idx) => (
                    <div
                      key={d.date}
                      className="py-2.5 flex items-center justify-between text-sm hover:bg-muted/30 px-2 rounded-lg transition-colors gap-2"
                    >
                      <span className="w-20 sm:w-24 font-medium text-foreground text-xs sm:text-sm shrink-0">
                        {idx === 0
                          ? "Today"
                          : formatForecastDay(d.date, weather.timezone)}
                      </span>

                      <div className="flex items-center gap-2 flex-1 justify-center sm:justify-start">
                        <WeatherIcon code={d.code} isDay={true} className="size-7 shrink-0" />
                        <span className="text-xs text-muted-foreground capitalize font-medium">
                          {describeWeather(d.code).label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 text-right shrink-0">
                        <span className="text-xs font-semibold text-foreground">
                          {Math.round(d.high)}°
                        </span>
                        <span className="text-xs text-muted-foreground w-6">
                          {Math.round(d.low)}°
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 8. WHAT TO WEAR (CASUAL, BUSINESS, SPORTS) */}
              <section className="bg-card/85 backdrop-blur-md rounded-2xl p-4 border border-border/60 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shirt className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      What to Wear Today
                    </h3>
                  </div>

                  <div className="flex bg-muted/70 p-0.5 rounded-lg text-xs">
                    {(["casual", "business", "sports"] as WearCategory[]).map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setWearCategory(cat)}
                          className={`px-2.5 py-1 rounded-md capitalize font-medium transition cursor-pointer ${
                            wearCategory === cat
                              ? "bg-card text-foreground shadow-xs font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {cat}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/40 text-xs text-foreground space-y-1">
                  {wearCategory === "casual" && (
                    <p>
                      {weather.current.temperature >= 28
                        ? "☀️ Light cotton t-shirt, linen shorts, breathable sneakers, and sunglasses."
                        : weather.current.temperature >= 18
                        ? "🌤️ Comfortable jeans, cotton tee, and an optional light overshirt."
                        : "🧥 Warm sweater or denim jacket, long trousers, and closed shoes."}
                    </p>
                  )}
                  {wearCategory === "business" && (
                    <p>
                      {weather.current.temperature >= 28
                        ? "👔 Breathable short-sleeve shirt or lightweight polo, tailored trousers, and loafers."
                        : weather.current.temperature >= 18
                        ? "👔 Oxford button-down shirt, blazer, chinos, and dress shoes."
                        : "🧥 Wool blazer or trench coat, formal trousers, and leather boots."}
                    </p>
                  )}
                  {wearCategory === "sports" && (
                    <p>
                      {weather.current.temperature >= 28
                        ? "🏃 Moisture-wicking running singlet, lightweight running shorts, and plenty of water."
                        : weather.current.temperature >= 18
                        ? "🏃 Long-sleeve technical top, training tights or joggers, and running shoes."
                        : "🏃 Thermal base layer, windbreaker running jacket, and sports gloves."}
                    </p>
                  )}
                  {weather.current.code >= 51 && (
                    <p className="text-blue-500 font-semibold pt-1">
                      🌧️ Pack a compact umbrella or water-resistant jacket.
                    </p>
                  )}
                </div>
              </section>
            </>
          ) : null}
        </main>
      </div>

      {/* 9. SETTINGS MODAL (SCREENSHOTS 1 & 2) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <span className="font-extrabold text-base text-foreground">Settings</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-1 hover:bg-muted rounded-full text-muted-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BUY ME A ROOT BEER CARD (FROM SCREENSHOT 1) */}
            <div
              onClick={() => {
                setMenuOpen(false);
                setBeerModalOpen(true);
              }}
              className="p-3 rounded-2xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-950/50 transition cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🍺</span>
                <div>
                  <h4 className="font-bold text-xs text-amber-950 dark:text-amber-100">
                    Buy Me a Root Beer
                  </h4>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                    Support app & unlock bonus art
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            </div>

            {/* UNITS SECTION */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Units
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleUnitChange("metric")}
                  className={`py-2 px-3 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
                    unit === "metric"
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  °C • Metric
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitChange("us")}
                  className={`py-2 px-3 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
                    unit === "us"
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  °F • US
                </button>
              </div>
            </div>

            {/* SKY BACKGROUND SECTION (SCREENSHOTS 1 & 2) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Sky Background
              </label>
              <div className="relative">
                <select
                  value={skyPref}
                  onChange={(e) => handleSkyChange(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 pr-8 rounded-xl border border-border bg-muted/40 text-foreground focus:outline-hidden appearance-none cursor-pointer"
                >
                  <option value="auto">Auto (weather)</option>
                  <option value="day">Sunny day</option>
                  <option value="night">Clear night</option>
                  <option value="cloudy">Cloudy day</option>
                  <option value="rain">Rain</option>
                  <option value="sunset">Sunset</option>
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* TEXT SIZE SECTION */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Text Size
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: "100%", label: "Normal (100%)" },
                  { value: "115%", label: "Large (115%)" },
                  { value: "130%", label: "Huge (130%)" },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => handleFontSizeChange(s.value)}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl transition cursor-pointer text-center truncate ${
                      fontSize === s.value
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* LANGUAGE SELECTOR */}
            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>Language</span>
              </label>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-border bg-muted/40 text-foreground focus:outline-hidden"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* QUICK NAVIGATION */}
            <div className="space-y-1 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setGalleryOpen(true);
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-muted text-xs font-semibold text-foreground cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span>AI City Artwork Gallery</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              <a
                href="/privacy"
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-muted text-xs font-semibold text-foreground"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span>Privacy Policy & Offline Support</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 10. AI ARTWORK GALLERY MODAL WITH 24H AD UNLOCKS & TIERS */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">
                  AI City Artwork Gallery
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGalleryOpen(false)}
                className="p-1 hover:bg-muted rounded-full text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Select any watercolor to set it as your live wallpaper. Locked slots can be
              unlocked for <strong>24 hours by watching an ad</strong> or permanently via supporter tiers.
            </p>

            {/* ARTWORKS GRID */}
            <div className="grid grid-cols-2 gap-3">
              {CURATED_ARTWORKS.map((art) => {
                const isFree = !art.requiredTier || art.requiredTier === "free";
                const adUnlocked = isAdUnlocked(art.id);
                const permanentUnlocked = isThankYouBackgroundUnlocked(art.id);
                const isUnlocked = isFree || adUnlocked || permanentUnlocked;
                const isCurrent = activeBg === art.url;

                return (
                  <div
                    key={art.id}
                    onClick={() => handleSelectArtwork(art)}
                    className={`group relative rounded-xl overflow-hidden border-2 transition cursor-pointer flex flex-col ${
                      isCurrent
                        ? "border-primary shadow-md"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="aspect-video w-full relative bg-muted">
                      <img
                        src={art.url}
                        alt={art.name}
                        className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                          !isUnlocked ? "brightness-50" : ""
                        }`}
                      />
                      {isCurrent && (
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center gap-1 shadow-xs">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </div>
                      )}
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-2 text-center bg-black/40">
                          <Lock className="w-5 h-5 mb-1 text-amber-400" />
                          <span className="text-[10px] font-bold">Locked</span>
                          <span className="text-[9px] text-white/80">
                            Watch Ad to Unlock (24h)
                          </span>
                        </div>
                      )}
                      {adUnlocked && !isFree && (
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center gap-1 shadow-xs">
                          <Clock className="w-2.5 h-2.5" />
                          <span>24h Ad Pass</span>
                        </div>
                      )}
                    </div>

                    <div className="p-2 bg-card flex items-center justify-between">
                      <div className="truncate">
                        <span className="font-semibold text-xs text-foreground block truncate">
                          {art.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {art.city}
                        </span>
                      </div>
                      {isUnlocked ? (
                        <Unlock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SUPPORTER TIERS */}
            <div className="pt-3 border-t border-border space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Beer className="w-3.5 h-3.5 text-amber-500" />
                <span>Permanent Unlocks via Supporter Tiers</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {ROOT_BEER_TIERS_DEEPER_AMBER_NO_PRICE.map((tier) => {
                  const unlocked = isThankYouBackgroundUnlocked(tier.id);
                  return (
                    <div
                      key={tier.id}
                      className="p-2 rounded-xl border border-border bg-muted/40 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{tier.name}</span>
                        {unlocked ? (
                          <span className="text-[10px] text-emerald-500 font-bold">
                            Unlocked
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTestUnlockTier(tier.id)}
                            className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                          >
                            Unlock
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">
                        {tier.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. ROOT BEER SUPPORTER MODAL */}
      {beerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Beer className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-foreground">
                  Support My Weather Pal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBeerModalOpen(false)}
                className="p-1 hover:bg-muted rounded-full text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              My Weather Pal is free, private, and has no trackers. Support our hand-painted
              watercolor art and unlock permanent custom backgrounds!
            </p>

            <div className="space-y-2">
              {ROOT_BEER_TIERS_DEEPER_AMBER_NO_PRICE.map((tier) => (
                <div
                  key={tier.id}
                  className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-foreground block">
                      {tier.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      {tier.description}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleTestUnlockTier(tier.id);
                      setBeerModalOpen(false);
                      setGalleryOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 text-amber-950 hover:bg-amber-400 transition cursor-pointer shadow-xs shrink-0 ml-2"
                  >
                    Select Tier
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 12. SIMULATED 24-HOUR AD MODAL */}
      {simulatingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Play className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                Sponsor Video
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Unlocking 24-hour access to hand-painted watercolor art...
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <span className="text-2xl font-black text-foreground">
                {adCountdown}s
              </span>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Artwork unlocks as soon as timer completes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 13. LOCATION CONSENT PRE-DIALOG */}
      {locationPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3 animate-in zoom-in-95">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Use Current Location?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We only use your GPS coordinates to request live weather from Open-Meteo.
              Your location is stored solely on this device and is never sent to any server or tracked.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLocationPromptOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl hover:bg-muted text-muted-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUseLocationConsent}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
              >
                Allow Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
