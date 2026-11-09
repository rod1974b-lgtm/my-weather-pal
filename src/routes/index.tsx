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
  Sparkles,
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
  getClothingAdvice,
  describeWeather,
} from "@/lib/weather";
import { WeatherIcon } from "@/components/WeatherIcon";

const description =
  "Current weather, the hourly forecast for today, and a seven-day outlook, with city search, outfit advice, and offline caching.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Weather Pal · Local weather, made easy" },
      { name: "description", content: description },
      { property: "og:title", content: "My Weather Pal · Local weather, made easy" },
      { property: "og:description", content: description },
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
  const [isSearching, startSearchTransition] = useTransition();
  const [favorites, setFavorites] = useState<Place[]>([]);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Initialize saved preferences & favorites
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
        const geoPlace: Place = {
          name: "Current Location",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          country: "",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        };
        handleSelectPlace(geoPlace);
      },
      () => {
        setIsLocating(false);
        setLocationPromptOpen(false);
        alert("Unable to retrieve your location.");
      },
      { timeout: 10000 }
    );
  }

  const alertData = weather ? getWeatherAlert(weather) : null;
  const clothingAdvice = weather ? getClothingAdvice(weather) : null;
  const isFav = isFavorite(place, favorites);
  const aqiInfo = weather ? aqiCategory(weather.current.aqi) : null;
  const unitSymbol = unit === "metric" ? "°C" : "°F";
  const windUnit = unit === "metric" ? "km/h" : "mph";

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        {/* Header / Search Controls */}
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              My Weather Pal
            </h1>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleUnit}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted transition cursor-pointer"
                title="Toggle temperature unit"
              >
                {unit === "metric" ? "°C → °F" : "°F → °C"}
              </button>

              <button
                type="button"
                onClick={() => setLocationPromptOpen(true)}
                className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition cursor-pointer"
                title="Use current location"
              >
                <MapPin className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => loadWeatherData(place, unit)}
                disabled={loading}
                className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition cursor-pointer disabled:opacity-50"
                title="Refresh weather"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Search input */}
          <div className="relative">
            <div className="flex items-center rounded-xl border border-border/80 bg-card px-3 py-2 shadow-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
              <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search city, town, or province..."
                className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="text-muted-foreground hover:text-foreground ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Autocomplete dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border bg-popover shadow-lg overflow-hidden divide-y divide-border/50">
                {searchResults.map((r) => (
                  <button
                    key={`${r.id}-${r.lat}-${r.lon}`}
                    type="button"
                    onClick={() => handleSelectPlace(r)}
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted/70 transition flex items-center justify-between cursor-pointer"
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

        {/* Location Permission Modal */}
        {locationPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <MapPin className="w-5 h-5 text-primary" />
                <span>Use your device location?</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We only use your GPS coordinates in your browser to fetch local weather from
                Open-Meteo. Your location is never tracked, stored, or sent to any private server.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLocationPromptOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border text-foreground hover:bg-muted transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={isLocating}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition flex items-center gap-1 cursor-pointer"
                >
                  {isLocating && <Loader2 className="w-3 h-3 animate-spin" />}
                  Allow & Detect
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Weather Alert */}
        {alertData && (
          <section
            className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs ${
              alertData.severity === "warning"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                : "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200"
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-snug">{alertData.message}</div>
          </section>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs">
            {error}
          </div>
        )}

        {/* Main Weather Hero */}
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
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
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

            {/* Outfit / Clothing Recommendation */}
            {clothingAdvice && (
              <section className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <Shirt className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    What to Wear
                  </h3>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{clothingAdvice}</p>
              </section>
            )}

            {/* Hourly Forecast */}
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

            {/* 7-Day Forecast */}
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

            {/* Weather Metrics Grid */}
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
    </div>
  );
}
