import { useUiStore } from '../../store/index'
import type { SignalEvent } from '../../types/index'
import './SignalsScreen.css'

function SignalCard({ event }: { event: SignalEvent }) {
  const ts = new Date(event.ts)
  const timeStr = ts.toLocaleTimeString('tr-TR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
  const dateStr = ts.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
  const isBuy = event.side === 'BUY'

  return (
    <div className={`signal-card signal-card--${event.side.toLowerCase()}`}>
      <div className="sc-header">
        <span className={`sc-badge sc-badge--${event.side.toLowerCase()}`}>
          {isBuy ? '▲ AL' : '▼ SAT'}
        </span>
        <span className="sc-time">
          {dateStr} {timeStr}
        </span>
        <span className="sc-price">
          {event.price.toLocaleString('en-US', { maximumFractionDigits: 1 })} ₮
        </span>
      </div>

      {/* Güven çubuğu */}
      <div className="sc-confidence">
        <div
          className="sc-confidence-fill"
          style={{
            width: `${event.confidence}%`,
            background: isBuy ? 'var(--green)' : 'var(--red)',
          }}
        />
        <span className="sc-confidence-label">%{event.confidence} güven</span>
      </div>

      {/* Skor dökümü */}
      <div className="sc-scores">
        <span>CVD <b>{event.scores.cvd >= 0 ? '+' : ''}{event.scores.cvd.toFixed(2)}</b></span>
        <span>OBI <b>{event.scores.obi >= 0 ? '+' : ''}{event.scores.obi.toFixed(2)}</b></span>
        <span>VEL <b>{event.scores.vel >= 0 ? '+' : ''}{event.scores.vel.toFixed(2)}</b></span>
        <span>∑ <b>{event.scores.composite >= 0 ? '+' : ''}{event.scores.composite.toFixed(2)}</b></span>
      </div>
    </div>
  )
}

export function SignalsScreen() {
  const signalEvents = useUiStore((s) => s.signalEvents)
  const reversed = [...signalEvents].reverse()

  if (reversed.length === 0) {
    return (
      <div className="signals-empty">
        <div className="signals-empty-icon">📡</div>
        <p>Henüz sinyal yok</p>
        <p className="signals-empty-sub">Radar tarıyor…</p>
      </div>
    )
  }

  return (
    <div className="signals-screen">
      <div className="signals-count">
        {reversed.length} sinyal (son 200)
      </div>
      <div className="signals-list">
        {reversed.map((ev: SignalEvent) => (
          <SignalCard key={ev.id} event={ev} />
        ))}
      </div>
    </div>
  )
}
