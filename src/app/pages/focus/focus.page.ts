import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { FocusService } from '@core/services/focus.service';
import { FOCUS_PRESETS } from '@core/constants/app.constants';
import { PrimaryButtonComponent } from '@shared/components/primary-button/primary-button.component';

@Component({
  selector: 'app-focus',
  standalone: true,
  imports: [IonicModule, PrimaryButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./focus.page.scss'],
  templateUrl: './focus.page.html',
})
export class FocusPage {
  private readonly focusSvc = inject(FocusService);

  readonly presets = FOCUS_PRESETS;
  readonly session = this.focusSvc.session;
  readonly progress = this.focusSvc.progress;

  readonly minutes = computed(() => Math.floor(this.session().remaining / 60));
  readonly seconds = computed(() => this.session().remaining % 60);
  readonly currentMinutes = computed(() => Math.round(this.session().duration / 60));

  /** Stroke-dashoffset for the SVG ring, given a 314 circumference. */
  readonly dashOffset = computed(() => 314 - this.progress() * 314);

  setPreset(min: number): void {
    if (this.session().state === 'running') return;
    this.focusSvc.setDuration(min);
  }

  start(): void {
    this.focusSvc.start();
  }

  pause(): void {
    this.focusSvc.pause();
  }

  reset(): void {
    this.focusSvc.reset();
  }

  pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }
}
