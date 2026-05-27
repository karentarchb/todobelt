import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Mood, MoodKey } from '@core/models';

@Component({
  selector: 'tb-mood-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./mood-selector.component.scss'],
  template: `
    <div class="tb-mood" role="radiogroup" aria-label="¿Cómo te sientes hoy?">
      @for (m of options; track m.key) {
        <button
          type="button"
          class="tb-mood__opt"
          [class.tb-mood__opt--active]="m.key === selected"
          [attr.aria-checked]="m.key === selected"
          role="radio"
          (click)="select.emit(m.key)"
        >
          <span class="tb-mood__emoji" aria-hidden="true">{{ m.emoji }}</span>
          <span class="tb-mood__label">{{ m.label }}</span>
        </button>
      }
    </div>
  `,
})
export class MoodSelectorComponent {
  @Input({ required: true }) options!: Mood[];
  @Input() selected: MoodKey | null = null;

  @Output() select = new EventEmitter<MoodKey>();
}
