import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { AuthService } from './auth.service';
import { FirestoreWalletService } from './firestore-wallet.service';
import { WalletState, WalletTx } from '../models';
import { uid as makeId } from '../helpers/id.helper';

const EMPTY: WalletState = {
  balance: 0,
  totalEarned: 0,
  totalSpent: 0,
  history: [],
};

const HISTORY_LIMIT = 40;

/**
 * The wallet is now Firestore-backed. The signal still acts as the UI
 * source of truth — we update it optimistically, then let the realtime
 * listener reconcile against the server state.
 *
 * Earn/spend are intentionally synchronous from the caller's perspective:
 * callers (TasksService, RewardsService) see immediate balance changes,
 * and the Firestore write is fire-and-forget.
 */
@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly auth = inject(AuthService);
  private readonly fs = inject(FirestoreWalletService);

  private readonly _state = signal<WalletState>(EMPTY);
  private unsubscribe: (() => void) | null = null;

  readonly state = computed(() => this._state());
  readonly balance = computed(() => this._state().balance);
  readonly history = computed(() => this._state().history);

  constructor() {
    effect(() => {
      const user = this.auth.user();
      this.unsubscribe?.();
      this.unsubscribe = null;

      if (!user) {
        this._state.set(EMPTY);
        return;
      }

      void this.fs.ensureExists(user.id).then(() => {
        this.unsubscribe = this.fs.watch(user.id, (state) => {
          this._state.set({
            balance: state.balance,
            totalEarned: state.totalEarned,
            totalSpent: state.totalSpent,
            history: this.normalizeHistory(state.history),
          });
        });
      });
    });
  }

  /** Kept for backwards compatibility with bootstrap calls; effect handles state. */
  async hydrate(): Promise<void> {
    return;
  }

  earn(amount: number, reason: string): void {
    if (amount <= 0) return;
    const user = this.auth.user();
    if (!user) return;

    const tx: WalletTx = {
      id: makeId('tx'),
      kind: 'earn',
      amount,
      reason,
      at: new Date().toISOString(),
    };

    // Optimistic local update; listener will reconcile from server.
    this._state.update((s) => ({
      ...s,
      balance: s.balance + amount,
      totalEarned: s.totalEarned + amount,
      history: this.prepend(s.history, tx),
    }));

    void this.fs.earn(user.id, amount, tx).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[wallet] earn write failed:', err);
    });
  }

  /** @returns true if the spend succeeded, false if insufficient balance. */
  spend(amount: number, reason: string): boolean {
    if (amount <= 0) return false;
    const user = this.auth.user();
    if (!user) return false;

    if (this._state().balance < amount) return false;

    const tx: WalletTx = {
      id: makeId('tx'),
      kind: 'spend',
      amount,
      reason,
      at: new Date().toISOString(),
    };

    this._state.update((s) => ({
      ...s,
      balance: s.balance - amount,
      totalSpent: s.totalSpent + amount,
      history: this.prepend(s.history, tx),
    }));

    void this.fs.spend(user.id, amount, tx).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[wallet] spend write failed:', err);
    });

    return true;
  }

  private normalizeHistory(history: WalletTx[]): WalletTx[] {
    return [...history]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, HISTORY_LIMIT);
  }

  private prepend(history: WalletTx[], tx: WalletTx): WalletTx[] {
    return [tx, ...history].slice(0, HISTORY_LIMIT);
  }
}
