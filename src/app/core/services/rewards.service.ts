import { Injectable, computed, inject, signal } from '@angular/core';
import { ClaimRewardResult, Reward } from '../models';
import { uid } from '../helpers/id.helper';
import { WalletService } from './wallet.service';

const SEED: Reward[] = [
  {
    id: uid('r'),
    title: 'Café especial',
    description: 'Un latte de tu cafetería favorita.',
    cost: 12,
    kind: 'coffee',
    accent: 'yellow',
    claimedCount: 0,
  },
  {
    id: uid('r'),
    title: 'Helado',
    description: 'Una bola de tu sabor preferido.',
    cost: 18,
    kind: 'icecream',
    accent: 'rose',
    claimedCount: 0,
  },
  {
    id: uid('r'),
    title: '15 min de pausa',
    description: 'Cierra los ojos y respira.',
    cost: 6,
    kind: 'break',
    accent: 'green',
    claimedCount: 0,
  },
  {
    id: uid('r'),
    title: 'Caminata corta',
    description: 'Un paseo de 10 minutos al aire libre.',
    cost: 8,
    kind: 'walk',
    accent: 'blue',
    claimedCount: 0,
  },
  {
    id: uid('r'),
    title: 'Capricho dulce',
    description: 'Algo pequeño que te haga sonreír.',
    cost: 22,
    kind: 'treat',
    accent: 'purple',
    claimedCount: 0,
  },
  {
    id: uid('r'),
    title: '30 min pantalla',
    description: 'Una pausa para tu serie favorita.',
    cost: 14,
    kind: 'screen',
    accent: 'blue',
    claimedCount: 0,
  },
];

@Injectable({ providedIn: 'root' })
export class RewardsService {
  private readonly wallet = inject(WalletService);

  private readonly _rewards = signal<Reward[]>(SEED);
  readonly rewards = computed(() => this._rewards());

  claim(id: string): ClaimRewardResult {
    const reward = this._rewards().find((r) => r.id === id);
    if (!reward) return { ok: false, message: 'Recompensa no encontrada.' };

    const success = this.wallet.spend(reward.cost, `Recompensa · ${reward.title}`);
    if (!success) {
      return {
        ok: false,
        message: 'Aún te faltan monedas para esta recompensa.',
        reward,
      };
    }

    this._rewards.update((list) =>
      list.map((r) =>
        r.id === id
          ? { ...r, claimedCount: r.claimedCount + 1, lastClaimedAt: new Date().toISOString() }
          : r,
      ),
    );

    return {
      ok: true,
      message: `¡Disfruta tu ${reward.title.toLowerCase()}!`,
      reward,
      remaining: this.wallet.balance(),
    };
  }
}
