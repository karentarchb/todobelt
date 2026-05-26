import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { TasksService } from '@core/services/tasks.service';
import { WalletService } from '@core/services/wallet.service';
import { MoodService } from '@core/services/mood.service';
import { AuthService } from '@core/services/auth.service';
import { RewardsService } from '@core/services/rewards.service';
import { greetingForHour } from '@core/helpers/date.helper';

import { CoinBadgeComponent } from '@shared/components/coin-badge/coin-badge.component';
import { SectionHeaderComponent } from '@shared/components/section-header/section-header.component';
import { TaskCardComponent } from '@shared/components/task-card/task-card.component';
import { RewardCardComponent } from '@shared/components/reward-card/reward-card.component';
import { MoodSelectorComponent } from '@shared/components/mood-selector/mood-selector.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    IonicModule,
    CoinBadgeComponent,
    SectionHeaderComponent,
    TaskCardComponent,
    RewardCardComponent,
    MoodSelectorComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./home.page.scss'],
  templateUrl: './home.page.html',
})
export class HomePage {
  private readonly tasksSvc = inject(TasksService);
  private readonly walletSvc = inject(WalletService);
  private readonly moodSvc = inject(MoodService);
  private readonly auth = inject(AuthService);
  private readonly rewardsSvc = inject(RewardsService);
  private readonly router = inject(Router);

  readonly greeting = greetingForHour();
  readonly userName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');

  readonly balance = this.walletSvc.balance;
  readonly moodOptions = this.moodSvc.options;
  readonly moodSelected = computed(() => this.moodSvc.today()?.key ?? null);

  readonly pending = computed(() => this.tasksSvc.todayPending().slice(0, 4));
  readonly completedCount = computed(() => this.tasksSvc.completed().length);
  readonly totalCount = computed(() => this.tasksSvc.tasks().length);
  readonly progress = this.tasksSvc.progress;

  readonly featuredRewards = computed(() =>
    this.rewardsSvc.rewards().slice(0, 3),
  );

  onMood(key: 'great' | 'good' | 'meh' | 'low' | 'tired'): void {
    void this.moodSvc.setToday(key);
  }

  toggleTask(id: string): void {
    this.tasksSvc.toggle(id);
  }

  onClaim(id: string): void {
    this.rewardsSvc.claim(id);
  }

  goTasks(): void {
    void this.router.navigateByUrl('/tabs/tasks');
  }

  goRewards(): void {
    void this.router.navigateByUrl('/tabs/rewards');
  }
}
