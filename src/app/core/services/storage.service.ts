import { Injectable } from '@angular/core';

/**
 * Thin wrapper around Capacitor Preferences with a web localStorage fallback.
 * Kept async so the API is identical across web and native.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private hasCap(): boolean {
    return typeof window !== 'undefined' && !!(window as { Capacitor?: unknown }).Capacitor;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      if (this.hasCap()) {
        const { Preferences } = await import('@capacitor/preferences');
        const { value } = await Preferences.get({ key });
        return value ? (JSON.parse(value) as T) : null;
      }
    } catch {
      /* fall through */
    }
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    const json = JSON.stringify(value);
    try {
      if (this.hasCap()) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({ key, value: json });
        return;
      }
    } catch {
      /* fall through */
    }
    localStorage.setItem(key, json);
  }

  async remove(key: string): Promise<void> {
    try {
      if (this.hasCap()) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.remove({ key });
        return;
      }
    } catch {
      /* fall through */
    }
    localStorage.removeItem(key);
  }
}
