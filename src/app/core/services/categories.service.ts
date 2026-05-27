import { Injectable, computed, effect, inject, signal } from '@angular/core';

import {
  Category,
  CategoryDeleteResult,
  CategoryUpdate,
  NewCategoryInput,
} from '../models';
import { AuthService } from './auth.service';
import { FirestoreCategoriesService } from './firestore-categories.service';
import { TasksService } from './tasks.service';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly auth = inject(AuthService);
  private readonly fs = inject(FirestoreCategoriesService);
  private readonly tasksSvc = inject(TasksService);

  private readonly _categories = signal<Category[]>([]);
  private unsubscribe: (() => void) | null = null;

  readonly categories = computed(() => this._categories());
  readonly customCategories = computed(() => this._categories().filter((c) => !c.isDefault));
  readonly defaultCategories = computed(() => this._categories().filter((c) => c.isDefault));

  constructor() {
    effect(() => {
      const user = this.auth.user();
      this.unsubscribe?.();
      this.unsubscribe = null;

      if (!user) {
        this._categories.set([]);
        return;
      }

      void this.fs.ensureSeeded(user.id).then(() => {
        this.unsubscribe = this.fs.watch(user.id, (cats) => this._categories.set(cats));
      });
    });
  }

  byId(id: string | null | undefined): Category | undefined {
    if (!id) return undefined;
    return this._categories().find((c) => c.id === id);
  }

  /** Number of tasks currently referencing the given category. */
  taskCount(id: string): number {
    return this.tasksSvc.tasks().filter((t) => t.category === id).length;
  }

  async add(input: NewCategoryInput): Promise<string | null> {
    const user = this.auth.user();
    if (!user || !input.name.trim()) return null;
    return this.fs.add(user.id, input);
  }

  async update(id: string, patch: CategoryUpdate): Promise<void> {
    const user = this.auth.user();
    if (!user) return;
    await this.fs.update(user.id, id, patch);
  }

  /**
   * Deletes a category, refusing to do so when:
   *   - it's one of the seeded defaults (would orphan the slug forever)
   *   - any task currently references it (would orphan those tasks)
   */
  async remove(id: string): Promise<CategoryDeleteResult> {
    const user = this.auth.user();
    if (!user) return { ok: false, reason: 'not-found' };

    const category = this.byId(id);
    if (!category) return { ok: false, reason: 'not-found' };
    if (category.isDefault) return { ok: false, reason: 'cannot-delete-default' };

    const taskCount = this.taskCount(id);
    if (taskCount > 0) {
      return { ok: false, reason: 'in-use', taskCount };
    }

    await this.fs.remove(user.id, id);
    return { ok: true };
  }
}
