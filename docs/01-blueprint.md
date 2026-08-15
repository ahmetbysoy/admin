# 01 · Blueprint (Mimari Plan)

> Faz 0 çıktısı. Kod üretimine başlamadan önce bu dosya "tek doğru" mimari kaynaktır.

---

## 1. Amaç

Klasik indikatörler (RSI, MACD, EMA, Bollinger…) yerine **ham WSS veri akışından** (işlem akışı, emir defteri, fiyat) türetilen özel metriklerle al/sat sinyali üreten; mobil uygulama gibi hissettiren, animasyonlu ve eğlenceli bir web uygulaması.

## 2. Ürün İlkeleri

1. **Mobil-öncelikli:** 360px'ten masaüstüne; masaüstünde 480px "telefon kanvası". Alt sekme çubuğu, dokunma hedefleri ≥ 44px.
2. **Veri-odaklı:** Ekranda çizilen her şey WSS'ten gelen **canlı veriden** türetilir; statik demo verisi yok.
3. **Kendi indikatörlerimiz:** Hazır indikatör kütüphanesi kullanılmaz; matematik `docs/04-indicators.md`'de tanımlı.
4. **Eğlence + netlik:** Animasyonlar abartılı ama bilgiyi gölgelemez; sinyal anı unutulmaz olur (konfeti + ses + haptik).
5. **Yalın:** Sunucu yok, auth yok, trade execution yok. Sadece public piyasa verisi.
6. **Ölçülebilir performans:** Store güncellemesi ≤ 10 Hz, animasyon 60 fps, bellek sınırlı buffer'lar.

## 3. Teknoloji Kararları

| Karar | Seçim | Neden |
|---|---|---|
| Çatı | React 19 + Vite + TypeScript | Hızlı scaffold, standart, TS ile tip güvenliği |
| State | **Zustand** | Yüksek frekanslı tick'lerde hafif; selector ile re-render kontrolü |
| Animasyon | framer-motion + canvas rAF | Bileşen geçişleri framer-motion; radar/konfeti canvas |
| Grafik | lightweight-charts | Canvas tabanlı, performanslı, ücretsiz |
| Test | Vitest | İndikatör + sinyal motoru saf fonksiyon testleri |
| Stil | CSS custom properties (design tokens) | Neon tema, runtime değişimi, ekstra bağımlılık yok |
| Paketleme | Yok (Faz 1) | PWA manifest ile "app gibi" kurulabilirlik yeterli |

