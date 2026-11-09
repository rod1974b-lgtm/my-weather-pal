import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useTransition } from "react";
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
import { ROOT_BEER_TIERS_DEEPER_AMBER_NO_PRICE, type RootBeerTier } from "@/lib/monetization";
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

const CURATED_ARTWORKS = [
  { name: "Bangkok Sunny Grand Palace", url: "/backgrounds/vibrant/bangkok_sunny.jpg", city: "Bangkok" },
  { name: "Ratchaburi Atmospheric Haze", url: "/backgrounds/vibrant/ratchaburi_haze.jpg", city: "Ratchaburi" },
  { name: "Kyoto Golden Pagoda", url: "/backgrounds/vibrant/kyoto_sunny.jpg", city: "Kyoto" },
  { name: "Skopje Rainy Watercolor", url: "/backgrounds/vibrant/rain_skopje.jpg", city: "Skopje" },
  { name: "Swiss Alps Mountain Snow", url: "/backgrounds/vibrant/snow_swiss.jpg", city: "Swiss" },
  { name: "Dramatic Thunderstorm", url: "/backgrounds/vibrant/storm.jpg", city: "Atmosphere" },
  ...((LANDMARK_WATERCOLORS["bangkok"] || []).slice(1, 3).map((url, i) => ({
    name: `Bangkok Riverside ${i + 1}`,
    url,
    city: "Bangkok",
  }))),
  ...((LANDMARK_WATERCOLORS["ratchaburi"] || []).slice(1, 3).map((url, i) => ({
    name: `Ratchaburi Floating Market ${i + 1}`,
    url,
    city: "Ratchaburi",
  }))),
];

type WearCategory = "casual" | "business" | "sports";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Weather Pal — Hand-Painted Watercolor Forecasts" },
      {
        name: "description",
        content: "Hand-painted watercolor weather forecasts, air quality indices, clothing advice, and disaster alerts.",
      },
      { property: "og:title", content: "My Weather Pal — Hand-Painted Watercolor Forecasts" },
      {
        property: "og:description",
        content: "Hand-painted watercolor weather forecasts, air quality indices, clothing advice, and disaster alerts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WeatherPage,
});

