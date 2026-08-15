import { useEffect, useRef } from 'react'
import { WsManager } from '../core/ws/WsManager'
import { createBuffers } from '../core/buffers/index'
import { computeTick, createTickState } from '../core/indicators/index'
import {
  createSignalEngineState,
  processTick,
  loadSignalLog,
  appendSignal,
} from '../core/signal/index'
import { useDataStore, useUiStore, useSettingsStore } from '../store/index'
import type { NormalizedEvent } from '../types/index'
import type { SignalEngineState } from '../core/signal/index'
import type { TickState } from '../core/indicators/index'

/**
 * WsEngine: WSS bağlantısı + 10Hz tick döngüsünü yönetir.
 * Bir kez mount edilir, unmount'ta teardown.
 */
export function WsEngine(): null {
  const wsManagerRef = useRef<WsManager | null>(null)
  const buffersRef = useRef(createBuffers())
  const tickStateRef = useRef<TickState>(createTickState())
  const signalEngineRef = useRef<SignalEngineState>(createSignalEngineState())
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const initializedRef = useRef(false)

  const { settings } = useSettingsStore()
  const setPrice = useDataStore((s) => s.setPrice)
  const setIndicators = useDataStore((s) => s.setIndicators)
  const setCandles = useDataStore((s) => s.setCandles)
  const setSignalState = useDataStore((s) => s.setSignalState)
  const setWsStatus = useUiStore((s) => s.setWsStatus)
  const addSignalEvent = useUiStore((s) => s.addSignalEvent)
  const setSignalEvents = useUiStore((s) => s.setSignalEvents)

  useEffect(() => {
    // StrictMode çift çağrı koruması
    if (initializedRef.current) return
    initializedRef.current = true

    // Kayıtlı sinyalleri yükle
    const savedSignals = loadSignalLog()
    setSignalEvents(savedSignals)

    const manager = new WsManager()
    wsManagerRef.current = manager
    const buffers = buffersRef.current

    // WS başlat
    manager.start({
      source: settings.source,
      onData(event: NormalizedEvent) {
        if (event.type === 'trade') {
          buffers.trades.push(event.data)
          buffers.candleAgg.addTrade(event.data)
          setPrice(event.data.price)
        } else if (event.type === 'depth') {
          buffers.depth.snapshot = event.data
        } else if (event.type === 'mark') {
          buffers.mark.latest = event.data
          setPrice(event.data.price)
        }
      },
      onStatus(status, attempt) {
        setWsStatus(status, attempt)
      },
    })

    // 10Hz tick döngüsü
    tickIntervalRef.current = setInterval(() => {
      const iv = computeTick(buffers, tickStateRef.current, settings)
      setIndicators(iv)
      setCandles(buffers.candleAgg.getCandles(), buffers.candleAgg.getLiveCandle())
      setSignalState(signalEngineRef.current.state)

      const currentPrice = buffers.mark.latest?.price ?? 0
      const { newState, firedEvent } = processTick(
        iv,
        signalEngineRef.current,
        {
          threshold: settings.threshold,
          confirmTicks: settings.confirmTicks,
          cooldownS: settings.cooldownS,
          hysteresissDown: 0.3,
        },
        currentPrice,
      )
      signalEngineRef.current = newState

      if (firedEvent) {
        addSignalEvent(firedEvent)
        appendSignal([], firedEvent)
        // ses + titreşim
        playSignalSound(firedEvent.side, settings.soundEnabled)
        triggerVibration(firedEvent.side, settings.vibrationEnabled)
      }
    }, 100) // 10Hz

    return () => {
      manager.destroy()
      if (tickIntervalRef.current !== null) {
        clearInterval(tickIntervalRef.current)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

// ─── Ses ─────────────────────────────────────────────────────────────────

function playSignalSound(side: 'BUY' | 'SELL', enabled: boolean): void {
  if (!enabled) return
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = side === 'BUY' ? 880 : 330
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    const duration = side === 'BUY' ? 0.08 : 0.12
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start()
    osc.stop(ctx.currentTime + duration)
    osc.onended = () => ctx.close()
  } catch {
    // WebAudio desteksiz
  }
}

// ─── Titreşim ─────────────────────────────────────────────────────────────

function triggerVibration(side: 'BUY' | 'SELL', enabled: boolean): void {
  if (!enabled || !('vibrate' in navigator)) return
  if (side === 'BUY') {
    navigator.vibrate(60)
  } else {
    navigator.vibrate([40, 30, 40])
  }
}
