import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { ClaimRewardResult, Reward } from '../models';
import { DEFAULT_REWARDS } from '../constants/rewards.constants';
import { AuthService } from './auth.service';
import { FirestoreRewardsService } from './firestore-rewards.service';
import { WalletService } from './wallet.service';

@Injectable({ providedIn: 'root' })
export class RewardsService {
  private readonly wallet = inject(WalletService);
  private readonly auth = inject(AuthService);
  private readonly fs = inject(FirestoreRewardsService);

  private readonly _rewards = signal<Reward[]>([]);
  private unsubscribe: (() => void) | null = null;

  readonly rewards = computed(() => this._rewards());

  constructor() {
    effect(() => {
      const user = this.auth.user();
      this.unsubscribe?.();
      this.unsubscribe = null;

      if (!user) {
        this._rewards.set([]);
        return;
      }

      void this.fs.ensureSeeded(user.id, DEFAULT_REWARDS).then(() => {
        this.unsubscribe = this.fs.watch(user.id, (rewards) => {
          this._rewards.set(rewards);
        });
      });
    });
  }

  async claim(id: string): Promise<ClaimRewardResult> {
    const user = this.auth.user();
    if (!user) {
      return { ok: false, message: 'Inicia sesión para canjear recompensas.' };
    }

    const reward = this._rewards().find((r) => r.id === id);
    if (!reward) {
      return { ok: false, message: 'Recompensa no encontrada.' };
    }

    const spent = this.wallet.spend(reward.cost, `Recompensa · ${reward.title}`);
    if (!spent) {
      return {
        ok: false,
        message: 'Aún te faltan monedas para esta recompensa.',
        reward,
      };
    }

    try {
      await this.fs.recordClaim(user.id, id);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[rewards] recordClaim failed:', err);
      // We don't auto-refund the wallet — the user effectively claimed
      // locally. The next listener fire will sync remote state.
    }

    return {
      ok: true,
      message: `¡Disfruta tu ${reward.title.toLowerCase()}!`,
      reward,
      remaining: this.wallet.balance(),
    };
  }
}
