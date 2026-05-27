import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'tb-empty-state',
  standalone: true,
  imports: [IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./empty-state.component.scss'],
  template: `
    <div class="tb-empty">
      @if (icon) {
        <span class="tb-empty__icon">
          <ion-icon [name]="icon" aria-hidden="true" />
        </span>
      }
      <h3 class="tb-empty__title">{{ title }}</h3>
      @if (description) {
        <p class="tb-empty__desc">{{ description }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input() description?: string;
  @Input() icon = 'sparkles-outline';
}
