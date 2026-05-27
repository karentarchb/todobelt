import { Injectable, computed, inject, signal } from '@angular/core';

import { AuthService } from './auth.service';
import { FirestoreFocusService } from './firestore-focus.service';
import { FirestoreMoodService } from './firestore-mood.service';
import { TasksService } from './tasks.service';
import { FocusSessionRecord, Mood, MoodEntry, MoodKey, Task } from '../models';
import { MOODS } from '../constants/app.constants';

export interface MoodBucket {
  key: MoodKey;
  label: string;
  emoji: string;
  count: number;
  percent: number;
}

export interface StatsSummary {
  // Tasks
  tasksTotalCompleted: number;
  tasksAveragePerDay: number;
  tasksThisWeek: number;
  tasksActiveDays: number;

  // Mood
  moodDaysTracked: number;
  moodDistribution: MoodBucket[];
  moodMostFrequent: Mood | null;

  // Focus / pomodoro
  focusSessionCount: number;
  focusBestSeconds: number;
  focusTotalSeconds: number;
}

const EMPTY: StatsSummary = {
  tasksTotalCompleted: 0,
  tasksAveragePerDay: 0,
  tasksThisWeek: 0,
  tasksActiveDays: 0,
  moodDaysTracked: 0,
  moodDistribution: [],
  moodMostFrequent: null,
  focusSessionCount: 0,
  focusBestSeconds: 0,
  focusTotalSeconds: 0,
};

/**
 * Aggregates per-user stats from tasks, moods and focus sessions.
 * The page calls refresh() on entry; the service caches the most recent
 * result in a signal so the UI can render immediately on subsequent visits.
 */
@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly auth = inject(AuthService);
  private readonly tasksSvc = inject(TasksService);
  private readonly fsMood = inject(FirestoreMoodService);
  private readonly fsFocus = inject(FirestoreFocusService);

  private readonly _summary = signal<StatsSummary>(EMPTY);
  private readonly _loading = signal(false);
  private readonly _lastRefreshAt = signal<number | null>(null);

  readonly summary = computed(() => this._summary());
  readonly loading = computed(() => this._loading());
  readonly lastRefreshAt = computed(() => this._lastRefreshAt());

  async refresh(): Promise<void> {
    const user = this.auth.user();
    if (!user) {
      this._summary.set(EMPTY);
      return;
    }

    this._loading.set(true);
    try {
      const [moods, sessions] = await Promise.all([
        this.fsMood.fetchAll(user.id),
        this.fsFocus.fetchAll(user.id),
      ]);
      const tasks = this.tasksSvc.tasks();
      this._summary.set(this.compute(tasks, moods, sessions));
      this._lastRefreshAt.set(Date.now());
    } finally {
      this._loading.set(false);
    }
  }

  // ------------- aggregation logic -------------

  private compute(
    tasks: Task[],
    moods: MoodEntry[],
    sessions: FocusSessionRecord[],
  ): StatsSummary {
    return {
      ...this.taskStats(tasks),
      ...this.moodStats(moods),
      ...this.focusStats(sessions),
    };
  }

  private taskStats(tasks: Task[]): Pick<StatsSummary,
    'tasksTotalCompleted' | 'tasksAveragePerDay' | 'tasksThisWeek' | 'tasksActiveDays'
  > {
    const completed = tasks.filter((t) => t.done && t.completedAt);

    // Distinct days on which something got completed.
    const dayKeys = new Set(
      completed.map((t) => this.dayKey(new Date(t.completedAt!))),
    );
    const activeDays = dayKeys.size;

    const weekStart = Date.now() - 7 * 86_400_000;
    const thisWeek = completed.filter(
      (t) => new Date(t.completedAt!).getTime() >= weekStart,
    ).length;

    const avg = activeDays > 0 ? completed.length / activeDays : 0;

    return {
      tasksTotalCompleted: completed.length,
      tasksAveragePerDay: Math.round(avg * 10) / 10,
      tasksThisWeek: thisWeek,
      tasksActiveDays: activeDays,
    };
  }

  private moodStats(moods: MoodEntry[]): Pick<StatsSummary,
    'moodDaysTracked' | 'moodDistribution' | 'moodMostFrequent'
  > {
    const total = moods.length;
    const counts = new Map<MoodKey, number>();
    for (const entry of moods) {
      counts.set(entry.key, (counts.get(entry.key) ?? 0) + 1);
    }

    const distribution: MoodBucket[] = MOODS
      .map((m) => {
        const count = counts.get(m.key) ?? 0;
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        return { key: m.key, label: m.label, emoji: m.emoji, count, percent };
      })
      .sort((a, b) => b.count - a.count);

    const top = distribution[0];
    const mostFrequent =
      top && top.count > 0 ? MOODS.find((m) => m.key === top.key) ?? null : null;

    return {
      moodDaysTracked: total,
      moodDistribution: distribution,
      moodMostFrequent: mostFrequent,
    };
  }

  private focusStats(sessions: FocusSessionRecord[]): Pick<StatsSummary,
    'focusSessionCount' | 'focusBestSeconds' | 'focusTotalSeconds'
  > {
    if (sessions.length === 0) {
      return { focusSessionCount: 0, focusBestSeconds: 0, focusTotalSeconds: 0 };
    }
    let best = 0;
    let total = 0;
    for (const s of sessions) {
      if (s.durationSec > best) best = s.durationSec;
      total += s.durationSec;
    }
    return {
      focusSessionCount: sessions.length,
      focusBestSeconds: best,
      focusTotalSeconds: total,
    };
  }

  private dayKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }
}
