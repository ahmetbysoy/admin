# 02 · Gereksinimler

> Faz 1'in sözleşmesi. Kod üretimi bu kriterlerle kabul edilir.

---

## 1. Fonksiyonel Gereksinimler (FR)

| ID | Gereksinim |
|---|---|
| FR-01 | Uygulama seçili veri kaynağına (varsayılan **OKX**) WSS ile bağlanır; bağlantı durumunu gösterir (canlı / bağlanıyor / yeniden bağlanıyor / kopuk). |
| FR-02 | Kopma durumunda exponential backoff (1s → 2 → 4 … maks 30s) ile **sonsuz** yeniden bağlanma. |
| FR-03 | Sekme arka plana geçince akış duraklatılır, öne gelince kaldığı yerden devam eder. |
| FR-04 | Settings'ten kaynak seçimi: OKX / Binance (varsayılan OKX, TR erişimi nedeniyle). |
| FR-05 | Trades akışı normalize edilir ve son **1.000 işlem** ring buffer'da tutulur. |
| FR-06 | Emir defteri (depth) akışı normalize edilir; son 20 seviye snapshot tutulur. |
| FR-07 | Mark fiyat akışından son fiyat + periyot içi değişim hesaplanır. |
| FR-08 | **CVD** indikatörü hesaplanır (tanım: `docs/04-indicators.md`). |
| FR-09 | **Imbalance** indikatörü hesaplanır. |
| FR-10 | **Velocity** indikatörü hesaplanır. |
| FR-11 | Üç metrikten **kompozit skor** üretilir; ağırlıklar Settings'ten ayarlanabilir. |
| FR-12 | Sinyal durum makinesi (histerezis + onay + cooldown) çalışır; çıktı: **BUY / SELL / NÖTR + güven %**. |
| FR-13 | Sinyal günlüğü: son 200 sinyal localStorage'da tutulur (zaman, yön, fiyat, güven, skor dökümü). |
| FR-14 | **Radar** ekranı: radar gauge + 3 indikatör barı + sinyal LED'i + canlı fiyat. |
| FR-15 | **Chart** ekranı: yerel toplanan mumlar (15s) + CVD histogramı + sinyal işaretleri (▲/▼). |
| FR-16 | **Signals** ekranı: sinyal kartları listesi + güven rozetleri + boş durum görünümü. |
| FR-17 | **Settings** ekranı: sembol, kaynak, ağırlık kaydırıcıları, eşik, cooldown, ses/titreşim. |
| FR-18 | Tüm ayarlar localStorage'da kalıcıdır. |
| FR-19 | Sinyal anında sesli (WebAudio) ve titreşimli (Vibration API) bildirim; ikisi de kapatılabilir. |
| FR-20 | Fiyat göstergesi her güncellemede yönüne göre renklenir ve sayı tween ile akar. |

## 2. Teknik Gereksinimler (NFR)

| ID | Gereksinim |
|---|---|
| NFR-01 | Animasyonlar 60 fps; **Zustand güncellemesi ≤ 10 Hz**; DOM'a dokunan state, hesaplama state'inden ayrışık. |
| NFR-02 | Bağlantı kopunca <5 sn içinde ilk yeniden bağlanma denemesi başlar. |
| NFR-03 | Buffer'lar sabit boyutlu (FIFO), bellek sızıntısı yok; `strict mode` altında çift subscribe olmaz. |
| NFR-04 | `core/` tamamen saf fonksiyon; Vitest ile **en az 8 birim test**: CVD yön birikimi, divergence, OBI uç değerleri (±1), Velocity z-score, kompozit skor ağırlıkları, histerezis, cooldown, bağlantı durum makinesi. |
| NFR-05 | 360px → masaüstü responsive; masaüstünde max 480px telefon kanvası, kenarlarda çerçeve. |
| NFR-06 | Erişilebilirlik: WCAG kontrastı, `prefers-reduced-motion` desteği (tüm animasyonlar statikleşir), dokunma hedefleri ≥ 44px. |
| NFR-07 | WSS erişilemezse uygulama çökmez; "bağlanıyor" durumu ve yeniden deneme görünür. |
| NFR-08 | Gizlilik: sunucu yok, veri localStorage dışına çıkmaz. |

## 3. Faz 1 Kabul Kriterleri (Definition of Done)

- [ ] `npm install && npm run dev` → uygulama açılır, hata yok.
- [ ] Bağlantı kurulunca canlı fiyat akar; 3 indikatör değer üretir.
- [ ] Sinyal oluşunca görsel (konfeti/LED) + ses + titreşim tetiklenir ve günlüğe düşer.
- [ ] Ayarlar değiştirilince davranış anında değişir; sayfa yenilenince ayarlar korunur.
- [ ] Sekme gizlenince akış durur, geri gelince devam eder.
- [ ] `npm test` geçer (indikatör + sinyal motoru).
- [ ] 375px mobil ve masaüstü görünümleri düzgündür.
- [ ] Uygulamada kalıcı "yatırım tavsiyesi değildir" etiketi vardır.

## 4. Kapsam Dışı (Faz 1)

Emir iletimi / API key / hesap · backend · backtest · çoklu sembol/watchlist · push bildirim · native paketleme · klasik indikatörler.
