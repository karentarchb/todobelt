import { Injectable, computed, inject, signal } from '@angular/core';
import { WalletService } from './wallet.service';

export interface FocusSession {
  /** Total duration in seconds. */
  duration: number;
  /** Remaining seconds. */
  remaining: number;
  state: 'idle' | 'running' | 'paused' | 'done';
  startedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class FocusService {
  private readonly wallet = inject(WalletService);

  private readonly _session = signal<FocusSession>({
    duration: 25 * 60,
    remaining: 25 * 60,
    state: 'idle',
  });

  private intervalId: ReturnType<typeof setInterval> | null = null;

  readonly session = computed(() => this._session());

  readonly progress = computed(() => {
    const s = this._session();
    if (s.duration === 0) return 0;
    return 1 - s.remaining / s.duration;
  });

  setDuration(minutes: number): void {
    const seconds = Math.max(1, Math.round(minutes)) * 60;
    this._session.set({ duration: seconds, remaining: seconds, state: 'idle' });
  }

  start(): void {
    const s = this._session();
    if (s.state === 'running') return;

    this._session.set({
      ...s,
      state: 'running',
      startedAt: s.startedAt ?? new Date().toISOString(),
    });

    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  pause(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this._session.update((s) => ({ ...s, state: 'paused' }));
  }

  reset(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this._session.update((s) => ({
      duration: s.duration,
      remaining: s.duration,
      state: 'idle',
    }));
  }

  private tick(): void {
    const s = this._session();
    if (s.remaining <= 1) {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this._session.set({ ...s, remaining: 0, state: 'done' });
      const reward = Math.max(2, Math.round(s.duration / 60 / 5));
      this.wallet.earn(reward, 'Sesión de enfoque completada');
      return;
    }
    this._session.set({ ...s, remaining: s.remaining - 1 });
  }
}
