# 05 · Faz 1 — Kod Üretim Promptu & Görev Listesi

> **Kullanım:** Aşağıdaki "PROMPT BAŞLANGICI / BİTİŞİ" arasındaki metni olduğu gibi kopyalayıp kod üreten bir araca (Cursor, Claude Code, GitHub Copilot, ChatGPT vb.) tek mesajda yapıştır. Araçtan görevleri sırayla (T1→T12) uygulamasını iste.

---

## PROMPT BAŞLANGICI

```
Sen kıdemli bir frontend mimarı ve React/TypeScript uzmanısın. Sana verilen planlama
dokümanlarına SADIK kalarak tek seferde bir Faz-1 uygulaması üreteceksin.

### 1) ÖNCE ŞUNLARI OKU (repo içinde mevcut)
- docs/01-blueprint.md   → mimari, katmanlar, klasör yapısı, WSS stratejisi
- docs/02-requirements.md → FR/NFR listesi ve Faz 1 kabul kriterleri
- docs/03-design.md      → design tokens, ekranlar, animasyon specleri
- docs/04-indicators.md  → indikatör matematiği ve sinyal durum makinesi
Bu dosyalar "tek doğru"dur; bunlarla çelişen bir şey yapma.

### 2) SABİT TEKNOLOJİ
React 19 + Vite (react-ts şablonu) + TypeScript strict
State: Zustand 5
Animasyon: framer-motion (bileşen geçişleri) + canvas rAF (radar/konfeti)
Grafik: lightweight-charts 5
Test: Vitest
Stil: CSS custom properties (docs/03'teki token'lar) — Tailwind/UI kiti KULLANMA

### 3) ZORUNLU MİMARİ KURALLAR
- core/ modülleri (ws, buffers, indicators, signal) saf ve UI'dan bağımsız olacak.
- UI bileşenleri iş mantığı içermeyecek; tek köprü Zustand store'ları.
- dataStore güncellemesi ≤ 10 Hz (100ms tick zamanlayıcı); DOM'a dokunan state ayrışık.
- WSS katmanı adapter desenli: OKX adapter (varsayılan) + Binance adapter, ortak
  normalize şema (docs/04 §1). Kaynak Settings'ten seçilir.
- Mumlar kline WSS'inden değil, YERELDE trades'ten toplanır (15s mumlar).
- document.hidden iken akış duraklatılır; geri gelince devam.
- WSS koparsa exponential backoff (1s→30s, sonsuz deneme) + durum yayını.
- Strict mode'da çift abonelik oluşmayacak (doğru teardown).
- Tüm sinyal/gösterge renkleri token'lardan gelecek.
- Her yerde TS tipleri (any yok); lint temiz.

### 4) GÖREV LİSTESİ (sırayla uygula, her birinin kabulünü sağla)

T1 — SCAFFOLD
  - npm create vite@latest . -- --template react-ts ile uygulamayı kur (repo köküne).
  - Bağımlılıklar: zustand, framer-motion, lightweight-charts; dev: vitest.
  - package.json script'leri: dev, build, preview, test.
  - Kabul: npm install hatasız; npm run dev boş ekranı açıyor.

T2 — TASARIM İSKELETİ
  - styles/tokens.css + global.css (docs/03 token'ları birebir).
  - Telefon kanvası: masaüstünde max-width 480px ortalanmış, mobilde tam ekran.
  - Header (bağlantı pili + sembol + fiyat) ve 4 sekmeli bottom tab bar
    (Radar · Chart · Sinyaller · Ayarlar); sekme geçişi framer-motion 180ms.
  - Boş ekran yer tutucuları.
  - Kabul: 375px ve masaüstünde layout düzgün; token'lar tek yerden geliyor.

T3 — TİPLER + WSS ADAPTÖRLERİ
  - types/: NormalizedTrade/Depth/Mark, WsStatus, SignalEvent, Settings şeması.
  - WsAdapter arayüzü + OkxAdapter + BinanceAdapter (docs/01 §6).
  - OKX: trades, books, tickers kanalları (BTC-USDT). Binance: aggTrade,
    depth20@100ms, markPrice@1s (BTCUSDT).
  - Kabul: her iki adapter da ortak şemaya çeviriyor; birim test edilebilir parse fonksiyonları.

T4 — WS MANAGER
  - WsManager: connect/disconnect, durum makinesi (connecting/live/reconnecting/offline),
    backoff 1s→30s, hidden pause/resume, teardown, durum yayını store'a.
  - Kabul: kopma simülasyonunda yeniden bağlanma tetikleniyor; unmount'ta kaynak sıfır.

T5 — BUFFER'LAR
  - core/buffers: RingBuffer<T> (sabit boyut FIFO), trades(1000), depth snapshot(son 1),
    mark(son 1), 15s mum agregatörü, CVD örnek geçmişi(600).
  - Kabul: sabit boyut korunuyor; mumlar trades'ten doğru toplanıyor (OHLCV).

T6 — İNDİKATÖRLER (saf fonksiyonlar)
  - docs/04 §2-4 birebir: CVD (+divergence), OBI, Velocity; z-score ve EMA yardımcıları.
  - 10 Hz tick: buffer'lardan hesapla → dataStore'a yaz.
  - Kabul: vitest ile CVD yön birikimi, OBI uç değerleri, Velocity z-score testleri geçer.

T7 — SİNYAL MOTORU
  - docs/04 §5: kompozit skor, eşik, onay tick, histerezis, cooldown, güven, durum makinesi.
  - SignalEvent yayını + son 200 sinyal günlüğü (localStorage persist).
  - Kabul: histerezis/cooldown testleri geçer; yapay veriyle BUY/SELL/NÖTR üretilebiliyor.

T8 — STORE'LAR
  - dataStore (tick verisi ≤10Hz), uiStore (sekme, bağlantı, sinyal anı), settingsStore
    (persist: sembol, kaynak, ağırlıklar, eşik, cooldown, ses, titreşim).
  - Kabul: ayarlar yenilemede korunuyor; store güncellemeleri 10Hz'i aşmıyor.

T9 — RADAR EKRANI
  - docs/03 §4.1: canvas radar gauge (tarama 3sn/tur), skor oku, sinyal LED'i,
    güven %, 3 indikatör barı (eşik çizgili), canlı fiyat tween'i, mini son sinyal şeridi.
  - Sinyal anı: pulse + konfeti (canvas 60 parçacık) + ses + titreşim.
  - Kabul: canlı veriyle tüm öğeler hareket ediyor; 60fps.

T10 — CHART EKRANI
  - lightweight-charts: 15s mumlar + CVD histogram paneli + BUY/SELL marker'ları.
  - Kabul: canlı mum güncelleniyor; sinyal anında marker düşüyor.

T11 — SİNYALLER + AYARLAR EKRANLARI
  - Sinyaller: kart listesi, yön rozeti, güven çubuğu, skor dökümü, boş durum.
  - Ayarlar: kaynak/sembol, ağırlık kaydırıcıları (toplam %100 normalizasyon),
    eşik, cooldown, ses/titreşim anahtarları, "test sinyali" butonu, disclaimer.
  - Kabul: tüm kontroller anında davranışa yansıyor.

T12 — CİLA + TESTLER + DOKÜMANTASYON
  - WebAudio sinyalleri (BUY 880Hz/80ms, SELL 330Hz/120ms, kopuş 200Hz), Vibration API.
  - prefers-reduced-motion: tüm animasyonlar statikleşir.
  - Durum görünümleri: bağlanıyor/kopuk overlay, iskeletler.
  - Vitest: toplam ≥ 8 test (docs/02 NFR-04 listesi).
  - README güncelle (kurulum, çalıştırma, uyarı etiketi).
  - Kabul: npm run dev, npm test, npm run build üçü de temiz geçer.

### 5) KÜRESEL KABUL (DoD)
- npm install && npm run dev → çalışır, konsol hatasız.
- Canlı bağlantıda fiyat akar, 3 indikatör değer üretir, sinyal motoru çalışır.
- Sekme gizlenince akış durur; dönünce devam.
- npm test geçer; npm run build geçer.
- 375px mobil + masaüstü (480px kanvas) düzgün.
- Kalıcı "yatırım tavsiyesi değildir" etiketi.

### 6) YASAKLAR
- Emir iletimi, hesap, API key — YOK. Backend YOK.
- Klasik indikatör kütüphaneleri (RSI/MACD paketleri) YOK.
- Çoklu sembol/watchlist YOK (tek sembol: BTC-USDT).
- Google Fonts CDN linki YOK — fontları public/fonts'a self-host indir.
- Mock/demo verisi ile ekran doldurma YOK — her şey WSS'ten.

### 7) ÇIKTI
Kodu doğrudan repo yapısına uygula (docs/01 §7'deki klasör düzenine sadık),
her görevden sonra ilgili kabul maddesini kendin doğrula, en sonunda
"Faz 1 tamamlandı" özetini görev bazında raporla.
```

