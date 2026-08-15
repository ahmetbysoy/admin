import type {
  WsAdapter,
  WsAdapterHandlers,
  NormalizedTrade,
  NormalizedDepth,
  NormalizedMark,
} from '../../types/index';

// ─── OKX raw mesaj tipleri ────────────────────────────────────────────────

interface OkxTradeItem {
  tradeId: string;
  px: string;
  sz: string;
  side: string;
  ts: string;
}

interface OkxBookItem {
  asks: string[][];
  bids: string[][];
  ts: string;
}

interface OkxTickerItem {
  last: string;
  ts: string;
}

interface OkxMessage {
  arg?: { channel: string; instId: string };
  event?: string;
  data?: OkxTradeItem[] | OkxBookItem[] | OkxTickerItem[];
}

// ─── Parse yardımcıları ───────────────────────────────────────────────────

export function parseOkxTrade(item: OkxTradeItem): NormalizedTrade {
  return {
    ts: parseInt(item.ts, 10),
    price: parseFloat(item.px),
    qty: parseFloat(item.sz),
    side: item.side === 'buy' ? 'buy' : 'sell',
  };
}

export function parseOkxDepth(item: OkxBookItem): NormalizedDepth {
  return {
    ts: parseInt(item.ts, 10),
    bids: item.bids.map((b) => [parseFloat(b[0]), parseFloat(b[1])] as [number, number]),
    asks: item.asks.map((a) => [parseFloat(a[0]), parseFloat(a[1])] as [number, number]),
  };
}

export function parseOkxMark(item: OkxTickerItem): NormalizedMark {
  return {
    ts: parseInt(item.ts, 10),
    price: parseFloat(item.last),
  };
}

// ─── OKX Adaptörü ─────────────────────────────────────────────────────────

export class OkxAdapter implements WsAdapter {
  readonly id = 'okx' as const;

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

    const ws = new WebSocket('wss://ws.okx.com:8443/ws/v5/public');
    this.ws = ws;

    ws.onopen = () => {
      if (this._disconnected) { ws.close(); return; }
      // BTC-USDT trades, books5, tickers kanalları
      ws.send(JSON.stringify({
        op: 'subscribe',
        args: [
          { channel: 'trades', instId: 'BTC-USDT' },
          { channel: 'books5', instId: 'BTC-USDT' },
          { channel: 'tickers', instId: 'BTC-USDT' },
        ],
      }));
      this.handlers?.onStatus('live');
    };

    ws.onmessage = (ev: MessageEvent<string>) => {
      if (this._disconnected) return;
      try {
        const msg = JSON.parse(ev.data) as OkxMessage;
        if (!msg.arg || !msg.data) return;
        const channel = msg.arg.channel;

        if (channel === 'trades') {
          for (const item of msg.data as OkxTradeItem[]) {
            this.handlers?.onData({ type: 'trade', data: parseOkxTrade(item) });
          }
        } else if (channel === 'books5') {
          for (const item of msg.data as OkxBookItem[]) {
            this.handlers?.onData({ type: 'depth', data: parseOkxDepth(item) });
          }
        } else if (channel === 'tickers') {
          for (const item of msg.data as OkxTickerItem[]) {
            this.handlers?.onData({ type: 'mark', data: parseOkxMark(item) });
          }
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
