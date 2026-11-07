function isPreviewHostname(hostname: string) {
  return /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+\.(?:lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(hostname)
    || /^project--.+-dev\.(?:lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(hostname)
    || hostname === "lovableproject.com" || hostname.endsWith(".lovableproject.com")
    || hostname === "lovableproject-dev.com" || hostname.endsWith(".lovableproject-dev.com")
    || hostname === "beta.lovable.dev" || hostname.endsWith(".beta.lovable.dev");
}

export async function setupOfflineSupport() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const hostname = window.location.hostname.toLowerCase();
  const disable = new URLSearchParams(window.location.search).has("sw") && new URLSearchParams(window.location.search).get("sw") === "off";
  const previewHosts = ["id-preview--27b7db23-11e8-41ff-b4db-58299ae8e90f.lovable.app"];
  const isPreview = isPreviewHostname(hostname) || previewHosts.includes(hostname);
  const registrations = await navigator.serviceWorker.getRegistrations();
  if (!import.meta.env.PROD || window.top !== window.self || disable || isPreview) {
    await Promise.allSettled(registrations.filter((registration) => new URL(registration.scope).origin === window.location.origin && registration.active?.scriptURL.endsWith("/sw.js")).map((registration) => registration.unregister()));
    return;
  }
  await import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: true }));
}