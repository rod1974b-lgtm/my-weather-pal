import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t, i18n } = useTranslation();
  useEffect(() => {
    document.title = t("privacy_meta_title");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("privacy_meta_desc"));
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.language.startsWith("ar") ? "rtl" : "ltr";
  }, [t, i18n.language]);
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> {t("privacy_back")}
      </Link>
      <p className="text-sm font-medium text-primary">{t("privacy_kicker")}</p>
      <h1 className="mt-2 text-4xl font-semibold">{t("privacy_title")}</h1>
      <p className="mt-3 max-w-xl leading-7 text-muted-foreground">{t("privacy_intro")}</p>
      <div className="mt-10 divide-y divide-border border-y border-border">
        <section className="py-6"><h2 className="text-lg font-semibold">{t("privacy_section1_title")}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("privacy_section1_body")}</p></section>
        <section className="py-6"><h2 className="text-lg font-semibold">{t("privacy_section2_title")}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("privacy_section2_body")}</p></section>
        <section className="py-6"><h2 className="text-lg font-semibold">{t("privacy_section3_title")}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("privacy_section3_body")}</p></section>
        <section className="py-6"><h2 className="text-lg font-semibold">{t("privacy_section4_title")}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("privacy_section4_body")}</p><a className="underline underline-offset-4" href="https://open-meteo.com/en/terms" target="_blank" rel="noreferrer">open-meteo.com</a></section>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">{t("privacy_updated")}</p>
    </main>
  );
}
