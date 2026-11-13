// src/lib/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const baseKeys = {
  // Navigation & Search
  app_title: "My Weather Pal",
  tagline: "Private • Accurate • Curated Art",
  app_tagline: "Private • Accurate • Curated Art",
  search: "Search a city...",
  search_placeholder: "Search city or landmark...",
  favorites: "Favorites",
  no_saved: "No saved cities yet - Try searching above ↑",
  close: "Close",
  refresh: "Refresh forecast",
  weather_by: "Weather data by Open-Meteo • AI Watercolor Art",
  clear_all: "Clear All",

  // Core Metrics & Forecasts
  humidity: "Humidity",
  wind: "Wind",
  uv_index: "UV Index",
  uv: "UV Index",
  air_quality: "Air Quality",
  aqi: "Air Quality",
  precipitation: "Precipitation",
  sunrise: "Sunrise",
  sunset: "Sunset",
  today: "Today",
  now: "Now",
  seven_day: "7-Day Forecast",
  daily_forecast: "7-Day Forecast",
  hourly_forecast: "Hourly Forecast",
  hourly: "Hourly Forecast",
  weekly: "Weekly Forecast",
  feels_like: "Feels like",
  best_time: "Best time to go outside",
  high_short: "H",
  low_short: "L",
  updated_now: "Updated just now",
  updated_1m: "Updated 1m ago",
  updated_min: "Updated",
  ago: "ago",

  // Alerts & Ticker
  what_to_wear: "What to Wear Today",
  alerts: "Weather Alerts",
  all_clear: "ALL CLEAR",
  all_clear_sub: "No severe weather watches active in this region",
  alert_hazard: "ALERT",
  alert_advisory: "ADVISORY",
  alert_thunderstorm_tag: "SEVERE THUNDERSTORM WARNING",
  alert_winter_tag: "WINTER WEATHER ADVISORY",
  alert_rain_tag: "HEAVY PRECIPITATION ADVISORY",
  alert_flood_tag: "RIVER FLOOD WATCH",
  alert_earthquake_tag: "EARTHQUAKE ALERT",

  // Conditions
  cond_clear: "Clear sky",
  cond_partly_cloudy: "Partly cloudy",
  cond_foggy: "Foggy / Hazy",
  cond_drizzle: "Light drizzle",
  cond_rain: "Rain showers",
  cond_snow: "Snowfall",
  cond_thunderstorm: "Thunderstorm",

  // UI Actions & Buttons
  use_location: "Use my location",
  settings: "Settings",
  language: "Language",
  save: "Save",
  saved: "Saved!",
  remove_fav: "Remove favorite",
  next_art: "Next Artwork",
  art_gallery: "AI Gallery",
  ai_scene: "AI Curated Scene",
  paint_watercolor: "Paint Watercolor",
  gallery_upload: "Upload Photo",
  choose_file: "Choose File",
  tab_generate: "Generate with AI",
  ai_model_label: "GPT Sunburst 2.5",
  ai_creator_desc: "Create bespoke watercolor landmarks for any city with AI.",
  city_input_placeholder: "Enter city name (e.g., Kyoto)",
  prompt_input_placeholder: "Describe the landmark or atmosphere...",
  privacy_policy: "Privacy Policy",

  // Units & Tiers
  metric: "Metric (°C, km/h)",
  imperial: "US Imperial (°F, mph)",
  support_title: "Root Beer Supporter Tiers",
  support_desc: "Unlock full sky catalogs, bonus AI generations, and ad-free browsing forever.",
  watch_ad: "Watch 5-sec Ad (Unlock 24h)",
  watching_ad: "Watching ad... ({{s}}s)",
  or_unlock_forever: "Or unlock everything forever:"
};

const resources = {
  en: { translation: baseKeys },
};

function detectInitialLanguage(): string {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem("weather:lang") || localStorage.getItem("app_language");
    if (stored) return stored;
    if (navigator.language) {
      return navigator.language.toLowerCase().split("-")[0] || "en";
    }
  } catch {}
  return "en";
}

const savedLang = detectInitialLanguage();

i18n.use(initReactI18next).init({
  resources,
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false,
  returnEmptyString: false,
});

export const setAppLanguage = async (lang: string) => {
  const all = ["en","th","es","ja","zh","fr","de","pt","ru","ar","ko","id","vi","hi"];
  if (!all.includes(lang)) return;
  localStorage.setItem("weather:lang", lang);
  localStorage.setItem("app_language", lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  await i18n.changeLanguage(lang);
};

export default i18n;

// Supplemental key bundles for all 14 languages
import "./i18n-missing-keys";
import "./i18n-gallery-keys";
import "./i18n-root-keys";
