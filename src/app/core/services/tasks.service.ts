import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { NewTaskInput, Task, TaskPriority, TaskTemplate } from '../models';
import {
  DAILY_COIN_CAP,
  DUE_BONUS_MINUTES,
  MIN_ELAPSED_MINUTES,
  TASK_REWARD,
} from '../constants/app.constants';
import { TASK_TEMPLATES } from '../constants/task-templates.constants';
import { AuthService } from './auth.service';
import { FirestoreTasksService } from './firestore-tasks.service';
import { NotificationService } from './notification.service';
import { WalletService } from './wallet.service';

export type ToggleReason =
  | 'ok'        // full reward granted
  | 'partial'   // reward granted but clipped by daily cap
  | 'too-fast'  // completed before MIN_ELAPSED_MINUTES → no coins
  | 'late'      // 24h+ past due → no coins
  | 'capped'    // daily cap already met → no coins
  | 'undo';     // toggled back to pending (no feedback)

export interface ToggleResult {
  earned: number;
  reason: ToggleReason;
  /** Minutes remaining until the task qualifies, when reason === 'too-fast'. */
  waitMinutes?: number;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly auth = inject(AuthService);
  private readonly fsTasks = inject(FirestoreTasksService);
  private readonly wallet = inject(WalletService);
  private readonly notifications = inject(NotificationService);

  private readonly _tasks = signal<Task[]>([]);
  private readonly _loading = signal(false);
  private unsubscribe: (() => void) | null = null;

  readonly tasks = computed(() => this._tasks());
  readonly loading = computed(() => this._loading());
  readonly pending = computed(() => this._tasks().filter((t) => !t.done));
  readonly completed = computed(() => this._tasks().filter((t) => t.done));
  readonly todayPending = computed(() =>
    this.pending().slice().sort(this.byPriority),
  );
  readonly progress = computed(() => {
    const total = this._tasks().length;
    if (!total) return 0;
    return Math.round((this.completed().length / total) * 100);
  });

  /** Coins earned today (rolling, computed from wallet history). */
  readonly todayEarned = computed(() => {
    const start = this.startOfTodayMs();
    return this.wallet
      .state()
      .history.filter((tx) => tx.kind === 'earn' && new Date(tx.at).getTime() >= start)
      .reduce((sum, tx) => sum + tx.amount, 0);
  });

  readonly dailyCap = DAILY_COIN_CAP;
  readonly templates: TaskTemplate[] = TASK_TEMPLATES;

  constructor() {
    // React to auth changes: subscribe to the user's Firestore tasks while
    // logged in, clear local state on logout.
    effect(() => {
      const user = this.auth.user();
      this.unsubscribe?.();
      this.unsubscribe = null;

      if (!user) {
        this._tasks.set([]);
        return;
      }
      this._loading.set(true);
      this.unsubscribe = this.fsTasks.watch(user.id, (tasks) => {
        this._tasks.set(tasks);
        this._loading.set(false);
      });
    });
  }

  async add(input: NewTaskInput): Promise<void> {
    const user = this.auth.user();
    if (!user) return;
    const priority = input.priority ?? 'medium';

    // Firestore rejects `undefined` field values; we omit optional fields
    // entirely when not set instead of letting them through as undefined.
    const base: Omit<Task, 'id'> = {
      title: input.title.trim(),
      category: input.category ?? 'personal',
      priority,
      reward: input.reward ?? TASK_REWARD[priority],
      createdAt: new Date().toISOString(),
      done: false,
    };
    if (input.notes?.trim()) base.notes = input.notes.trim();
    if (input.dueAt) base.dueAt = input.dueAt;
    if (input.recurrence) base.recurrence = input.recurrence;

    const newId = await this.fsTasks.add(user.id, base);

    // Schedule a system notification when the task has a time of day.
    if (base.dueAt) {
      void this.notifications.scheduleForTask({ ...base, id: newId } as Task);
    }
  }

  async addFromTemplate(template: TaskTemplate): Promise<void> {
    await this.add({
      title: template.title,
      category: template.category,
      priority: template.priority,
      dueAt: template.defaultTime ? this.todayAt(template.defaultTime) : undefined,
      recurrence: template.recurrence,
    });
  }

  async update(id: string, patch: NewTaskInput): Promise<void> {
    const user = this.auth.user();
    if (!user) return;

    // Build a minimal patch only with fields the user actually edited.
    // createdAt is intentionally NOT included — Firestore rules forbid
    // changing it. If priority changes, the base reward is recomputed.
    const cleanPatch: Partial<Task> = {};
    if (patch.title !== undefined) cleanPatch.title = patch.title.trim();
    if (patch.notes !== undefined) cleanPatch.notes = patch.notes.trim();
    if (patch.category !== undefined) cleanPatch.category = patch.category;
    if (patch.priority !== undefined) {
      cleanPatch.priority = patch.priority;
      cleanPatch.reward = TASK_REWARD[patch.priority];
    }
    if (patch.dueAt !== undefined) cleanPatch.dueAt = patch.dueAt;
    if (patch.recurrence !== undefined) cleanPatch.recurrence = patch.recurrence;

    await this.fsTasks.update(user.id, id, cleanPatch);

    // Re-schedule the notification with the new dueAt / recurrence values.
    const updated = this._tasks().find((t) => t.id === id);
    if (updated) {
      await this.notifications.cancelForTask(id);
      if (cleanPatch.dueAt ?? updated.dueAt) {
        void this.notifications.scheduleForTask({ ...updated, ...cleanPatch });
      }
    }
  }

