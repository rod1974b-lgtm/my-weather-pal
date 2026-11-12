import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import "@/lib/i18n-missing-keys";
import "@/lib/i18n-gallery-keys";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { savePlace, type Place } from "@/lib/weather";

const cities: { name: string; countryKey: string; image: string; coords: [number, number] }[] = [
  { name: "Bangkok", countryKey: "country_thailand", image: "/backgrounds/vibrant/bangkok_sunny.jpg", coords: [13.7563, 100.5018] },
  { name: "Kyoto", countryKey: "country_japan", image: "/backgrounds/vibrant/kyoto_sunny.jpg", coords: [35.0116, 135.7681] },
  { name: "Skopje", countryKey: "country_north_macedonia", image: "/backgrounds/vibrant/rain_skopje.jpg", coords: [41.9981, 21.4254] },
  { name: "Ratchaburi", countryKey: "country_thailand", image: "/backgrounds/vibrant/ratchaburi_haze.jpg", coords: [13.5283, 99.8134] },
  { name: "Swiss Alps", countryKey: "country_switzerland", image: "/backgrounds/vibrant/snow_swiss.jpg", coords: [46.8182, 8.2275] },
  { name: "Bangkok river", countryKey: "country_thailand", image: "/backgrounds/vibrant/storm.jpg", coords: [13.7563, 100.5018] },
];

export const Route = createFileRoute("/gallery")({
  component: GalleryPage,
});

function GalleryPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    document.title = t("gallery_meta_title");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("gallery_meta_desc"));
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.language.startsWith("ar") ? "rtl" : "ltr";
  }, [t, i18n.language]);

  const viewWeather = (city: (typeof cities)[number]) => {
    const place: Place = { name: city.name, country: t(city.countryKey), lat: city.coords[0], lon: city.coords[1] };
    savePlace(place);
    void navigate({ to: "/" });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-7 lg:px-10">
      <header className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> {t("gallery_back")}
        </Link>
        <p className="mt-8 text-sm font-medium text-primary">{t("gallery_kicker")}</p>
        <h1 className="mt-2 text-4xl font-semibold">{t("gallery_title")}</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">{t("gallery_subtitle")}</p>
      </header>
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <article key={city.name} className="overflow-hidden border border-border bg-card">
            <button type="button" onClick={() => setSelected(city.image)} aria-label={t("gallery_view_artwork", { city: city.name })} className="block aspect-[4/3] w-full overflow-hidden bg-muted">
              <img src={city.image} alt={t("gallery_alt", { city: city.name, country: t(city.countryKey) })} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.025]" />
            </button>
            <div className="flex items-center justify-between gap-3 p-4">
              <div>
                <h2 className="font-semibold">{city.name}</h2>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={12} />{t(city.countryKey)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => viewWeather(city)}>{t("gallery_weather")}</Button>
            </div>
          </article>
        ))}
      </section>
      <footer className="mt-10 border-t border-border pt-4 text-sm text-muted-foreground">
        <Link to="/privacy" className="hover:text-foreground">{t("gallery_privacy")}</Link>
      </footer>
      {selected && (
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }} className="fixed inset-0 z-50 grid place-items-center bg-foreground/85 p-4">
          <div role="dialog" aria-modal="true" aria-label={t("gallery_preview")} className="relative max-h-[90vh] max-w-5xl">
            <img src={selected} alt={t("gallery_preview_alt")} className="max-h-[85vh] max-w-full object-contain" />
            <Button variant="secondary" className="absolute right-3 top-3" onClick={() => setSelected(null)}>{t("gallery_close")}</Button>
          </div>
        </div>
      )}
    </main>
  );
}
