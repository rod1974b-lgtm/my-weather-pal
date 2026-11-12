import { createRootRoute, Outlet, ScrollRestoration } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import "@/lib/i18n-missing-keys";
import "@/lib/i18n-gallery-keys";
import "@/lib/i18n-root-keys";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

// TanStack Start root route — shell for the whole app.
// This file must NOT contain hardcoded UI strings. All visible text lives in pages.
// It only: sets <html lang/dir> from i18n, restores scroll, renders <Outlet/>.
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
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  );
}

export const Route = createRootRoute({ component: RootComponent });
