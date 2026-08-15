# Src klasörü

Faz 1 kod üretimi bu klasör yapısına yerleşecek (bkz. `docs/01-blueprint.md` §7):

```
src/
├── app/          # main.tsx, App, provider'lar, sekme yönlendirme
├── core/
│   ├── ws/       # WsManager + OKX/Binance adaptörleri
│   ├── buffers/  # ring buffer'lar + mum agregatörü
│   ├── indicators/  # CVD, OBI, Velocity (saf fonksiyonlar)
│   └── signal/   # kompozit skor + sinyal durum makinesi
├── store/        # Zustand store'ları + persist
├── ui/
│   ├── components/  # Gauge, MeterBar, SignalLed, PriceTicker, TabBar…
│   └── screens/     # Radar, Chart, Signals, Settings
├── styles/       # tokens.css + global.css
└── types/        # paylaşılan tipler
```

Kod üretimi `docs/05-phase1-todo-prompt.md`'deki prompt ile yapılacak.
