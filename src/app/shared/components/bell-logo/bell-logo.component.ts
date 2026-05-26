import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Minimalist bell glyph — TODO BELT brand mark.
 * Pure SVG, no fills outside the stroke, no decorative flourish.
 */
@Component({
  selector: 'tb-bell-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./bell-logo.component.scss'],
  template: `
    <span
      class="tb-bell"
      [class.tb-bell--tinted]="tinted"
      [style.--bell-size.px]="size"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <!-- Soft body of the bell -->
        <path
          d="M16 42c0-10.5 2.4-17.5 7.2-21.2C26.4 18.3 28.9 17 32 17s5.6 1.3 8.8 3.8C45.6 24.5 48 31.5 48 42v.5l3.4 4.1c.6.7.1 1.7-.8 1.7H13.4c-.9 0-1.4-1-.8-1.7l3.4-4.1V42Z"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linejoin="round"
        />
        <!-- Clapper -->
        <path
          d="M28 52a4 4 0 0 0 8 0"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
        />
        <!-- Top stud -->
        <circle cx="32" cy="13" r="2.6" fill="currentColor" />
      </svg>
    </span>
  `,
})
export class BellLogoComponent {
  @Input() size = 36;
  @Input() tinted = false;
}
