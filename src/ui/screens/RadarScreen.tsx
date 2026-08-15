import { useDataStore, useUiStore } from '../../store/index'
import { RadarGauge } from '../components/RadarGauge'
import { MeterBar } from '../components/MeterBar'
import { useSettingsStore } from '../../store/index'
import './RadarScreen.css'

function LastSignalStrip() {
  const signals = useUiStore((s) => s.signalEvents)
  const last = signals[signals.length - 1]
  if (!last) return (
    <div className="last-signal last-signal--empty">
      Radar tarıyor…
    </div>
  )
  const ts = new Date(last.ts)
  const timeStr = ts.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return (
    <div className={`last-signal last-signal--${last.side.toLowerCase()}`}>
      <span className="ls-arrow">{last.side === 'BUY' ? '▲' : '▼'}</span>
      <span className="ls-label">Son sinyal: {timeStr}</span>
      <span className="ls-conf">+%{last.confidence}</span>
    </div>
  )
}

export function RadarScreen() {
  const indicators = useDataStore((s) => s.indicators)
  const wsStatus = useUiStore((s) => s.wsStatus)
  const wsAttempt = useUiStore((s) => s.wsAttempt)
  const { settings } = useSettingsStore()

  return (
    <div className="radar-screen">
      {/* Kopuk overlay */}
      {wsStatus === 'offline' && (
        <div className="connection-overlay">
          <span className="overlay-icon">📡</span>
          <p>Bağlantı koptu</p>
          <p className="overlay-sub">Yeniden deneniyor… (#{wsAttempt})</p>
        </div>
      )}

      {/* Radar Gauge */}
      <RadarGauge />

      {/* İndikatör barları */}
      <div className="indicator-bars card">
        <MeterBar
          label="CVD"
          value={indicators?.cvdZ ?? 0}
          threshold={settings.threshold}
        />
        <MeterBar
          label="IMB"
          value={indicators?.obi ?? 0}
          color="var(--cyan)"
          threshold={settings.threshold * 0.5}
        />
        <MeterBar
          label="VEL"
          value={indicators?.velocityZ ?? 0}
          color="var(--violet)"
          threshold={settings.threshold}
        />
      </div>

      {/* Son sinyal şeridi */}
      <LastSignalStrip />
    </div>
  )
}
