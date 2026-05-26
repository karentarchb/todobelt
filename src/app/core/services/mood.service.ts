import { Injectable, computed, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { STORAGE_KEYS, MOODS } from '../constants/app.constants';
import { Mood, MoodEntry, MoodKey } from '../models';
import { isToday } from '../helpers/date.helper';

@Injectable({ providedIn: 'root' })
export class MoodService {
  private readonly storage = inject(StorageService);

  readonly options: Mood[] = MOODS;

  private readonly _today = signal<MoodEntry | null>(null);
  readonly today = computed(() => this._today());

  async hydrate(): Promise<void> {
    const saved = await this.storage.get<MoodEntry>(STORAGE_KEYS.moodToday);
    if (saved && isToday(saved.at)) {
      this._today.set(saved);
    } else {
      this._today.set(null);
    }
  }

  async setToday(key: MoodKey): Promise<void> {
    const entry: MoodEntry = { key, at: new Date().toISOString() };
    this._today.set(entry);
    await this.storage.set(STORAGE_KEYS.moodToday, entry);
  }

  byKey(key: MoodKey): Mood | undefined {
    return this.options.find((m) => m.key === key);
  }
}
