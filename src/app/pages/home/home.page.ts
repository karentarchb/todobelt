import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController, IonicModule, ToastController } from '@ionic/angular';

import { TasksService } from '@core/services/tasks.service';
import { WalletService } from '@core/services/wallet.service';
import { MoodService } from '@core/services/mood.service';
import { AuthService } from '@core/services/auth.service';
import { RewardsService } from '@core/services/rewards.service';
import { greetingForHour } from '@core/helpers/date.helper';
import { flashToggle } from '@core/helpers/toggle-feedback.helper';

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
  private readonly toastCtrl = inject(ToastController);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly alertCtrl = inject(AlertController);

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

  async toggleTask(id: string): Promise<void> {
    const result = await this.tasksSvc.toggle(id);
    await flashToggle(this.toastCtrl, result);
  }

  /**
   * Card-body tap on Home: same options as on TasksPage, except Editar
   * navigates to /tabs/tasks (Home doesn't render the edit modal).
   */
  async openActions(taskId: string): Promise<void> {
    const task = this.tasksSvc.tasks().find((t) => t.id === taskId);
    if (!task) return;

    const sheet = await this.actionSheetCtrl.create({
      header: task.title,
      cssClass: 'tb-action-sheet',
      buttons: [
        {
          text: task.done ? 'Marcar como pendiente' : 'Marcar como completada',
          icon: task.done ? 'arrow-undo-outline' : 'checkmark-outline',
          handler: () => {
            void this.toggleTask(task.id);
          },
        },
        {
          text: 'Editar en Tareas',
          icon: 'create-outline',
          handler: () => {
            void this.router.navigateByUrl('/tabs/tasks');
          },
        },
        {
          text: 'Eliminar',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            void this.confirmDelete(task.id, task.title);
          },
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel',
        },
      ],
    });
    await sheet.present();
  }

  private async confirmDelete(id: string, title: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar tarea?',
      message: `"${title}" se eliminará. Esta acción no se puede deshacer.`,
      cssClass: 'tb-alert',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.tasksSvc.remove(id);
          },
        },
      ],
    });
    await alert.present();
  }

  async onClaim(id: string): Promise<void> {
    const result = await this.rewardsSvc.claim(id);
    if (!result.ok && result.message) {
      const toast = await this.toastCtrl.create({
        message: result.message,
        duration: 1800,
        position: 'top',
        cssClass: 'tb-toast',
      });
      await toast.present();
    }
  }

  goTasks(): void {
    void this.router.navigateByUrl('/tabs/tasks');
  }

  goRewards(): void {
    void this.router.navigateByUrl('/tabs/rewards');
  }

  goStats(): void {
    void this.router.navigateByUrl('/tabs/stats');
  }
}