**Reddedilenler:** Redux Toolkit (tick frekansında fazla seremonili), TradingView charting_library (lisans/registration gerektirir), Tailwind (tasarım sistemi zaten token'larla kurulacak, bağımlılığı azaltır).

## 4. Mimari Katmanlar

```
┌─────────────────────────────────────────────────────┐
│  UI (ui/screens + ui/components)                    │
│  Radar · Chart · Signals · Settings                 │
│  framer-motion + rAF animasyonları                  │
├─────────────────────────────────────────────────────┤
│  State (store/ — Zustand)                           │
│  dataStore (tick ≤10Hz) · uiStore · settingsStore   │
│  settings → localStorage persist                    │
├─────────────────────────────────────────────────────┤
│  Domain (core/)                                     │
│  ws/      WsManager + adaptörler (OKX, Binance)     │
│  buffers/ ring buffer'lar (son 1.000 trade vb.)     │
│  indicators/ CVD · OBI · Velocity (saf fonksiyon)   │
│  signal/  kompozit skor + durum makinesi            │
├─────────────────────────────────────────────────────┤
│  Config (types/ + ayarlar şeması)                   │
└─────────────────────────────────────────────────────┘
```

**Kural:** Bileşenler iş mantığı içermez; `core/` tamamen UI'dan bağımsızdır (test edilebilir saf modüller). Store, `core` ile `ui` arasındaki tek köprüdür.

## 5. Veri Akışı

```
WSS (trades · depth · mark fiyat)
      │  Adapter → normalize (ortak şema)
      ▼
Ring Buffer'lar (sabit boyut, FIFO)
      │  10 Hz "tick" zamanlayıcısı
      ▼
İndikatörler (CVD · Imbalance · Velocity) → z-score
      ▼
Signal Engine (kompozit skor · histerezis · cooldown)
      ▼
Zustand dataStore (≤10 Hz)
      ▼
UI (rAF ile 60 fps render) → sinyal anı: konfeti + ses + titreşim
```

**Mum grafiği de kendi verimizden:** kline WSS'ine bağımlılık yok; mumlar yerelde trades akışından toplanır (varsayılan 15s). Böylece kaynak değişince grafik davranışı değişmez.

## 6. WSS Veri Kaynağı Stratejisi

**Adaptör deseni** — kaynaklar değiştirilebilir:

```ts
type NormalizedTrade = { ts: number; price: number; qty: number; side: 'buy' | 'sell' };
type NormalizedDepth = { ts: number; bids: [number, number][]; asks: [number, number][] };
type NormalizedMark  = { ts: number; price: number };

interface WsAdapter {
  readonly id: 'okx' | 'binance';
  connect(handlers: {
    onData(e: NormalizedEvent): void;
    onStatus(s: WsStatus): void;   // 'connecting' | 'live' | 'reconnecting' | 'offline'
  }): void;
  disconnect(): void;
}
```

| Kaynak | Endpoint (Faz 1) | Not |
|---|---|---|
| **OKX (varsayılan)** | `wss://ws.okx.com:8443/ws/v5/public` → `trades`, `books`, `tickers` (BTC-USDT) | Türkiye'den erişilebilir |
| **Binance** | `wss://fstream.binance.com/stream?streams=…` → `aggTrade`, `depth20@100ms`, `markPrice@1s` | Global API'leri TR'den erişime kapalı olabilir; adaptör hazır, Settings'ten seçilir |

- Kaynak seçimi **Settings ekranından** yapılır, seçim localStorage'da tutulur.
- Aynı normalizasyondan geçen her kaynak, üst katmanlar için birebir aynıdır.

## 7. Klasör Yapısı

```
signal-radar/
├── docs/                    # Faz 0 planlama çıktıları
├── public/                  # ikon, manifest, fontlar (self-host)
├── src/
│   ├── app/                 # main.tsx, App, provider'lar, sekme yönlendirme
│   ├── core/
│   │   ├── ws/              # WsManager + adaptörler
│   │   ├── buffers/         # ring buffer'lar
│   │   ├── indicators/      # CVD, OBI, Velocity (saf fonksiyonlar)
│   │   └── signal/          # skor + durum makinesi
│   ├── store/               # Zustand store'ları + persist
│   ├── ui/
│   │   ├── components/      # Gauge, MeterBar, SignalLed, PriceTicker, TabBar…
│   │   └── screens/         # Radar, Chart, Signals, Settings
│   ├── styles/              # tokens.css + global.css
│   └── types/               # paylaşılan tipler
├── README.md
└── .gitignore
```

## 8. Faz Planı

| Faz | Kapsam | Durum |
|---|---|---|
| **0** | Blueprint, gereksinimler, tasarım, indikatör matematiği, Faz 1 promptu | ✅ Tamam |
| **1** | Vite+React uygulaması: WSS çekirdeği, 3 indikatör, sinyal motoru, 4 ekran, animasyonlar, testler | ⬜ Sıradaki |
| **2** | Hesaplamayı Web Worker'a taşıma; çoklu sembol/watchlist; sinyal CSV export; backtest/replay; push bildirim | Planlandı |

## 9. Kapsam Dışı (Non-Goals)

- Emir iletimi / hesap bağlama / API key — **asla yok**
- Backend / veri tabanı
- Backtest ve optimizasyon (Faz 2'de)
- Native paketleme (React Native/Capacitor) — PWA hissi yeterli
- Klasik teknik indikatörler (RSI, MACD, EMA ekranı vs.)

## 10. Riskler ve Kararlar

| Risk | Karar |
|---|---|
| WSS kopması | Exponential backoff (1s→30s), sonsuz yeniden deneme, durum pili UI'da |
| Tick seli ile UI kilidi | Store güncellemesi ≤10 Hz; buffer sabit boyut; DOM'a dokunan state ayrışık |
| Sekme arka planda pil tüketimi | `document.hidden` iken akış duraklatılır, dönüşte devam |
| Binance TR erişimi | Adaptör deseni + OKX varsayılan kaynak |
| Sinyal titremesi (flicker) | Histerezis + onay tick sayısı + cooldown (`docs/04`) |
| Yasal / etik | Yalnızca public veri; UI'da kalıcı "yatırım tavsiyesi değildir" etiketi |
