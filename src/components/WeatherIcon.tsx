import { useEffect, useState } from "react";

const watercolorIcons: Record<string, string> = {
  "01d": "/icons/watercolor/01d_clear_sky.png",
  "01n": "/icons/watercolor/01n_clear_night.png",
  "02d": "/icons/watercolor/02d_few_clouds.png",
  "02n": "/icons/watercolor/02n_few_clouds_night.png",
  "03d": "/icons/watercolor/03d_scattered.png",
  "03n": "/icons/watercolor/03n_scattered_night.png",
  "04d": "/icons/watercolor/04d_overcast.png",
  "04n": "/icons/watercolor/04n_overcast_night.png",
  "fog-day": "/icons/watercolor/50d_fog.png",
  "fog-night": "/icons/watercolor/04n_broken_night.png",
  "drizzle-day": "/icons/watercolor/09d_drizzle.png",
  "drizzle-night": "/icons/watercolor/09n_shower_night.png",
  "rain-day": "/icons/watercolor/10d_light_rain.png",
  "rain-night": "/icons/watercolor/10n_rain_night.png",
  "heavy-rain-day": "/icons/watercolor/10d_heavy_rain.png",
  "snow-day": "/icons/watercolor/13d_snow.png",
  "snow-night": "/icons/watercolor/13n_snow_night.png",
  "showers-day": "/icons/watercolor/09d_shower_rain.png",
  "showers-night": "/icons/watercolor/09n_shower_night.png",
  "storm-day": "/icons/watercolor/11d_thunderstorm.png",
  "storm-night": "/icons/watercolor/11n_thunderstorm_night.png",
};

function iconForWeather(code: number, isDay: boolean) {
  const suffix = isDay ? "d" : "n";
  if (code === 0) return { key: `01${suffix}`, description: isDay ? "Clear sky" : "Clear night", emoji: isDay ? "☀️" : "🌙" };
  if (code === 1) return { key: `02${suffix}`, description: "Mainly clear", emoji: "🌤️" };
  if (code === 2) return { key: `03${suffix}`, description: "Partly cloudy", emoji: "⛅" };
  if (code === 3) return { key: `04${suffix}`, description: "Overcast", emoji: "☁️" };
  if (code === 45 || code === 48) return { key: isDay ? "fog-day" : "fog-night", description: "Fog", emoji: "🌫️" };
  if (code >= 51 && code <= 57) return { key: isDay ? "drizzle-day" : "drizzle-night", description: "Drizzle", emoji: "🌦️" };
  if (code === 65 || code === 82) return { key: isDay ? "heavy-rain-day" : "rain-night", description: "Heavy rain", emoji: "🌧️" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { key: isDay ? "rain-day" : "rain-night", description: "Rain", emoji: "🌧️" };
  if (code >= 71 && code <= 77) return { key: isDay ? "snow-day" : "snow-night", description: "Snow", emoji: "❄️" };
  if (code >= 80 && code <= 82) return { key: isDay ? "showers-day" : "showers-night", description: "Rain showers", emoji: "🌧️" };
  if (code >= 95) return { key: isDay ? "storm-day" : "storm-night", description: "Thunderstorm", emoji: "⛈️" };
  return { key: `02${suffix}`, description: "Partly cloudy", emoji: "🌤️" };
}

type WeatherIconProps = {
  code: number;
  isDay?: boolean;
  className?: string;
};

export function WeatherIcon({ code, isDay = true, className = "size-8" }: WeatherIconProps) {
  const icon = iconForWeather(code, isDay);
  const image = watercolorIcons[icon.key] ?? watercolorIcons["02d"];
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [image]);

  if (imageFailed) {
    return <span className={`inline-flex items-center justify-center leading-none ${className}`} role="img" aria-label={icon.description}>{icon.emoji}</span>;
  }

  return <img src={image} alt={icon.description} className={`inline-block object-contain ${className}`} loading="lazy" onError={() => setImageFailed(true)} />;
}