import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { formatCoins } from '@core/helpers/format.helper';

@Component({
  selector: 'tb-coin-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./coin-badge.component.scss'],
  template: `
    <span class="tb-coin" [class.tb-coin--lg]="size === 'lg'">
      <span class="tb-coin__dot" aria-hidden="true"></span>
      <span class="tb-coin__value">{{ formatted }}</span>
    </span>
  `,
})
export class CoinBadgeComponent {
  @Input() value = 0;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get formatted(): string {
    return formatCoins(this.value);
  }
}
