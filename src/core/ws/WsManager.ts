import type { WsAdapter, WsAdapterHandlers, WsStatus, NormalizedEvent, DataSource } from '../../types/index';
import { OkxAdapter } from './OkxAdapter';
import { BinanceAdapter } from './BinanceAdapter';

// ─── Yardımcılar ──────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function createAdapter(source: DataSource): WsAdapter {
  return source === 'binance' ? new BinanceAdapter() : new OkxAdapter();
}

// ─── WsManager ────────────────────────────────────────────────────────────

export interface WsManagerConfig {
  source: DataSource;
  onData(event: NormalizedEvent): void;
  onStatus(status: WsStatus, attempt: number): void;
}

/**
 * WebSocket bağlantısını yönetir:
 * - Exponential backoff: 1s → 30s, sonsuz yeniden deneme
 * - document.hidden iken pause, dönünce resume
 * - Strict mode çift abonelik koruması
 * - Teardown: tüm kaynakları sıfırlar
 */
export class WsManager {
  private adapter: WsAdapter | null = null;
  private config: WsManagerConfig | null = null;
  private status: WsStatus = 'offline';
  private attempt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private paused = false;
  private destroyed = false;

  // Backoff sabitleri
  private readonly MIN_DELAY_MS = 1000;
  private readonly MAX_DELAY_MS = 30_000;

  constructor() {
    this._onVisibilityChange = this._onVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this._onVisibilityChange);
  }

  start(config: WsManagerConfig): void {
    if (this.destroyed) return;
    // Mevcut bağlantıyı temizle
    this._teardownAdapter();
    this.config = config;
    this.attempt = 0;
    this.paused = document.hidden;
    if (!this.paused) {
      this._connect();
    }
  }

  stop(): void {
    this._clearRetry();
    this._teardownAdapter();
    this._emitStatus('offline');
  }

  destroy(): void {
    this.destroyed = true;
    this.stop();
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
    this.config = null;
  }

  private _connect(): void {
    if (this.destroyed || !this.config || this.paused) return;

    const adapter = createAdapter(this.config.source);
    this.adapter = adapter;

    const handlers: WsAdapterHandlers = {
      onData: (event) => {
        if (!this.destroyed && !this.paused) {
          this.config?.onData(event);
        }
      },
      onStatus: (s: WsStatus) => {
        if (this.destroyed) return;
        if (s === 'live') {
          this.attempt = 0;
          this._emitStatus('live');
        } else if (s === 'offline' || s === 'reconnecting') {
          this._scheduleReconnect();
        } else {
          this._emitStatus(s);
        }
      },
    };

    adapter.connect(handlers);
  }

  private _scheduleReconnect(): void {
    if (this.destroyed || this.paused) return;
    this._teardownAdapter();
    this.attempt += 1;
    const delay = clamp(
      this.MIN_DELAY_MS * Math.pow(2, this.attempt - 1),
      this.MIN_DELAY_MS,
      this.MAX_DELAY_MS,
    );
    this._emitStatus('reconnecting');
    this._clearRetry();
    this.retryTimer = setTimeout(() => {
      if (!this.destroyed && !this.paused) {
        this._connect();
      }
    }, delay);
  }

  private _teardownAdapter(): void {
    if (this.adapter) {
      this.adapter.disconnect();
      this.adapter = null;
    }
    this._clearRetry();
  }

  private _clearRetry(): void {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private _emitStatus(s: WsStatus): void {
    this.status = s;
    this.config?.onStatus(s, this.attempt);
  }

  private _onVisibilityChange(): void {
    if (this.destroyed || !this.config) return;
    if (document.hidden) {
      // Sekme gizlendi → duraklat
      this.paused = true;
      this._teardownAdapter();
      this._emitStatus('offline');
    } else {
      // Sekme geri geldi → devam et
      this.paused = false;
      this.attempt = 0;
      this._connect();
    }
  }

  getStatus(): WsStatus {
    return this.status;
  }

  getAttempt(): number {
    return this.attempt;
  }
}
