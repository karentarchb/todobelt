import { Injectable, computed, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  OAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';

import { FirebaseService } from './firebase.service';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../constants/app.constants';
import { AuthCredentials, UserProfile } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly firebase = inject(FirebaseService);
  private readonly storage = inject(StorageService);

  private readonly _user = signal<UserProfile | null>(null);
  readonly user = computed(() => this._user());
  readonly isAuthenticated = computed(() => this._user() !== null);

  /**
   * Suppresses the onAuthStateChanged-driven signal update during signUp.
   * Reason: createUserWithEmailAndPassword fires the listener BEFORE
   * updateProfile() has a chance to set displayName, which would cache
   * a profile with the email-derived fallback name and seed the Firestore
   * profile doc with the wrong displayName. With this flag we ignore the
   * intermediate listener tick and emit the signal manually after
   * updateProfile completes.
   */
  private suspendListener = false;

  constructor() {
    // Single source of truth — Firebase Auth state drives our local signal.
    onAuthStateChanged(this.firebase.auth, (firebaseUser) => {
      if (this.suspendListener) return;
      if (firebaseUser) {
        const profile = this.toProfile(firebaseUser);
        this._user.set(profile);
        void this.storage.set(STORAGE_KEYS.authUser, profile);
      } else {
        this._user.set(null);
        void this.storage.remove(STORAGE_KEYS.authUser);
      }
    });
  }

  /** Seed from local storage to avoid a flash of unauthenticated state. */
  async hydrate(): Promise<void> {
    if (this._user()) return;
    const cached = await this.storage.get<UserProfile>(STORAGE_KEYS.authUser);
    if (cached) this._user.set(cached);
  }

  async login(credentials: AuthCredentials): Promise<UserProfile> {
    const cred = await signInWithEmailAndPassword(
      this.firebase.auth,
      credentials.email.trim(),
      credentials.password,
    );
    return this.toProfile(cred.user);
  }

  async signUp(credentials: AuthCredentials, displayName?: string): Promise<UserProfile> {
    this.suspendListener = true;
    try {
      const cred = await createUserWithEmailAndPassword(
        this.firebase.auth,
        credentials.email.trim(),
        credentials.password,
      );
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      // Manually emit AFTER updateProfile completes so downstream
      // services (ProfileService.ensureExists, etc.) see the correct
      // displayName from the very first signal tick.
      const profile = this.toProfile(cred.user);
      this._user.set(profile);
      await this.storage.set(STORAGE_KEYS.authUser, profile);
      return profile;
    } finally {
      this.suspendListener = false;
    }
  }

  /**
   * Google sign-in via popup. Works on web; for packaged Capacitor builds,
   * swap to signInWithRedirect or a native Google sign-in plugin.
   */
  async loginWithGoogle(): Promise<UserProfile> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(this.firebase.auth, provider);
    return this.toProfile(cred.user);
  }

  /**
   * Apple sign-in via OAuthProvider('apple.com'). Requires Apple provider
   * enabled in Firebase console and a configured Service ID + return URL.
   */
  async loginWithApple(): Promise<UserProfile> {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    const cred = await signInWithPopup(this.firebase.auth, provider);
    return this.toProfile(cred.user);
  }

  async logout(): Promise<void> {
    await signOut(this.firebase.auth);
  }

  private toProfile(user: User): UserProfile {
    return {
      id: user.uid,
      name: user.displayName?.trim() || this.nameFromEmail(user.email ?? ''),
      email: user.email ?? '',
      avatarUrl: user.photoURL ?? undefined,
      joinedAt: user.metadata.creationTime ?? new Date().toISOString(),
    };
  }

  private nameFromEmail(email: string): string {
    const local = email.split('@')[0] ?? 'amig@';
    return local
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }
}
