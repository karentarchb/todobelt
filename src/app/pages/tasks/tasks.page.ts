import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  IonicModule,
  ToastController,
} from '@ionic/angular';

import { TasksService } from '@core/services/tasks.service';
import { CategoriesService } from '@core/services/categories.service';
import { Task, TaskCategoryId, TaskPriority, TaskTemplate } from '@core/models';
import { ACCENT_VAR } from '@core/constants/category-defaults.constants';
import { flashToggle } from '@core/helpers/toggle-feedback.helper';
import {
  WEEKDAYS_MON_FIRST,
  WEEKDAY_PRESETS,
} from '@core/helpers/weekday.helper';

import { TaskCardComponent } from '@shared/components/task-card/task-card.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PrimaryButtonComponent } from '@shared/components/primary-button/primary-button.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    IonicModule,
    FormsModule,
    TaskCardComponent,
    EmptyStateComponent,
    PrimaryButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./tasks.page.scss'],
  templateUrl: './tasks.page.html',
})
export class TasksPage {
  private readonly tasksSvc = inject(TasksService);
  private readonly categoriesSvc = inject(CategoriesService);
  private readonly toastCtrl = inject(ToastController);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly alertCtrl = inject(AlertController);
  private readonly router = inject(Router);

  readonly categoryFilter = signal<TaskCategoryId | null>(null);

  /** Completed tasks live in a collapsible drawer at the bottom. */
  readonly drawerOpen = signal(false);

  readonly showAdd = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly draftTitle = signal('');
  readonly draftCategory = signal<TaskCategoryId>('personal');
  readonly draftPriority = signal<TaskPriority>('medium');
  /** Time-of-day picker value (HH:mm). Empty string = no specific time. */
  readonly draftDueTime = signal<string>('');
  readonly draftRecurrence = signal<'none' | 'daily' | 'weekly'>('none');
  readonly draftDays = signal<number[]>([]);

  readonly weekdayChoices = WEEKDAYS_MON_FIRST;

  readonly categories = this.categoriesSvc.categories;

  readonly priorities: { key: TaskPriority; label: string }[] = [
    { key: 'low', label: 'Suave' },
    { key: 'medium', label: 'Normal' },
    { key: 'high', label: 'Importante' },
  ];

  readonly templates = this.tasksSvc.templates;
  readonly todayEarned = this.tasksSvc.todayEarned;
  readonly dailyCap = this.tasksSvc.dailyCap;

  readonly capProgress = computed(() => {
    const cap = this.dailyCap;
    if (cap <= 0) return 0;
    return Math.min(100, Math.round((this.todayEarned() / cap) * 100));
  });

  readonly pendingTasks = computed(() => {
    let result = this.tasksSvc.todayPending();
    const cat = this.categoryFilter();
    if (cat) result = result.filter((t) => t.category === cat);
    return result;
  });

  readonly completedTasks = computed(() => {
    let result = this.tasksSvc.completed().slice().sort((a, b) => {
      const at = new Date(a.completedAt ?? a.createdAt).getTime();
      const bt = new Date(b.completedAt ?? b.createdAt).getTime();
      return bt - at;
    });
    const cat = this.categoryFilter();
    if (cat) result = result.filter((t) => t.category === cat);
    return result;
  });

  // ---------- Card interactions ----------

  async toggleTask(id: string): Promise<void> {
    const result = await this.tasksSvc.toggle(id);
    await flashToggle(this.toastCtrl, result);
  }

