import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const description = "How My Weather Pal handles location, weather searches, and on-device forecast storage.";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "Privacy · My Weather Pal" }, { name: "description", content: description },
    { property: "og:title", content: "Privacy · My Weather Pal" }, { property: "og:description", content: description },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8"><Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Back to weather</Link><p className="text-sm font-medium text-primary">MY WEATHER PAL</p><h1 className="mt-2 text-4xl font-semibold">Privacy, plainly.</h1><p className="mt-3 max-w-xl leading-7 text-muted-foreground">This app has no accounts, advertising trackers, or analytics. Weather and city-search requests go directly from your browser to Open-Meteo.</p><div className="mt-10 divide-y divide-border border-y border-border">
    <section className="py-6"><h2 className="text-lg font-semibold">Location is your choice</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Your location is requested only after you choose “Use my location” and confirm the explanation. The coordinates are used in a weather request and saved on this device as your selected place. You can search for a city instead.</p></section>
    <section className="py-6"><h2 className="text-lg font-semibold">Weather saved on this device</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">The latest forecast for each selected city and unit is saved in your browser so it can be shown when you’re offline. Your selected city and temperature units are also stored locally. Clear this site’s browser storage to remove them.</p></section>
    <section className="py-6"><h2 className="text-lg font-semibold">City artwork</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">The gallery uses bundled watercolor illustrations. No photo, prompt, or artwork is uploaded. Gallery images are served from this app.</p></section>
    <section className="py-6"><h2 className="text-lg font-semibold">External services</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Open-Meteo receives the requested city coordinates to return forecasts and city-search results. Its service terms and privacy information are available at <a className="underline underline-offset-4" href="https://open-meteo.com/en/terms" target="_blank" rel="noreferrer">open-meteo.com</a>. The app itself does not run trackers.</p></section>
  </div><p className="mt-6 text-xs text-muted-foreground">Last updated November 2026</p></main>;
}
