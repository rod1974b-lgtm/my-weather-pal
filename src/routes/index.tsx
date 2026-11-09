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
} from "@/lib/weather";
import { WeatherIcon } from "@/components/WeatherIcon";
import { ROOT_BEER_TIERS_DEEPER_AMBER_NO_PRICE, type RootBeerTier } from "@/lib/monetization";

const LANGUAGES = [
  { code: "en", flag: "🇺🇸", name: "English" },
  { code: "th", flag: "🇹🇭", name: "ไทย" },
  { code: "es", flag: "🇪🇸", name: "Español" },
  { code: "ja", flag: "🇯🇵", name: "日本語" },
  { code: "zh", flag: "🇨🇳", name: "中文" },
  { code: "hi", flag: "🇮🇳", name: "हिन्दी" },
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "de", flag: "🇩🇪", name: "Deutsch" },
  { code: "pt", flag: "🇧🇷", name: "Português" },
  { code: "ru", flag: "🇷🇺", name: "Русский" },
  { code: "ar", flag: "🇸🇦", name: "العربية" },
  { code: "ko", flag: "🇰🇷", name: "한국어" },
  { code: "id", flag: "🇮🇩", name: "Indonesia" },
  { code: "vi", flag: "🇻🇳", name: "Tiếng Việt" },
];

const SAMPLE_ARTWORKS = [
  { name: "Bangkok Grand Palace", url: "/backgrounds/vibrant/bangkok_day_1.webp" },
  { name: "Bangkok Wat Arun", url: "/backgrounds/vibrant/bangkok_day_2.webp" },
  { name: "Bangkok Twilight", url: "/backgrounds/vibrant/bangkok_night.webp" },
  { name: "Ratchaburi Floating Market", url: "/backgrounds/vibrant/ratchaburi_day_1.webp" },
  { name: "Chiang Mai Mountain Temple", url: "/backgrounds/vibrant/chiangmai_day_1.webp" },
];

type WearCategory = "casual" | "business" | "sports";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Weather Pal · Local weather, made easy" },
      { name: "description", content: "Local weather with watercolor art, clothing advice, and alert tickers." },
      { property: "og:title", content: "My Weather Pal · Local weather, made easy" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WeatherPage,
});

