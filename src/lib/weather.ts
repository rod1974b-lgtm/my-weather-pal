export type Place = {
  name: string;
  country?: string;
  lat: number;
  lon: number;
};

export type CityResult = Place & { id: number };
export type WeatherUnit = "metric" | "imperial";

export const DEFAULT_PLACE: Place = {
  name: "Bangkok",
  country: "Thailand",
  lat: 13.7563,
  lon: 100.5018,
};

export type Weather = {
  place: Place;
  fetchedAt: number;
  unit: WeatherUnit;
  timezone: string;
  current: {
    temperature: number;
    feelsLike: number;
    code: number;
    wind: number;
    humidity: number;
    isDay: boolean;
    uvIndex: number;
    precipitation: number;
    temp: number;
    feels: number;
    is_day: number;
    feels_like: number;
    uv_index: number;
    condition?: string;
    visibility?: number;
    aqi?: number;
  };
  sun: { sunrise: string; sunset: string };
  hourly: {
    time: string;
    temperature: number;
    code: number;
    precipitation: number;
    isDay: boolean;
    temp: number;
    precipProb: number;
    is_day: number;
  }[];
  daily: {
    date: string;
    high: number;
    low: number;
    code: number;
    precipitation: number;
    max: number;
    min: number;
    precipProbMax: number;
  }[];
};

const UNIT_KEY = "weather:unit-pref";
const PLACE_KEY = "weather:place";
const CACHE_PREFIX = "weather:last:";
const FAVORITES_KEY = "weather:favorites";

function storage(): Storage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

function placeCacheKey(place: Place, unit: WeatherUnit): string {
  return `${CACHE_PREFIX}${place.lat.toFixed(3)}:${place.lon.toFixed(3)}:${unit}`;
}

function isPlace(value: unknown): value is Place {
  if (typeof value !== "object" || value === null) return false;
  const place = value as Partial<Place>;
  return (
    typeof place.name === "string" &&
    typeof place.lat === "number" &&
    Number.isFinite(place.lat) &&
    typeof place.lon === "number" &&
    Number.isFinite(place.lon)
  );
}

