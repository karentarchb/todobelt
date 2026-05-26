import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

import { StatsService } from '@core/services/stats.service';
import { pluralize } from '@core/helpers/format.helper';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./stats.page.scss'],
  templateUrl: './stats.page.html',
})
export class StatsPage {
  private readonly statsSvc = inject(StatsService);
  private readonly router = inject(Router);

  readonly summary = this.statsSvc.summary;
  readonly loading = this.statsSvc.loading;

  readonly bestRecordLabel = computed(() => this.formatDuration(this.summary().focusBestSeconds));
  readonly totalFocusLabel = computed(() => this.formatDuration(this.summary().focusTotalSeconds));

  readonly hasMoodData = computed(() => this.summary().moodDaysTracked > 0);
  readonly hasFocusData = computed(() => this.summary().focusSessionCount > 0);
  readonly hasTaskData = computed(() => this.summary().tasksTotalCompleted > 0);

  // Lifecycle hook fired by ion-content. Triggered every time the page enters.
  ionViewWillEnter(): void {
    void this.statsSvc.refresh();
  }

  async handleRefresh(ev: CustomEvent): Promise<void> {
    await this.statsSvc.refresh();
    (ev.target as HTMLIonRefresherElement).complete();
  }

  goBack(): void {
    void this.router.navigateByUrl('/tabs/home');
  }

  pluralize = pluralize;

  /** Format seconds as "X min" or "Xh Ym" depending on size. */
  private formatDuration(seconds: number): string {
    if (seconds <= 0) return '0 min';
    const totalMin = Math.round(seconds / 60);
    if (totalMin < 60) return `${totalMin} min`;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  }
}