function WeatherPage() {
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const [unit, setUnit] = useState<WeatherUnit>("metric");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [, startSearchTransition] = useTransition();
  const [favorites, setFavorites] = useState<Place[]>([]);
  const [selectedLang, setSelectedLang] = useState("en");

  // Modals
  const [menuOpen, setMenuOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [beerModalOpen, setBeerModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<RootBeerTier | null>(null);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Clothing category
  const [wearCategory, setWearCategory] = useState<WearCategory>("casual");

  useEffect(() => {
    const savedPlace = readSavedPlace();
    const initialPlace = savedPlace || DEFAULT_PLACE;
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
    loadWeatherData(newPlace, unit);
  }

  function handleToggleUnit() {
    const nextUnit: WeatherUnit = unit === "metric" ? "imperial" : "metric";
    setUnit(nextUnit);
    saveUnit(nextUnit);
    loadWeatherData(place, nextUnit);
  }

  function handleToggleFavorite() {
    let next: Place[];
    if (isFavorite(place, favorites)) {
      next = favorites.filter((f) => !isSamePlace(f, place));
    } else {
      next = [place, ...favorites.slice(0, 7)];
    }
    setFavorites(next);
    saveFavorites(next);
  }

  function handleSearchInput(val: string) {
    setSearchQuery(val);
    if (!val.trim() || val.trim().length < 2) {
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

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setLocationPromptOpen(false);
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setLocationPromptOpen(false);
        handleSelectPlace({
          name: "Current Location",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          country: "",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        });
      },
      () => {
        setIsLocating(false);
        setLocationPromptOpen(false);
        alert("Unable to retrieve location.");
      },
      { timeout: 10000 }
    );
  }

  // Dynamic wear advice generator
  function getWearAdvice(): { text: string; accessories: string[] } {
    if (!weather) return { text: "Loading outfit recommendation...", accessories: [] };
    const tempC = unit === "imperial" ? ((weather.current.temp - 32) * 5) / 9 : weather.current.temp;
    const isRain = weather.current.code >= 51 && weather.current.code <= 67;
    const isHot = tempC >= 28;
    const isCold = tempC <= 16;

    if (wearCategory === "business") {
      if (isRain) {
        return {
          text: "Tailored water-resistant trench over suit, dress leather shoes, and a business umbrella.",
          accessories: ["Sturdy Umbrella", "Leather Briefcase", "Dress Watch"],
        };
      }
      if (isHot) {
        return {
          text: "Breathable linen shirt, lightweight chinos, and unlined blazer.",
          accessories: ["Polarized Sunglasses", "Leather Loafers", "Silk Pocket Square"],
        };
      }
      if (isCold) {
        return {
          text: "Fine wool overcoat layered over structured blazer and dress trousers.",
          accessories: ["Cashmere Scarf", "Dress Leather Gloves", "Leather Oxfords"],
        };
      }
      return {
        text: "Classic business casual: fitted button-down, pressed trousers, and light blazer.",
        accessories: ["Leather Belt", "Dress Shoes"],
      };
    }

    if (wearCategory === "sports") {
      if (isRain) {
        return {
          text: "Waterproof running windbreaker, moisture-wicking tights, and trail shoes with grip.",
          accessories: ["Water-repellent Cap", "Electrolyte Hydration", "Reflective Band"],
        };
      }
      if (isHot) {
        return {
          text: "Ultra-lightweight mesh tank, athletic running shorts, and breathable mesh trainers.",
          accessories: ["Sports Visor", "UV Sunglasses", "Running Water Bottle"],
        };
      }
      if (isCold) {
        return {
          text: "Thermal compression base layer, insulated training hoodie, and running gloves.",
          accessories: ["Thermal Headband", "Running Gloves", "Fleece Snood"],
        };
      }
      return {
        text: "Moisture-wicking athletic tee, performance joggers, and comfortable running sneakers.",
        accessories: ["Fitness Tracker", "Cotton Wristbands"],
      };
    }

    // Casual
    if (isRain) {
      return {
        text: "Lightweight hooded rain jacket, water-resistant sneakers, and a compact umbrella.",
        accessories: ["Compact Umbrella", "Waterproof Backpack"],
      };
    }
    if (isHot) {
      return {
        text: "Relaxed cotton tee, breathable linen shorts, and comfortable sandals or sneakers.",
        accessories: ["Straw Hat", "UV Sunglasses", "Sunscreen (SPF 50)"],
      };
    }
    if (isCold) {
      return {
        text: "Cozy knit sweater, fleece-lined jacket, denim pants, and warm boots.",
        accessories: ["Wool Beanie", "Warm Scarf", "Insulated Gloves"],
      };
    }
    return {
      text: "Comfortable casual cotton t-shirt, casual denim or chinos, and lifestyle sneakers.",
      accessories: ["Canvas Tote", "Classic Sunglasses"],
    };
  }

  const alertData = weather ? getWeatherAlert(weather) : null;
  const wearData = getWearAdvice();
  const isFav = isFavorite(place, favorites);
  const aqiInfo = weather ? aqiCategory(weather.current.aqi) : null;
  const unitSymbol = unit === "metric" ? "°C" : "°F";
  const windUnit = unit === "metric" ? "km/h" : "mph";

  return (
    <div className="min-h-screen bg-background text-foreground pb-14">
      {/* 1. TOP WEATHER ALERT TICKER */}
      {alertData ? (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-2 font-medium truncate">
            <span className="inline-flex items-center rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
              {alertData.severity}
            </span>
            <span className="truncate">{alertData.message}</span>
          </div>
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
        </div>
      ) : (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>All Clear · No active weather warnings for {place.name}</span>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* 2. HEADER & PULL-DOWN MENU */}
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
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted transition cursor-pointer"
              >
                {unit === "metric" ? "°C" : "°F"}
              </button>

              <button
                type="button"
                onClick={() => setLocationPromptOpen(true)}
                className="p-2 rounded-lg border border-border bg-card hover:bg-muted transition cursor-pointer"
                title="Current location"
              >
                <MapPin className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => loadWeatherData(place, unit)}
                disabled={loading}
                className="p-2 rounded-lg border border-border bg-card hover:bg-muted transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              {/* PULL DOWN MENU BUTTON */}
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="p-2 rounded-lg border border-border bg-card hover:bg-muted transition cursor-pointer"
                title="Open menu"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <div className="flex items-center rounded-xl border border-border/80 bg-card px-3 py-2 shadow-xs focus-within:border-primary">
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
                  className="text-muted-foreground hover:text-foreground"
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

          {/* Favorites chips */}
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
                      : "bg-muted/50 text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {fav.name}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* HERO WEATHER */}
        {weather && (
          <>
            <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      {place.name}
                    </h2>
                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      className="p-1 rounded-md text-muted-foreground hover:text-rose-500 transition cursor-pointer"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFav ? "fill-rose-500 text-rose-500" : ""
                        }`}
                      />
                    </button>
                  </div>
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
                    size={48}
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

                {weather.daily[0] && (
                  <div className="text-right text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      H: {Math.round(weather.daily[0].temp_max)}°
                    </span>{" "}
                    · L: {Math.round(weather.daily[0].temp_min)}°
                  </div>
                )}
              </div>
            </section>

            {/* 3. WHAT TO WEAR: CASUAL, BUSINESS, SPORTS TABS */}
            <section className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    What to Wear
                  </h3>
                </div>

                {/* Casual / Business / Sports Category Selector */}
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

              {/* Recommended Accessories */}
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

            {/* HOURLY FORECAST */}
            <section className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
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

            {/* 7-DAY FORECAST */}
            <section className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                7-Day Forecast
              </h3>
              <div className="divide-y divide-border/60">
                {weather.daily.slice(0, 7).map((d, i) => (
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
                      <span>{Math.round(d.temp_max)}°</span>
                      <span className="text-muted-foreground/70 font-normal">
                        {Math.round(d.temp_min)}°
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* METRICS */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border/80 bg-card p-3 shadow-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span>Humidity</span>
                </div>
                <div className="text-lg font-bold text-foreground">
                  {weather.current.humidity}%
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-3 shadow-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <Wind className="w-3.5 h-3.5 text-teal-500" />
                  <span>Wind</span>
                </div>
                <div className="text-lg font-bold text-foreground">
                  {Math.round(weather.current.wind)} {windUnit}
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-3 shadow-xs">
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

              <div className="rounded-xl border border-border/80 bg-card p-3 shadow-xs">
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
          </>
        )}
      </main>

      {/* 4. PULL-DOWN MENU DRAWER */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-card border-l border-border w-80 h-full p-5 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Menu className="w-4 h-4 text-primary" />
                  Menu & Settings
                </h3>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Language selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                  <Globe className="w-3.5 h-3.5" />
                  Language ({LANGUAGES.length})
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setSelectedLang(l.code);
                        setMenuOpen(false);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition cursor-pointer ${
                        selectedLang === l.code
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span className="truncate">{l.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action items */}
              <div className="space-y-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setGalleryOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-muted/40 hover:bg-muted transition text-xs font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 text-foreground">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span>AI City Artwork Gallery</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setBeerModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 transition text-xs font-medium cursor-pointer text-amber-900 dark:text-amber-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Beer className="w-4 h-4 text-amber-600" />
                    <span>Buy Me a Root Beer (Tiers)</span>
                  </div>
                  <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-md">
                    Support
                  </span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground text-center pt-6 border-t border-border">
              My Weather Pal · Open-Meteo & Watercolor Art
            </div>
          </div>
        </div>
      )}

      {/* 5. AI GALLERY MODAL */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <ImageIcon className="w-5 h-5 text-primary" />
                <span>AI Watercolor Gallery</span>
              </div>
              <button
                type="button"
                onClick={() => setGalleryOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto grid grid-cols-2 gap-3">
              {SAMPLE_ARTWORKS.map((art) => (
                <div
                  key={art.name}
                  className="group relative rounded-xl overflow-hidden border border-border bg-muted/30 aspect-video flex flex-col justify-end p-2.5"
                >
                  <img
                    src={art.url}
                    alt={art.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="relative z-10 bg-black/60 backdrop-blur-xs rounded-md px-2 py-1 text-[11px] text-white font-medium truncate">
                    {art.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. ROOT BEER TIERS MODAL */}
      {beerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-amber-500/10">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <Beer className="w-5 h-5 text-amber-600" />
                <span>Support My Weather Pal</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBeerModalOpen(false);
                  setSelectedTier(null);
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enjoying My Weather Pal? Tip a chilled root beer to unlock supporter thank-you backgrounds forever!
              </p>

              <div className="space-y-2.5">
                {ROOT_BEER_TIERS_DEEPER_AMBER_NO_PRICE.slice(0, 4).map((tier) => (
                  <div
                    key={tier.id}
                    className="p-3 rounded-xl border border-border/80 bg-muted/30 hover:border-amber-500/50 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <span>🍺</span> {tier.name}
                      </h4>
                      <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                        {tier.displayPrice || `$${tier.price}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      {tier.tagline}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground/80">
                      <span>{tier.bonus.label}</span>
                      <a
                        href="https://buymeacoffee.com/rod1974b"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-amber-600 hover:underline font-semibold"
                      >
                        Tip {tier.displayPrice} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
