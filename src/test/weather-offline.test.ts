import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PLACE, fetchWeather, readCachedWeather, type Weather } from "@/lib/weather";

const forecast = {
  timezone: "Asia/Bangkok",
  current: { time: "2026-11-07T14:00", temperature_2m: 31, apparent_temperature: 35, weather_code: 2, relative_humidity_2m: 68, wind_speed_10m: 10, is_day: 1 },
  hourly: { time: Array.from({ length: 48 }, (_, index) => `2026-11-07T${String(index).padStart(2, "0")}:00`), temperature_2m: Array.from({ length: 48 }, (_, index) => 20 + index), weather_code: Array.from({ length: 48 }, () => 2), precipitation_probability: Array.from({ length: 48 }, () => 10) },
  daily: { time: ["2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13"], weather_code: [2, 0, 1, 3, 61, 2, 0], temperature_2m_max: [32, 33, 34, 30, 29, 31, 33], temperature_2m_min: [25, 26, 26, 24, 23, 24, 25], precipitation_probability_max: [10, 0, 5, 20, 70, 15, 0] },
};

describe("weather forecast caching", () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it("has a valid default place for the server-rendered dashboard", () => {
    expect(DEFAULT_PLACE.name).toBe("Bangkok");
    expect(DEFAULT_PLACE.lat).toBe(13.7563);
    expect(DEFAULT_PLACE.lon).toBe(100.5018);
  });

  it("caches current, 24 hourly values, and seven daily values for the selected city and unit", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(forecast), { status: 200 })));
    const result = await fetchWeather(DEFAULT_PLACE, "metric");
    expect(result.current.temperature).toBe(31);
    expect(result.hourly).toHaveLength(24);
    expect(result.daily).toHaveLength(7);
    expect(readCachedWeather(DEFAULT_PLACE, "metric")?.current.temperature).toBe(31);
    expect(readCachedWeather(DEFAULT_PLACE, "imperial")).toBeNull();
  });

  it("shows a valid saved forecast when a refresh is unavailable", () => {
    const saved: Weather = {
      place: DEFAULT_PLACE,
      unit: "metric",
      fetchedAt: 1,
      timezone: "Asia/Bangkok",
      current: {
        temperature: 29,
        feelsLike: 33,
        code: 2,
        humidity: 70,
        wind: 8,
        isDay: true,
        uvIndex: 0,
        precipitation: 0,
        temp: 29,
        feels: 33,
        is_day: 1,
        feels_like: 33,
        uv_index: 0,
      },
      sun: { sunrise: "--:--", sunset: "--:--" },
      hourly: [],
      daily: [],
    };
    localStorage.setItem("weather:last:13.756:100.502:metric", JSON.stringify(saved));
    expect(readCachedWeather(DEFAULT_PLACE, "metric")?.current.temperature).toBe(29);
  });
});