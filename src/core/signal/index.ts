import type { SignalEvent, SignalSide, SignalState, IndicatorValues } from '../../types/index';

// ─── Sinyal Motoru Durumu ─────────────────────────────────────────────────

export interface SignalEngineState {
  state: SignalState;
  candidateSide: SignalSide | null;
  candidateTicks: number;   // aday sinyal kaç tick korundu
  lastFiredTs: number;      // son sinyal zamanı (ms)
  lastFiredSide: SignalSide | null;
}

export function createSignalEngineState(): SignalEngineState {
  return {
    state: 'IDLE',
    candidateSide: null,
    candidateTicks: 0,
    lastFiredTs: 0,
    lastFiredSide: null,
  };
}

// ─── Sinyal Motoru ────────────────────────────────────────────────────────

export interface SignalEngineConfig {
  threshold: number;       // |S| >= threshold → aday (varsayılan 0.6)
  confirmTicks: number;    // aday kaç tick korunmalı (varsayılan 2)
  cooldownS: number;       // sinyal sonrası bekleme süresi (sn, varsayılan 15)
  hysteresissDown: number; // sinyal sonrası düşme eşiği (varsayılan 0.3)
}

export interface SignalEngineResult {
  newState: SignalEngineState;
  firedEvent: SignalEvent | null;
}

/**
 * Saf sinyal motoru — tick başına çağrılır.
 *
 * Durum makinesi:
 *   IDLE → ARMED (|S| >= threshold, 2 tick) → FIRED → COOLDOWN → IDLE
 *
 * Histerezis: FIRED sonrası karşı taraf, |S| < hysteresissDown'a düşmeden tetiklenmez.
 */
export function processTick(
  indicators: IndicatorValues,
  prevState: SignalEngineState,
  config: SignalEngineConfig,
  currentPrice: number,
): SignalEngineResult {
  const { compositeSore: score, confidence, cvdZ, obi, velocityZ } = indicators;
  const now = Date.now();

  // Deep copy
  const s: SignalEngineState = { ...prevState };

  // ─── COOLDOWN kontrolü ────────────────────────────────────────
  if (s.state === 'COOLDOWN' || s.state === 'FIRED') {
    const elapsed = (now - s.lastFiredTs) / 1000;
    if (elapsed >= config.cooldownS) {
      s.state = 'IDLE';
      s.candidateSide = null;
      s.candidateTicks = 0;
    } else {
      return { newState: s, firedEvent: null };
    }
  }

  // ─── Histerezis: karşı tarafa geçiş için skor eşik altına düşmeli ──
  if (s.lastFiredSide !== null && s.state === 'IDLE') {
    const aboveHysteresis = Math.abs(score) >= config.hysteresissDown;
    if (!aboveHysteresis) {
      // Eşik altına düştü, artık karşı taraf tetiklenebilir
      s.lastFiredSide = null;
    }
  }

  // ─── IDLE → aday tespiti ──────────────────────────────────────
  if (s.state === 'IDLE') {
    const aboveThreshold = Math.abs(score) >= config.threshold;
    if (!aboveThreshold) {
      s.candidateSide = null;
      s.candidateTicks = 0;
      return { newState: s, firedEvent: null };
    }

    const newSide: SignalSide = score > 0 ? 'BUY' : 'SELL';

    // Histerezis: son sinyal ile aynı yön + düşmemiş ise skip
    if (s.lastFiredSide !== null && s.lastFiredSide === newSide) {
      return { newState: s, firedEvent: null };
    }

    if (s.candidateSide !== newSide) {
      // Yön değişti, sıfırla
      s.candidateSide = newSide;
      s.candidateTicks = 1;
    } else {
      s.candidateTicks++;
    }

    s.state = 'ARMED';

    // Yeterince tick birikti mi?
    if (s.candidateTicks < config.confirmTicks) {
      return { newState: s, firedEvent: null };
    }
  }

  // ─── ARMED → FIRED ────────────────────────────────────────────
  if (s.state === 'ARMED' && s.candidateTicks >= config.confirmTicks) {
    const side = s.candidateSide!;
    const event: SignalEvent = {
      id: `${now}-${side}`,
      ts: now,
      side,
      price: currentPrice,
      confidence,
      scores: {
        cvd: cvdZ,
        obi,
        vel: velocityZ,
        composite: score,
      },
    };

    s.state = 'COOLDOWN';
    s.lastFiredTs = now;
    s.lastFiredSide = side;
    s.candidateSide = null;
    s.candidateTicks = 0;

    return { newState: s, firedEvent: event };
  }

  return { newState: s, firedEvent: null };
}

// ─── Sinyal Günlüğü (localStorage persist) ───────────────────────────────

const STORAGE_KEY = 'signal-radar:signals';
const MAX_SIGNALS = 200;

export function loadSignalLog(): SignalEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SignalEvent[];
  } catch {
    return [];
  }
}

export function saveSignalLog(signals: SignalEvent[]): void {
  try {
    const trimmed = signals.slice(-MAX_SIGNALS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage dolu olabilir
  }
}

export function appendSignal(signals: SignalEvent[], event: SignalEvent): SignalEvent[] {
  const updated = [...signals, event].slice(-MAX_SIGNALS);
  saveSignalLog(updated);
  return updated;
}
