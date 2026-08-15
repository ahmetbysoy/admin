import './MeterBar.css'

interface MeterBarProps {
  label: string
  value: number     // z-score veya normalize değer
  unit?: string
  color?: string
  threshold?: number
}

export function MeterBar({ label, value, unit = '', color, threshold = 0.6 }: MeterBarProps) {
  // [-3, +3] aralığını [0,100]'e map
  const pct = Math.min(100, Math.max(0, ((value + 3) / 6) * 100))
  const isPositive = value >= 0
  const barColor = color ?? (isPositive ? 'var(--green)' : 'var(--red)')
  // Eşik çizgisi pozisyonu
  const thresholdPct = ((threshold + 3) / 6) * 100
  const negThresholdPct = ((-threshold + 3) / 6) * 100

  return (
    <div className="meter-bar" role="meter" aria-valuenow={value} aria-label={label}>
      <div className="meter-bar__header">
        <span className="meter-bar__label">{label}</span>
        <span
          className="meter-bar__value"
          style={{ color: barColor }}
        >
          {value >= 0 ? '+' : ''}{value.toFixed(2)}{unit}
        </span>
      </div>
      <div className="meter-bar__track">
        <div
          className="meter-bar__fill"
          style={{
            left: isPositive ? '50%' : `${pct}%`,
            width: isPositive ? `${pct - 50}%` : `${50 - pct}%`,
            background: barColor,
          }}
        />
        {/* Eşik çizgileri */}
        <div className="meter-bar__threshold" style={{ left: `${thresholdPct}%` }} />
        <div className="meter-bar__threshold" style={{ left: `${negThresholdPct}%` }} />
        {/* Merkez */}
        <div className="meter-bar__center" />
      </div>
    </div>
  )
}
