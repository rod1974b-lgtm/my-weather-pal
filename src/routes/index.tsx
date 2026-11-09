import { createFileRoute } from "@tanstack/react-router";
import WeatherView from "@/components/WeatherView";


const description = "Current weather, the hourly forecast for today, and a seven-day outlook, with city search and optional location access.";

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
  component: WeatherDashboard,
});