  async remove(id: string): Promise<void> {
    const user = this.auth.user();
    if (!user) return;
    await this.notifications.cancelForTask(id);
    await this.fsTasks.remove(user.id, id);
  }

  /**
   * Toggle done/undone. When marking complete, anti-cheat rules apply:
   *
   *   - If less than MIN_ELAPSED_MINUTES[priority] elapsed since creation,
   *     the task is marked done but no coins are awarded ('too-fast').
   *   - If more than 24h late vs dueAt, no coins ('late').
   *   - 2h–24h late: half coins (rounded down, min 1).
   *   - Within DUE_BONUS_MINUTES of dueAt: +1 coin bonus.
   *   - Coins are clamped to remaining daily cap. If the cap is reached,
   *     the rest are clipped ('partial') or zeroed ('capped').
   */
  async toggle(id: string): Promise<ToggleResult> {
    const user = this.auth.user();
    if (!user) return { earned: 0, reason: 'undo' };

    const task = this._tasks().find((t) => t.id === id);
    if (!task) return { earned: 0, reason: 'undo' };

    const nowDone = !task.done;
    const patch: Partial<Task> = nowDone
      ? { done: true, completedAt: new Date().toISOString() }
      : { done: false };

    await this.fsTasks.update(user.id, id, patch);

    if (!nowDone) return { earned: 0, reason: 'undo' };

    // Recurring task: cancel current notification and schedule the next
    // instance so the user sees it tomorrow / next week. The completed
    // task itself stays as-is for stats and the completed drawer.
    if (task.recurrence) {
      void this.cycleRecurrence(task);
    }

    const reward = this.computeReward(task);

    if (reward.reason === 'too-fast') {
      const wait = Math.ceil(
        MIN_ELAPSED_MINUTES[task.priority] -
          (Date.now() - new Date(task.createdAt).getTime()) / 60_000,
      );
      return { earned: 0, reason: 'too-fast', waitMinutes: Math.max(1, wait) };
    }

    if (reward.reason === 'late') {
      return { earned: 0, reason: 'late' };
    }

    const remainingCap = Math.max(0, this.dailyCap - this.todayEarned());
    const earned = Math.min(reward.amount, remainingCap);

    if (earned <= 0) {
      return { earned: 0, reason: 'capped' };
    }

    this.wallet.earn(earned, `Tarea completada · ${task.title}`);

    if (earned < reward.amount) {
      return { earned, reason: 'partial' };
    }
    return { earned, reason: 'ok' };
  }

  // ------------- private helpers -------------

  private computeReward(task: Task): { amount: number; reason: 'ok' | 'too-fast' | 'late' } {
    const now = Date.now();
    const created = new Date(task.createdAt).getTime();
    const elapsedMin = (now - created) / 60_000;
    if (elapsedMin < MIN_ELAPSED_MINUTES[task.priority]) {
      return { amount: 0, reason: 'too-fast' };
    }

    let amount = TASK_REWARD[task.priority];

    if (task.dueAt) {
      const due = new Date(task.dueAt).getTime();
      const minutesLate = (now - due) / 60_000;
      const absMin = Math.abs(minutesLate);

      if (minutesLate > 24 * 60) {
        return { amount: 0, reason: 'late' };
      }
      if (minutesLate > 2 * 60) {
        amount = Math.max(1, Math.floor(amount * 0.5));
      }
      if (absMin <= DUE_BONUS_MINUTES) {
        amount += 1;
      }
    }

    return { amount, reason: 'ok' };
  }

  /**
   * Cancels the completed task's notification and creates the next
   * occurrence as a fresh task — preserving title / category / time
   * but shifting dueAt to tomorrow (daily) or next week (weekly).
   */
  private async cycleRecurrence(prev: Task): Promise<void> {
    await this.notifications.cancelForTask(prev.id);
    const nextDue = this.computeNextDue(prev.dueAt, prev.recurrence);
    if (!nextDue) return;
    await this.add({
      title: prev.title,
      ...(prev.notes ? { notes: prev.notes } : {}),
      category: prev.category,
      priority: prev.priority,
      dueAt: nextDue,
      recurrence: prev.recurrence,
    });
  }

  private computeNextDue(dueAt: string | undefined, recurrence: Task['recurrence']): string | undefined {
    if (!dueAt) return undefined;
    const d = new Date(dueAt);
    if (recurrence === 'daily') d.setDate(d.getDate() + 1);
    else if (recurrence === 'weekly') d.setDate(d.getDate() + 7);
    else return undefined;
    return d.toISOString();
  }

  private todayAt(hhmm: string): string {
    const [hStr, mStr] = hhmm.split(':');
    const h = Number(hStr ?? 0);
    const m = Number(mStr ?? 0);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  private startOfTodayMs(): number {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  private byPriority(a: Task, b: Task): number {
    const rank: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
    return rank[a.priority] - rank[b.priority];
  }
}
