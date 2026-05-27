import { Injectable, computed, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../constants/app.constants';
import { AuthCredentials, UserProfile } from '../models';
import { uid } from '../helpers/id.helper';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storage = inject(StorageService);

  private readonly _user = signal<UserProfile | null>(null);
  readonly user = computed(() => this._user());
  readonly isAuthenticated = computed(() => this._user() !== null);

  async hydrate(): Promise<void> {
    const user = await this.storage.get<UserProfile>(STORAGE_KEYS.authUser);
    this._user.set(user ?? null);
  }

  /**
   * Mock login. In a real app this would call the backend; here we accept
   * any email/password combo and create a local profile to keep the demo flow.
   */
  async login(credentials: AuthCredentials): Promise<UserProfile> {
    await this.delay(700);
    const name = this.nameFromEmail(credentials.email);
    const user: UserProfile = {
      id: uid('usr'),
      name,
      email: credentials.email,
      joinedAt: new Date().toISOString(),
    };
    this._user.set(user);
    await this.storage.set(STORAGE_KEYS.authUser, user);
    await this.storage.set(STORAGE_KEYS.authToken, uid('tok'));
    return user;
  }

  async logout(): Promise<void> {
    this._user.set(null);
    await this.storage.remove(STORAGE_KEYS.authUser);
    await this.storage.remove(STORAGE_KEYS.authToken);
  }

  private nameFromEmail(email: string): string {
    const local = email.split('@')[0] ?? 'amig@';
    return local
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
