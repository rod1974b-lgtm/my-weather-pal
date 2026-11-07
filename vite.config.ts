// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      strategies: "generateSW",
      filename: "sw.js",
      injectRegister: false,
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      workbox: {
        globPatterns: ["**/*.{html,js,css,svg,webp,png,jpg,ico}"],
        navigateFallback: "/offline.html",
        navigateFallbackDenylist: [/^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/v1\/forecast\?/,
            handler: "NetworkFirst",
            options: {
              cacheName: "open-meteo-forecast",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/geocoding-api\.open-meteo\.com\/v1\/search\?/,
            handler: "NetworkFirst",
            options: {
              cacheName: "open-meteo-geocoding",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
