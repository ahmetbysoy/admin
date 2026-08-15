# 03 · Tasarım (Design)

> "Kokpit Radarı" — koyu neon, bilim-kurgu kokpiti hissi. Eğlenceli ama bilgiyi asla gölgelemeyen.

---

## 1. Kimlik

Karanlık bir kokpit; tek ışık kaynağı verinin kendisi. Sinyal geldiğinde ekran "nefes alır". Sayılar monospace, kartlar cam dokulu, her şey 4px grid'de.

## 2. Design Tokens

```css
:root {
  /* Renkler */
  --bg:        #070B14;   /* zemin */
  --surface:   #0F1626;   /* kart */
  --surface-2: #16203A;   /* kart içi katman */
  --border:    #1E2A44;
  --text:      #E6EDF7;
  --muted:     #7C8DB0;
  --green:     #34D399;   /* BUY / pozitif */
  --red:       #F87171;   /* SELL / negatif */
  --amber:     #FBBF24;   /* bağlanıyor / uyarı */
  --cyan:      #22D3EE;   /* fiyat / bilgi */
  --violet:    #A78BFA;   /* velocity */
  --glow-buy:  rgba(52, 211, 153, .35);
  --glow-sell: rgba(248, 113, 113, .35);

  /* Tipografi */
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;

  /* Ölçüler */
  --radius: 16px;
  --gap: 16px;
  --tabbar-h: 64px;
  --header-h: 56px;
}
```

Fontlar **self-host** (`public/fonts/`) — offline dostu ve tutarlı render. Sadece 2 ağırlık: display 600, mono 500/700.

## 3. Layout (Mobil-Uygulama Hissi)

- Tek kolon, tam ekran; masaüstünde **max-width 480px** ortalanmış "telefon kanvası" (ince çerçeve + dışı karartılmış).
- Üst: 56px header → bağlantı pili (sol), sembol + fiyat (orta), ses simgesi (sağ).
- Alt: 64px + safe-area bottom nav → **Radar · Chart · Sinyaller · Ayarlar** (ikon + etiket, aktif sekme neon glow).
- İçerik alanı sekme başına scroll bağımsız (`overflow-y: auto`, momentum scroll).

## 4. Ekranlar

### 4.1 Radar (Ana Ekran)

```
┌──────────────────────────────┐
│ ● CANLI   BTC-USDT   97.450 ₮│  ← header
│                              │
│        ╭──────────╮           │
│      ╭─┤  RADAR   ├─╮         │  ← dönen tarama çizgisi,
│      │ │  skor oku │ │         │    sinyal LED'i merkezde,
│      │ │  %82      │ │         │    güven yüzdesi
│      ╰─┤  BUY ▂▄▆  ├─╯         │
│        ╰──────────╯           │
│   CVD ▓▓▓▓▓▓░░░░░░  +0.62     │  ← 3 dikey bar: eşik çizgisi,
│   IMB ▓▓▓▓░░░░░░░░  +0.41     │    z-score rengi, canlı değer
│   VEL ▓▓▓░░░░░░░░░  +1.82     │
│                              │
│  ▲ son sinyal: 14:32:07 +%78 │  ← mini sinyal şeridi
└──────────────────────────────┘
```

- **Radar gauge:** canvas; conic-gradient tarama çizgisi 3 sn/tur döner; kompozit skor ok olarak; merkez LED (BUY yeşil / SELL kırmızı / NÖTR gri, "nefes alma" glow'u).
- **Sinyal anı:** halka şok dalgası (pulse, 400ms) + canvas konfeti (60 parçacık, 1.2 sn) + ses + titreşim.

### 4.2 Chart

- Mum grafiği (yerel toplanan **15s** mumlar, lightweight-charts) + alt panel **CVD histogramı** (yeşil/kırmızı).
- Sinyal anları ▲/▼ marker + dikey kesikli çizgi; marker'a dokununca sinyal kartı popover'ı.
- Zaman dilimi seçici: 15s / 1m (Faz 1: 15s sabit, seçici görsel).

### 4.3 Sinyaller

- Kart listesi: zaman (mono), yön rozeti (BUY/SELL), güven çubuğu, fiyat, üç metriğin skor dökümü.
- Boş durum: "Henüz sinyal yok — radar tarıyor…" + yavaş radar animasyonu.

### 4.4 Ayarlar

- **Veri:** kaynak (OKX/Binance), sembol (BTC-USDT varsayılan), endpoint gösterimi (read-only).
- **Sinyal:** 3 ağırlık kaydırıcısı (toplam %100'e normalize), eşik (0.3–1.2), onay tick, cooldown (sn).
- **Bildirim:** ses aç/kapa, titreşim aç/kapa, "test sinyali" butonu (demo tetikleme).
- **Hakkında:** kısa açıklama + ⚠️ yatırım tavsiyesi değildir etiketi.

## 5. Hareket Dili (Animasyon Specleri)

| Animasyon | Spec |
|---|---|
| Radar taraması | 3 sn/tur, `conic-gradient` rotate, rAF |
| Sinyal pulse | 400ms, scale 1→1.6 + opacity 1→0 halka |
| Sayı tween | 250ms ease-out, yön rengi (yeşil/kırmızı) |
| LED nefes alma | BUY/SELL'de 800ms glow cycle |
| Sekme geçişi | 180ms slide-up + fade (framer-motion) |
| Konfeti | canvas, 60 parçacık, 1.2sn, yerçekimli |
| Bağlantı pili | canlı: yeşil nabız · bağlanıyor: amber yanıp sönme · kopuk: kırmızı sabit |

**Kural:** `prefers-reduced-motion` aktifse tüm animasyonlar statik duruma düşer (sinyal yine de net görünür).

## 6. Ses & Haptik (WebAudio — dosyasız sentez)

| Olay | Ses | Titreşim |
|---|---|---|
| BUY | 880 Hz, 80ms "ping" | 60ms |
| SELL | 330 Hz, 120ms "dong" | 2×40ms |
| Bağlantı koptu | 200 Hz, 150ms (1 kez) | — |

## 7. Durum Görünümleri

- **Bağlanıyor:** amber nabız + "veri akışı bekleniyor" iskeleti.
- **Kopuk:** kırmızı pil + tam ekran ince overlay "Bağlantı koptu — yeniden deneniyor (deneme #n)".
- **Veri bekleniyor:** barlar %0, LED gri NÖTR.
- **Sinyal yok:** LED gri, skor oku orta bölgede.
