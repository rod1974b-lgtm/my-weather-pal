import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import "@/lib/i18n-missing-keys";
import "@/lib/i18n-gallery-keys";
import { setAppLanguage } from "@/lib/i18n-missing-keys";
import { Search, MapPin, RefreshCw, Heart, Droplets, Wind, Sun, Compass, Shirt, Loader2, X, Beer, Globe, Palette, Play, Sparkles, Camera, Lock, Check, Download, Trash2 } from "lucide-react";
import { type Place, type Weather, type WeatherUnit, type CityResult, fetchWeather, DEFAULT_PLACE, formatForecastDay, formatForecastTime, uvCategory, describeWeather } from "@/lib/weather";
import { WeatherIcon } from "@/components/WeatherIcon";
import { SORTED_TIERS, saveThankYouBackgroundForever, isThankYouBackgroundUnlocked, unlockWithAd24h, isAdUnlocked, getDonationUrl, type RootBeerTier } from "@/lib/monetization";
import { generateWatercolorFn } from "@/lib/aiWatercolor.functions";

export const Route = createFileRoute("/")({
  component: WeatherApp,
  head: () => ({ meta: [
    { title: "My Weather Pal — Private, Real-Time Weather & Artwork" },
    { name: "description", content: "Private local and global weather forecasts, hourly charts, 7-day outlook, clothing guidance, and AI watercolor studio." },
    { property: "og:title", content: "My Weather Pal — Private Weather & Curated Art" },
    { property: "og:description", content: "Accurate Open-Meteo forecasts paired with fluid watercolor landmark scenes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
});

interface ArtworkSlot { id: string; cityName: string; url: string; description: string; isUnlockedDefault: boolean; isAiGenerated?: boolean; }
const SAVED_AI_ARTWORKS_KEY = "weather:saved_ai_artworks";
function loadSavedAiArtworks(): ArtworkSlot[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem(SAVED_AI_ARTWORKS_KEY); if (!raw) return []; const parsed: unknown = JSON.parse(raw); if (!Array.isArray(parsed)) return []; return parsed.filter((a): a is ArtworkSlot => !!a && typeof a === "object" && typeof (a as ArtworkSlot).id === "string" && typeof (a as ArtworkSlot).url === "string"); } catch { return []; }
}
function persistAiArtwork(art: ArtworkSlot) { if (typeof window === "undefined") return; try { const existing = loadSavedAiArtworks(); localStorage.setItem(SAVED_AI_ARTWORKS_KEY, JSON.stringify([art, ...existing.filter((a) => a.id !== art.id)])); } catch (err) { console.error("Failed to save artwork:", err); } }
function removeSavedAiArtwork(id: string) { if (typeof window === "undefined") return; try { localStorage.setItem(SAVED_AI_ARTWORKS_KEY, JSON.stringify(loadSavedAiArtworks().filter((a) => a.id !== id))); } catch {} }

const LANDMARK_WATERCOLORS: ArtworkSlot[] = [
  { id: "art-bangkok-1", cityName: "Bangkok", url: "/backgrounds/vibrant/ratchaburi_haze.jpg", description: "Golden spires of Wat Arun illuminated by dusk haze", isUnlockedDefault: true },
  { id: "art-bangkok-2", cityName: "Bangkok", url: "/backgrounds/vibrant/storm.jpg", description: "Tropical monsoon clouds rolling over the Chao Phraya River", isUnlockedDefault: false },
  { id: "art-zurich-1", cityName: "Zurich", url: "/backgrounds/vibrant/snow_swiss.jpg", description: "Snow-dusted Alpine roofs and icy crystalline air", isUnlockedDefault: false },
  { id: "art-swiss-2", cityName: "Bern", url: "/backgrounds/vibrant/snow_swiss.jpg", description: "Alpine peaks glistening under quiet winter skies", isUnlockedDefault: false },
];
const DEFAULT_ARTWORK: ArtworkSlot = LANDMARK_WATERCOLORS[0]!;
const LANGUAGES = [
  { code: "en", flag: "🇺🇸", label: "English" }, { code: "th", flag: "🇹🇭", label: "ไทย (Thai)" }, { code: "es", flag: "🇪🇸", label: "Español (Spanish)" },
  { code: "ja", flag: "🇯🇵", label: "日本語 (Japanese)" }, { code: "zh", flag: "🇨🇳", label: "中文 (Chinese)" }, { code: "fr", flag: "🇫🇷", label: "Français (French)" },
  { code: "de", flag: "🇩🇪", label: "Deutsch (German)" }, { code: "pt", flag: "🇧🇷", label: "Português (Portuguese)" }, { code: "ru", flag: "🇷🇺", label: "Русский (Russian)" },
  { code: "ar", flag: "🇸🇦", label: "العربية (Arabic)" }, { code: "ko", flag: "🇰🇷", label: "한국어 (Korean)" }, { code: "id", flag: "🇮🇩", label: "Bahasa Indonesia" },
  { code: "vi", flag: "🇻🇳", label: "Tiếng Việt (Vietnamese)" }, { code: "hi", flag: "🇮🇳", label: "हिन्दी (Hindi)" },
];
const CITIES: Record<string, Record<string, string>> = {
  Bangkok: { en: "Bangkok", th: "กรุงเทพมหานคร", es: "Bangkok", ja: "バンコク", zh: "曼谷", fr: "Bangkok", de: "Bangkok", pt: "Banguecoque", ru: "Бангкок", ar: "بانكوك", ko: "방콕", id: "Bangkok", vi: "Băng Cốc", hi: "बैंकॉक" },
  Zurich: { en: "Zurich", th: "ซูริก", es: "Zúrich", ja: "チューリッヒ", zh: "苏黎世", fr: "Zurich", de: "Zürich", pt: "Zurique", ru: "Цюрих", ar: "زيورخ", ko: "취리히", id: "Zurich", vi: "Zurich", hi: "ज़्यूरिख़" },
  Bern: { en: "Bern", th: "แบร์น", es: "Berna", ja: "ベルン", zh: "伯尔尼", fr: "Berne", de: "Bern", pt: "Berna", ru: "Берн", ar: "برن", ko: "베른", id: "Bern", vi: "Bern", hi: "बर्न" },
  Tokyo: { en: "Tokyo", th: "โตเกียว", es: "Tokio", ja: "東京", zh: "东京", fr: "Tokyo", de: "Tokio", pt: "Tóquio", ru: "Токио", ar: "طوكيو", ko: "도쿄", id: "Tokyo", vi: "Tokyo", hi: "टोक्यो" },
  London: { en: "London", th: "ลอนดอน", es: "Londres", ja: "ロンドン", zh: "伦敦", fr: "Londres", de: "London", pt: "Londres", ru: "Лондон", ar: "لندن", ko: "런던", id: "London", vi: "Luân Đôn", hi: "लंदन" },
  Paris: { en: "Paris", th: "ปารีส", es: "París", ja: "パリ", zh: "巴黎", fr: "Paris", de: "Paris", pt: "Paris", ru: "Париж", ar: "باريس", ko: "파리", id: "Paris", vi: "Paris", hi: "पेरिस" },
};
const ARTWORK_DESCRIPTIONS: Record<string, Record<string, string>> = {
  "art-bangkok-1": { en: "Golden spires of Wat Arun illuminated by dusk haze", th: "ยอดพระปรางค์สีทองของวัดอรุณส่องประกายยามพลบค่ำ", es: "Torres doradas de Wat Arun iluminadas por la bruma del atardecer", ja: "夕暮れの霞に照らされるワット・アルンの黄金の塔", zh: "暮色薄雾中熠熠生辉的郑王庙金色尖顶", fr: "Flèches dorées du Wat Arun illuminées par la brume du crépuscule", de: "Goldene Spitzen des Wat Arun im Schein des Abenddunstes", pt: "Pináculos dourados de Wat Arun iluminados pela névoa do entardecer", ru: "Золотые шпили храма Ват Арун в лучах вечерней дымки", ar: "مآذن معبد وات أرون الذهبية تتلألأ في ضباب الغسق", ko: "황혼의 안개 속에 빛나는 왓 아룬의 황금 첨탑", id: "Puncak emas Wat Arun yang diterangi kabut senja", vi: "Ngọn tháp vàng của Wat Arun lung linh trong ráng chiều", hi: "संध्याकाल की धुंध में जगमगाती वाट अरुण की सुनहरी मीनारें" },
  "art-bangkok-2": { en: "Tropical monsoon clouds rolling over the Chao Phraya River", th: "เมฆมรสุมเขตร้อนพัดผ่านแม่น้ำเจ้าพระยา", es: "Nubes del monzón tropical sobre el río Chao Phraya", ja: "チャオプラヤー川の上空を覆う熱帯モンスーンの雨雲", zh: "热带季风雨云在湄南河上空翻滚", fr: "Nuages de mousson tropicale sur le fleuve Chao Phraya", de: "Tropische Monsunwolken über dem Chao Phraya Fluss", pt: "Nuvens de monção tropical sobre o rio Chao Phraya", ru: "Тропические муссонные тучи над рекой Чао Прайя", ar: "غيوم الرياح الموسمية الاستوائية تعلو نهر تشاو برايا", ko: "차오프라야강 위로 밀려오는 열대 몬순 먹구름", id: "Awan muson tropis bergulung di atas Sungai Chao Phraya", vi: "Mây gió mùa nhiệt đới vần vũ trên dòng sông Chao Phraya", hi: "चाओ फ्राया नदी के ऊपर छाते उष्णकटिबंधीय मानसूनी बादल" },
  "art-zurich-1": { en: "Snow-dusted Alpine roofs and icy crystalline air", th: "หลังคาบ้านทรงอัลไพน์เคลือบหิมะกับอากาศหนาวเย็นใสบริสุทธิ์", es: "Tejados alpinos cubiertos de nieve y aire cristalino", ja: "雪化粧したアルプスの屋根と澄み渡る冷涼な空気", zh: "覆雪的阿尔卑斯式屋顶与冰清透彻的空气", fr: "Toits alpins saupoudrés de neige et air cristallin", de: "Schneebestäubte Alpendächer und eiskristallklare Luft", pt: "Telhados alpinos cobertos de neve e ar cristalino", ru: "Заснеженные альпийские крыши и морозный кристальный воздух", ar: "أسطح جبال الألب المغطاة بالثلوج وهواء نقي بارد", ko: "눈 덮인 알프스 지붕과 맑고 청량한 겨울 공기", id: "Atap Alpen berlapis salju dan udara dingin sebening kristal", vi: "Mái nhà An-pơ phủ tuyết trắng trong bầu không khí băng giá", hi: "बर्फ से ढकी आल्प्स की छतें और ठंडी बर्फीली हवा" },
  "art-swiss-2": { en: "Alpine peaks glistening under quiet winter skies", th: "ยอดเขาแอลป์ทอประกายใต้ท้องฟ้าฤดูหนาวอันเงียบสงบ", es: "Picos alpinos relucientes bajo cielos invernales serenos", ja: "静寂な冬空の下で輝くアルプスの峰々", zh: "静谧冬日天空下闪耀的阿尔卑斯山峰", fr: "Sommets alpins scintillants sous un ciel d'hiver paisible", de: "Glitzernde Alpengipfel unter stillem Winterhimmel", pt: "Picos alpinos cintilantes sob o céu sereno de inverno", ru: "Сверкающие альпийские вершины под тихим зимним небом", ar: "قمم جبال الألب المتلألئة تحت سماء الشتاء الهادئة", ko: "고요한 겨울 하늘 아래 반짝이는 알프스 봉우리들", id: "Puncak Alpen berkilau di bawah langit musim dingin yang tenang", vi: "Những đỉnh núi An-pơ lấp lánh dưới bầu trời đông tĩnh lặng", hi: "शांत शीतकालीन आकाश के नीचे चमकती आल्प्स की चोटियाँ" },
};
const COUNTRY_NAME_TO_CODE: Record<string, string> = { thailand: "TH", switzerland: "CH", "united states": "US", usa: "US", japan: "JP", china: "CN", france: "FR", germany: "DE", spain: "ES", italy: "IT", "united kingdom": "GB", uk: "GB", canada: "CA", australia: "AU", brazil: "BR", russia: "RU", "saudi arabia": "SA", "south korea": "KR", korea: "KR", indonesia: "ID", vietnam: "VN", india: "IN" };
function getTranslatedCountry(countryName: string | undefined, lang: string): string { if (!countryName) return ""; try { const code = COUNTRY_NAME_TO_CODE[countryName.trim().toLowerCase()]; if (code) { const dn = new Intl.DisplayNames([lang], { type: "region" }); return dn.of(code) || countryName; } } catch {} return countryName; }
function getTranslatedCity(cityName: string, lang: string): string { const s = lang.toLowerCase().split("-")[0] || "en"; const m = CITIES[cityName]; if (m && m[s]) return m[s]; return cityName; }
function getTranslatedArtworkDescription(art: ArtworkSlot, lang: string): string { const s = lang.toLowerCase().split("-")[0] || "en"; const m = ARTWORK_DESCRIPTIONS[art.id]; if (m && m[s]) return m[s]; return art.description; }
function getWeatherSolidColor(code: number | undefined, isDay: boolean, skyPreset?: string): string {
  if (skyPreset && skyPreset !== "auto") { switch (skyPreset) { case "clear_day": return "#38bdf8"; case "clear_night": return "#0f172a"; case "cloudy_day": return "#94a3b8"; case "cloudy_night": return "#1e293b"; case "rain": return "#475569"; case "snow": return "#cbd5e1"; case "storm": return "#334155"; case "fog": return "#64748b"; default: break; } }
  if (code === undefined) return isDay ? "#38bdf8" : "#0f172a";
  if (code === 0 || code === 1) return isDay ? "#38bdf8" : "#0f172a";
  if (code === 2 || code === 3) return isDay ? "#94a3b8" : "#1e293b";
  if (code === 45 || code === 48) return isDay ? "#64748b" : "#1e293b";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return isDay ? "#475569" : "#1e293b";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return isDay ? "#cbd5e1" : "#1e293b";
  if (code >= 95 && code <= 99) return "#334155";
  return isDay ? "#38bdf8" : "#0f172a";
}
function getConditionTranslation(code: number, t: (k: string, fallback: string) => string): string {
  if (code === 0) return t("cond_clear", "Clear sky");
  if (code === 1 || code === 2) return t("cond_partly_cloudy", "Partly cloudy");
  if (code === 3) return t("cond_overcast", "Overcast");
  if (code === 45 || code === 48) return t("cond_fog", "Fog");
  if (code >= 51 && code <= 55) return t("cond_drizzle", "Drizzle");
  if (code >= 61 && code <= 63) return t("cond_rain", "Rain");
  if (code === 65) return t("cond_heavy_rain", "Heavy rain");
  if (code >= 71 && code <= 77) return t("cond_snow", "Snow");
  if (code >= 80 && code <= 82) return t("cond_showers", "Showers");
  if (code >= 85 && code <= 86) return t("cond_snow_showers", "Snow showers");
  if (code >= 95 && code <= 99) return t("cond_thunderstorm", "Thunderstorm");
  return t("cond_partly_cloudy", "Partly cloudy");
}
async function searchCitiesLocalized(query: string, lang: string, signal?: AbortSignal): Promise<CityResult[]> {
  const shortLang = lang.toLowerCase().split("-")[0] || "en";
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&format=json&language=${encodeURIComponent(shortLang)}`, { signal });
  if (!response.ok) return [];
  const payload = await response.json();
  return (payload.results ?? []).map((r: any) => ({ id: r.id, name: r.name, country: r.country, lat: r.latitude, lon: r.longitude }));
}

function WeatherApp() {
  const { t, i18n } = useTranslation();
  const [currentPlace, setCurrentPlace] = useState<Place>(DEFAULT_PLACE);
  const [unit, setUnit] = useState<WeatherUnit>(() => (typeof window === "undefined" ? "metric" : (localStorage.getItem("weather:unit") as WeatherUnit) || "metric"));
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [favorites, setFavorites] = useState<Place[]>(() => { if (typeof window === "undefined") return [DEFAULT_PLACE]; try { const saved = localStorage.getItem("weather:favorites"); return saved ? JSON.parse(saved) : [DEFAULT_PLACE]; } catch { return [DEFAULT_PLACE]; } });
  const [skyPreset, setSkyPreset] = useState<string>(() => (typeof window === "undefined" ? "auto" : localStorage.getItem("weather:sky_preset") || "auto"));
  const [textSize, setTextSize] = useState<"normal" | "large" | "xlarge">(() => (typeof window === "undefined" ? "normal" : (localStorage.getItem("weather:text_size") as "normal" | "large" | "xlarge") || "normal"));
  const [clothingCategory, setClothingCategory] = useState<"casual" | "business" | "sports">("casual");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryTab, setGalleryTab] = useState<"all" | "saved">("all");
  const [availableArtworks, setAvailableArtworks] = useState<ArtworkSlot[]>(() => [...loadSavedAiArtworks(), ...LANDMARK_WATERCOLORS]);
  const [activeWallpaper, setActiveWallpaper] = useState<ArtworkSlot>(() => loadSavedAiArtworks()[0] ?? DEFAULT_ARTWORK);
  const [creatorCity, setCreatorCity] = useState("");
  const [creatorPrompt, setCreatorPrompt] = useState("");
  const [creatorImagePreview, setCreatorImagePreview] = useState<string | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [creatorError, setCreatorError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [pendingUnlockTarget, setPendingUnlockTarget] = useState<ArtworkSlot | null>(null);
  const [watchingAd, setWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeLang = i18n.language || "en";

  useEffect(() => { if (!watchingAd) return; if (adCountdown <= 0) { setWatchingAd(false); if (pendingUnlockTarget) { unlockWithAd24h(pendingUnlockTarget.id); setActiveWallpaper(pendingUnlockTarget); setPendingUnlockTarget(null); } return; } const timer = setTimeout(() => setAdCountdown((c) => c - 1), 1000); return () => clearTimeout(timer); }, [watchingAd, adCountdown, pendingUnlockTarget]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("weather:lang") || localStorage.getItem("app_language");
      if (saved && saved !== i18n.language) { i18n.changeLanguage(saved); }
      else if (!saved && navigator.language) {
        const browserCode = navigator.language.toLowerCase().split("-")[0];
        if (LANGUAGES.some((l) => l.code === browserCode) && browserCode !== i18n.language) { i18n.changeLanguage(browserCode); }
      }
    }
  }, []);
  useEffect(() => { if (typeof document !== "undefined") { const code = i18n.language || "en"; document.documentElement.lang = code; document.documentElement.dir = code.startsWith("ar") ? "rtl" : "ltr"; } }, [i18n.language]);

  const loadWeather = useCallback(async (place: Place) => {
    setLoading(true); setError(null);
    try { const data = await fetchWeather(place, unit); setWeather(data); setCurrentPlace(place); setCreatorCity((prev) => prev || place.name); setAvailableArtworks((arts) => { const matched = arts.find((a) => a.cityName.toLowerCase() === place.name.toLowerCase()); if (matched) setActiveWallpaper(matched); return arts; }); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : t("load_failed")); }
    finally { setLoading(false); }
  }, [unit, t]);

  useEffect(() => { loadWeather(DEFAULT_PLACE); }, [loadWeather]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) { setSearchResults([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => { try { setSearchResults(await searchCitiesLocalized(searchQuery.trim(), activeLang, controller.signal)); } catch (err) { if ((err as Error)?.name !== "AbortError") setSearchResults([]); } }, 280);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchQuery, activeLang]);

  const toggleFavorite = (place: Place) => { setFavorites((prev) => { const exists = prev.some((p) => Math.abs(p.lat - place.lat) < 0.01 && Math.abs(p.lon - place.lon) < 0.01); const updated = exists ? prev.filter((p) => !(Math.abs(p.lat - place.lat) < 0.01 && Math.abs(p.lon - place.lon) < 0.01)) : [...prev, place]; localStorage.setItem("weather:favorites", JSON.stringify(updated)); return updated; }); };
  const isFavorite = (place: Place) => favorites.some((p) => Math.abs(p.lat - place.lat) < 0.01 && Math.abs(p.lon - place.lon) < 0.01);
  const handleSelectCity = (result: CityResult) => { const nextPlace: Place = { name: result.name, ...(result.country ? { country: result.country } : {}), lat: result.lat, lon: result.lon }; setSearchQuery(""); setSearchResults([]); loadWeather(nextPlace); };
  const handleUseLocation = () => {
    setLocationDialogOpen(false);
    if (!navigator.geolocation) { setError(t("gps_unsupported")); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => { loadWeather({ name: t("gps_location_name"), lat: pos.coords.latitude, lon: pos.coords.longitude }); },
      () => { setLoading(false); setError(t("gps_denied")); }
    );
  };
  const isSlotUnlocked = (slot: ArtworkSlot) => slot.isUnlockedDefault || !!slot.isAiGenerated || isAdUnlocked(slot.id) || isThankYouBackgroundUnlocked(slot.id);
  const handleSelectWallpaper = (slot: ArtworkSlot) => { if (isSlotUnlocked(slot)) { setActiveWallpaper(slot); setGalleryOpen(false); } else setPendingUnlockTarget(slot); };
  const handleNextArtwork = () => { const i = availableArtworks.findIndex((a) => a.id === activeWallpaper.id); const target = availableArtworks[(i + 1) % availableArtworks.length]; if (!target) return; if (isSlotUnlocked(target)) setActiveWallpaper(target); else setPendingUnlockTarget(target); };
  const handleWatchAd = () => { if (!pendingUnlockTarget) return; setWatchingAd(true); setAdCountdown(5); };
  const handleDownloadWallpaper = async (art: ArtworkSlot) => {
    try {
      const cleanCity = (art.cityName || "wallpaper").toLowerCase().replace(/[^a-z0-9]/g, "_");
      const filename = `${cleanCity}_ai_watercolor_${Date.now()}.png`;
      if (art.url.startsWith("data:") || art.url.startsWith("blob:")) { const link = document.createElement("a"); link.href = art.url; link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); setDownloadSuccess(true); setTimeout(() => setDownloadSuccess(false), 2500); return; }
      const response = await fetch(art.url); if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob(); const blobUrl = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = blobUrl; link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); setTimeout(() => URL.revokeObjectURL(blobUrl), 1000); setDownloadSuccess(true); setTimeout(() => setDownloadSuccess(false), 2500);
    } catch { window.open(art.url, "_blank"); }
  };
  const handleDeleteSavedArtwork = (id: string, e: React.MouseEvent) => { e.stopPropagation(); removeSavedAiArtwork(id); setAvailableArtworks((prev) => prev.filter((a) => a.id !== id)); if (activeWallpaper.id === id) setActiveWallpaper(DEFAULT_ARTWORK); };
  const handleGenerateAiWatercolor = async () => {
    if (!creatorCity.trim() || !creatorPrompt.trim()) { setCreatorError(t("enter_city_and_scene")); return; }
    setGeneratingAi(true); setCreatorError(null);
    try {
      const res: any = await generateWatercolorFn({ data: { city: creatorCity.trim(), userPrompt: creatorPrompt.trim(), weatherDesc: weather ? describeWeather(weather.current.code).label : undefined } });
      const imageUrl: string | undefined = res?.imageUrl ?? res?.data?.imageUrl;
      if (!imageUrl) throw new Error(t("ai_no_image"));
      const newArt: ArtworkSlot = { id: `ai-${Date.now()}`, cityName: creatorCity.trim(), url: imageUrl, description: res?.prompt ?? res?.data?.prompt ?? creatorPrompt.trim(), isUnlockedDefault: true, isAiGenerated: true };
      persistAiArtwork(newArt); setAvailableArtworks((prev) => [newArt, ...prev]); setActiveWallpaper(newArt); setCreatorPrompt(""); setCreatorImagePreview(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("ai_failed"); setCreatorError(msg);
      if (creatorImagePreview) { const fallbackArt: ArtworkSlot = { id: `upload-${Date.now()}`, cityName: creatorCity.trim(), url: creatorImagePreview, description: creatorPrompt.trim() || t("uploaded_reference"), isUnlockedDefault: true, isAiGenerated: true }; persistAiArtwork(fallbackArt); setAvailableArtworks((prev) => [fallbackArt, ...prev]); setActiveWallpaper(fallbackArt); }
    } finally { setGeneratingAi(false); }
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (event) => setCreatorImagePreview(event.target?.result as string); reader.readAsDataURL(file); } };
  const handleLanguageChange = async (code: string) => { await setAppLanguage(code); setMenuOpen(false); };
  const solidBgColor = getWeatherSolidColor(weather?.current.code, weather?.current.isDay ?? true, skyPreset);
  const getOutfitAdvice = () => {
    if (!weather) return "";
    const temp = weather.current.temperature; const isMetric = unit === "metric"; const tempC = isMetric ? temp : ((temp - 32) * 5) / 9;
    let baseTip = "";
    if (tempC < 5) baseTip = t("wear_heavy_coat");
    else if (tempC < 15) baseTip = t("wear_jacket");
    else if (tempC < 24) baseTip = t("wear_mild");
    else baseTip = t("wear_light");
    if (weather.current.precipitation > 0 || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weather.current.code)) baseTip += " " + t("wear_umbrella");
    if (clothingCategory === "business") return baseTip + " " + t("wear_business_tip");
    if (clothingCategory === "sports") return baseTip + " " + t("wear_sports_tip");
    return baseTip;
  };
  const todayDaily = weather?.daily[0];
  const displayedGalleryArt = galleryTab === "saved" ? availableArtworks.filter((a) => a.isAiGenerated) : availableArtworks;

  return (
    <div style={{ backgroundColor: solidBgColor, fontSize: textSize === "large" ? "1.08rem" : textSize === "xlarge" ? "1.18rem" : "1rem", minHeight: "100vh", transition: "background-color 0.4s ease" }} className="text-foreground transition-colors duration-300 relative selection:bg-amber-500/25">
      <div className="mx-auto max-w-xl px-4 py-4 sm:px-6 space-y-4">
        <header className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10 shadow-xs backdrop-blur-md overflow-hidden p-1"><img src="/favicon.ico" alt="My Weather Pal icon" className="h-full w-full object-contain" /></div>
            <div><h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg leading-tight">{t("app_title")}</h1><p className="text-[11px] text-muted-foreground/90 font-medium">{t("app_tagline")}</p></div>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => { const nextUnit: WeatherUnit = unit === "metric" ? "imperial" : "metric"; setUnit(nextUnit); localStorage.setItem("weather:unit", nextUnit); }} className="flex h-8 items-center rounded-xl border border-border/80 bg-card/85 px-2.5 text-xs font-semibold text-foreground shadow-xs backdrop-blur-md transition hover:bg-muted cursor-pointer">{unit === "metric" ? "°C" : "°F"}</button>
            <div className="relative">
              <button type="button" onClick={() => setSettingsOpen((p) => !p)} className="flex items-center justify-center rounded-xl border border-border/80 bg-card/85 p-2 text-foreground shadow-xs backdrop-blur-md transition hover:bg-muted cursor-pointer" title={t("settings")}><Beer className="h-4 w-4 text-amber-600 dark:text-amber-400" /></button>
              {settingsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 z-50 rounded-2xl border border-border/80 bg-popover/95 p-4 shadow-xl backdrop-blur-xl space-y-3.5 text-xs animate-in fade-in-50 duration-150">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2"><span className="font-bold text-foreground flex items-center gap-1.5"><Beer className="h-4 w-4 text-amber-500" /><span>{t("settings")}</span></span><button type="button" onClick={() => setSettingsOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="h-3.5 w-3.5" /></button></div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                    <div className="flex items-center justify-between"><span className="font-bold text-amber-700 dark:text-amber-300">{t("support_title")}</span><span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">{t("lifetime")}</span></div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{t("support_desc")}</p>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">{SORTED_TIERS.map((tier: RootBeerTier) => (<a key={tier.id} href={getDonationUrl(tier.id, "buymeacoffee")} target="_blank" rel="noreferrer" onClick={() => saveThankYouBackgroundForever(tier.id)} className="flex items-center justify-between rounded-lg border border-amber-500/25 bg-card/80 px-2 py-1.5 text-[11px] font-semibold text-foreground hover:bg-amber-500/20 transition"><span className="truncate pr-1">{tier.name.replace(" Root Beer Tier", "")}</span><span className="text-amber-600 dark:text-amber-400 font-bold">{tier.displayPrice}</span></a>))}</div>
                  </div>
                  <div className="space-y-1.5"><label className="text-[11px] font-semibold text-muted-foreground">{t("units")}</label><div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1">
                    <button type="button" onClick={() => { setUnit("metric"); localStorage.setItem("weather:unit", "metric"); }} className={`rounded-lg py-1 text-center font-medium transition cursor-pointer ${unit === "metric" ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"}`}>{t("metric")}</button>
                    <button type="button" onClick={() => { setUnit("imperial"); localStorage.setItem("weather:unit", "imperial"); }} className={`rounded-lg py-1 text-center font-medium transition cursor-pointer ${unit === "imperial" ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"}`}>{t("imperial")}</button>
                  </div></div>
                  <div className="space-y-1.5"><label className="text-[11px] font-semibold text-muted-foreground">{t("sky_background")}</label><select value={skyPreset} onChange={(e) => { setSkyPreset(e.target.value); localStorage.setItem("weather:sky_preset", e.target.value); }} className="w-full rounded-xl border border-border/80 bg-card py-1.5 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer">
                    <option value="auto">{t("sky_auto")}</option><option value="clear_day">{t("sky_clear_day")}</option><option value="clear_night">{t("sky_clear_night")}</option><option value="cloudy_day">{t("sky_cloudy_day")}</option><option value="cloudy_night">{t("sky_cloudy_night")}</option><option value="rain">{t("sky_rain")}</option><option value="snow">{t("sky_snow")}</option><option value="storm">{t("sky_storm")}</option><option value="fog">{t("sky_fog")}</option>
                  </select></div>
                  <div className="space-y-1.5"><label className="text-[11px] font-semibold text-muted-foreground">{t("text_size")}</label><div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1 text-[11px]">{(["normal", "large", "xlarge"] as const).map((size) => (<button key={size} type="button" onClick={() => { setTextSize(size); localStorage.setItem("weather:text_size", size); }} className={`rounded-lg py-1 text-center font-medium capitalize transition cursor-pointer ${textSize === size ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"}`}>{size === "normal" ? t("font_normal") : size === "large" ? t("font_large") : t("font_xlarge")}</button>))}</div></div>
                </div>
              )}
            </div>
            <div className="relative">
              <button type="button" onClick={() => setMenuOpen((p) => !p)} className="flex h-8 items-center gap-1.5 rounded-xl border border-border/80 bg-card/85 px-2.5 text-xs font-semibold text-foreground shadow-xs backdrop-blur-md transition hover:bg-muted cursor-pointer" title={t("language")}><Globe className="h-3.5 w-3.5" /><span className="uppercase text-[11px] font-bold">{activeLang.slice(0, 2)}</span></button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 z-50 rounded-2xl border border-border/80 bg-popover/95 p-2 shadow-xl backdrop-blur-xl space-y-1 text-xs animate-in fade-in-50 duration-150">
                  <div className="px-2 py-1 font-bold text-muted-foreground border-b border-border/60">{t("language")}</div>
                  <div className="max-h-52 overflow-y-auto space-y-0.5 py-1">{LANGUAGES.map((lang) => (<button key={lang.code} type="button" onClick={() => handleLanguageChange(lang.code)} className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${activeLang.startsWith(lang.code) ? "bg-amber-500/15 font-bold text-amber-700 dark:text-amber-300" : "hover:bg-muted"}`}><span className="flex items-center gap-1.5"><span>{lang.flag}</span><span>{lang.label}</span></span>{activeLang.startsWith(lang.code) && <Check className="h-3.5 w-3.5" />}</button>))}</div>
                  <div className="border-t border-border/60 pt-1"><a href="/privacy" className="block px-2 py-1.5 text-muted-foreground hover:text-foreground transition rounded-lg hover:bg-muted">{t("privacy_policy")}</a></div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="relative z-20">
          <div className="relative flex items-center"><Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("search_placeholder")} className="w-full rounded-2xl border border-border/80 bg-card/85 py-2.5 pl-10 pr-24 text-sm text-foreground shadow-xs backdrop-blur-md placeholder:text-muted-foreground/70 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition" />
            <div className="absolute right-2 flex items-center gap-1"><button type="button" onClick={() => setLocationDialogOpen(true)} className="flex items-center gap-1 rounded-xl bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition cursor-pointer" title={t("use_location")}><MapPin className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t("use_location")}</span></button></div>
          </div>
          {searchResults.length > 0 && (<div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-60 overflow-y-auto rounded-2xl border border-border/80 bg-popover/95 p-1.5 shadow-xl backdrop-blur-xl space-y-0.5 text-xs animate-in fade-in-50 duration-150">{searchResults.map((result: CityResult) => (<button key={`${result.name}-${result.lat}-${result.lon}`} type="button" onClick={() => handleSelectCity(result)} className="w-full rounded-xl px-3 py-2 text-left hover:bg-muted transition flex items-center justify-between cursor-pointer"><span className="font-semibold text-foreground">{getTranslatedCity(result.name, activeLang)}{result.country && <span className="ml-1 text-muted-foreground font-normal">({getTranslatedCountry(result.country, activeLang)})</span>}</span><span className="text-[10px] text-muted-foreground/70">{result.lat.toFixed(2)}, {result.lon.toFixed(2)}</span></button>))}</div>)}
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-card/85 px-3 py-2 text-xs shadow-xs backdrop-blur-md"><span className="flex h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" /><span className="font-bold text-foreground shrink-0">{t("alerts")}:</span><span className="truncate text-muted-foreground"><strong className="text-emerald-600 dark:text-emerald-400 mr-1">{t("all_clear")}</strong>— {t("all_clear_sub")}</span></div>

        {favorites.length > 0 && (<div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar"><span className="shrink-0 text-[11px] font-semibold text-muted-foreground/80 pl-1">{t("favorites")}:</span>{favorites.map((fav: Place) => (<button key={`${fav.name}-${fav.lat}`} type="button" onClick={() => loadWeather(fav)} className={`shrink-0 rounded-xl px-2.5 py-1 font-medium transition cursor-pointer border ${Math.abs(fav.lat - currentPlace.lat) < 0.01 && Math.abs(fav.lon - currentPlace.lon) < 0.01 ? "border-amber-500/40 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold" : "border-border/60 bg-card/70 text-muted-foreground hover:text-foreground hover:bg-card"}`}>{getTranslatedCity(fav.name, activeLang)}</button>))}</div>)}
        {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">{error}</div>}

        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card/85 shadow-lg backdrop-blur-md transition-all">
          <div className="relative aspect-16/9 w-full overflow-hidden bg-muted/40">
            <img src={activeWallpaper.url} alt={getTranslatedArtworkDescription(activeWallpaper, activeLang)} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/10"><Palette className="h-3.5 w-3.5 text-amber-400" /><span>{t("ai_scene")}</span></div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => handleDownloadWallpaper(activeWallpaper)} className="flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium backdrop-blur-md border border-white/10 hover:bg-black/60 transition cursor-pointer" title={t("download_wallpaper")}>{downloadSuccess ? <><Check className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-300 font-bold">{t("saved")}</span></> : <><Download className="h-3.5 w-3.5" /><span>{t("save")}</span></>}</button>
                <button type="button" onClick={handleNextArtwork} className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium backdrop-blur-md border border-white/10 hover:bg-black/60 transition cursor-pointer" title={t("next_art")}>{t("next_art")}</button>
                <button type="button" onClick={() => setGalleryOpen(true)} className="rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-amber-500 transition cursor-pointer">{t("art_gallery")}</button>
              </div>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
              <div className="max-w-[75%] space-y-0.5"><div className="flex items-center gap-1.5"><p className="text-xs font-bold tracking-tight text-white drop-shadow-sm">{getTranslatedCity(activeWallpaper.cityName, activeLang)}</p>{activeWallpaper.isAiGenerated && <span className="rounded-full bg-amber-500/80 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">{t("tab_saved")}</span>}</div><p className="text-[11px] text-white/80 line-clamp-1 drop-shadow-sm">{getTranslatedArtworkDescription(activeWallpaper, activeLang)}</p></div>
              <button type="button" onClick={() => toggleFavorite(currentPlace)} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition cursor-pointer" title={isFavorite(currentPlace) ? t("remove_fav") : t("add_fav")}><Heart className={`h-4 w-4 ${isFavorite(currentPlace) ? "fill-rose-500 text-rose-500" : "text-white"}`} /></button>
            </div>
          </div>
        </div>

        {weather && (<div className="rounded-3xl border border-border/80 bg-card/85 p-5 shadow-lg backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between"><div><div className="flex items-center gap-1.5"><h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{getTranslatedCity(weather.place.name, activeLang)}</h2>{weather.place.country && <span className="text-xs font-semibold text-muted-foreground">, {getTranslatedCountry(weather.place.country, activeLang)}</span>}</div><p className="text-xs font-medium text-muted-foreground/90">{getConditionTranslation(weather.current.code, (key, fallback) => t(key, { defaultValue: fallback }))}</p></div><button type="button" onClick={() => loadWeather(currentPlace)} disabled={loading} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground hover:bg-muted transition cursor-pointer" title={t("refresh")}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-amber-500" : ""}`} /></button></div>
          <div className="flex items-center justify-between pt-1"><div className="flex items-baseline gap-2"><span className="text-5xl font-black tracking-tight text-foreground sm:text-6xl">{Math.round(weather.current.temperature)}°</span><div className="text-xs font-medium text-muted-foreground space-y-0.5"><p>{t("feels_like")} {Math.round(weather.current.feelsLike)}°</p>{todayDaily && <p>{t("high_short")}: {Math.round(todayDaily.high)}° • {t("low_short")}: {Math.round(todayDaily.low)}°</p>}</div></div><div className="h-16 w-16 sm:h-20 sm:w-20"><WeatherIcon code={weather.current.code} isDay={weather.current.isDay} className="h-full w-full" /></div></div>
          <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-4 text-xs">
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-2.5 space-y-1"><div className="flex items-center gap-1.5 text-muted-foreground"><Droplets className="h-3.5 w-3.5 text-sky-500" /><span>{t("humidity")}</span></div><p className="text-sm font-bold text-foreground">{weather.current.humidity}%</p></div>
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-2.5 space-y-1"><div className="flex items-center gap-1.5 text-muted-foreground"><Wind className="h-3.5 w-3.5 text-teal-500" /><span>{t("wind")}</span></div><p className="text-sm font-bold text-foreground">{Math.round(weather.current.wind)} {unit === "metric" ? "km/h" : "mph"}</p></div>
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-2.5 space-y-1"><div className="flex items-center gap-1.5 text-muted-foreground"><Sun className="h-3.5 w-3.5 text-amber-500" /><span>{t("uv_index")}</span></div><p className="text-sm font-bold text-foreground">{weather.current.uvIndex.toFixed(1)} ({uvCategory(weather.current.uvIndex)})</p></div>
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-2.5 space-y-1"><div className="flex items-center gap-1.5 text-muted-foreground"><Compass className="h-3.5 w-3.5 text-indigo-500" /><span>{t("air_quality")}</span></div><p className="text-sm font-bold text-foreground">{weather.current.aqi ? `${weather.current.aqi} AQI` : t("aqi_good")}</p></div>
          </div>
        </div>)}

        {weather && weather.hourly.length > 0 && (<div className="rounded-3xl border border-border/80 bg-card/85 p-4 shadow-lg backdrop-blur-md space-y-3"><h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("hourly_forecast")}</h3><div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar text-center text-xs">{weather.hourly.slice(0, 16).map((h, idx: number) => (<div key={h.time} className="flex min-w-[70px] shrink-0 flex-col items-center rounded-2xl border border-border/50 bg-muted/20 p-2 space-y-1"><span className="text-[11px] font-medium text-muted-foreground">{idx === 0 ? t("now") : formatForecastTime(h.time, weather.timezone)}</span><div className="h-8 w-8 my-0.5"><WeatherIcon code={h.code} isDay={h.isDay} className="h-full w-full" /></div><span className="text-[10px] font-semibold text-foreground/80 line-clamp-1 h-3.5">{getConditionTranslation(h.code, (key, fallback) => t(key, { defaultValue: fallback }))}</span><span className="text-xs font-bold text-foreground">{Math.round(h.temperature)}°</span>{h.precipProb > 0 && <span className="text-[10px] font-semibold text-sky-500">{h.precipProb}%</span>}</div>))}</div></div>)}

        {weather && weather.daily.length > 0 && (<div className="rounded-3xl border border-border/80 bg-card/85 p-4 shadow-lg backdrop-blur-md space-y-2.5"><h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("seven_day")}</h3><div className="divide-y divide-border/50 text-xs">{weather.daily.map((d, index: number) => (<div key={d.date} className="flex items-center justify-between py-2 first:pt-1 last:pb-1"><span className="w-16 font-semibold text-foreground">{index === 0 ? t("today") : formatForecastDay(d.date, weather.timezone)}</span><div className="flex items-center gap-2 flex-1 px-2"><div className="h-6 w-6 shrink-0"><WeatherIcon code={d.code} isDay={true} className="h-full w-full" /></div><span className="text-muted-foreground font-medium truncate max-w-[130px]">{getConditionTranslation(d.code, (key, fallback) => t(key, { defaultValue: fallback }))}</span></div><div className="flex items-center gap-3 text-right">{d.precipProbMax > 0 && <span className="text-[11px] font-semibold text-sky-500">{d.precipProbMax}%</span>}<span className="font-semibold text-muted-foreground">{Math.round(d.low)}°</span><span className="font-bold text-foreground">{Math.round(d.high)}°</span></div></div>))}</div></div>)}

        {weather && (<div className="rounded-3xl border border-border/80 bg-card/85 p-4 shadow-lg backdrop-blur-md space-y-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Shirt className="h-4 w-4 text-amber-500" /><h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("what_to_wear")}</h3></div><div className="flex gap-1 rounded-xl bg-muted/60 p-0.5 text-[11px]">{(["casual", "business", "sports"] as const).map((cat) => (<button key={cat} type="button" onClick={() => setClothingCategory(cat)} className={`rounded-lg px-2 py-0.5 capitalize font-medium transition cursor-pointer ${clothingCategory === cat ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"}`}>{cat === "casual" ? t("casual") : cat === "business" ? t("business") : t("sports")}</button>))}</div></div><p className="text-xs text-muted-foreground leading-relaxed rounded-2xl bg-muted/30 p-3 border border-border/50">{getOutfitAdvice()}</p></div>)}

        <div className="rounded-3xl border border-border/80 bg-card/85 p-5 shadow-lg backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" /><h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("tab_generate")}</h3></div><span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">{t("ai_model_label")}</span></div>
          <p className="text-xs text-muted-foreground leading-relaxed">{t("ai_creator_desc")}</p>
          <div className="space-y-2 pt-1">
            <input type="text" value={creatorCity} onChange={(e) => setCreatorCity(e.target.value)} placeholder={t("city_input_placeholder", "City (e.g. Bangkok, Zurich, Tokyo)...")} className="w-full rounded-2xl border border-border/80 bg-muted/30 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none" />
            <input type="text" value={creatorPrompt} onChange={(e) => setCreatorPrompt(e.target.value)} placeholder={t("prompt_input_placeholder", "Landmark / scene description (e.g. Wat Arun at sunset over golden river)...")} className="w-full rounded-2xl border border-border/80 bg-muted/30 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none" />
            <div className="flex items-center justify-between gap-2 pt-1"><button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/60 transition cursor-pointer"><Camera className="h-3.5 w-3.5 text-amber-500" /><span>{t("gallery_upload")}</span></button><input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />{creatorImagePreview && <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium"><Check className="h-3 w-3" /><span>{t("photo_ready")}</span></div>}</div>
            {creatorError && <p className="text-[11px] text-rose-500 font-medium">{creatorError}</p>}
            <button type="button" onClick={handleGenerateAiWatercolor} disabled={generatingAi} className="w-full rounded-2xl bg-amber-500 hover:bg-amber-600 py-2.5 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">{generatingAi ? <><Loader2 className="h-4 w-4 animate-spin" /><span>{t("painting_in_progress")}</span></> : <><Sparkles className="h-4 w-4" /><span>{t("paint_watercolor")}</span></>}</button>
          </div>
        </div>

        <footer className="pt-2 pb-6 text-center text-xs text-muted-foreground/80 space-y-1"><p>{t("weather_by")}</p><div className="flex items-center justify-center gap-3 text-[11px]"><a href="/privacy" className="hover:text-foreground transition underline underline-offset-2">{t("privacy_policy")}</a><span>•</span><button type="button" onClick={() => setGalleryOpen(true)} className="hover:text-foreground transition cursor-pointer">{t("art_gallery")}</button></div></footer>
      </div>

      {galleryOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150"><div className="w-full max-w-lg rounded-3xl border border-border bg-card p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border/60 pb-3"><div className="flex items-center gap-2 font-bold text-foreground"><Palette className="h-4 w-4 text-amber-500" /><span>{t("gallery_title")}</span></div><button type="button" onClick={() => setGalleryOpen(false)} className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"><X className="h-4 w-4" /></button></div>
        <div className="flex items-center gap-1 rounded-2xl bg-muted/60 p-1 text-xs"><button type="button" onClick={() => setGalleryTab("all")} className={`flex-1 rounded-xl py-1.5 text-center font-bold transition cursor-pointer ${galleryTab === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}>{t("tab_curated")} ({availableArtworks.length})</button><button type="button" onClick={() => setGalleryTab("saved")} className={`flex-1 rounded-xl py-1.5 text-center font-bold transition cursor-pointer ${galleryTab === "saved" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}>{t("tab_saved")} ({availableArtworks.filter((a) => a.isAiGenerated).length})</button></div>
        <div className="grid grid-cols-2 gap-3">{displayedGalleryArt.length === 0 ? (<div className="col-span-2 py-8 text-center text-xs text-muted-foreground space-y-1"><p className="font-semibold">{t("no_saved")}</p><p>{t("tab_generate")}</p></div>) : (displayedGalleryArt.map((art: ArtworkSlot) => { const unlocked = isSlotUnlocked(art); const isActive = activeWallpaper.id === art.id; return (<div key={art.id} onClick={() => handleSelectWallpaper(art)} className={`group relative overflow-hidden rounded-2xl border text-left transition cursor-pointer ${isActive ? "border-amber-500 ring-2 ring-amber-500/40" : "border-border/80 hover:border-amber-500/50"}`}><div className="aspect-16/10 w-full overflow-hidden bg-muted relative"><img src={art.url} alt={getTranslatedArtworkDescription(art, activeLang)} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /><div className="absolute top-1.5 right-1.5 flex items-center gap-1"><button type="button" onClick={(e) => { e.stopPropagation(); handleDownloadWallpaper(art); }} className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/90 transition cursor-pointer" title={t("download_wallpaper")}><Download className="h-3 w-3" /></button>{art.isAiGenerated && <button type="button" onClick={(e) => handleDeleteSavedArtwork(art.id, e)} className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600/80 text-white backdrop-blur-md hover:bg-rose-600 transition cursor-pointer" title={t("delete_saved_art")}><Trash2 className="h-3 w-3" /></button>}</div></div><div className="p-2 space-y-0.5 bg-card/90"><div className="flex items-center justify-between text-xs font-bold text-foreground"><span className="truncate pr-1">{getTranslatedCity(art.cityName, activeLang)}</span>{!unlocked && <Lock className="h-3 w-3 text-amber-500 shrink-0" />}{isActive && <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300 shrink-0">{t("gallery_active_badge")}</span>}</div><p className="text-[10px] text-muted-foreground line-clamp-1">{getTranslatedArtworkDescription(art, activeLang)}</p></div></div>); }))}</div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2"><div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300"><span>{t("support_title")}</span><span>{t("from_price")}</span></div><div className="grid grid-cols-2 gap-1.5 pt-1">{SORTED_TIERS.map((tier: RootBeerTier) => (<a key={tier.id} href={getDonationUrl(tier.id, "buymeacoffee")} target="_blank" rel="noreferrer" onClick={() => saveThankYouBackgroundForever(tier.id)} className="rounded-xl border border-amber-500/30 bg-card/80 p-2 text-center text-xs font-semibold text-foreground hover:bg-amber-500/20 transition"><div>{tier.name.replace(" Root Beer Tier", "")}</div><div className="text-amber-600 dark:text-amber-400 font-bold">{tier.displayPrice}</div></a>))}</div></div>
      </div></div>)}

      {pendingUnlockTarget && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150"><div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3"><div className="flex items-center gap-2 font-bold text-foreground text-sm"><Lock className="h-4 w-4 text-amber-500" /><span>{t("unlock_title", { city: getTranslatedCity(pendingUnlockTarget.cityName, activeLang) })}</span></div><button type="button" onClick={() => setPendingUnlockTarget(null)} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="h-4 w-4" /></button></div>
        <p className="text-xs text-muted-foreground leading-relaxed">{t("unlock_desc")}</p>
        <div className="space-y-2 pt-1"><button type="button" onClick={handleWatchAd} disabled={watchingAd} className="w-full rounded-2xl bg-amber-500 hover:bg-amber-600 p-3 text-xs font-bold text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">{watchingAd ? <><Loader2 className="h-4 w-4 animate-spin" /><span>{t("watching_ad", { s: adCountdown })}</span></> : <><Play className="h-4 w-4 fill-white" /><span>{t("watch_ad")}</span></>}</button><div className="pt-2 border-t border-border/60 text-center"><p className="text-[11px] font-semibold text-muted-foreground mb-1.5">{t("or_unlock_forever")}</p><div className="grid grid-cols-2 gap-1.5">{SORTED_TIERS.slice(0, 2).map((tier: RootBeerTier) => (<a key={tier.id} href={getDonationUrl(tier.id, "buymeacoffee")} target="_blank" rel="noreferrer" onClick={() => { saveThankYouBackgroundForever(tier.id); if (pendingUnlockTarget) { unlockWithAd24h(pendingUnlockTarget.id); setActiveWallpaper(pendingUnlockTarget); setPendingUnlockTarget(null); } }} className="rounded-xl border border-amber-500/30 bg-muted/40 p-2 text-center text-[11px] font-bold text-foreground hover:bg-amber-500/15 transition">{tier.name.replace(" Root Beer Tier", "")} ({tier.displayPrice})</a>))}</div></div></div>
      </div></div>)}

      {locationDialogOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"><div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl space-y-3"><div className="flex items-center gap-2 text-foreground font-bold text-sm"><MapPin className="h-4 w-4 text-amber-500" /><span>{t("use_location")}</span></div><p className="text-xs text-muted-foreground leading-relaxed">{t("location_desc")}</p><div className="flex items-center justify-end gap-2 pt-2"><button type="button" onClick={() => setLocationDialogOpen(false)} className="rounded-xl border border-border/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition cursor-pointer">{t("cancel")}</button><button type="button" onClick={handleUseLocation} className="rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer">{t("use_location")}</button></div></div></div>)}
    </div>
  );
}
