import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useTransition, useRef } from "react";
import "@/lib/i18n";
import { useTranslation } from "react-i18next";
import {
  Search,
  MapPin,
  RefreshCw,
  Heart,
  Palette,
  X,
  Compass,
  Check,
  AlertTriangle,
  Loader2,
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
  loadFavorites,
  saveFavorites,
  isFavorite,
  searchCities,
  readCachedWeather,
} from "@/lib/weather";
import { WeatherView } from "@/components/WeatherView";
import { AppMenu } from "@/components/AppMenu";
import { AiGalleryModal } from "@/components/AiGalleryModal";

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

function WeatherHome() {
  const { t } = useTranslation();
  const [place, setPlace] = useState<Place>(() => readSavedPlace() || DEFAULT_PLACE);
  const [unit, setUnit] = useState<WeatherUnit>(() => readUnit());
  const [weather, setWeather] = useState<Weather | null>(() => readCachedWeather(place));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityResult[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Favorites state
  const [favorites, setFavorites] = useState<Place[]>(() => loadFavorites());

  // Wallpaper & Modals
  const [activeBgUrl, setActiveBgUrl] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Load weather when place or unit changes
  const loadForecast = async (targetPlace: Place, targetUnit: WeatherUnit) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeather(targetPlace, targetUnit);
      setWeather(data);
    } catch (err: any) {
      console.error("Forecast error:", err);
      setError(err?.message || "Failed to load forecast");
      const cached = readCachedWeather(targetPlace);
      if (cached) setWeather(cached);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast(place, unit);
  }, [place.lat, place.lon, unit]);

  // Autocomplete city search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startSearchTransition(async () => {
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

  const handleSelectCity = (res: CityResult) => {
    const newPlace: Place = {
      name: res.name,
      country: res.country,
      admin1: res.admin1,
      lat: res.lat,
      lon: res.lon,
    };
    setPlace(newPlace);
    savePlace(newPlace);
    setQuery("");
    setSearchOpen(false);
  };

  const handleToggleFavorite = () => {
    const isFav = isFavorite(favorites, place);
    let next: Place[];
    if (isFav) {
      next = favorites.filter(
        (f) =>
          Math.abs(f.lat - place.lat) > 0.05 || Math.abs(f.lon - place.lon) > 0.05
      );
    } else {
      next = [place, ...favorites.slice(0, 9)];
    }
    setFavorites(next);
    saveFavorites(next);
  };

  const handleUseLocation = () => {
    setLocationDialogOpen(false);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await resp.json();
          const detectedCity =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "My Location";
          const detectedCountry = data.address?.country || "";

          const userPlace: Place = {
            name: detectedCity,
            country: detectedCountry,
            lat: latitude,
            lon: longitude,
          };

          setPlace(userPlace);
          savePlace(userPlace);
        } catch {
          const fallbackPlace: Place = {
            name: "Current Location",
            lat: latitude,
            lon: longitude,
          };
          setPlace(fallbackPlace);
          savePlace(fallbackPlace);
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        setLocationLoading(false);
        console.warn("Location error:", err);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative min-h-screen text-foreground selection:bg-amber-500/20">
      {/* Full-app wallpaper background with frosted layer */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 bg-cover bg-center"
        style={{
          backgroundImage: activeBgUrl ? `url("${activeBgUrl}")` : undefined,
          opacity: activeBgUrl ? 0.35 : 0.15,
        }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 backdrop-blur-[2px] bg-background/70" />

      {/* Main container */}
      <div className="relative z-10 mx-auto max-w-2xl px-3 py-4 sm:px-4 sm:py-6 space-y-4">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              {t("app_title", "My Weather Pal")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("app_tagline", "Private • Accurate • Curated Art")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Gallery button */}
            <button
              type="button"
              onClick={() => setGalleryOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-card/80 px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-xs backdrop-blur-md transition hover:bg-muted cursor-pointer"
              title={t("city_art_gallery", "City Art Gallery")}
            >
              <Palette className="h-4 w-4 text-amber-500" />
              <span className="hidden sm:inline">{t("city_art", "City Art")}</span>
            </button>

            {/* Settings AppMenu (Root beer tiers, unit toggle, sky preset, font size, languages) */}
            <AppMenu
              unit={unit}
              onUnitChange={(newUnit) => {
                setUnit(newUnit);
                saveUnit(newUnit);
              }}
              onOpenAiGallery={() => setGalleryOpen(true)}
            />
          </div>
        </header>

        {/* City Search Bar & Location Action */}
        <section className="space-y-2">
          <div ref={searchRef} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setSearchOpen(true)}
                placeholder={t("search_placeholder", "Search city or landmark...")}
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

            {/* GPS Location Button */}
            <button
              type="button"
              onClick={() => setLocationDialogOpen(true)}
              disabled={locationLoading}
              className="flex items-center justify-center rounded-xl border border-border/80 bg-card/90 p-2.5 text-foreground shadow-xs backdrop-blur-md transition hover:bg-muted disabled:opacity-50 cursor-pointer"
              title={t("use_location", "Use My Location")}
            >
              {locationLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
              ) : (
                <Compass className="h-4 w-4 text-amber-500" />
              )}
            </button>

            {/* Search Autocomplete Dropdown */}
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
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {[res.admin1, res.country].filter(Boolean).join(", ")}
                      </span>
                    </div>
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Saved Favorites Chips */}
          {favorites.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-muted-foreground font-medium shrink-0 flex items-center gap-1 mr-1">
                <Heart className="h-3 w-3 text-amber-500 fill-amber-500" />
                {t("favorites", "Saved")}:
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
                    Math.abs(fav.lat - place.lat) < 0.05 &&
                    Math.abs(fav.lon - place.lon) < 0.05
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

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Authentic WeatherView Component */}
        <WeatherView
          weather={weather}
          unit={unit}
          loading={loading}
          onRefresh={() => loadForecast(place, unit)}
          onSelectBackground={setActiveBgUrl}
          onSelectBg={setActiveBgUrl}
          isFav={isFavorite(favorites, place)}
          onToggleFavorite={handleToggleFavorite}
          onOpenAiGallery={() => setGalleryOpen(true)}
          customBgUrl={activeBgUrl}
        />

        {/* Footer */}
        <footer className="pt-6 pb-4 text-center text-xs text-muted-foreground/80 space-y-1">
          <p>{t("weather_by", "Weather data by Open-Meteo • AI Watercolor Art")}</p>
        </footer>
      </div>

      {/* AI Watercolor Studio / Gallery Modal */}
      <AiGalleryModal
        open={galleryOpen}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onOpenChange={setGalleryOpen}
        city={place.name}
        cityName={place.name}
        country={place.country}
        weatherCode={weather?.current.code}
        tempC={weather?.current.temp}
        activeBg={activeBgUrl}
        activeBackground={activeBgUrl || undefined}
        onSelectBackground={(url) => setActiveBgUrl(url)}
        onSelectBg={(url) => setActiveBgUrl(url)}
      />

      {/* Location Rationale Dialog */}
      {locationDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {t("use_location", "Use My Location")}
                </h3>
                <p className="text-xs text-muted-foreground">Private & On-Device</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              We only use your GPS coordinates locally in your browser to request accurate weather forecasts from Open-Meteo. No user tracking, no accounts, and no location data is stored on external servers.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLocationDialogOpen(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition cursor-pointer"
              >
                {t("cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={handleUseLocation}
                className="rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
              >
                {t("use_location", "Allow Location")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
