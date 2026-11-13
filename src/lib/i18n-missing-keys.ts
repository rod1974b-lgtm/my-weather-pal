// src/lib/i18n-missing-keys.ts — FIXED
// Put this file in src/lib/ (same folder as i18n.ts)
// FIX: import the APP's i18n instance from ./i18n, NOT from "i18next".
// The old version used the raw i18next singleton, which is a different instance
// than the one your app renders with, so none of these keys ever appeared.
import i18n from "./i18n";

const M: Record<string, Record<string, string>> = {
  en: {
    support_title: "Root Beer Supporter Tiers", support_desc: "Unlock full sky catalogs, bonus AI generations, and ad-free browsing forever.",
    metric: "Metric (°C, km/h)", imperial: "US Imperial (°F, mph)", saved: "Saved!", save: "Save",
    unlock_title: "Unlock {{city}} Wallpaper", unlock_desc: "This landmark watercolor is locked. Watch a quick 5-second simulated rewarded ad for 24-hour access, or unlock permanently with any Root Beer tier.",
    watch_ad: "Watch 5-sec Ad (Unlock 24h)", watching_ad: "Watching ad... ({{s}}s)", or_unlock_forever: "Or unlock everything forever:",
    location_desc: "We request your GPS location only to fetch your immediate local forecast. We do not store or track your coordinates anywhere.",
    gps_denied: "GPS permission denied. Search for your city above.", gps_unsupported: "Geolocation is not supported by your browser.",
    load_failed: "Failed to load weather data.", ai_no_image: "AI did not return an image. Try again.", ai_failed: "AI image generation failed. Try again.",
    enter_city_and_scene: "Please enter both a city name and a scene description.", photo_ready: "Photo ready as prompt reference", painting_in_progress: "Painting & Saving Watercolor...",
    alert_hazard: "ALERT", alert_advisory: "ADVISORY", alert_thunderstorm_tag: "SEVERE THUNDERSTORM WARNING", alert_winter_tag: "WINTER WEATHER ADVISORY", alert_rain_tag: "HEAVY PRECIPITATION ADVISORY", alert_flood_tag: "RIVER FLOOD WATCH", alert_earthquake_tag: "EARTHQUAKE ALERT",
    privacy_back: "Back to weather", privacy_kicker: "MY WEATHER PAL", privacy_title: "Privacy, plainly.",
    privacy_intro: "This app has no accounts, advertising trackers, or analytics. Weather and city-search requests go directly from your browser to Open-Meteo.",
    privacy_section1_title: "Location is your choice", privacy_section1_body: "Your location is requested only after you choose Use my location and confirm the explanation. The coordinates are used in a weather request and saved on this device as your selected place. You can search for a city instead.",
    privacy_section2_title: "Weather saved on this device", privacy_section2_body: "The latest forecast for each selected city and unit is saved in your browser so it can be shown when you are offline. Your selected city and temperature units are also stored locally. Clear this site's browser storage to remove them.",
    privacy_section3_title: "City artwork", privacy_section3_body: "The gallery uses bundled watercolor illustrations. No photo, prompt, or artwork is uploaded. Gallery images are served from this app.",
    privacy_section4_title: "External services", privacy_section4_body: "Open-Meteo receives the requested city coordinates to return forecasts and city-search results. Its service terms and privacy information are available at open-meteo.com. The app itself does not run trackers.",
    privacy_updated: "Last updated November 2026", privacy_meta_title: "Privacy · My Weather Pal", privacy_meta_desc: "How My Weather Pal handles location, weather searches, and on-device forecast storage."
  },
  th: {
    support_title: "ระดับผู้สนับสนุน Root Beer", support_desc: "ปลดล็อกท้องฟ้าทั้งหมด สร้างภาพ AI เพิ่ม และไม่มีโฆษณาตลอดไป",
    metric: "เมตริก (°C, กม./ชม.)", imperial: "สหรัฐฯ (°F, ไมล์/ชม.)", saved: "บันทึกแล้ว!", save: "บันทึก",
    unlock_title: "ปลดล็อกวอลเปเปอร์ {{city}}", unlock_desc: "ภาพนี้ถูกล็อกไว้ ดูโฆษณาจำลอง 5 วินาทีเพื่อใช้งาน 24 ชม. หรือปลดล็อกถาวรด้วย Root Beer",
    watch_ad: "ดูโฆษณา 5 วิ (ปลดล็อก 24 ชม.)", watching_ad: "กำลังดูโฆษณา... ({{s}} วิ)", or_unlock_forever: "หรือปลดล็อกทุกอย่างถาวร:",
    location_desc: "เราขอตำแหน่ง GPS เพื่อดึงพยากรณ์ท้องถิ่นเท่านั้น เราไม่จัดเก็บหรือติดตามพิกัดของคุณ",
    gps_denied: "ถูกปฏิเสธสิทธิ์ GPS ค้นหาเมืองของคุณด้านบน", gps_unsupported: "เบราว์เซอร์ของคุณไม่รองรับ GPS",
    load_failed: "โหลดข้อมูลอากาศไม่สำเร็จ", ai_no_image: "AI ไม่ได้ส่งภาพกลับมา ลองอีกครั้ง", ai_failed: "สร้างภาพ AI ไม่สำเร็จ ลองอีกครั้ง",
    enter_city_and_scene: "กรุณาใส่ทั้งชื่อเมืองและคำอธิบายฉาก", photo_ready: "รูปภาพพร้อมสำหรับใช้อ้างอิง", painting_in_progress: "กำลังวาดและบันทึกภาพสีน้ำ...",
    alert_hazard: "แจ้งเตือนภัย", alert_advisory: "คำแนะนำ", alert_thunderstorm_tag: "คำเตือนพายุฝนฟ้าคะนองรุนแรง", alert_winter_tag: "คำแนะนำสภาพอากาศฤดูหนาว", alert_rain_tag: "คำแนะนำฝนตกหนัก", alert_flood_tag: "เฝ้าระวังน้ำท่วมแม่น้ำ", alert_earthquake_tag: "แจ้งเตือนแผ่นดินไหว",
    privacy_back: "กลับไปหน้าอากาศ", privacy_kicker: "MY WEATHER PAL", privacy_title: "ความเป็นส่วนตัว อย่างตรงไปตรงมา",
    privacy_intro: "แอปนี้ไม่มีบัญชี ไม่มีตัวติดตามโฆษณา หรือการวิเคราะห์ข้อมูล คำขอสภาพอากาศส่งจากเบราว์เซอร์ของคุณไปยัง Open-Meteo โดยตรง",
    privacy_section1_title: "ตำแหน่งคือทางเลือกของคุณ", privacy_section1_body: "ตำแหน่งของคุณจะถูกขอหลังจากคุณเลือก ใช้ตำแหน่งของฉัน และยืนยันคำอธิบายเท่านั้น พิกัดจะถูกใช้ในคำขอสภาพอากาศและบันทึกในอุปกรณ์นี้ คุณสามารถค้นหาเมืองแทนได้",
    privacy_section2_title: "สภาพอากาศบันทึกในอุปกรณ์นี้", privacy_section2_body: "พยากรณ์ล่าสุดสำหรับแต่ละเมืองจะถูกบันทึกในเบราว์เซอร์เพื่อให้แสดงได้เมื่อออฟไลน์ เมืองและหน่วยอุณหภูมิที่เลือกก็จัดเก็บในเครื่องเช่นกัน ล้างที่เก็บข้อมูลของเว็บไซต์นี้เพื่อลบออก",
    privacy_section3_title: "ภาพศิลปะเมือง", privacy_section3_body: "แกลเลอรีใช้ภาพประกอบสีน้ำที่มาพร้อมแอป ไม่มีการอัปโหลดรูปภาพ คำสั่ง หรือผลงานใดๆ",
    privacy_section4_title: "บริการภายนอก", privacy_section4_body: "Open-Meteo ได้รับพิกัดเมืองที่ร้องขอเพื่อส่งพยากรณ์และผลการค้นหา ข้อกำหนดและข้อมูลความเป็นส่วนตัวมีที่ open-meteo.com แอปนี้เองไม่ใช้ตัวติดตาม",
    privacy_updated: "อัปเดตล่าสุด พฤศจิกายน 2026", privacy_meta_title: "ความเป็นส่วนตัว · My Weather Pal", privacy_meta_desc: "My Weather Pal จัดการตำแหน่ง การค้นหาสภาพอากาศ และการจัดเก็บพยากรณ์บนอุปกรณ์อย่างไร"
  },
  es: {
    support_title: "Niveles de apoyo Root Beer", support_desc: "Desbloquea todos los cielos, generaciones IA extra y navegación sin anuncios para siempre.",
    metric: "Métrico (°C, km/h)", imperial: "Imperial EE. UU. (°F, mph)", saved: "¡Guardado!", save: "Guardar",
    unlock_title: "Desbloquear fondo de {{city}}", unlock_desc: "Esta acuarela está bloqueada. Mira un anuncio simulado de 5 segundos para 24 h, o desbloquea para siempre con Root Beer.",
    watch_ad: "Ver anuncio de 5 s (24 h)", watching_ad: "Viendo anuncio... ({{s}}s)", or_unlock_forever: "O desbloquea todo para siempre:",
    location_desc: "Solo pedimos tu ubicación GPS para tu pronóstico local inmediato. No guardamos ni rastreamos tus coordenadas.",
    gps_denied: "Permiso GPS denegado. Busca tu ciudad arriba.", gps_unsupported: "Tu navegador no admite geolocalización.",
    load_failed: "No se pudo cargar el clima.", ai_no_image: "La IA no devolvió una imagen. Inténtalo de nuevo.", ai_failed: "Falló la generación con IA. Inténtalo de nuevo.",
    enter_city_and_scene: "Introduce una ciudad y una descripción de la escena.", photo_ready: "Foto lista como referencia", painting_in_progress: "Pintando y guardando acuarela...",
    alert_hazard: "ALERTA", alert_advisory: "AVISO", alert_thunderstorm_tag: "AVISO DE TORMENTA ELÉCTRICA SEVERA", alert_winter_tag: "AVISO DE CLIMA INVERNAL", alert_rain_tag: "AVISO DE PRECIPITACIÓN INTENSA", alert_flood_tag: "VIGILANCIA DE INUNDACIÓN FLUVIAL", alert_earthquake_tag: "ALERTA DE TERREMOTO",
    privacy_back: "Volver al clima", privacy_kicker: "MY WEATHER PAL", privacy_title: "Privacidad, en claro.",
    privacy_intro: "Esta app no tiene cuentas, rastreadores de publicidad ni analíticas. Las solicitudes van directo de tu navegador a Open-Meteo.",
    privacy_section1_title: "La ubicación es tu decisión", privacy_section1_body: "Tu ubicación solo se solicita después de elegir Usar mi ubicación y confirmar la explicación. Las coordenadas se usan en una solicitud de clima y se guardan en este dispositivo. Puedes buscar una ciudad en su lugar.",
    privacy_section2_title: "Clima guardado en este dispositivo", privacy_section2_body: "El pronóstico más reciente de cada ciudad se guarda en tu navegador para mostrarlo sin conexión. Tu ciudad y unidades también se guardan localmente. Borra el almacenamiento del sitio para eliminarlos.",
    privacy_section3_title: "Arte de la ciudad", privacy_section3_body: "La galería usa ilustraciones en acuarela incluidas. No se sube ninguna foto, prompt ni obra.",
    privacy_section4_title: "Servicios externos", privacy_section4_body: "Open-Meteo recibe las coordenadas solicitadas para devolver pronósticos y resultados. Sus términos están en open-meteo.com. La app no usa rastreadores.",
    privacy_updated: "Última actualización: noviembre de 2026", privacy_meta_title: "Privacidad · My Weather Pal", privacy_meta_desc: "Cómo My Weather Pal maneja la ubicación, búsquedas y almacenamiento local."
  },
  ja: {
    support_title: "ルートビア サポータープラン", support_desc: "全ての空カタログ、AI生成追加、広告なし閲覧を永久に解放。",
    metric: "メートル法 (°C, km/h)", imperial: "米国式 (°F, mph)", saved: "保存しました！", save: "保存",
    unlock_title: "{{city}} の壁紙を解放", unlock_desc: "この水彩画はロックされています。5秒の模擬広告を見ると24時間利用でき、Root Beerプランなら永久に解放できます。",
    watch_ad: "5秒広告を見る (24h解放)", watching_ad: "広告視聴中... ({{s}}秒)", or_unlock_forever: "または全て永久解放:",
    location_desc: "GPS位置は直近の現地予報を取得するためだけに使用します。座標を保存・追跡することはありません。",
    gps_denied: "GPSの許可が拒否されました。上の検索から都市を探してください。", gps_unsupported: "お使いのブラウザは位置情報に対応していません。",
    load_failed: "天気データの読み込みに失敗しました。", ai_no_image: "AIが画像を返しませんでした。もう一度お試しください。", ai_failed: "AI画像生成に失敗しました。もう一度お試しください。",
    enter_city_and_scene: "都市名とシーンの説明の両方を入力してください。", photo_ready: "参照用写真の準備ができました", painting_in_progress: "水彩画を描画して保存中...",
    alert_hazard: "警報", alert_advisory: "注意報", alert_thunderstorm_tag: "激しい雷雨警報", alert_winter_tag: "冬季気象注意報", alert_rain_tag: "大雨注意報", alert_flood_tag: "河川洪水注意情報", alert_earthquake_tag: "地震警報",
    privacy_back: "天気に戻る", privacy_kicker: "MY WEATHER PAL", privacy_title: "プライバシーを、わかりやすく。",
    privacy_intro: "このアプリにはアカウント、広告トラッカー、分析機能はありません。天気のリクエストはブラウザからOpen-Meteoへ直接送信されます。",
    privacy_section1_title: "位置情報はあなたの選択", privacy_section1_body: "位置情報は「現在地を使う」を選び、説明を確認した後にのみ要求されます。座標は天気リクエストに使われ、このデバイスに保存されます。代わりに都市を検索することもできます。",
    privacy_section2_title: "天気はこのデバイスに保存", privacy_section2_body: "各都市の最新予報はブラウザに保存され、オフラインでも表示できます。選択した都市と温度単位もローカルに保存されます。削除するにはこのサイトのストレージを消去してください。",
    privacy_section3_title: "都市アート", privacy_section3_body: "ギャラリーは同梱の水彩イラストを使用します。写真、プロンプト、作品がアップロードされることはありません。",
    privacy_section4_title: "外部サービス", privacy_section4_body: "Open-Meteoは予報を返すために要求された都市座標を受け取ります。利用規約は open-meteo.com で確認できます。このアプリはトラッカーを使用しません。",
    privacy_updated: "最終更新 2026年11月", privacy_meta_title: "プライバシー · My Weather Pal", privacy_meta_desc: "My Weather Palが位置情報、天気検索、端末内保存をどう扱うか。"
  },
  zh: {
    support_title: "Root Beer 支持者等级", support_desc: "解锁全部天空目录、额外AI生成、永久无广告浏览。",
    metric: "公制 (°C, km/h)", imperial: "美制 (°F, mph)", saved: "已保存！", save: "保存",
    unlock_title: "解锁 {{city}} 壁纸", unlock_desc: "这幅水彩画已锁定。观看5秒模拟广告可获得24小时使用权，或用Root Beer永久解锁。",
    watch_ad: "观看5秒广告 (解锁24小时)", watching_ad: "正在看广告... ({{s}}秒)", or_unlock_forever: "或永久解锁全部：",
    location_desc: "我们仅请求GPS位置以获取您即时的当地预报。我们不会存储或追踪您的坐标。",
    gps_denied: "GPS权限被拒绝。请在上方搜索您的城市。", gps_unsupported: "您的浏览器不支持地理定位。",
    load_failed: "加载天气数据失败。", ai_no_image: "AI未返回图片。请重试。", ai_failed: "AI图片生成失败。请重试。",
    enter_city_and_scene: "请输入城市名称和场景描述。", photo_ready: "参考照片已准备就绪", painting_in_progress: "正在绘制并保存水彩画...",
    alert_hazard: "警报", alert_advisory: "提示", alert_thunderstorm_tag: "严重雷暴预警", alert_winter_tag: "冬季天气提示", alert_rain_tag: "强降水提示", alert_flood_tag: "河流洪水监视", alert_earthquake_tag: "地震警报",
    privacy_back: "返回天气", privacy_kicker: "MY WEATHER PAL", privacy_title: "隐私，讲清楚。",
    privacy_intro: "本应用没有账号、广告追踪器或分析功能。天气请求直接从您的浏览器发送到Open-Meteo。",
    privacy_section1_title: "位置由您决定", privacy_section1_body: "只有在您选择“使用我的位置”并确认说明后，才会请求您的位置。坐标用于天气请求，并保存在此设备上。您也可以改为搜索城市。",
    privacy_section2_title: "天气保存在此设备上", privacy_section2_body: "每个城市的最新预报保存在浏览器中，以便离线时显示。您选定的城市和温度单位也存储在本地。清除本网站的存储即可删除。",
    privacy_section3_title: "城市艺术", privacy_section3_body: "画廊使用内置水彩插图。不会上传任何照片、提示词或作品。",
    privacy_section4_title: "外部服务", privacy_section4_body: "Open-Meteo接收请求的城市坐标以返回预报。其条款见 open-meteo.com。本应用不使用追踪器。",
    privacy_updated: "最后更新 2026年11月", privacy_meta_title: "隐私 · My Weather Pal", privacy_meta_desc: "My Weather Pal如何处理位置、天气搜索和设备端存储。"
  },
  fr: {
    support_title: "Niveaux de soutien Root Beer", support_desc: "Débloquez tous les ciels, des générations IA bonus et une navigation sans pub pour toujours.",
    metric: "Métrique (°C, km/h)", imperial: "Impérial US (°F, mph)", saved: "Enregistré !", save: "Enregistrer",
    unlock_title: "Débloquer le fond {{city}}", unlock_desc: "Cette aquarelle est verrouillée. Regardez une pub simulée de 5 secondes pour 24 h, ou débloquez à vie avec Root Beer.",
    watch_ad: "Regarder pub 5 s (24 h)", watching_ad: "Pub en cours... ({{s}}s)", or_unlock_forever: "Ou tout débloquer à vie :",
    location_desc: "Nous demandons votre position GPS uniquement pour votre prévision locale immédiate. Nous ne stockons ni ne suivons vos coordonnées.",
    gps_denied: "Autorisation GPS refusée. Recherchez votre ville ci-dessus.", gps_unsupported: "La géolocalisation n’est pas prise en charge.",
    load_failed: "Échec du chargement météo.", ai_no_image: "L’IA n’a pas renvoyé d’image. Réessayez.", ai_failed: "Échec de génération IA. Réessayez.",
    enter_city_and_scene: "Entrez une ville et une description de scène.", photo_ready: "Photo prête comme référence", painting_in_progress: "Peinture et enregistrement...",
    alert_hazard: "ALERTE", alert_advisory: "AVIS", alert_thunderstorm_tag: "ALERTE ORAGE VIOLENT", alert_winter_tag: "AVIS DE TEMPS HIVERNAL", alert_rain_tag: "AVIS DE FORTES PRÉCIPITATIONS", alert_flood_tag: "VIGILANCE CRUE FLUVIALE", alert_earthquake_tag: "ALERTE SISMIQUE",
    privacy_back: "Retour à la météo", privacy_kicker: "MY WEATHER PAL", privacy_title: "La confidentialité, clairement.",
    privacy_intro: "Cette app n’a ni comptes, ni traqueurs publicitaires, ni analytics. Les demandes vont directement de votre navigateur à Open-Meteo.",
    privacy_section1_title: "La localisation, c’est votre choix", privacy_section1_body: "Votre position n’est demandée qu’après avoir choisi Utiliser ma position et confirmé l’explication. Les coordonnées servent à une demande météo et sont enregistrées sur cet appareil.",
    privacy_section2_title: "Météo enregistrée sur cet appareil", privacy_section2_body: "La dernière prévision de chaque ville est enregistrée dans votre navigateur pour être affichée hors ligne. Votre ville et unités sont aussi stockées localement.",
    privacy_section3_title: "Art de la ville", privacy_section3_body: "La galerie utilise des illustrations aquarelle intégrées. Aucune photo, prompt ou œuvre n’est téléversée.",
    privacy_section4_title: "Services externes", privacy_section4_body: "Open-Meteo reçoit les coordonnées demandées pour renvoyer les prévisions. Ses conditions sont sur open-meteo.com. L’app n’utilise pas de traqueurs.",
    privacy_updated: "Dernière mise à jour : novembre 2026", privacy_meta_title: "Confidentialité · My Weather Pal", privacy_meta_desc: "Comment My Weather Pal gère la localisation, les recherches et le stockage local."
  },
  de: {
    support_title: "Root Beer Unterstützer-Stufen", support_desc: "Schalte alle Himmelskataloge, extra KI-Generierungen und werbefreies Surfen für immer frei.",
    metric: "Metrisch (°C, km/h)", imperial: "US-imperial (°F, mph)", saved: "Gespeichert!", save: "Speichern",
    unlock_title: "{{city}}-Hintergrund freischalten", unlock_desc: "Dieses Aquarell ist gesperrt. Sieh dir eine 5-Sekunden-Werbeanzeige für 24 h Zugang an, oder schalte mit Root Beer dauerhaft frei.",
    watch_ad: "5-Sek.-Werbeanzeige ansehen (24 h)", watching_ad: "Werbeanzeige läuft... ({{s}}s)", or_unlock_forever: "Oder alles für immer freischalten:",
    location_desc: "Wir fragen deinen GPS-Standort nur für deine sofortige lokale Vorhersage ab. Wir speichern oder verfolgen deine Koordinaten nicht.",
    gps_denied: "GPS-Berechtigung verweigert. Suche oben nach deiner Stadt.", gps_unsupported: "Geolokalisierung wird nicht unterstützt.",
    load_failed: "Wetterdaten konnten nicht geladen werden.", ai_no_image: "KI hat kein Bild zurückgegeben. Versuch es erneut.", ai_failed: "KI-Bildgenerierung fehlgeschlagen.",
    enter_city_and_scene: "Bitte gib Stadt und Szenenbeschreibung ein.", photo_ready: "Foto als Referenz bereit", painting_in_progress: "Aquarell wird gemalt & gespeichert...",
    alert_hazard: "WARNUNG", alert_advisory: "HINWEIS", alert_thunderstorm_tag: "SCHWERGEWITTERWARNUNG", alert_winter_tag: "WINTERWETTERHINWEIS", alert_rain_tag: "STARKREGENHINWEIS", alert_flood_tag: "FLUSSHOCHWASSER-BEOBACHTUNG", alert_earthquake_tag: "ERDBEBENALARM",
    privacy_back: "Zurück zum Wetter", privacy_kicker: "MY WEATHER PAL", privacy_title: "Datenschutz, klar erklärt.",
    privacy_intro: "Diese App hat keine Konten, Werbe-Tracker oder Analytics. Anfragen gehen direkt von deinem Browser zu Open-Meteo.",
    privacy_section1_title: "Standort ist deine Wahl", privacy_section1_body: "Dein Standort wird erst abgefragt, nachdem du Meinen Standort verwenden gewählt und die Erklärung bestätigt hast. Die Koordinaten werden für eine Wetteranfrage verwendet und auf diesem Gerät gespeichert.",
    privacy_section2_title: "Wetter auf diesem Gerät gespeichert", privacy_section2_body: "Die neueste Vorhersage für jede Stadt wird im Browser gespeichert, damit sie offline angezeigt werden kann. Deine Stadt und Einheiten werden ebenfalls lokal gespeichert.",
    privacy_section3_title: "Stadtkunst", privacy_section3_body: "Die Galerie verwendet mitgelieferte Aquarell-Illustrationen. Kein Foto oder Prompt wird hochgeladen.",
    privacy_section4_title: "Externe Dienste", privacy_section4_body: "Open-Meteo erhält die angefragten Koordinaten, um Vorhersagen zu liefern. Bedingungen auf open-meteo.com. Die App verwendet keine Tracker.",
    privacy_updated: "Zuletzt aktualisiert: November 2026", privacy_meta_title: "Datenschutz · My Weather Pal", privacy_meta_desc: "Wie My Weather Pal Standort, Wettersuche und lokalen Speicher handhabt."
  },
  pt: {
    support_title: "Níveis de apoio Root Beer", support_desc: "Desbloqueie todos os céus, gerações IA extra e navegação sem anúncios para sempre.",
    metric: "Métrico (°C, km/h)", imperial: "Imperial EUA (°F, mph)", saved: "Salvo!", save: "Salvar",
    unlock_title: "Desbloquear papel de parede de {{city}}", unlock_desc: "Esta aquarela está bloqueada. Assista a um anúncio simulado de 5 segundos para 24 h, ou desbloqueie para sempre com Root Beer.",
    watch_ad: "Ver anúncio de 5 s (24 h)", watching_ad: "Assistindo anúncio... ({{s}}s)", or_unlock_forever: "Ou desbloqueie tudo para sempre:",
    location_desc: "Pedimos sua localização GPS apenas para sua previsão local imediata. Não armazenamos nem rastreamos suas coordenadas.",
    gps_denied: "Permissão GPS negada. Busque sua cidade acima.", gps_unsupported: "Geolocalização não suportada pelo navegador.",
    load_failed: "Falha ao carregar o clima.", ai_no_image: "A IA não retornou uma imagem. Tente novamente.", ai_failed: "Falha na geração com IA. Tente novamente.",
    enter_city_and_scene: "Insira uma cidade e uma descrição da cena.", photo_ready: "Foto pronta como referência", painting_in_progress: "Pintando e salvando aquarela...",
    alert_hazard: "ALERTA", alert_advisory: "AVISO", alert_thunderstorm_tag: "ALERTA DE TEMPESTADE SEVERA", alert_winter_tag: "AVISO DE CLIMA DE INVERNO", alert_rain_tag: "AVISO DE CHUVA FORTE", alert_flood_tag: "VIGILÂNCIA DE ENCHENTE FLUVIAL", alert_earthquake_tag: "ALERTA DE TERREMOTO",
    privacy_back: "Voltar ao clima", privacy_kicker: "MY WEATHER PAL", privacy_title: "Privacidade, com clareza.",
    privacy_intro: "Este app não tem contas, rastreadores de anúncios ou analytics. As solicitações vão direto do seu navegador para o Open-Meteo.",
    privacy_section1_title: "A localização é sua escolha", privacy_section1_body: "Sua localização só é solicitada depois que você escolhe Usar minha localização e confirma a explicação. As coordenadas são usadas em uma solicitação de clima e salvas neste dispositivo.",
    privacy_section2_title: "Clima salvo neste dispositivo", privacy_section2_body: "A previsão mais recente de cada cidade é salva no navegador para ser exibida offline. Sua cidade e unidades também são salvas localmente.",
    privacy_section3_title: "Arte da cidade", privacy_section3_body: "A galeria usa ilustrações em aquarela incluídas. Nenhuma foto, prompt ou obra é enviada.",
    privacy_section4_title: "Serviços externos", privacy_section4_body: "O Open-Meteo recebe as coordenadas solicitadas para devolver previsões. Seus termos estão em open-meteo.com. O app não usa rastreadores.",
    privacy_updated: "Última atualização: novembro de 2026", privacy_meta_title: "Privacidade · My Weather Pal", privacy_meta_desc: "Como o My Weather Pal lida com localização, buscas e armazenamento local."
  },
  ru: {
    support_title: "Уровни поддержки Root Beer", support_desc: "Разблокируйте все каталоги неба, дополнительные генерации ИИ и просмотр без рекламы навсегда.",
    metric: "Метрическая (°C, км/ч)", imperial: "Имперская США (°F, миль/ч)", saved: "Сохранено!", save: "Сохранить",
    unlock_title: "Разблокировать обои {{city}}", unlock_desc: "Эта акварель заблокирована. Посмотрите 5-секундную рекламу для доступа на 24 ч или разблокируйте навсегда с Root Beer.",
    watch_ad: "Смотреть рекламу 5 с (24 ч)", watching_ad: "Просмотр рекламы... ({{s}}с)", or_unlock_forever: "Или разблокировать всё навсегда:",
    location_desc: "Мы запрашиваем GPS только для вашего ближайшего местного прогноза. Мы не сохраняем и не отслеживаем ваши координаты.",
    gps_denied: "Доступ к GPS запрещён. Найдите свой город выше.", gps_unsupported: "Геолокация не поддерживается браузером.",
    load_failed: "Не удалось загрузить погоду.", ai_no_image: "ИИ не вернул изображение. Попробуйте снова.", ai_failed: "Генерация ИИ не удалась. Попробуйте снова.",
    enter_city_and_scene: "Введите город и описание сцены.", photo_ready: "Фото готово как референс", painting_in_progress: "Рисуем и сохраняем акварель...",
    alert_hazard: "ТРЕВОГА", alert_advisory: "ПРЕДУПРЕЖДЕНИЕ", alert_thunderstorm_tag: "ПРЕДУПРЕЖДЕНИЕ О СИЛЬНОЙ ГРОЗЕ", alert_winter_tag: "ПРЕДУПРЕЖДЕНИЕ О ЗИМНЕЙ ПОГОДЕ", alert_rain_tag: "ПРЕДУПРЕЖДЕНИЕ О СИЛЬНЫХ ОСАДКАХ", alert_flood_tag: "НАБЛЮДЕНИЕ ЗА ПАВОДКОМ", alert_earthquake_tag: "ТРЕВОГА О ЗЕМЛЕТРЯСЕНИИ",
    privacy_back: "Назад к погоде", privacy_kicker: "MY WEATHER PAL", privacy_title: "Конфиденциальность, по-простому.",
    privacy_intro: "В приложении нет аккаунтов, рекламных трекеров или аналитики. Запросы идут напрямую из вашего браузера в Open-Meteo.",
    privacy_section1_title: "Местоположение — ваш выбор", privacy_section1_body: "Местоположение запрашивается только после того, как вы выберете Использовать моё местоположение и подтвердите объяснение. Координаты используются в запросе погоды и сохраняются на этом устройстве.",
    privacy_section2_title: "Погода сохранена на этом устройстве", privacy_section2_body: "Последний прогноз для каждого города сохраняется в браузере, чтобы показывать его офлайн. Ваш город и единицы также хранятся локально.",
    privacy_section3_title: "Городское искусство", privacy_section3_body: "Галерея использует встроенные акварельные иллюстрации. Фото, промпты и работы не загружаются.",
    privacy_section4_title: "Внешние сервисы", privacy_section4_body: "Open-Meteo получает запрошенные координаты, чтобы вернуть прогнозы. Условия на open-meteo.com. Приложение не использует трекеры.",
    privacy_updated: "Обновлено: ноябрь 2026", privacy_meta_title: "Конфиденциальность · My Weather Pal", privacy_meta_desc: "Как My Weather Pal обрабатывает местоположение, поиск погоды и локальное хранение."
  },
  ar: {
    support_title: "مستويات دعم Root Beer", support_desc: "افتح كل كتالوجات السماء، وتوليدات ذكاء اصطناعي إضافية، وتصفح بدون إعلانات للأبد.",
    metric: "متري (°C, كم/س)", imperial: "أمريكي (°F, ميل/س)", saved: "تم الحفظ!", save: "حفظ",
    unlock_title: "فتح خلفية {{city}}", unlock_desc: "هذه اللوحة المائية مقفلة. شاهد إعلاناً محاكياً لمدة 5 ثوانٍ للوصول 24 ساعة، أو افتحها للأبد مع Root Beer.",
    watch_ad: "شاهد إعلان 5 ثوانٍ (24 ساعة)", watching_ad: "جارٍ مشاهدة الإعلان... ({{s}}ث)", or_unlock_forever: "أو افتح كل شيء للأبد:",
    location_desc: "نطلب موقع GPS فقط لجلب توقعاتك المحلية الفورية. لا نخزن إحداثياتك أو نتتبعها.",
    gps_denied: "تم رفض إذن GPS. ابحث عن مدينتك أعلاه.", gps_unsupported: "المتصفح لا يدعم تحديد الموقع.",
    load_failed: "فشل تحميل بيانات الطقس.", ai_no_image: "لم يعِد الذكاء الاصطناعي صورة. حاول مجدداً.", ai_failed: "فشل توليد الصورة. حاول مجدداً.",
    enter_city_and_scene: "أدخل اسم مدينة ووصف مشهد.", photo_ready: "الصورة جاهزة كمرجع", painting_in_progress: "جارٍ رسم وحفظ اللوحة المائية...",
    alert_hazard: "تنبيه", alert_advisory: "إرشاد", alert_thunderstorm_tag: "تحذير من عاصفة رعدية شديدة", alert_winter_tag: "إرشاد طقس شتوي", alert_rain_tag: "إرشاد هطول غزير", alert_flood_tag: "مراقبة فيضان نهري", alert_earthquake_tag: "تنبيه زلزال",
    privacy_back: "العودة للطقس", privacy_kicker: "MY WEATHER PAL", privacy_title: "الخصوصية، ببساطة.",
    privacy_intro: "هذا التطبيق بلا حسابات أو متتبعات إعلانات أو تحليلات. طلبات الطقس تذهب مباشرة من متصفحك إلى Open-Meteo.",
    privacy_section1_title: "الموقع خيارك", privacy_section1_body: "يُطلب موقعك فقط بعد اختيار استخدام موقعي وتأكيد الشرح. تُستخدم الإحداثيات في طلب طقس وتُحفظ على هذا الجهاز. يمكنك البحث عن مدينة بدلاً من ذلك.",
    privacy_section2_title: "الطقس محفوظ على هذا الجهاز", privacy_section2_body: "تُحفظ أحدث توقعات لكل مدينة في المتصفح لعرضها دون اتصال. مدينتك ووحداتك محفوظة محلياً أيضاً.",
    privacy_section3_title: "فن المدينة", privacy_section3_body: "يستخدم المعرض رسوماً مائية مدمجة. لا يتم رفع أي صورة أو موجه أو عمل فني.",
    privacy_section4_title: "خدمات خارجية", privacy_section4_body: "يتلقى Open-Meteo الإحداثيات المطلوبة لإرجاع التوقعات. شروطه على open-meteo.com. التطبيق نفسه لا يستخدم متتبعات.",
    privacy_updated: "آخر تحديث نوفمبر 2026", privacy_meta_title: "الخصوصية · My Weather Pal", privacy_meta_desc: "كيف يتعامل My Weather Pal مع الموقع وبحث الطقس والتخزين المحلي."
  },
  ko: {
    support_title: "Root Beer 후원 등급", support_desc: "모든 하늘 카탈로그, 추가 AI 생성, 광고 없는 탐색을 영원히 해제하세요.",
    metric: "미터법 (°C, km/h)", imperial: "미국식 (°F, mph)", saved: "저장됨!", save: "저장",
    unlock_title: "{{city}} 배경 해제", unlock_desc: "이 수채화는 잠겨 있습니다. 5초 모의 광고를 보면 24시간 이용할 수 있고, Root Beer로 영원히 해제할 수 있습니다.",
    watch_ad: "5초 광고 보기 (24시간)", watching_ad: "광고 시청 중... ({{s}}초)", or_unlock_forever: "또는 모두 영원히 해제:",
    location_desc: "GPS 위치는 즉각적인 현지 예보를 위해서만 요청합니다. 좌표를 저장하거나 추적하지 않습니다.",
    gps_denied: "GPS 권한이 거부되었습니다. 위에서 도시를 검색하세요.", gps_unsupported: "브라우저가 위치 정보를 지원하지 않습니다.",
    load_failed: "날씨 데이터를 불러오지 못했습니다.", ai_no_image: "AI가 이미지를 반환하지 않았습니다. 다시 시도하세요.", ai_failed: "AI 이미지 생성에 실패했습니다. 다시 시도하세요.",
    enter_city_and_scene: "도시 이름과 장면 설명을 모두 입력하세요.", photo_ready: "참조용 사진이 준비되었습니다", painting_in_progress: "수채화 그리기 및 저장 중...",
    alert_hazard: "경보", alert_advisory: "주의보", alert_thunderstorm_tag: "심한 뇌우 경보", alert_winter_tag: "겨울 기상 주의보", alert_rain_tag: "호우 주의보", alert_flood_tag: "하천 홍수 주의", alert_earthquake_tag: "지진 경보",
    privacy_back: "날씨로 돌아가기", privacy_kicker: "MY WEATHER PAL", privacy_title: "개인정보, 쉽게.",
    privacy_intro: "이 앱에는 계정, 광고 추적기, 분석 기능이 없습니다. 날씨 요청은 브라우저에서 Open-Meteo로 직접 전송됩니다.",
    privacy_section1_title: "위치는 당신의 선택", privacy_section1_body: "위치는 내 위치 사용을 선택하고 설명을 확인한 후에만 요청됩니다. 좌표는 날씨 요청에 사용되며 이 기기에 선택한 장소로 저장됩니다. 대신 도시를 검색할 수 있습니다.",
    privacy_section2_title: "날씨는 이 기기에 저장", privacy_section2_body: "각 도시의 최신 예보는 브라우저에 저장되어 오프라인에서도 표시됩니다. 선택한 도시와 단위도 로컬에 저장됩니다.",
    privacy_section3_title: "도시 아트", privacy_section3_body: "갤러리는 내장 수채화 일러스트를 사용합니다. 사진, 프롬프트, 작품이 업로드되지 않습니다.",
    privacy_section4_title: "외부 서비스", privacy_section4_body: "Open-Meteo는 예보를 반환하기 위해 요청된 좌표를 받습니다. 약관은 open-meteo.com에서 확인하세요. 이 앱은 추적기를 사용하지 않습니다.",
    privacy_updated: "마지막 업데이트 2026년 11월", privacy_meta_title: "개인정보 · My Weather Pal", privacy_meta_desc: "My Weather Pal이 위치, 날씨 검색, 기기 내 저장을 어떻게 처리하는지."
  },
  id: {
    support_title: "Tingkat Pendukung Root Beer", support_desc: "Buka semua katalog langit, generasi AI bonus, dan penjelajahan bebas iklan selamanya.",
    metric: "Metrik (°C, km/jam)", imperial: "Imperial AS (°F, mph)", saved: "Tersimpan!", save: "Simpan",
    unlock_title: "Buka Wallpaper {{city}}", unlock_desc: "Cat air ini terkunci. Tonton iklan simulasi 5 detik untuk akses 24 jam, atau buka permanen dengan Root Beer.",
    watch_ad: "Tonton Iklan 5 dtk (24 jam)", watching_ad: "Menonton iklan... ({{s}}d)", or_unlock_forever: "Atau buka semuanya selamanya:",
    location_desc: "Kami meminta lokasi GPS hanya untuk prakiraan lokal imediate Anda. Kami tidak menyimpan atau melacak koordinat Anda.",
    gps_denied: "Izin GPS ditolak. Cari kota Anda di atas.", gps_unsupported: "Geolokasi tidak didukung browser.",
    load_failed: "Gagal memuat data cuaca.", ai_no_image: "AI tidak mengembalikan gambar. Coba lagi.", ai_failed: "Gagal membuat gambar AI. Coba lagi.",
    enter_city_and_scene: "Masukkan nama kota dan deskripsi adegan.", photo_ready: "Foto siap sebagai referensi", painting_in_progress: "Melukis & Menyimpan Cat Air...",
    alert_hazard: "PERINGATAN", alert_advisory: "IMBAUAN", alert_thunderstorm_tag: "PERINGATAN BADAI PETIR PARAH", alert_winter_tag: "IMBAUAN CUACA DINGIN", alert_rain_tag: "IMBAUAN HUJAN LEBAT", alert_flood_tag: "PANTAU BANJIR SUNGAI", alert_earthquake_tag: "PERINGATAN GEMPA",
    privacy_back: "Kembali ke cuaca", privacy_kicker: "MY WEATHER PAL", privacy_title: "Privasi, dengan jelas.",
    privacy_intro: "Aplikasi ini tanpa akun, pelacak iklan, atau analitik. Permintaan cuaca langsung dari browser Anda ke Open-Meteo.",
    privacy_section1_title: "Lokasi adalah pilihan Anda", privacy_section1_body: "Lokasi hanya diminta setelah Anda memilih Gunakan lokasi saya dan mengonfirmasi penjelasan. Koordinat digunakan dalam permintaan cuaca dan disimpan di perangkat ini.",
    privacy_section2_title: "Cuaca tersimpan di perangkat ini", privacy_section2_body: "Prakiraan terbaru setiap kota disimpan di browser agar tampil saat offline. Kota dan satuan Anda juga tersimpan secara lokal.",
    privacy_section3_title: "Seni kota", privacy_section3_body: "Galeri menggunakan ilustrasi cat air bawaan. Tidak ada foto, prompt, atau karya yang diunggah.",
    privacy_section4_title: "Layanan eksternal", privacy_section4_body: "Open-Meteo menerima koordinat yang diminta untuk mengembalikan prakiraan. Ketentuannya di open-meteo.com. Aplikasi ini tidak menjalankan pelacak.",
    privacy_updated: "Terakhir diperbarui November 2026", privacy_meta_title: "Privasi · My Weather Pal", privacy_meta_desc: "Bagaimana My Weather Pal menangani lokasi, pencarian cuaca, dan penyimpanan lokal."
  },
  vi: {
    support_title: "Hạng ủng hộ Root Beer", support_desc: "Mở khóa mọi danh mục bầu trời, lượt tạo AI thêm và duyệt web không quảng cáo mãi mãi.",
    metric: "Hệ mét (°C, km/h)", imperial: "Hệ Mỹ (°F, mph)", saved: "Đã lưu!", save: "Lưu",
    unlock_title: "Mở khóa hình nền {{city}}", unlock_desc: "Tranh màu nước này đã bị khóa. Xem quảng cáo mô phỏng 5 giây để dùng 24 giờ, hoặc mở khóa vĩnh viễn với Root Beer.",
    watch_ad: "Xem quảng cáo 5 giây (24 giờ)", watching_ad: "Đang xem quảng cáo... ({{s}}s)", or_unlock_forever: "Hoặc mở khóa tất cả mãi mãi:",
    location_desc: "Chúng tôi chỉ yêu cầu vị trí GPS để lấy dự báo địa phương ngay lập tức. Chúng tôi không lưu trữ hay theo dõi tọa độ của bạn.",
    gps_denied: "Quyền GPS bị từ chối. Tìm thành phố của bạn ở trên.", gps_unsupported: "Trình duyệt không hỗ trợ định vị.",
    load_failed: "Không tải được dữ liệu thời tiết.", ai_no_image: "AI không trả về hình ảnh. Thử lại.", ai_failed: "Tạo hình ảnh AI thất bại. Thử lại.",
    enter_city_and_scene: "Nhập tên thành phố và mô tả cảnh.", photo_ready: "Ảnh đã sẵn sàng làm tham khảo", painting_in_progress: "Đang vẽ và lưu màu nước...",
    alert_hazard: "CẢNH BÁO", alert_advisory: "KHUYẾN CÁO", alert_thunderstorm_tag: "CẢNH BÁO GIÔNG BÃO MẠNH", alert_winter_tag: "KHUYẾN CÁO THỜI TIẾT MÙA ĐÔNG", alert_rain_tag: "KHUYẾN CÁO MƯA LỚN", alert_flood_tag: "THEO DÕI LŨ SÔNG", alert_earthquake_tag: "CẢNH BÁO ĐỘNG ĐẤT",
    privacy_back: "Quay lại thời tiết", privacy_kicker: "MY WEATHER PAL", privacy_title: "Riêng tư, rõ ràng.",
    privacy_intro: "Ứng dụng này không có tài khoản, trình theo dõi quảng cáo hay phân tích. Yêu cầu thời tiết đi trực tiếp từ trình duyệt của bạn tới Open-Meteo.",
    privacy_section1_title: "Vị trí là lựa chọn của bạn", privacy_section1_body: "Vị trí chỉ được yêu cầu sau khi bạn chọn Sử dụng vị trí của tôi và xác nhận giải thích. Tọa độ được dùng trong yêu cầu thời tiết và lưu trên thiết bị này.",
    privacy_section2_title: "Thời tiết lưu trên thiết bị này", privacy_section2_body: "Dự báo mới nhất cho mỗi thành phố được lưu trong trình duyệt để hiển thị khi ngoại tuyến. Thành phố và đơn vị của bạn cũng được lưu cục bộ.",
    privacy_section3_title: "Nghệ thuật thành phố", privacy_section3_body: "Bộ sưu tập dùng tranh màu nước đi kèm. Không ảnh, prompt hay tác phẩm nào được tải lên.",
    privacy_section4_title: "Dịch vụ bên ngoài", privacy_section4_body: "Open-Meteo nhận tọa độ được yêu cầu để trả về dự báo. Điều khoản tại open-meteo.com. Ứng dụng không chạy trình theo dõi.",
    privacy_updated: "Cập nhật lần cuối tháng 11 năm 2026", privacy_meta_title: "Riêng tư · My Weather Pal", privacy_meta_desc: "My Weather Pal xử lý vị trí, tìm kiếm thời tiết và lưu trữ cục bộ như thế nào."
  },
  hi: {
    support_title: "Root Beer समर्थक स्तर", support_desc: "सभी आकाश कैटलॉग, अतिरिक्त AI जनरेशन और हमेशा विज्ञापन-मुक्त ब्राउज़िंग अनलॉक करें।",
    metric: "मीट्रिक (°C, किमी/घंटा)", imperial: "अमेरिकी (°F, मील/घंटा)", saved: "सहेजा गया!", save: "सहेजें",
    unlock_title: "{{city}} वॉलपेपर अनलॉक करें", unlock_desc: "यह वॉटरकलर लॉक है। 24 घंटे के लिए 5 सेकंड का विज्ञापन देखें, या Root Beer से स्थायी रूप से अनलॉक करें।",
    watch_ad: "5 सेकंड विज्ञापन देखें (24 घंटे)", watching_ad: "विज्ञापन देख रहे हैं... ({{s}}s)", or_unlock_forever: "या सब कुछ हमेशा के लिए अनलॉक करें:",
    location_desc: "हम GPS स्थान केवल आपकी तत्काल स्थानीय पूर्वानुमान के लिए मांगते हैं। हम आपके निर्देशांक संग्रहीत या ट्रैक नहीं करते।",
    gps_denied: "GPS अनुमति अस्वीकृत। ऊपर अपना शहर खोजें।", gps_unsupported: "आपका ब्राउज़र जियोलोकेशन का समर्थन नहीं करता।",
    load_failed: "मौसम डेटा लोड करने में विफल।", ai_no_image: "AI ने कोई छवि नहीं लौटाई। पुनः प्रयास करें।", ai_failed: "AI छवि निर्माण विफल। पुनः प्रयास करें।",
    enter_city_and_scene: "शहर का नाम और दृश्य विवरण दोनों दर्ज करें।", photo_ready: "संदर्भ फोटो तैयार है", painting_in_progress: "वॉटरकलर बन रहा है और सहेजा जा रहा है...",
    alert_hazard: "अलर्ट", alert_advisory: "सलाह", alert_thunderstorm_tag: "गंभीर तूफान चेतावनी", alert_winter_tag: "शीतकालीन मौसम सलाह", alert_rain_tag: "भारी वर्षा सलाह", alert_flood_tag: "नदी बाढ़ निगरानी", alert_earthquake_tag: "भूकंप अलर्ट",
    privacy_back: "मौसम पर वापस जाएं", privacy_kicker: "MY WEATHER PAL", privacy_title: "गोपनीयता, साफ़-साफ़।",
    privacy_intro: "इस ऐप में कोई खाते, विज्ञापन ट्रैकर या एनालिटिक्स नहीं हैं। मौसम अनुरोध सीधे आपके ब्राउज़र से Open-Meteo तक जाते हैं।",
    privacy_section1_title: "स्थान आपकी पसंद है", privacy_section1_body: "स्थान केवल तभी मांगा जाता है जब आप मेरा स्थान उपयोग करें चुनते हैं और स्पष्टीकरण की पुष्टि करते हैं। निर्देशांक मौसम अनुरोध में उपयोग होते हैं और इस डिवाइस पर सहेजे जाते हैं।",
    privacy_section2_title: "मौसम इस डिवाइस पर सहेजा गया", privacy_section2_body: "प्रत्येक शहर का नवीनतम पूर्वानुमान ब्राउज़र में सहेजा जाता है ताकि ऑफ़लाइन दिखाया जा सके। आपका शहर और इकाइयाँ भी स्थानीय रूप से संग्रहीत हैं।",
    privacy_section3_title: "शहर कला", privacy_section3_body: "गैलरी बंडल वॉटरकलर चित्रों का उपयोग करती है। कोई फोटो, प्रॉम्प्ट या कलाकृति अपलोड नहीं होती।",
    privacy_section4_title: "बाहरी सेवाएं", privacy_section4_body: "Open-Meteo पूर्वानुमान लौटाने के लिए अनुरोधित निर्देशांक प्राप्त करता है। इसकी शर्तें open-meteo.com पर हैं। ऐप स्वयं ट्रैकर नहीं चलाता।",
    privacy_updated: "अंतिम अपडेट नवंबर 2026", privacy_meta_title: "गोपनीयता · My Weather Pal", privacy_meta_desc: "My Weather Pal स्थान, मौसम खोज और डिवाइस स्टोरेज को कैसे संभालता है।"
  }
};

const applyMissingKeys = () => {
  for (const lang of Object.keys(M)) {
    for (const [k, v] of Object.entries(M[lang])) {
      try {
        // Only add if missing - never overwrite your existing translations
        if (!i18n.exists(k, { lng: lang })) {
          i18n.addResource(lang, "translation", k, v);
        }
      } catch {}
    }
  }
};
if ((i18n as any).isInitialized) applyMissingKeys();
else try { (i18n as any).on("initialized", applyMissingKeys); } catch { applyMissingKeys(); }
export const setAppLanguage = async (lang: string) => {
  const all = ["en","th","es","ja","zh","fr","de","pt","ru","ar","ko","id","vi","hi"];
  if (!all.includes(lang)) return;
  localStorage.setItem("weather:lang", lang);
  localStorage.setItem("app_language", lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  await i18n.changeLanguage(lang);
};
export default M;