function WeatherPage() {
  const [place, setPlace] = useState<Place>(() => {
    if (typeof window !== "undefined") {
      return readSavedPlace() || DEFAULT_PLACE;
    }
    return DEFAULT_PLACE;
  });

  const [unit, setUnit] = useState<WeatherUnit>(() => {
    if (typeof window !== "undefined") {
      return readUnit();
    }
    return "metric";
  });

  const [weather, setWeather] = useState<Weather | null>(() => {
    if (typeof window !== "undefined") {
      return readCachedWeather(place, unit);
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [, startSearchTransition] = useTransition();
  const [favorites, setFavorites] = useState<Place[]>([]);
  const [selectedLang, setSelectedLang] = useState("en");

  // Custom App Wallpaper (applied to full page + wallpaper hero)
  const [activeBg, setActiveBg] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("weather:custom-bg") || "/backgrounds/vibrant/bangkok_sunny.jpg";
    }
    return "/backgrounds/vibrant/bangkok_sunny.jpg";
  });

  // Modals
  const [menuOpen, setMenuOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [beerModalOpen, setBeerModalOpen] = useState(false);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Clothing category
  const [wearCategory, setWearCategory] = useState<WearCategory>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("weather:wear-category") as WearCategory;
      if (saved === "casual" || saved === "business" || saved === "sports") return saved;
    }
    return "casual";
  });

  useEffect(() => {
    const initialPlace = readSavedPlace() || DEFAULT_PLACE;
    const initialUnit = readUnit();
    setPlace(initialPlace);
    setUnit(initialUnit);
    setFavorites(loadFavorites());

    const cached = readCachedWeather(initialPlace, initialUnit);
    if (cached) {
      setWeather(cached);
      setLoading(false);
    }

    loadWeatherData(initialPlace, initialUnit);
  }, []);

  async function loadWeatherData(targetPlace: Place, targetUnit: WeatherUnit) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeather(targetPlace, targetUnit);
      setWeather(data);
    } catch (err) {
      const cached = readCachedWeather(targetPlace, targetUnit);
      if (cached) {
        setWeather(cached);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load weather");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPlace(newPlace: Place) {
    setPlace(newPlace);
    savePlace(newPlace);
    setSearchQuery("");
    setSearchResults([]);

    // Check if place has curated matching artwork
    const cityKey = newPlace.name.toLowerCase().trim();
    const matched = CURATED_ARTWORKS.find((a) => cityKey.includes(a.city.toLowerCase()));
    if (matched) {
      handleSelectBg(matched.url);
    }

    loadWeatherData(newPlace, unit);
  }

  function handleToggleUnit() {
    const nextUnit: WeatherUnit = unit === "metric" ? "imperial" : "metric";
    setUnit(nextUnit);
    saveUnit(nextUnit);
    loadWeatherData(place, nextUnit);
  }

  function handleToggleFavorite() {
    const updated = isFavorite(place, favorites)
      ? favorites.filter((f) => !isSamePlace(f, place))
      : [...favorites, place];
    setFavorites(updated);
    saveFavorites(updated);
  }

  function handleSearchInput(val: string) {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    startSearchTransition(async () => {
      try {
        const results = await searchCities(val);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
    });
  }

  function handleRequestLocation() {
    setIsLocating(true);
    setLocationPromptOpen(false);
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const currentPlace: Place = {
          name: "Current Location",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          country: "",
        };
        handleSelectPlace(currentPlace);
        setIsLocating(false);
      },
      (geoErr) => {
        setIsLocating(false);
        setError(geoErr.message || "Failed to retrieve your location");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  function handleSelectBg(url: string | null) {
    setActiveBg(url);
    if (typeof window !== "undefined") {
      if (url) localStorage.setItem("weather:custom-bg", url);
      else localStorage.removeItem("weather:custom-bg");
    }
  }

  function handleNextWallpaper() {
    const currentIndex = CURATED_ARTWORKS.findIndex((art) => art.url === activeBg);
    const nextIndex = (currentIndex + 1) % CURATED_ARTWORKS.length;
    handleSelectBg(CURATED_ARTWORKS[nextIndex].url);
  }

  function getWearAdvice(): { text: string; accessories: string[] } {
    if (!weather) return { text: "Loading outfit recommendation...", accessories: [] };
    const tempC = unit === "imperial" ? ((weather.current.temp - 32) * 5) / 9 : weather.current.temp;
    const isRain =
      (weather.current.code >= 51 && weather.current.code <= 67) ||
      (weather.current.code >= 80 && weather.current.code <= 82) ||
      weather.current.code >= 95;
    const isCold = tempC < 16;
    const isHot = tempC > 28;

    if (wearCategory === "business") {
      if (isCold) {
        return {
          text: "Wool tailored overcoat over a pressed formal suit with dress shoes. Layer with cashmere knitwear if needed.",
          accessories: ["Silk Scarf", "Leather Briefcase", isRain ? "Executive Umbrella" : "Formal Watch"],
        };
      }
      if (isHot) {
        return {
          text: "Breathable linen-blend shirt or lightweight suit without tie. Premium leather loafers and sun-shielding eyewear.",
          accessories: ["Polarized Sunglasses", "Leather Cardholder", isRain ? "Compact Umbrella" : "Sun Cream"],
        };
      }
      return {
        text: "Classic business suit or smart blazer paired with tailored trousers. Comfortable dress shoes.",
        accessories: ["Leather Belt", "Classic Timepiece", isRain ? "Windproof Umbrella" : "Laptop Bag"],
      };
    }

    if (wearCategory === "sports") {
      if (isCold) {
        return {
          text: "Thermal compression base layer, windproof running jacket, and moisture-wicking fleece tights.",
          accessories: ["Beanie Hat", "Running Gloves", "Reflective Band"],
        };
      }
      if (isHot) {
        return {
          text: "Lightweight sleeveless singlet or sweat-wicking dri-fit t-shirt with perforated running shorts.",
          accessories: ["Sports Cap", "Electrolyte Water Bottle", "UV Sunglasses"],
        };
      }
      return {
        text: "Comfortable joggers with breathable athletic mesh shirt and lightweight training jacket.",
        accessories: ["Sweatband", "Smart Fitness Tracker", "Running Shoes"],
      };
    }

    // Casual
    if (isCold) {
      return {
        text: "Cozy knit sweater or insulated down jacket with comfortable denim and cushioned boots.",
        accessories: ["Knitted Beanie", "Warm Socks", isRain ? "Travel Umbrella" : "Lip Balm"],
      };
    }
    if (isHot) {
      return {
        text: "Breathable cotton tee or relaxed camp collar shirt with lightweight shorts and slide sandals.",
        accessories: ["Sun Hat", "UV Sunglasses", isRain ? "Compact Umbrella" : "Cold Drink"],
      };
    }
    return {
      text: "Comfortable layered tee with a light cotton jacket, chinos, and your favorite everyday sneakers.",
      accessories: ["Canvas Tote", "Casual Watch", isRain ? "Folding Umbrella" : "Sunglasses"],
    };
  }

  const alertData = weather ? getWeatherAlert(weather) : null;
  const wearData = getWearAdvice();
  const isFav = isFavorite(place, favorites);
  const aqiInfo = weather ? aqiCategory(weather.current.aqi) : null;
  const unitSymbol = unit === "metric" ? "°C" : "°F";
  const windUnit = unit === "metric" ? "km/h" : "mph";

  // Daily high / low fallback from high or max
  const todayHigh = weather?.daily[0] ? Math.round(weather.daily[0].high ?? weather.daily[0].max ?? 0) : null;
  const todayLow = weather?.daily[0] ? Math.round(weather.daily[0].low ?? weather.daily[0].min ?? 0) : null;

  // Sky class fallback based on current conditions
  const currentSkyClass = weather ? `sky-${skyKey(weather.current.code, weather.current.is_day)}` : "sky-default";

  return (
    <div className={`min-h-screen text-foreground pb-14 sky relative ${currentSkyClass}`}>
      {/* FULL-APP WALLPAPER OVERLAY (WHEN ACTIVE) */}
      {activeBg && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.85) 60%, rgba(15,23,42,0.95) 100%), url(${activeBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        />
      )}

      <div className="relative z-10">
        <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
          {/* 1. HEADER & CONTROLS */}
          <header className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span className="text-2xl">🌦️</span>
                My Weather Pal
              </h1>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleUnit}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-card/90 backdrop-blur-xs hover:bg-muted transition cursor-pointer"
                >
                  {unit === "metric" ? "°C" : "°F"}
                </button>

                <button
                  type="button"
                  onClick={() => setLocationPromptOpen(true)}
                  className="p-2 rounded-lg border border-border bg-card/90 backdrop-blur-xs hover:bg-muted transition cursor-pointer"
                  title="Current location"
                >
                  <MapPin className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => loadWeatherData(place, unit)}
                  disabled={loading}
                  className="p-2 rounded-lg border border-border bg-card/90 backdrop-blur-xs hover:bg-muted transition cursor-pointer disabled:opacity-50"
                  title="Refresh weather"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="p-2 rounded-lg border border-border bg-card/90 backdrop-blur-xs hover:bg-muted transition cursor-pointer"
                  title="Open menu"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* City search bar */}
            <div className="relative">
              <div className="flex items-center rounded-xl border border-border/80 bg-card/90 backdrop-blur-xs px-3 py-2 shadow-xs focus-within:border-primary">
                <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder="Search city, town, province..."
                  className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-hidden"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border bg-popover shadow-lg overflow-hidden divide-y divide-border/50">
                  {searchResults.map((r) => (
                    <button
                      key={`${r.id}-${r.lat}-${r.lon}`}
                      type="button"
                      onClick={() => handleSelectPlace(r)}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-muted/70 transition flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-medium text-foreground">
                        {r.name}
                        {r.admin1 ? `, ${r.admin1}` : ""}
                      </span>
                      <span className="text-muted-foreground text-[11px]">{r.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Favorites */}
            {favorites.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-muted-foreground text-[11px] shrink-0 font-medium mr-1">
                  Saved:
                </span>
                {favorites.map((fav) => (
                  <button
                    key={`${fav.lat}-${fav.lon}`}
                    type="button"
                    onClick={() => handleSelectPlace(fav)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 transition cursor-pointer border ${
                      isSamePlace(fav, place)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card/80 text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {fav.name}
                  </button>
                ))}
              </div>
            )}
          </header>

          {/* 2. WEATHER ALERT TICKER (PLACED BELOW CITY SEARCH) */}
          <section className="rounded-xl border border-border/80 bg-card/90 backdrop-blur-xs overflow-hidden shadow-xs">
            {alertData ? (
              <div className="bg-amber-500/15 border-b border-amber-500/30 px-3.5 py-2 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 overflow-hidden">
                <div className="flex items-center gap-2 font-medium truncate">
                  <span className="inline-flex items-center rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    {alertData.severity}
                  </span>
                  <span className="truncate">{alertData.message}</span>
                </div>
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              </div>
            ) : (
              <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-3.5 py-2 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-medium">All Clear · No active weather warnings for {place.name}</span>
                </div>
                <span className="text-[10px] text-emerald-700/70 font-semibold uppercase">Normal</span>
              </div>
            )}
          </section>

          {/* Error notice */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-destructive/80 hover:text-destructive cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {weather && (
            <>
              {/* 3. WALLPAPER CANVAS HERO (SEPARATE CANVAS FROM CURRENT WEATHER) */}
              <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md">
                <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-muted">
                  <img
                    key={activeBg || "default-bg"}
                    src={activeBg || "/backgrounds/vibrant/bangkok_sunny.jpg"}
                    alt={`${place.name} watercolor landscape`}
                    className="h-full w-full object-cover transition-opacity duration-700 select-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20 pointer-events-none" />

                  {/* Artwork quick action buttons */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleNextWallpaper}
                      className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md transition hover:bg-black/65 cursor-pointer shadow-xs"
                      title="Next Curated Art"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span className="hidden sm:inline">Next Art</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGalleryOpen(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md transition hover:bg-black/65 cursor-pointer shadow-xs"
                      title="Open Artwork Gallery"
                    >
                      <Palette className="w-3 h-3 text-amber-300" />
                      <span>Gallery</span>
                    </button>
                  </div>

                  {/* Artwork Landmark Caption */}
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
                      <p className="text-[11px] text-white/70 drop-shadow-xs">
                        Hand-painted watercolor cityscape
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      className="pointer-events-auto p-1.5 rounded-full bg-black/40 border border-white/20 text-white hover:text-rose-400 transition cursor-pointer"
                      title={isFav ? "Saved in Favorites" : "Add to Favorites"}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFav ? "fill-rose-500 text-rose-500" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>

              {/* 4. CURRENT WEATHER CARD (SEPARATE FROM THE WALLPAPER HERO) */}
              <section className="rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Current Conditions
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
                      {place.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {place.admin1 ? `${place.admin1}, ` : ""}
                      {place.country || "Local"}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-4xl font-extrabold tracking-tight text-foreground">
                      {Math.round(weather.current.temp)}
                      {unitSymbol}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Feels like {Math.round(weather.current.feels)}
                      {unitSymbol}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/60">
                  <div className="flex items-center gap-3">
                    <WeatherIcon
                      code={weather.current.code}
                      isDay={weather.current.is_day}
                      size={46}
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {weather.current.label || describeWeather(weather.current.code).label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {weather.current.is_day ? "Daytime" : "Nighttime"}
                      </p>
                    </div>
                  </div>

                  {todayHigh !== null && todayLow !== null && (
                    <div className="text-right text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        H: {todayHigh}°
                      </span>{" "}
                      · L: {todayLow}°
                    </div>
                  )}
                </div>
              </section>

              {/* 5. CURRENT WEATHER METRICS GRID */}
              <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-border/80 bg-card/95 backdrop-blur-xs p-3 shadow-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" />
                    <span>Humidity</span>
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {weather.current.humidity}%
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-card/95 backdrop-blur-xs p-3 shadow-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                    <Wind className="w-3.5 h-3.5 text-teal-500" />
                    <span>Wind</span>
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {Math.round(weather.current.wind)} {windUnit}
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-card/95 backdrop-blur-xs p-3 shadow-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>UV Index</span>
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {weather.current.uvIndex}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({uvCategory(weather.current.uvIndex)})
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-card/95 backdrop-blur-xs p-3 shadow-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                    <Compass className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Air Quality</span>
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {weather.current.aqi}{" "}
                    {aqiInfo && (
                      <span className="text-xs font-normal text-muted-foreground">
                        ({aqiInfo.label})
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* 6. WHAT TO WEAR: CASUAL, BUSINESS, SPORTS */}
              <section className="rounded-xl border border-border/80 bg-card/95 backdrop-blur-xs p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shirt className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      What to Wear
                    </h3>
                  </div>

                  <div className="flex items-center rounded-lg bg-muted/60 p-0.5 text-[11px] font-medium">
                    {(["casual", "business", "sports"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setWearCategory(cat)}
                        className={`rounded-md px-2.5 py-1 transition cursor-pointer capitalize ${
                          wearCategory === cat
                            ? "bg-card text-foreground shadow-xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-foreground leading-relaxed mb-3">
                  {wearData.text}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50">
                  <span className="text-[11px] font-semibold text-muted-foreground mr-1">
                    Accessories:
                  </span>
                  {wearData.accessories.map((acc) => (
                    <span
                      key={acc}
                      className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground"
                    >
                      {acc}
                    </span>
                  ))}
                </div>
              </section>

              {/* 7. HOURLY FORECAST */}
              <section className="rounded-xl border border-border/80 bg-card/95 backdrop-blur-xs p-4 shadow-xs">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Today&apos;s Hourly Forecast
                </h3>
                <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
                  {weather.hourly.slice(0, 24).map((h, i) => (
                    <div
                      key={h.time || i}
                      className="flex flex-col items-center gap-1.5 text-center shrink-0 min-w-[52px]"
                    >
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {i === 0 ? "Now" : formatForecastTime(h.time, weather.timezone)}
                      </span>
                      <WeatherIcon code={h.code} isDay={h.is_day ?? 1} size={30} />
                      <span className="text-xs font-semibold text-foreground">
                        {Math.round(h.temp)}°
                      </span>
                      {h.pop !== undefined && h.pop > 10 && (
                        <span className="text-[10px] text-blue-500 font-medium">
                          {Math.round(h.pop)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* 8. 7-DAY FORECAST */}
              <section className="rounded-xl border border-border/80 bg-card/95 backdrop-blur-xs p-4 shadow-xs">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  7-Day Forecast
                </h3>
                <div className="divide-y divide-border/60">
                  {weather.daily.slice(0, 7).map((d, i) => {
                    const maxVal = Math.round(d.high ?? d.max ?? 0);
                    const minVal = Math.round(d.low ?? d.min ?? 0);
                    return (
                      <div
                        key={d.date}
                        className="flex items-center justify-between py-2.5 text-xs"
                      >
                        <span className="w-24 font-medium text-foreground">
                          {i === 0 ? "Today" : formatForecastDay(d.date, weather.timezone)}
                        </span>
                        <div className="flex items-center gap-2 flex-1 px-2">
                          <WeatherIcon code={d.code} isDay={1} size={24} />
                          <span className="text-muted-foreground truncate">
                            {describeWeather(d.code).label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-foreground w-16 justify-end">
                          <span>{maxVal}°</span>
                          <span className="text-muted-foreground/70 font-normal">
                            {minVal}°
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {/* 9. MAIN PULL-DOWN MENU MODAL */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold text-sm text-foreground">Menu & Settings</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                <Globe className="w-3.5 h-3.5" />
                Language
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setSelectedLang(lang.code);
                      setMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                      selectedLang === lang.code
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted/50 hover:bg-muted text-foreground"
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span className="truncate">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setGalleryOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted text-xs font-medium text-foreground transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span>AI Watercolor Gallery</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setBeerModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-medium text-amber-900 dark:text-amber-200 transition cursor-pointer border border-amber-500/20"
              >
                <div className="flex items-center gap-2">
                  <Beer className="w-4 h-4 text-amber-600" />
                  <span>Buy Me a Root Beer</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
              </button>

              <a
                href="/privacy"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted text-xs font-medium text-foreground transition"
              >
                <span>Privacy Policy</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 10. AI ARTWORK GALLERY MODAL */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <ImageIcon className="w-5 h-5 text-primary" />
                <span>AI Watercolor Art Gallery</span>
              </div>
              <button
                type="button"
                onClick={() => setGalleryOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              <p className="text-xs text-muted-foreground">
                Select any hand-painted watercolor artwork below to set it as your live app wallpaper:
              </p>

              <div className="grid grid-cols-2 gap-3">
                {CURATED_ARTWORKS.map((art) => {
                  const isSelected = activeBg === art.url;
                  return (
                    <button
                      key={art.url}
                      type="button"
                      onClick={() => handleSelectBg(art.url)}
                      className={`group relative rounded-xl overflow-hidden border text-left aspect-video flex flex-col justify-end p-2.5 transition cursor-pointer ${
                        isSelected
                          ? "ring-2 ring-primary border-primary shadow-md"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={art.url}
                        alt={art.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      <div className="relative z-10 flex items-center justify-between text-white">
                        <span className="text-[11px] font-semibold truncate pr-1">
                          {art.name}
                        </span>
                        {isSelected && (
                          <span className="bg-primary text-primary-foreground p-0.5 rounded-full shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {activeBg && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleSelectBg(null)}
                    className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                  >
                    Reset to Sky Gradient Theme
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 11. BUY ME A ROOT BEER MODAL */}
      {beerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Beer className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-sm text-foreground">Support My Weather Pal</span>
              </div>
              <button
                type="button"
                onClick={() => setBeerModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Enjoying the hand-painted watercolor weather forecasts? Select a root beer tier below:
            </p>

            <div className="space-y-2">
              {ROOT_BEER_TIERS_DEEPER_AMBER_NO_PRICE.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => {
                    alert(`Thank you for supporting with "${tier.name}"!`);
                    setBeerModalOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-border bg-muted/40 hover:bg-muted transition flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span>{tier.icon}</span>
                      <span>{tier.name}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {tier.description}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 12. LOCATION PRE-DIALOG */}
      {locationPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <MapPin className="w-5 h-5" />
              <span>Use Your Current Location</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We check your device coordinates to provide localized temperature, hourly forecasts, and air quality index. Your coordinates remain local to your browser and are never stored or tracked.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLocationPromptOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestLocation}
                disabled={isLocating}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 cursor-pointer flex items-center gap-1.5"
              >
                {isLocating && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Allow Access</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
