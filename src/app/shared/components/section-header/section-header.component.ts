import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'tb-section-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./section-header.component.scss'],
  template: `
    <header class="tb-section">
      <div class="tb-section__main">
        <h2 class="tb-section__title">{{ title }}</h2>
        @if (subtitle) {
          <p class="tb-section__subtitle">{{ subtitle }}</p>
        }
      </div>
      <ng-content select="[slot=action]" />
    </header>
  `,
})
export class SectionHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
