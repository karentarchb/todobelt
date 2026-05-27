import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Reward } from '@core/models';

const ICON_FOR_KIND: Record<Reward['kind'], string> = {
  coffee: 'cafe-outline',
  icecream: 'ice-cream-outline',
  break: 'leaf-outline',
  walk: 'walk-outline',
  treat: 'gift-outline',
  screen: 'tv-outline',
  custom: 'sparkles-outline',
};

const ACCENT_TOKEN: Record<NonNullable<Reward['accent']>, string> = {
  rose: 'var(--tb-rose)',
  blue: 'var(--tb-blue)',
  green: 'var(--tb-green)',
  yellow: 'var(--tb-yellow)',
  purple: 'var(--tb-purple)',
};

@Component({
  selector: 'tb-reward-card',
  standalone: true,
  imports: [IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./reward-card.component.scss'],
  template: `
    <article
      class="tb-reward"
      [class.tb-reward--locked]="!affordable"
      (click)="onClick()"
    >
      <span class="tb-reward__icon" [style.color]="accent">
        <ion-icon [name]="icon" aria-hidden="true" />
      </span>

      <div class="tb-reward__body">
        <h4 class="tb-reward__title">{{ reward.title }}</h4>
        @if (reward.description) {
          <p class="tb-reward__desc">{{ reward.description }}</p>
        }
      </div>

      <div class="tb-reward__cost" [class.tb-reward__cost--locked]="!affordable">
        <span class="tb-reward__cost-dot" aria-hidden="true"></span>
        {{ reward.cost }}
      </div>
    </article>
  `,
})
export class RewardCardComponent {
  @Input({ required: true }) reward!: Reward;
  @Input() affordable = true;

  @Output() claim = new EventEmitter<string>();

  get icon(): string {
    return ICON_FOR_KIND[this.reward.kind];
  }
  get accent(): string {
    return this.reward.accent ? ACCENT_TOKEN[this.reward.accent] : 'var(--tb-rose)';
  }

  onClick(): void {
    if (!this.affordable) return;
    this.claim.emit(this.reward.id);
  }
}
