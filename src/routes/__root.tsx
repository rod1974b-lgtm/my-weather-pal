import { createRootRoute, Outlet, ScrollRestoration } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import "@/lib/i18n-missing-keys";
import "@/lib/i18n-gallery-keys";
import "@/lib/i18n-root-keys";

function RootComponent() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const code = i18n.language || "en";
    document.documentElement.lang = code;
    document.documentElement.dir = code.startsWith("ar") ? "rtl" : "ltr";
  }, [i18n.language]);
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}
export const Route = createRootRoute({ component: RootComponent });
