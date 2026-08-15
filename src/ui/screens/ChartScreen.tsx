import { useEffect, useRef } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type Time,
  type SeriesMarker,
} from 'lightweight-charts'
import { useDataStore, useUiStore } from '../../store/index.js'
import type { Candle, SignalEvent } from '../../types/index.js'
import './ChartScreen.css'

function toChartCandle(c: Candle): CandlestickData {
  return {
    time: c.time as Time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }
}

export function ChartScreen() {
  const containerRef = useRef<HTMLDivElement>(null)
  const cvdContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const cvdChartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const cvdSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  const candles = useDataStore((s) => s.candles)
  const liveCandle = useDataStore((s) => s.liveCandle)
  const signalEvents = useUiStore((s) => s.signalEvents)

  // Chart başlat
  useEffect(() => {
    const container = containerRef.current
    const cvdContainer = cvdContainerRef.current
    if (!container || !cvdContainer) return

    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: '#0F1626' },
        textColor: '#7C8DB0',
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: '#1E2A44' },
        horzLines: { color: '#1E2A44' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#1E2A44' },
      timeScale: { borderColor: '#1E2A44', timeVisible: true },
      handleScroll: true,
      handleScale: true,
    }

    // Ana mum grafiği
    const chart = createChart(container, {
      ...chartOptions,
      height: container.clientHeight || 240,
      width: container.clientWidth,
    })
    chartRef.current = chart

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#34D399',
      downColor: '#F87171',
      borderUpColor: '#34D399',
      borderDownColor: '#F87171',
      wickUpColor: '#34D399',
      wickDownColor: '#F87171',
    })
    candleSeriesRef.current = candleSeries

    // CVD histogram
    const cvdChart = createChart(cvdContainer, {
      ...chartOptions,
      height: cvdContainer.clientHeight || 100,
      width: cvdContainer.clientWidth,
    })
    cvdChartRef.current = cvdChart

    const cvdSeries = cvdChart.addHistogramSeries({
      color: '#34D399',
      priceFormat: { type: 'price', precision: 4 },
    })
    cvdSeriesRef.current = cvdSeries

    // Resize observer
    const ro = new ResizeObserver(() => {
      chart.resize(container.clientWidth, container.clientHeight)
      cvdChart.resize(cvdContainer.clientWidth, cvdContainer.clientHeight)
    })
    ro.observe(container)
    ro.observe(cvdContainer)

    return () => {
      ro.disconnect()
      chart.remove()
      cvdChart.remove()
    }
  }, [])

  // Mum verisi güncelle
  useEffect(() => {
    const series = candleSeriesRef.current
    if (!series) return

    const allCandles: Candle[] = liveCandle ? [...candles, liveCandle] : candles
    if (allCandles.length === 0) return

    try {
      series.setData(allCandles.map(toChartCandle))
    } catch {
      // Duplicate time koruması
    }
  }, [candles, liveCandle])

  // CVD histogram güncelle (son 100 muma göre)
  useEffect(() => {
    const series = cvdSeriesRef.current
    if (!series || candles.length === 0) return

    // Her mum için CVD delta hesapla (kapanış - açılış proxy)
    const cvdData: HistogramData[] = candles.map((c) => {
      const delta = c.close - c.open
      return {
        time: c.time as Time,
        value: delta,
        color: delta >= 0 ? '#34D399' : '#F87171',
      }
    })

    try {
      series.setData(cvdData)
    } catch {
      // Duplicate time koruması
    }
  }, [candles])

  // Sinyal marker'ları güncelle
  useEffect(() => {
    const series = candleSeriesRef.current
    if (!series) return

    const markers: SeriesMarker<Time>[] = signalEvents
      .filter((ev: SignalEvent) => candles.some((c) => Math.abs(c.time - ev.ts / 1000) < 15))
      .map((ev: SignalEvent) => ({
        time: Math.floor(ev.ts / 1000 / 15) * 15 as Time,
        position: ev.side === 'BUY' ? 'belowBar' as const : 'aboveBar' as const,
        color: ev.side === 'BUY' ? '#34D399' : '#F87171',
        shape: ev.side === 'BUY' ? 'arrowUp' as const : 'arrowDown' as const,
        text: `${ev.side} %${ev.confidence}`,
      }))

    try {
      series.setMarkers(markers)
    } catch {
      // Marker hatası
    }
  }, [signalEvents, candles])

  return (
    <div className="chart-screen">
      <div className="chart-header">
        <span className="chart-title">BTC-USDT · 15s</span>
        <span className="chart-badge">Canlı</span>
      </div>
      <div ref={containerRef} className="chart-main-container" />
      <div className="chart-cvd-label">CVD Δ</div>
      <div ref={cvdContainerRef} className="chart-cvd-container" />
    </div>
  )
}
