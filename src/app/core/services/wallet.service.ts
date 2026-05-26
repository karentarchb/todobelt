import { Injectable, computed, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../constants/app.constants';
import { WalletState, WalletTx } from '../models';
import { uid } from '../helpers/id.helper';

const INITIAL: WalletState = {
  balance: 24,
  totalEarned: 24,
  totalSpent: 0,
  history: [],
};

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly storage = inject(StorageService);

  private readonly _state = signal<WalletState>(INITIAL);
  readonly state = computed(() => this._state());
  readonly balance = computed(() => this._state().balance);
  readonly history = computed(() => this._state().history);

  async hydrate(): Promise<void> {
    const saved = await this.storage.get<WalletState>(STORAGE_KEYS.walletState);
    if (saved) this._state.set(saved);
  }

  earn(amount: number, reason: string): void {
    if (amount <= 0) return;
    this.commit((s) => ({
      ...s,
      balance: s.balance + amount,
      totalEarned: s.totalEarned + amount,
      history: this.prepend(s.history, {
        id: uid('tx'),
        kind: 'earn',
        amount,
        reason,
        at: new Date().toISOString(),
      }),
    }));
  }

  /** @returns true if the spend succeeded, false if insufficient balance. */
  spend(amount: number, reason: string): boolean {
    if (amount <= 0) return false;
    const current = this._state();
    if (current.balance < amount) return false;
    this.commit((s) => ({
      ...s,
      balance: s.balance - amount,
      totalSpent: s.totalSpent + amount,
      history: this.prepend(s.history, {
        id: uid('tx'),
        kind: 'spend',
        amount,
        reason,
        at: new Date().toISOString(),
      }),
    }));
    return true;
  }

  private commit(update: (s: WalletState) => WalletState): void {
    const next = update(this._state());
    this._state.set(next);
    void this.storage.set(STORAGE_KEYS.walletState, next);
  }

  private prepend(history: WalletTx[], tx: WalletTx): WalletTx[] {
    return [tx, ...history].slice(0, 40);
  }
}
