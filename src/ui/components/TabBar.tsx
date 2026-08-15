import { useUiStore } from '../../store/index.js'
import type { TabId } from '../../store/index.js'
import './TabBar.css'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'radar',    label: 'Radar',    icon: '📡' },
  { id: 'chart',    label: 'Chart',    icon: '📊' },
  { id: 'signals',  label: 'Sinyaller', icon: '⚡' },
  { id: 'settings', label: 'Ayarlar',  icon: '⚙️' },
]

export function TabBar() {
  const activeTab = useUiStore((s) => s.activeTab)
  const setTab = useUiStore((s) => s.setTab)

  return (
    <nav className="tab-bar" role="navigation" aria-label="Ana Navigasyon">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn${activeTab === tab.id ? ' tab-btn--active' : ''}`}
          onClick={() => setTab(tab.id)}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          aria-label={tab.label}
        >
          <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
