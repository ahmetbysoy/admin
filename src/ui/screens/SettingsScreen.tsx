import { useSettingsStore, useUiStore } from '../../store/index.js'
import type { Settings, SignalWeights } from '../../types/index.js'
import './SettingsScreen.css'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="settings-row">
      <label className="settings-label">{label}</label>
      <div className="settings-control">{children}</div>
    </div>
  )
}

function WeightSliders() {
  const { settings, updateSettings } = useSettingsStore()
  const { weights } = settings

  const update = (key: keyof SignalWeights, raw: number) => {
    const newW = { ...weights, [key]: raw }
    // Toplam 1'e normalize et
    const total = newW.cvd + newW.obi + newW.vel
    if (total === 0) return
    const normalized: SignalWeights = {
      cvd: +(newW.cvd / total).toFixed(3),
      obi: +(newW.obi / total).toFixed(3),
      vel: +(newW.vel / total).toFixed(3),
    }
    updateSettings({ weights: normalized })
  }

  return (
    <div className="weight-sliders">
      {(['cvd', 'obi', 'vel'] as (keyof SignalWeights)[]).map((key) => (
        <div key={key} className="weight-row">
          <span className="weight-label">{key.toUpperCase()}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={weights[key]}
            onChange={(e) => update(key, parseFloat(e.target.value))}
            className="weight-slider"
            aria-label={`${key} ağırlığı`}
          />
          <span className="weight-value">{(weights[key] * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  )
}

export function SettingsScreen() {
  const { settings, updateSettings, resetSettings } = useSettingsStore()
  const addSignalEvent = useUiStore((s) => s.addSignalEvent)

  const testSignal = () => {
    addSignalEvent({
      id: `test-${Date.now()}`,
      ts: Date.now(),
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      price: 97000 + Math.random() * 2000,
      confidence: Math.floor(60 + Math.random() * 40),
      scores: {
        cvd: +(Math.random() * 2 - 1).toFixed(2),
        obi: +(Math.random() * 2 - 1).toFixed(2),
        vel: +(Math.random() * 2 - 1).toFixed(2),
        composite: +(Math.random() * 2 - 1).toFixed(2),
      },
    })
  }

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    updateSettings({ [key]: value })
  }

  return (
    <div className="settings-screen">
      {/* Veri */}
      <section className="settings-section">
        <h2 className="settings-section-title">Veri Kaynağı</h2>
        <Row label="Kaynak">
          <div className="toggle-group">
            {(['okx', 'binance'] as const).map((src) => (
              <button
                key={src}
                className={`toggle-btn${settings.source === src ? ' toggle-btn--active' : ''}`}
                onClick={() => updateSetting('source', src)}
                aria-pressed={settings.source === src}
              >
                {src.toUpperCase()}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Sembol">
          <span className="settings-readonly">{settings.symbol}</span>
        </Row>
        <Row label="CVD Pencere">
          <div className="slider-row">
            <input
              type="range" min={30} max={300} step={10}
              value={settings.windowS}
              onChange={(e) => updateSetting('windowS', parseInt(e.target.value, 10))}
              className="weight-slider"
              aria-label="CVD pencere (saniye)"
            />
            <span className="weight-value">{settings.windowS}s</span>
          </div>
        </Row>
      </section>

      {/* Sinyal */}
      <section className="settings-section">
        <h2 className="settings-section-title">Sinyal Parametreleri</h2>
        <Row label="Ağırlıklar">
          <WeightSliders />
        </Row>
        <Row label="Eşik">
          <div className="slider-row">
            <input
              type="range" min={0.3} max={1.2} step={0.05}
              value={settings.threshold}
              onChange={(e) => updateSetting('threshold', parseFloat(e.target.value))}
              className="weight-slider"
              aria-label="Sinyal eşiği"
            />
            <span className="weight-value">{settings.threshold.toFixed(2)}</span>
          </div>
        </Row>
        <Row label="Onay Tick">
          <div className="slider-row">
            <input
              type="range" min={1} max={10} step={1}
              value={settings.confirmTicks}
              onChange={(e) => updateSetting('confirmTicks', parseInt(e.target.value, 10))}
              className="weight-slider"
              aria-label="Onay tick sayısı"
            />
            <span className="weight-value">{settings.confirmTicks}</span>
          </div>
        </Row>
        <Row label="Cooldown">
          <div className="slider-row">
            <input
              type="range" min={5} max={120} step={5}
              value={settings.cooldownS}
              onChange={(e) => updateSetting('cooldownS', parseInt(e.target.value, 10))}
              className="weight-slider"
              aria-label="Cooldown süresi"
            />
            <span className="weight-value">{settings.cooldownS}s</span>
          </div>
        </Row>
      </section>

      {/* Bildirimler */}
      <section className="settings-section">
        <h2 className="settings-section-title">Bildirimler</h2>
        <Row label="Ses">
          <button
            className={`toggle-btn${settings.soundEnabled ? ' toggle-btn--active' : ''}`}
            onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
            aria-pressed={settings.soundEnabled}
          >
            {settings.soundEnabled ? '🔊 Açık' : '🔇 Kapalı'}
          </button>
        </Row>
        <Row label="Titreşim">
          <button
            className={`toggle-btn${settings.vibrationEnabled ? ' toggle-btn--active' : ''}`}
            onClick={() => updateSetting('vibrationEnabled', !settings.vibrationEnabled)}
            aria-pressed={settings.vibrationEnabled}
          >
            {settings.vibrationEnabled ? '📳 Açık' : '📴 Kapalı'}
          </button>
        </Row>
        <Row label="Test Sinyali">
          <button className="btn btn-primary" onClick={testSignal}>
            ⚡ Test Et
          </button>
        </Row>
      </section>

      {/* Sıfırla */}
      <section className="settings-section">
        <button className="btn settings-reset" onClick={resetSettings}>
          Ayarları Sıfırla
        </button>
      </section>

      {/* Hakkında */}
      <section className="settings-section settings-about">
        <p>Signal Radar v1.0 — Faz 1</p>
        <p className="about-muted">React 19 + Vite + Zustand</p>
        <p className="about-disclaimer">
          ⚠️ Bu uygulama yalnızca eğitim ve eğlence amaçlıdır.
          Yatırım, alım veya satım tavsiyesi içermez.
          Gerçek parayla işlem kararı vermek için kullanmayın.
        </p>
      </section>
    </div>
  )
}
