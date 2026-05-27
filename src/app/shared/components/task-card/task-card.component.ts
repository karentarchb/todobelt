import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Task } from '@core/models';
import { CategoriesService } from '@core/services/categories.service';
import { ACCENT_VAR } from '@core/constants/category-defaults.constants';
import { relativeDay } from '@core/helpers/date.helper';

@Component({
  selector: 'tb-task-card',
  standalone: true,
  imports: [IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./task-card.component.scss'],
  template: `
    <article
      class="tb-task"
      [class.tb-task--done]="task.done"
      (click)="action.emit(task.id)"
    >
      <button
        type="button"
        class="tb-task__check"
        [attr.aria-pressed]="task.done"
        [attr.aria-label]="task.done ? 'Marcar como pendiente' : 'Marcar como hecha'"
        (click)="onCheckClick($event)"
      >
        @if (task.done) {
          <ion-icon name="checkmark" aria-hidden="true" />
        }
      </button>

      <div class="tb-task__body">
        <h4 class="tb-task__title">{{ task.title }}</h4>

        <div class="tb-task__meta">
          <span class="tb-task__chip" [style.color]="categoryAccent()">
            <ion-icon [name]="categoryIcon()" aria-hidden="true" />
            {{ categoryLabel() }}
          </span>

          @if (task.dueAt) {
            <span class="tb-task__sep" aria-hidden="true">·</span>
            <span class="tb-task__due">{{ due }}</span>
          }

          <span class="tb-task__sep" aria-hidden="true">·</span>
          <span class="tb-task__reward">
            <span class="tb-task__reward-dot" aria-hidden="true"></span>
            +{{ task.reward }}
          </span>
        </div>
      </div>

      <span class="tb-task__priority" [attr.data-priority]="task.priority"></span>
    </article>
  `,
})
export class TaskCardComponent {
  private readonly categoriesSvc = inject(CategoriesService);

  @Input({ required: true }) task!: Task;

  /** Emitted when the user explicitly taps the check circle. */
  @Output() toggle = new EventEmitter<string>();

  /** Emitted when the user taps anywhere else on the card — used by the
   *  parent page to open the action sheet (complete / edit / delete). */
  @Output() action = new EventEmitter<string>();

  /**
   * Resolved category meta for this task. Falls back gracefully when
   * the category id no longer exists (e.g. deleted by the user, even
   * though the service prevents that for in-use categories).
   */
  readonly category = computed(() => this.categoriesSvc.byId(this.task?.category));

  categoryLabel = () => this.category()?.name ?? 'Sin categoría';
  categoryIcon = () => this.category()?.icon ?? 'pricetag-outline';
  categoryAccent = () => {
    const cat = this.category();
    return cat ? ACCENT_VAR[cat.accent] : 'var(--tb-text-muted)';
  };

  get due(): string {
    return relativeDay(this.task.dueAt);
  }

  onCheckClick(ev: MouseEvent): void {
    ev.stopPropagation();
    this.toggle.emit(this.task.id);
  }
}
