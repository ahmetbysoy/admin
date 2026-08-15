import { AnimatePresence, motion } from 'framer-motion'
import { useUiStore, useSettingsStore } from '../store/index.js'
import { WsEngine } from './WsEngine.js'
import { Header } from '../ui/components/Header.js'
import { TabBar } from '../ui/components/TabBar.js'
import { RadarScreen } from '../ui/screens/RadarScreen.js'
import { ChartScreen } from '../ui/screens/ChartScreen.js'
import { SignalsScreen } from '../ui/screens/SignalsScreen.js'
import { SettingsScreen } from '../ui/screens/SettingsScreen.js'

const screenVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.12 } },
}

export function App() {
  const activeTab = useUiStore((s) => s.activeTab)
  const { settings } = useSettingsStore()

  return (
    <div className="phone-canvas">
      <WsEngine />
      <Header />
      <main className="screen-content">
        <AnimatePresence mode="wait">
          {activeTab === 'radar' && (
            <motion.div key="radar" {...screenVariants}>
              <RadarScreen />
            </motion.div>
          )}
          {activeTab === 'chart' && (
            <motion.div key="chart" {...screenVariants}>
              <ChartScreen />
            </motion.div>
          )}
          {activeTab === 'signals' && (
            <motion.div key="signals" {...screenVariants}>
              <SignalsScreen />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div key="settings" {...screenVariants}>
              <SettingsScreen />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <TabBar />
      <div className="disclaimer">
        ⚠️ Eğitim ve eğlence amaçlıdır — yatırım tavsiyesi değildir · {settings.symbol}
      </div>
    </div>
  )
}
