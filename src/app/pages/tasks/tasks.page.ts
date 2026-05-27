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

import { TaskCardComponent } from '@shared/components/task-card/task-card.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PrimaryButtonComponent } from '@shared/components/primary-button/primary-button.component';

type StatusFilter = 'all' | 'today' | 'done';

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

  readonly statusFilter = signal<StatusFilter>('all');
  readonly categoryFilter = signal<TaskCategoryId | null>(null);

  readonly showAdd = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly draftTitle = signal('');
  readonly draftCategory = signal<TaskCategoryId>('personal');
  readonly draftPriority = signal<TaskPriority>('medium');

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

  readonly visible = computed(() => {
    let result = this.tasksSvc.tasks();
    switch (this.statusFilter()) {
      case 'today':
        result = result.filter((t) => !t.done);
        break;
      case 'done':
        result = result.filter((t) => t.done);
        break;
    }
    const cat = this.categoryFilter();
    if (cat) result = result.filter((t) => t.category === cat);
    return result;
  });

  readonly counts = computed(() => ({
    all: this.tasksSvc.tasks().length,
    today: this.tasksSvc.pending().length,
    done: this.tasksSvc.completed().length,
  }));

  // ----------- Card interactions -----------

  /** Direct toggle when the user taps the check circle. */
  async toggleTask(id: string): Promise<void> {
    const result = await this.tasksSvc.toggle(id);
    await flashToggle(this.toastCtrl, result);
  }

  /**
   * Card-body tap: open an action sheet so the user explicitly picks
   * what they want (complete / edit / delete) instead of an accidental
   * toggle on every touch.
   */
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

  // ----------- Templates -----------

  async useTemplate(template: TaskTemplate): Promise<void> {
    await this.tasksSvc.addFromTemplate(template);
    const toast = await this.toastCtrl.create({
      message: `Agregada: ${template.title}`,
      duration: 1600,
      position: 'top',
      cssClass: 'tb-toast',
    });
    await toast.present();
  }

  iconForTemplate(t: TaskTemplate): string {
    return t.icon ?? this.iconForCategory(t.category);
  }

  iconForCategory(id: TaskCategoryId): string {
    return this.categoriesSvc.byId(id)?.icon ?? 'pricetag-outline';
  }

  accentForCategory(id: TaskCategoryId): string {
    const cat = this.categoriesSvc.byId(id);
    return cat ? ACCENT_VAR[cat.accent] : 'var(--tb-text-muted)';
  }

  // ----------- Add / edit modal -----------

  openAdd(): void {
    this.editingId.set(null);
    this.draftTitle.set('');
    const first = this.categories()[0];
    this.draftCategory.set(first?.id ?? 'personal');
    this.draftPriority.set('medium');
    this.showAdd.set(true);
  }

  openEdit(task: Task): void {
    this.editingId.set(task.id);
    this.draftTitle.set(task.title);
    this.draftCategory.set(task.category);
    this.draftPriority.set(task.priority);
    this.showAdd.set(true);
  }

  closeAdd(): void {
    this.showAdd.set(false);
    this.editingId.set(null);
  }

  async submit(): Promise<void> {
    const title = this.draftTitle().trim();
    if (!title) return;

    const id = this.editingId();
    if (id) {
      await this.tasksSvc.update(id, {
        title,
        category: this.draftCategory(),
        priority: this.draftPriority(),
      });
    } else {
      await this.tasksSvc.add({
        title,
        category: this.draftCategory(),
        priority: this.draftPriority(),
      });
    }
    this.closeAdd();
  }

  setStatus(f: StatusFilter): void {
    this.statusFilter.set(f);
  }

  toggleCategoryFilter(id: TaskCategoryId): void {
    this.categoryFilter.update((current) => (current === id ? null : id));
  }

  clearCategoryFilter(): void {
    this.categoryFilter.set(null);
  }

  goCategories(): void {
    void this.router.navigateByUrl('/tabs/categories');
  }
}
