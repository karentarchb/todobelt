import { Injectable, computed, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../constants/app.constants';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly storage = inject(StorageService);

  private readonly _done = signal<boolean>(false);
  readonly done = computed(() => this._done());

  async hydrate(): Promise<void> {
    const flag = await this.storage.get<boolean>(STORAGE_KEYS.onboardingDone);
    this._done.set(!!flag);
  }

  async complete(): Promise<void> {
    this._done.set(true);
    await this.storage.set(STORAGE_KEYS.onboardingDone, true);
  }

  async reset(): Promise<void> {
    this._done.set(false);
    await this.storage.remove(STORAGE_KEYS.onboardingDone);
  }
}
