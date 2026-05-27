import { Injectable, computed, inject, signal } from '@angular/core';
import { NewTaskInput, Task } from '../models';
import { uid } from '../helpers/id.helper';
import { TASK_REWARD } from '../constants/app.constants';
import { WalletService } from './wallet.service';

const seed = (): Task[] => {
  const now = new Date();
  const iso = (offsetH: number) =>
    new Date(now.getTime() + offsetH * 3_600_000).toISOString();

  return [
    {
      id: uid('t'),
      title: 'Revisar correos importantes',
      category: 'work',
      priority: 'medium',
      reward: TASK_REWARD.medium,
      createdAt: iso(-3),
      dueAt: iso(2),
      done: false,
    },
    {
      id: uid('t'),
      title: 'Caminar 20 minutos',
      notes: 'Sin auriculares, solo respirar.',
      category: 'health',
      priority: 'low',
      reward: TASK_REWARD.low,
      createdAt: iso(-5),
      dueAt: iso(4),
      done: false,
    },
    {
      id: uid('t'),
      title: 'Avanzar diseño TODO BELT',
      category: 'creative',
      priority: 'high',
      reward: TASK_REWARD.high,
      createdAt: iso(-1),
      dueAt: iso(6),
      done: false,
    },
    {
      id: uid('t'),
      title: 'Beber 2 vasos de agua',
      category: 'health',
      priority: 'low',
      reward: TASK_REWARD.low,
      createdAt: iso(-2),
      dueAt: iso(1),
      done: true,
      completedAt: iso(-0.5),
    },
  ];
};

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly wallet = inject(WalletService);

  private readonly _tasks = signal<Task[]>(seed());

  readonly tasks = computed(() => this._tasks());
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

  add(input: NewTaskInput): Task {
    const priority = input.priority ?? 'medium';
    const task: Task = {
      id: uid('t'),
      title: input.title.trim(),
      notes: input.notes?.trim() || undefined,
      category: input.category ?? 'personal',
      priority,
      reward: input.reward ?? TASK_REWARD[priority],
      dueAt: input.dueAt,
      createdAt: new Date().toISOString(),
      done: false,
    };
    this._tasks.update((list) => [task, ...list]);
    return task;
  }

  toggle(id: string): void {
    let earned: { amount: number; title: string } | null = null;

    this._tasks.update((list) =>
      list.map((t) => {
        if (t.id !== id) return t;
        const nowDone = !t.done;
        if (nowDone) earned = { amount: t.reward, title: t.title };
        return {
          ...t,
          done: nowDone,
          completedAt: nowDone ? new Date().toISOString() : undefined,
        };
      }),
    );

    if (earned) {
      const { amount, title } = earned as { amount: number; title: string };
      this.wallet.earn(amount, `Tarea completada · ${title}`);
    }
  }

  remove(id: string): void {
    this._tasks.update((list) => list.filter((t) => t.id !== id));
  }

  private byPriority(a: Task, b: Task): number {
    const rank: Record<Task['priority'], number> = { high: 0, medium: 1, low: 2 };
    return rank[a.priority] - rank[b.priority];
  }
}
