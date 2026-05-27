import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { updateProfile } from 'firebase/auth';

import { FirebaseService } from './firebase.service';
import { FirestoreProfileService } from './firestore-profile.service';
import { AuthService } from './auth.service';
import { UserProfileDoc, UserProfileUpdate } from '../models';

/**
 * Manages the extended user profile stored in Firestore at users/{uid}.
 *
 * - Mirrors Firebase Auth's displayName / photoURL so legacy code that
 *   reads from AuthService keeps working.
 * - On first sign-in, seeds the doc with values from Firebase Auth.
 * - Updates write to both Firestore (extended fields) and Firebase Auth
 *   (displayName, photoURL) so the two stay in sync.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly auth = inject(AuthService);
  private readonly fs = inject(FirestoreProfileService);
  private readonly firebase = inject(FirebaseService);

  private readonly _profile = signal<UserProfileDoc | null>(null);
  private readonly _saving = signal(false);
  private unsubscribe: (() => void) | null = null;

  readonly profile = computed(() => this._profile());
  readonly saving = computed(() => this._saving());

  readonly displayName = computed(() => this._profile()?.displayName ?? '');
  readonly bio = computed(() => this._profile()?.bio ?? '');

  constructor() {
    effect(() => {
      const user = this.auth.user();
      this.unsubscribe?.();
      this.unsubscribe = null;

      if (!user) {
        this._profile.set(null);
        return;
      }

      const defaults: UserProfileDoc = {
        displayName: user.name,
        ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
        createdAt: user.joinedAt,
        updatedAt: new Date().toISOString(),
      };

      void this.fs.ensureExists(user.id, defaults).then(() => {
        this.unsubscribe = this.fs.watch(user.id, (profile) => {
          this._profile.set(profile);
        });
      });
    });
  }

  /**
   * Patch the profile. Writes to Firestore plus mirrors displayName /
   * avatarUrl to Firebase Auth so they stay in sync across the app.
   */
  async update(patch: UserProfileUpdate): Promise<void> {
    const user = this.auth.user();
    if (!user) return;
    this._saving.set(true);
    try {
      await this.fs.update(user.id, patch);

      const firebaseUser = this.firebase.auth.currentUser;
      if (firebaseUser && (patch.displayName !== undefined || patch.avatarUrl !== undefined)) {
        await updateProfile(firebaseUser, {
          ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
          ...(patch.avatarUrl !== undefined ? { photoURL: patch.avatarUrl } : {}),
        });
      }
    } finally {
      this._saving.set(false);
    }
  }
}
