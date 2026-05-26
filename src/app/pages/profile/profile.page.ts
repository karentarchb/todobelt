import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { AuthService } from '@core/services/auth.service';
import { WalletService } from '@core/services/wallet.service';
import { TasksService } from '@core/services/tasks.service';
import { MoodService } from '@core/services/mood.service';

import { BellLogoComponent } from '@shared/components/bell-logo/bell-logo.component';
import { PrimaryButtonComponent } from '@shared/components/primary-button/primary-button.component';
import { initials } from '@core/helpers/format.helper';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonicModule, BellLogoComponent, PrimaryButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./profile.page.scss'],
  templateUrl: './profile.page.html',
})
export class ProfilePage {
  private readonly auth = inject(AuthService);
  private readonly wallet = inject(WalletService);
  private readonly tasksSvc = inject(TasksService);
  private readonly moodSvc = inject(MoodService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;

  readonly stats = computed(() => ({
    balance: this.wallet.balance(),
    earned: this.wallet.state().totalEarned,
    done: this.tasksSvc.completed().length,
  }));

  readonly mood = computed(() => {
    const today = this.moodSvc.today();
    return today ? this.moodSvc.byKey(today.key) : null;
  });

  initialsFor(name?: string): string {
    return name ? initials(name) : '··';
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
