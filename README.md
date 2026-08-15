# 📡 Signal Radar

Canlı WebSocket (WSS) **emir akışından** beslenen, klasik indikatör kullanmayan, kendi sinyal motoruna sahip, mobil-öncelikli ve eğlenceli bir trading radarı.

## Fikir

RSI, MACD, EMA gibi hazır indikatörler **YOK**. Bunun yerine ham piyasa verisinden (işlem akışı + emir defteri) kendi metriklerimizi türetiyoruz:

| Metrik | Ne ölçer |
|---|---|
| **CVD** (Cumulative Volume Delta) | Alıcı/satıcı hacim dengesi |
| **Imbalance** | Emir defteri dengesizliği |
| **Velocity** | Fiyatın hızı / ivmelenmesi |

Üçünün ağırlıklı **kompozit skoru** AL / SAT / NÖTR sinyali üretir. Arayüz "kokpit radarı" temasında; tarama animasyonları, sinyal anında konfeti + ses + titreşim ile canlı çalışır. Hedef: **mobil uygulama gibi hissettiren** bir web uygulaması.

## Durum

- [x] **Faz 0** — Blueprint, gereksinimler, tasarım, indikatör matematiği (`docs/`)
- [ ] **Faz 1** — React + Vite uygulaması (`docs/05-phase1-todo-prompt.md` içindeki prompt ile üretilir)
- [ ] **Faz 2** — Web Worker, çoklu sembol, backtest, push bildirim (planlandı)

## Dokümanlar

| Dosya | İçerik |
|---|---|
| `docs/01-blueprint.md` | Mimari, veri akışı, klasör yapısı, faz planı |
| `docs/02-requirements.md` | Fonksiyonel & teknik gereksinimler, kabul kriterleri |
| `docs/03-design.md` | Tasarım sistemi, ekranlar, animasyon specleri |
| `docs/04-indicators.md` | İndikatörlerin matematik tanımları |
| `docs/05-phase1-todo-prompt.md` | Faz 1 kod üretimi için kopyala-yapıştır prompt + görev listesi |
| `docs/06-github-push.md` | Repoyu GitHub'a yayınlama adımları |

## Hızlı başlangıç (Faz 1 tamamlanınca)

```bash
npm install
npm run dev
```

## Uyarı

⚠️ **Eğitim ve eğlence amaçlıdır; yatırım tavsiyesi DEĞİLDİR.** Gerçek parayla işlem emri üretmez, üretmeyecek. Yalnızca kamuya açık piyasa verisi kullanılır.
