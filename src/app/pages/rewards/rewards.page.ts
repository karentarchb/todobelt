import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';

import { RewardsService } from '@core/services/rewards.service';
import { WalletService } from '@core/services/wallet.service';

import { CoinBadgeComponent } from '@shared/components/coin-badge/coin-badge.component';
import { RewardCardComponent } from '@shared/components/reward-card/reward-card.component';
import { SectionHeaderComponent } from '@shared/components/section-header/section-header.component';

@Component({
  selector: 'app-rewards',
  standalone: true,
  imports: [IonicModule, CoinBadgeComponent, RewardCardComponent, SectionHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./rewards.page.scss'],
  templateUrl: './rewards.page.html',
})
export class RewardsPage {
  private readonly rewardsSvc = inject(RewardsService);
  private readonly wallet = inject(WalletService);
  private readonly toastCtrl = inject(ToastController);

  readonly balance = this.wallet.balance;
  readonly totalEarned = computed(() => this.wallet.state().totalEarned);
  readonly totalSpent = computed(() => this.wallet.state().totalSpent);

  readonly affordable = computed(() =>
    this.rewardsSvc.rewards().filter((r) => r.cost <= this.balance()),
  );
  readonly locked = computed(() =>
    this.rewardsSvc.rewards().filter((r) => r.cost > this.balance()),
  );

  async claim(id: string): Promise<void> {
    const result = await this.rewardsSvc.claim(id);
    const toast = await this.toastCtrl.create({
      message: result.message,
      duration: 2000,
      position: 'top',
      cssClass: 'tb-toast',
    });
    await toast.present();
  }
}
