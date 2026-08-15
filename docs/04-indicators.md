# 04 · İndikatör Matematiği

> Bunlar klasik indikatör DEĞİLDİR. Ham WSS verisinden (işlem akışı + emir defteri + fiyat) türetilen özel metriklerdir. Tüm fonksiyonlar **saf** olmalıdır: girdi → çıktı, yan etki yok.

---

## 1. Girdi Şeması (normalize)

```ts
type NormalizedTrade = { ts: number; price: number; qty: number; side: 'buy' | 'sell' };
type NormalizedDepth = { ts: number; bids: [number, number][]; asks: [number, number][] };
// bids/asks: [fiyat, miktar], en iyi fiyattan başlayarak sıralı
type NormalizedMark  = { ts: number; price: number };
```

## 2. CVD — Cumulative Volume Delta

**Ne ölçer:** Alıcı mı satıcı mı agresif?

```
Her trade için:  delta = side === 'buy' ? +qty : -qty
Pencere (W):     son 60 sn (parametre: window_s, 30–300)

CVD      = Σ delta                (pencere içindeki tüm trade'ler)
CVD_norm = CVD / Σ qty            (∈ [-1, +1], hacimden bağımsız)
CVD_z    = (CVD_norm − EMA(CVD_norm, 20)) / std(CVD_norm, 20)
```

**Divergence (uyumsuzluk) tespiti:** son 20 sn'de fiyat yüksek tepe yaparken CVD_norm düşük tepe yapıyorsa → bearish; tersi → bullish. Tespit edilirse kompozit skora `∓0.3` düzeltme uygulanır.

## 3. Imbalance — Emir Defteri Dengesizliği

**Ne ölçer:** Bir tarafta "duvar" var mı?

```
N seviye (parametre: depth_levels, varsayılan 20):
B = Σ bids[i].qty ,  A = Σ asks[i].qty

OBI_t = (B − A) / (B + A)          (∈ [-1, +1])
OBI   = EMA(OBI_t, α = 0.2)
Uyarı bandı: |OBI| ≥ 0.35
```

## 4. Velocity — Fiyat Hızı / İvmelenme

**Ne ölçer:** Fiyat hangi hızla kaçıyor?

```
1 sn pencere:   v_t = (P_t − P_{t−1}) / Δt
v   = EMA(v_t, α = 0.3)
v_z = (v − EMA(v, 30)) / std(v, 30)
İvmelenme: |v_z| ≥ 1.5
```

## 5. Kompozit Skor ve Sinyal

```
S = w1·CVD_z + w2·OBI + w3·v_z
varsayılan: w = (0.4, 0.3, 0.3)     (UI'da Σw = 1'e normalize edilir)

eşik:       |S| ≥ 0.6        → aday sinyal
onay:       aday taraf 2 tick (2×100ms) korunursa → FIRED
histerezis: FIRED sonrası |S| < 0.3'e düşmeden karşı taraf tetiklenmez
cooldown:   sinyalden sonra 15 sn yeni sinyal yok
güven:      confidence = min(100, round(|S| / 1.2 × 100))
```

### Durum Makinesi

```
        |S|≥0.6 (2 tick)        event + log
IDLE ──────────────────▶ ARMED ─────────────▶ FIRED
  ▲                                              │
  └────────────────── COOLDOWN ◀─────────────────┘
                    (15 sn sonra IDLE)
```

Sinyal olayı taşır: `{ ts, side: 'BUY'|'SELL', price, confidence, scores: {cvd, obi, vel} }`

## 6. Parametre Tablosu (Settings'te görünenler)

| Parametre | Varsayılan | Aralık |
|---|---|---|
| `window_s` | 60 | 30–300 |
| `depth_levels` | 20 | 5–50 |
| `obi_ema_alpha` | 0.2 | 0.05–0.5 |
| `vel_ema_alpha` | 0.3 | 0.05–0.5 |
| `w_cvd / w_obi / w_vel` | 0.4 / 0.3 / 0.3 | 0–1 (toplam 1) |
| `threshold` | 0.6 | 0.3–1.2 |
| `confirm_ticks` | 2 | 1–10 |
| `cooldown_s` | 15 | 5–120 |
| `divergence_adjust` | 0.3 | 0–0.5 |

## 7. Faz 1 Sınırları

- Sinyaller **geri test edilmez**; "eğitim/eğlence amaçlı" etiketi kalıcıdır.
- Tick zamanlayıcısı: 10 Hz (100ms) — tüm pencere/skor hesapları bu ritimde yenilenir.
- Buffer sınırları: trades 1.000 kayıt; CVD örnekleri 600; derinlik son 1 snapshot.
