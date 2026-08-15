import type {
  WsAdapter,
  WsAdapterHandlers,
  NormalizedTrade,
  NormalizedDepth,
  NormalizedMark,
} from '../../types/index';

// ─── Binance raw mesaj tipleri ────────────────────────────────────────────

interface BinanceAggTrade {
  e: 'aggTrade';
  T: number;   // timestamp ms
  p: string;   // price
  q: string;   // qty
  m: boolean;  // market maker → sell
}

interface BinanceDepth {
  e: 'depthUpdate';
  T?: number;
  b: string[][];
  a: string[][];
}

interface BinanceDepth20 {
  // snapshot depth20
  lastUpdateId: number;
  T: number;
  bids: string[][];
  asks: string[][];
}

interface BinanceMarkPrice {
  e: 'markPriceUpdate';
  T: number;
  p: string; // mark price
}

// ─── Parse yardımcıları ───────────────────────────────────────────────────

export function parseBinanceTrade(msg: BinanceAggTrade): NormalizedTrade {
  return {
    ts: msg.T,
    price: parseFloat(msg.p),
    qty: parseFloat(msg.q),
    side: msg.m ? 'sell' : 'buy', // market maker = sell tarafı
  };
}

export function parseBinanceDepth20(msg: BinanceDepth20): NormalizedDepth {
  return {
    ts: msg.T,
    bids: msg.bids.map((b) => [parseFloat(b[0]), parseFloat(b[1])] as [number, number]),
    asks: msg.asks.map((a) => [parseFloat(a[0]), parseFloat(a[1])] as [number, number]),
  };
}

export function parseBinanceMarkPrice(msg: BinanceMarkPrice): NormalizedMark {
  return {
    ts: msg.T,
    price: parseFloat(msg.p),
  };
}

// ─── Binance Adaptörü ─────────────────────────────────────────────────────

const BINANCE_STREAM = 'wss://fstream.binance.com/stream?streams=' +
  'btcusdt@aggTrade/btcusdt@depth20@100ms/btcusdt@markPrice@1s';

export class BinanceAdapter implements WsAdapter {
  readonly id = 'binance' as const;

  private ws: WebSocket | null = null;
  private handlers: WsAdapterHandlers | null = null;
  private _disconnected = false;

  connect(handlers: WsAdapterHandlers): void {
    this._disconnected = false;
    this.handlers = handlers;
    this._open();
  }

  private _open(): void {
    if (this._disconnected) return;
    this.handlers?.onStatus('connecting');

    const ws = new WebSocket(BINANCE_STREAM);
    this.ws = ws;

    ws.onopen = () => {
      if (this._disconnected) { ws.close(); return; }
      this.handlers?.onStatus('live');
    };

    ws.onmessage = (ev: MessageEvent<string>) => {
      if (this._disconnected) return;
      try {
        // Binance combined stream: { stream, data }
        const envelope = JSON.parse(ev.data) as { stream: string; data: unknown };
        const stream = envelope.stream ?? '';
        const data = envelope.data;

        if (stream.includes('aggTrade')) {
          const msg = data as BinanceAggTrade;
          this.handlers?.onData({ type: 'trade', data: parseBinanceTrade(msg) });
        } else if (stream.includes('depth20')) {
          const msg = data as BinanceDepth20;
          this.handlers?.onData({ type: 'depth', data: parseBinanceDepth20(msg) });
        } else if (stream.includes('markPrice')) {
          const msg = data as BinanceMarkPrice;
          this.handlers?.onData({ type: 'mark', data: parseBinanceMarkPrice(msg) });
        } else if (stream.includes('depth')) {
          const msg = data as BinanceDepth;
          const ts = msg.T ?? Date.now();
          const depth: NormalizedDepth = {
            ts,
            bids: msg.b.map((b) => [parseFloat(b[0]), parseFloat(b[1])] as [number, number]),
            asks: msg.a.map((a) => [parseFloat(a[0]), parseFloat(a[1])] as [number, number]),
          };
          this.handlers?.onData({ type: 'depth', data: depth });
        }
      } catch {
        // JSON parse hatası yoksay
      }
    };

    ws.onerror = () => {
      this.handlers?.onStatus('offline');
    };

    ws.onclose = () => {
      if (!this._disconnected) {
        this.handlers?.onStatus('offline');
      }
    };
  }

  disconnect(): void {
    this._disconnected = true;
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
    this.handlers = null;
  }
}
