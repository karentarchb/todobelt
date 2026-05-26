import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'tb-primary-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./primary-button.component.scss'],
  template: `
    <button
      type="button"
      class="tb-pbtn"
      [class.tb-pbtn--ghost]="variant === 'ghost'"
      [class.tb-pbtn--block]="block"
      [disabled]="disabled || loading"
      (click)="onClick($event)"
    >
      @if (loading) {
        <span class="tb-pbtn__spinner" aria-hidden="true"></span>
      }
      <span class="tb-pbtn__label">
        <ng-content />
      </span>
    </button>
  `,
})
export class PrimaryButtonComponent {
  @Input() variant: 'primary' | 'ghost' = 'primary';
  @Input() block = false;
  @Input() disabled = false;
  @Input() loading = false;

  @Output() pressed = new EventEmitter<MouseEvent>();

  onClick(ev: MouseEvent): void {
    if (this.disabled || this.loading) return;
    this.pressed.emit(ev);
  }
}
