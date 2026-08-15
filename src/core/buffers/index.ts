import type { NormalizedTrade, NormalizedDepth, NormalizedMark, Candle } from '../../types/index';

// ─── Generic Ring Buffer ───────────────────────────────────────────────────

/**
 * Sabit boyutlu FIFO ring buffer.
 * Eleman sayısı capacity'yi aşarsa en eski eleman silinir.
 */
export class RingBuffer<T> {
  private readonly buf: (T | undefined)[];
  private head = 0;  // yazılacak slot
  private _size = 0;
  readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buf = new Array<T | undefined>(capacity).fill(undefined);
  }

  push(item: T): void {
    this.buf[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this._size < this.capacity) this._size++;
  }

  /** En yeniden en eskiye sıralı array döner */
  toArray(): T[] {
    if (this._size === 0) return [];
    const result: T[] = [];
    const start = this._size < this.capacity
      ? 0
      : this.head;
    for (let i = 0; i < this._size; i++) {
      const idx = (start + i) % this.capacity;
      const item = this.buf[idx];
      if (item !== undefined) result.push(item);
    }
    return result;
  }

  /** Son N elemanı döner (en eski→en yeni) */
  last(n: number): T[] {
    const arr = this.toArray();
    return arr.slice(Math.max(0, arr.length - n));
  }

  /** En son eklenen eleman */
  latest(): T | undefined {
    if (this._size === 0) return undefined;
    const idx = (this.head - 1 + this.capacity) % this.capacity;
    return this.buf[idx];
  }

  get size(): number {
    return this._size;
  }

  clear(): void {
    this.buf.fill(undefined);
    this.head = 0;
    this._size = 0;
  }
}

// ─── 15s Mum Agregatörü ───────────────────────────────────────────────────

const CANDLE_INTERVAL_MS = 15_000;

/**
 * Gelen trade'lerden yerelde 15s mum toplar.
 * kline WSS gerektirmez.
 */
export class CandleAggregator {
  private candles: RingBuffer<Candle>;
  private currentCandle: Candle | null = null;

  constructor(maxCandles = 200) {
    this.candles = new RingBuffer<Candle>(maxCandles);
  }

  addTrade(trade: NormalizedTrade): void {
    const bucketTs = Math.floor(trade.ts / CANDLE_INTERVAL_MS) * CANDLE_INTERVAL_MS / 1000;

    if (!this.currentCandle || this.currentCandle.time !== bucketTs) {
      // Mevcut mumu tamamla
      if (this.currentCandle) {
        this.candles.push({ ...this.currentCandle });
      }
      // Yeni mum aç
      this.currentCandle = {
        time: bucketTs,
        open: trade.price,
        high: trade.price,
        low: trade.price,
        close: trade.price,
        volume: trade.qty,
      };
    } else {
      // Mevcut mumu güncelle
      this.currentCandle.high = Math.max(this.currentCandle.high, trade.price);
      this.currentCandle.low = Math.min(this.currentCandle.low, trade.price);
      this.currentCandle.close = trade.price;
      this.currentCandle.volume += trade.qty;
    }
  }

  /** Tamamlanmış tüm mumları döner */
  getCandles(): Candle[] {
    return this.candles.toArray();
  }

  /** Canlı (tamamlanmamış) mumu döner */
  getLiveCandle(): Candle | null {
    return this.currentCandle;
  }

  /** Tüm mumları döner (canlı dahil) */
  getAllCandles(): Candle[] {
    const candles = this.candles.toArray();
    if (this.currentCandle) {
      return [...candles, { ...this.currentCandle }];
    }
    return candles;
  }
}

// ─── Merkezi Buffer Koleksiyonu ───────────────────────────────────────────

export interface Buffers {
  trades: RingBuffer<NormalizedTrade>;
  depth: { snapshot: NormalizedDepth | null };
  mark: { latest: NormalizedMark | null };
  cvdHistory: RingBuffer<number>;   // CVD_norm örnekleri
  candleAgg: CandleAggregator;
}

export function createBuffers(): Buffers {
  return {
    trades: new RingBuffer<NormalizedTrade>(1000),
    depth: { snapshot: null },
    mark: { latest: null },
    cvdHistory: new RingBuffer<number>(600),
    candleAgg: new CandleAggregator(200),
  };
}
