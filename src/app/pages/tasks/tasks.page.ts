import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';

import { TasksService } from '@core/services/tasks.service';
import { CategoriesService } from '@core/services/categories.service';
import { TaskCategoryId, TaskPriority, TaskTemplate } from '@core/models';
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
  private readonly router = inject(Router);

  readonly statusFilter = signal<StatusFilter>('all');
  readonly categoryFilter = signal<TaskCategoryId | null>(null);

  readonly showAdd = signal(false);

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

  async toggleTask(id: string): Promise<void> {
    const result = await this.tasksSvc.toggle(id);
    await flashToggle(this.toastCtrl, result);
  }

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

  openAdd(): void {
    this.draftTitle.set('');
    const first = this.categories()[0];
    this.draftCategory.set(first?.id ?? 'personal');
    this.draftPriority.set('medium');
    this.showAdd.set(true);
  }

  closeAdd(): void {
    this.showAdd.set(false);
  }

  async submit(): Promise<void> {
    const title = this.draftTitle().trim();
    if (!title) return;
    await this.tasksSvc.add({
      title,
      category: this.draftCategory(),
      priority: this.draftPriority(),
    });
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
