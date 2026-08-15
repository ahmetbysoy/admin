import { useDataStore, useUiStore } from '../../store/index'
import { useSettingsStore } from '../../store/index'
import type { WsStatus } from '../../types/index'
import './Header.css'

function ConnectionPill({ status, attempt }: { status: WsStatus; attempt: number }) {
  return (
    <div className={`conn-pill conn-pill--${status}`} aria-label={`Bağlantı: ${status}`}>
      <span className="conn-dot" />
      <span className="conn-label">
        {status === 'live' && 'CANLI'}
        {status === 'connecting' && 'BAĞLANIYOR'}
        {status === 'reconnecting' && `YENİDEN #${attempt}`}
        {status === 'offline' && 'KOPUK'}
      </span>
    </div>
  )
}

function PriceTicker() {
  const price = useDataStore((s) => s.price)
  const dir = useDataStore((s) => s.priceDir)
  return (
    <span className={`price-ticker price-ticker--${dir}`}>
      {price > 0 ? price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—'}
      <span className="price-unit"> ₮</span>
    </span>
  )
}

export function Header() {
  const wsStatus = useUiStore((s) => s.wsStatus)
  const wsAttempt = useUiStore((s) => s.wsAttempt)
  const { settings } = useSettingsStore()

  return (
    <header className="app-header" role="banner">
      <ConnectionPill status={wsStatus} attempt={wsAttempt} />
      <div className="header-center">
        <span className="header-symbol">{settings.symbol}</span>
        <PriceTicker />
      </div>
      <div className="header-right">
        <span className="source-badge">{settings.source.toUpperCase()}</span>
      </div>
    </header>
  )
}