  async openActions(taskId: string): Promise<void> {
    const task = this.tasksSvc.tasks().find((t) => t.id === taskId);
    if (!task) return;

    const sheet = await this.actionSheetCtrl.create({
      header: task.title,
      cssClass: 'tb-action-sheet',
      buttons: [
        {
          text: task.done ? 'Marcar como pendiente' : 'Marcar como completada',
          icon: task.done ? 'arrow-undo-outline' : 'checkmark-outline',
          handler: () => {
            void this.toggleTask(task.id);
          },
        },
        {
          text: 'Editar',
          icon: 'create-outline',
          handler: () => {
            this.openEdit(task);
          },
        },
        {
          text: 'Eliminar',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            void this.confirmDelete(task);
          },
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel',
        },
      ],
    });
    await sheet.present();
  }

  private async confirmDelete(task: Task): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar tarea?',
      message: `"${task.title}" se eliminará. Esta acción no se puede deshacer.`,
      cssClass: 'tb-alert',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.doDelete(task.id);
          },
        },
      ],
    });
    await alert.present();
  }

  private async doDelete(id: string): Promise<void> {
    await this.tasksSvc.remove(id);
    const toast = await this.toastCtrl.create({
      message: 'Tarea eliminada.',
      duration: 1600,
      position: 'top',
      cssClass: 'tb-toast',
    });
    await toast.present();
  }

  // ---------- Filters / drawer ----------

  toggleCategoryFilter(id: TaskCategoryId): void {
    this.categoryFilter.update((current) => (current === id ? null : id));
  }

  clearCategoryFilter(): void {
    this.categoryFilter.set(null);
  }

  toggleDrawer(): void {
    this.drawerOpen.update((v) => !v);
  }

  // ---------- Add / edit modal ----------

  openAdd(): void {
    this.editingId.set(null);
    this.draftTitle.set('');
    const first = this.categories()[0];
    this.draftCategory.set(first?.id ?? 'personal');
    this.draftPriority.set('medium');
    this.draftDueTime.set('');
    this.draftRecurrence.set('none');
    this.draftDays.set([]);
    this.showAdd.set(true);
  }

  openEdit(task: Task): void {
    this.editingId.set(task.id);
    this.draftTitle.set(task.title);
    this.draftCategory.set(task.category);
    this.draftPriority.set(task.priority);
    this.draftDueTime.set(this.extractTime(task.dueAt));
    this.draftRecurrence.set(task.recurrence ?? 'none');
    this.draftDays.set(task.recurrenceDays ?? []);
    this.showAdd.set(true);
  }

  toggleDay(day: number): void {
    this.draftDays.update((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort((a, b) => a - b),
    );
  }

  applyWeekdaysPreset(): void {
    this.draftDays.set([...WEEKDAY_PRESETS.WEEKDAYS]);
  }

  applyWeekendsPreset(): void {
    this.draftDays.set([...WEEKDAY_PRESETS.WEEKENDS]);
  }

  applyEverydayPreset(): void {
    this.draftDays.set([...WEEKDAY_PRESETS.EVERYDAY]);
  }

  closeAdd(): void {
    this.showAdd.set(false);
    this.editingId.set(null);
  }

  /** Fill the form from a template instead of auto-adding the task —
   *  the user can still tweak the title / category / time before saving. */
  useTemplate(template: TaskTemplate): void {
    this.draftTitle.set(template.title);
    this.draftCategory.set(template.category);
    this.draftPriority.set(template.priority);
    this.draftDueTime.set(template.defaultTime ?? '');
    this.draftRecurrence.set(template.recurrence ?? 'none');
    this.draftDays.set(template.recurrenceDays ?? []);
  }

  async submit(): Promise<void> {
    const title = this.draftTitle().trim();
    if (!title) return;

    const dueAt = this.draftDueTime() ? this.todayAt(this.draftDueTime()) : undefined;
    const rec = this.draftRecurrence();
    const recurrence = rec === 'none' ? undefined : rec;
    // Days only matter for weekly recurrence — drop them otherwise.
    const recurrenceDays = rec === 'weekly' && this.draftDays().length ? this.draftDays() : undefined;

    const id = this.editingId();
    if (id) {
      await this.tasksSvc.update(id, {
        title,
        category: this.draftCategory(),
        priority: this.draftPriority(),
        dueAt,
        recurrence,
        recurrenceDays,
      });
    } else {
      await this.tasksSvc.add({
        title,
        category: this.draftCategory(),
        priority: this.draftPriority(),
        dueAt,
        recurrence,
        recurrenceDays,
      });
    }
    this.closeAdd();
  }

  iconForCategory(id: TaskCategoryId): string {
    return this.categoriesSvc.byId(id)?.icon ?? 'pricetag-outline';
  }

  iconForTemplate(t: TaskTemplate): string {
    return t.icon ?? this.iconForCategory(t.category);
  }

  accentForCategory(id: TaskCategoryId): string {
    const cat = this.categoriesSvc.byId(id);
    return cat ? ACCENT_VAR[cat.accent] : 'var(--tb-text-muted)';
  }

  goCategories(): void {
    void this.router.navigateByUrl('/tabs/categories');
  }

  // ---------- Date helpers ----------

  private todayAt(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setHours(h ?? 0, m ?? 0, 0, 0);
    return d.toISOString();
  }

  private extractTime(iso: string | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    const h = d.getHours();
    const m = d.getMinutes();
    if (h === 0 && m === 0) return '';
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