export function readSavedPlace(): Place | null {
  try {
    const raw = storage()?.getItem(PLACE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return isPlace(value) ? value : null;
  } catch {
    return null;
  }
}

export function savePlace(place: Place): void {
  try {
    storage()?.setItem(PLACE_KEY, JSON.stringify(place));
  } catch {
    // Storage may be unavailable; weather still works for the current session.
  }
}

export function readUnit(): WeatherUnit {
  try {
    return storage()?.getItem(UNIT_KEY) === "imperial" ? "imperial" : "metric";
  } catch {
    return "metric";
  }
}

export function saveUnit(unit: WeatherUnit): void {
  try {
    storage()?.setItem(UNIT_KEY, unit);
  } catch {
    // Storage is optional.
  }
}

export function readCachedWeather(place: Place, unit: WeatherUnit): Weather | null {
  try {
    const raw = storage()?.getItem(placeCacheKey(place, unit));
    if (!raw) return null;
    const cached: unknown = JSON.parse(raw);
    if (typeof cached !== "object" || cached === null || !("current" in cached)) return null;
    return cached as Weather;
  } catch {
    return null;
  }
}

export function loadUnitPref(): WeatherUnit {
  return readUnit();
}

export function saveUnitPref(unit: WeatherUnit): void {
  saveUnit(unit);
}

export function loadFavorites(): Place[] {
  try {
    const raw = storage()?.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isPlace) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(favorites: Place[]): void {
  try {
    storage()?.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {
    // Storage is optional.
  }
}

export function isSamePlace(a: Place, b: Place): boolean {
  return (
    (Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lon - b.lon) < 0.01) ||
    a.name === b.name
  );
}

export function isFavorite(place: Place, favorites: Place[]): boolean {
  return favorites.some((favorite) => isSamePlace(favorite, place));
}

export function loadCached(): Weather | null {
  return readCachedWeather(DEFAULT_PLACE, readUnit());
}

type ForecastResponse = {
  timezone?: string;
  current: {
    time?: string;
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    relative_humidity_2m?: number;
    uv_index?: number;
    precipitation?: number;
    visibility?: number;
    is_day?: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability?: number[];
    is_day?: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise?: string[];
    sunset?: string[];
    precipitation_probability_max?: number[];
  };
};

export async function searchCities(query: string): Promise<CityResult[]> {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&format=json`,
  );
  if (!response.ok) throw new Error("City search failed");
  const payload = (await response.json()) as { results?: Array<Record<string, unknown>> };
  return (payload.results ?? []).flatMap((result) => {
    if (
      typeof result.id !== "number" ||
      typeof result.name !== "string" ||
      typeof result.latitude !== "number" ||
      typeof result.longitude !== "number"
    ) {
      return [];
    }
    const admin1 = typeof result.admin1 === "string" ? result.admin1 : undefined;
    const country = typeof result.country === "string" ? result.country : undefined;
    const name = admin1 && admin1 !== result.name ? `${result.name}, ${admin1}` : result.name;
    return [{
      id: result.id,
      name,
      lat: result.latitude,
      lon: result.longitude,
      ...(country ? { country } : {}),
    }];
  });
}

export async function searchCity(query: string): Promise<Place[]> {
  return searchCities(query);
}

export async function fetchWeather(place: Place, unit: WeatherUnit = "metric"): Promise<Weather> {
  const temperatureUnit = unit === "imperial" ? "fahrenheit" : "celsius";
  const windUnit = unit === "imperial" ? "mph" : "kmh";
  const precipitationUnit = unit === "imperial" ? "inch" : "mm";
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}` +
    "&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,uv_index,precipitation,is_day,visibility" +
    "&hourly=temperature_2m,weather_code,precipitation_probability,is_day" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max" +
    `&temperature_unit=${temperatureUnit}&wind_speed_unit=${windUnit}&precipitation_unit=${precipitationUnit}` +
    "&timezone=auto&forecast_days=7";

  const [forecastResult, airQualityResult] = await Promise.allSettled([
    fetch(url).then(async (response) => {
      if (!response.ok) throw new Error("Weather request failed");
      return (await response.json()) as ForecastResponse;
    }),
    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${place.lat}&longitude=${place.lon}&current=us_aqi`,
    ).then(async (response) => (response.ok ? (await response.json()) as { current?: { us_aqi?: number } } : null)),
  ]);

  if (forecastResult.status === "rejected") throw new Error("Weather request failed");
  const forecast = forecastResult.value;
  const current = forecast.current;
  const timezone = forecast.timezone ?? "UTC";
  const currentHour = current.time?.slice(0, 13) + ":00";
  let startIndex = currentHour
    ? forecast.hourly.time.findIndex((time) => time >= currentHour)
    : 0;
  if (startIndex < 0) startIndex = 0;

  const hourly = forecast.hourly.time.slice(startIndex, startIndex + 24).map((time, index) => {
    const dataIndex = startIndex + index;
    const temperature = index === 0 ? current.temperature_2m : forecast.hourly.temperature_2m[dataIndex] ?? current.temperature_2m;
    const code = index === 0 ? current.weather_code : forecast.hourly.weather_code[dataIndex] ?? current.weather_code;
    const precipProb = forecast.hourly.precipitation_probability?.[dataIndex] ?? 0;
    const isDay = index === 0 ? current.is_day ?? 1 : forecast.hourly.is_day?.[dataIndex] ?? 1;
    return { time, temperature, code, precipitation: precipProb, isDay: isDay !== 0, temp: temperature, precipProb, is_day: isDay };
  });

  const daily = forecast.daily.time.map((date, index) => {
    const high = forecast.daily.temperature_2m_max[index] ?? current.temperature_2m;
    const low = forecast.daily.temperature_2m_min[index] ?? current.temperature_2m;
    const precipitation = forecast.daily.precipitation_probability_max?.[index] ?? 0;
    return {
      date,
      high,
      low,
      code: forecast.daily.weather_code[index] ?? current.weather_code,
      precipitation,
      max: high,
      min: low,
      precipProbMax: precipitation,
    };
  });

  const temperature = current.temperature_2m;
  const feelsLike = current.apparent_temperature;
  const code = current.weather_code;
  const wind = current.wind_speed_10m;
  const humidity = current.relative_humidity_2m ?? 0;
  const uvIndex = current.uv_index ?? 0;
  const isDay = (current.is_day ?? 1) !== 0;
  const aqi = airQualityResult.status === "fulfilled" ? airQualityResult.value?.current?.us_aqi : undefined;
  const weather: Weather = {
    place,
    fetchedAt: Date.now(),
    unit,
    timezone,
    current: {
      temperature,
      feelsLike,
      code,
      wind,
      humidity,
      isDay,
      uvIndex,
      precipitation: current.precipitation ?? 0,
      temp: temperature,
      feels: feelsLike,
      is_day: isDay ? 1 : 0,
      feels_like: feelsLike,
      uv_index: uvIndex,
      condition: describeWeather(code).label,
      ...(current.visibility !== undefined ? { visibility: current.visibility } : {}),
      ...(aqi !== undefined ? { aqi: Math.round(aqi) } : {}),
    },
    sun: {
      sunrise: forecast.daily.sunrise?.[0]?.slice(11, 16) ?? "--:--",
      sunset: forecast.daily.sunset?.[0]?.slice(11, 16) ?? "--:--",
    },
    hourly,
    daily,
  };

  try {
    storage()?.setItem(placeCacheKey(place, unit), JSON.stringify(weather));
  } catch {
    // A network response should remain usable if caching is unavailable.
  }
  return weather;
}

export const getWeather = fetchWeather;

export function describeWeather(code: number): { label: string; icon: string } {
  if (code === 0) return { label: "Clear", icon: "☀️" };
  if (code <= 2) return { label: "Partly cloudy", icon: "⛅" };
  if (code === 3) return { label: "Overcast", icon: "☁️" };
  if (code <= 48) return { label: "Fog", icon: "🌫️" };
  if (code <= 57) return { label: "Drizzle", icon: "🌦️" };
  if (code <= 67) return { label: "Rain", icon: "🌧️" };
  if (code <= 77) return { label: "Snow", icon: "🌨️" };
  if (code <= 82) return { label: "Showers", icon: "🌧️" };
  if (code <= 86) return { label: "Snow showers", icon: "🌨️" };
  return { label: "Thunderstorm", icon: "⛈️" };
}

export const describe = describeWeather;

export function formatForecastTime(time: string, timezone: string): string {
  return new Intl.DateTimeFormat("en", { hour: "numeric", timeZone: timezone }).format(new Date(time));
}

export function formatForecastDay(date: string, _timezone: string): string {
  return new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

export function uvCategory(uv: number): string {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

export function aqiCategory(aqi: number): { label: string; color: string } {
  if (aqi <= 50) return { label: "Good", color: "text-emerald-500" };
  if (aqi <= 100) return { label: "Moderate", color: "text-yellow-500" };
  if (aqi <= 150) return { label: "Sensitive", color: "text-orange-500" };
  if (aqi <= 200) return { label: "Unhealthy", color: "text-red-500" };
  return { label: "Very Unhealthy", color: "text-purple-500" };
}

export function skyKey(code: number, isDay: number | undefined): string {
  const day = isDay !== 0;
  if (code <= 2) return day ? "clear-day" : "clear-night";
  if (code === 3) return day ? "cloudy-day" : "cloudy-night";
  if (code <= 48) return "fog";
  if (code <= 67 || code <= 82) return "rain";
  if (code <= 77 || code <= 86) return "snow";
  return "storm";
}

export function getWeatherAlert(weather: Weather): { icon: string; message: string; severity: "info" | "warning" } | null {
  if (weather.current.code >= 95) {
    return { icon: "⛈️", message: "Severe thunderstorm warning in this area.", severity: "warning" };
  }
  if (weather.current.code >= 51 && weather.current.code <= 82) {
    return { icon: "🌧️", message: "Rain currently falling. Roads may be slick.", severity: "info" };
  }
  const nextRain = weather.hourly.slice(0, 4).find((hour) => hour.precipProb >= 60);
  if (nextRain) {
    return { icon: "💧", message: `Rain expected around ${nextRain.time.slice(11, 16)} (${nextRain.precipProb}% chance).`, severity: "info" };
  }
  const highWindLimit = weather.unit === "imperial" ? 25 : 40;
  if (weather.current.wind >= highWindLimit) {
    return { icon: "💨", message: `High wind advisory: gusts up to ${Math.round(weather.current.wind)} ${weather.unit === "imperial" ? "mph" : "km/h"}.`, severity: "warning" };
  }
  return null;
}

export function getClothingAdvice(weather: Weather): string {
  const celsius = weather.unit === "imperial" ? ((weather.current.temperature - 32) * 5) / 9 : weather.current.temperature;
  if (celsius < 5) return "🧥 Heavy winter coat, gloves, and warm layers needed.";
  if (celsius < 14) return "🧥 A warm jacket or sweater is recommended.";
  if (celsius < 21) return "👕 Mild weather — light layers or long sleeves work best.";
  if (celsius < 28) return "🩳 Warm and pleasant — comfortable t-shirt and shorts.";
  return "☀️ Hot weather — stay hydrated and wear loose, breathable clothes.";
}