## PROMPT BİTİŞİ

---

## Görev Panosu (takip tablosu)

| ID | Görev | Bağımlılık | DoD Özeti | Tahmin |
|---|---|---|---|---|
| T1 | Vite scaffold + bağımlılıklar | — | npm install temiz, dev açılıyor | 15 dk |
| T2 | Tasarım iskeleti (token, kanvas, tabbar) | T1 | 375px + masaüstü düzgün | 30 dk |
| T3 | Tipler + WSS adaptörleri (OKX/Binance) | T1 | Ortak şema, parse testleri | 45 dk |
| T4 | WsManager (backoff, pause, teardown) | T3 | Kopma simülasyonu geçer | 30 dk |
| T5 | Ring buffer'lar + mum agregatörü | T3 | Sabit boyut, OHLCV doğru | 30 dk |
| T6 | İndikatörler (saf) + 10Hz tick | T5 | CVD/OBI/VEL testleri geçer | 45 dk |
| T7 | Sinyal motoru (durum makinesi) | T6 | Histerezis/cooldown testleri | 45 dk |
| T8 | Zustand store'lar + persist | T4,T7 | Ayarlar kalıcı, ≤10Hz | 30 dk |
| T9 | Radar ekranı + animasyonlar | T2,T8 | Canlı + 60fps | 2 sa |
| T10 | Chart ekranı | T8 | Canlı mum + marker | 1 sa |
| T11 | Sinyaller + Ayarlar ekranları | T8 | Kontroller anında etkili | 1 sa |
| T12 | Cila + testler + README | T9–T11 | dev/test/build temiz | 1 sa |

**Toplam tahmin: ~8–9 saat ajan süresi.**
