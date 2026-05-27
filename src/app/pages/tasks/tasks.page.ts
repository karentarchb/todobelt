import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { TasksService } from '@core/services/tasks.service';
import { TaskCategory, TaskPriority } from '@core/models';
import { CATEGORY_META } from '@core/constants/app.constants';

import { TaskCardComponent } from '@shared/components/task-card/task-card.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PrimaryButtonComponent } from '@shared/components/primary-button/primary-button.component';

type Filter = 'all' | 'today' | 'done';

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

  readonly filter = signal<Filter>('all');
  readonly showAdd = signal(false);

  readonly draftTitle = signal('');
  readonly draftCategory = signal<TaskCategory>('personal');
  readonly draftPriority = signal<TaskPriority>('medium');

  readonly categories = Object.entries(CATEGORY_META).map(([key, meta]) => ({
    key: key as TaskCategory,
    ...meta,
  }));

  readonly priorities: { key: TaskPriority; label: string }[] = [
    { key: 'low', label: 'Suave' },
    { key: 'medium', label: 'Normal' },
    { key: 'high', label: 'Importante' },
  ];

  readonly visible = computed(() => {
    const all = this.tasksSvc.tasks();
    switch (this.filter()) {
      case 'today':
        return all.filter((t) => !t.done);
      case 'done':
        return all.filter((t) => t.done);
      default:
        return all;
    }
  });

  readonly counts = computed(() => ({
    all: this.tasksSvc.tasks().length,
    today: this.tasksSvc.pending().length,
    done: this.tasksSvc.completed().length,
  }));

  toggleTask(id: string): void {
    this.tasksSvc.toggle(id);
  }

  openAdd(): void {
    this.draftTitle.set('');
    this.draftCategory.set('personal');
    this.draftPriority.set('medium');
    this.showAdd.set(true);
  }

  closeAdd(): void {
    this.showAdd.set(false);
  }

  submit(): void {
    const title = this.draftTitle().trim();
    if (!title) return;
    this.tasksSvc.add({
      title,
      category: this.draftCategory(),
      priority: this.draftPriority(),
    });
    this.closeAdd();
  }

  setFilter(f: Filter): void {
    this.filter.set(f);
  }
}
