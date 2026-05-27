import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { MOODS } from '../constants/app.constants';
import { Mood, MoodEntry, MoodKey } from '../models';
import { AuthService } from './auth.service';
import { FirestoreMoodService } from './firestore-mood.service';

@Injectable({ providedIn: 'root' })
export class MoodService {
  private readonly auth = inject(AuthService);
  private readonly fs = inject(FirestoreMoodService);

  readonly options: Mood[] = MOODS;

  private readonly _today = signal<MoodEntry | null>(null);
  private unsubscribe: (() => void) | null = null;

  readonly today = computed(() => this._today());

  constructor() {
    effect(() => {
      const user = this.auth.user();
      this.unsubscribe?.();
      this.unsubscribe = null;

      if (!user) {
        this._today.set(null);
        return;
      }
      this.unsubscribe = this.fs.watchToday(user.id, (entry) => {
        this._today.set(entry);
      });
    });
  }

  /** Kept as no-op for backwards compatibility with bootstrap calls. */
  async hydrate(): Promise<void> {
    return;
  }

  async setToday(key: MoodKey): Promise<void> {
    const user = this.auth.user();
    if (!user) return;

    // Optimistic local update; listener will reconcile from server.
    this._today.set({ key, at: new Date().toISOString() });
    try {
      await this.fs.setMood(user.id, key);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[mood] setToday failed:', err);
    }
  }

  byKey(key: MoodKey): Mood | undefined {
    return this.options.find((m) => m.key === key);
  }
}
