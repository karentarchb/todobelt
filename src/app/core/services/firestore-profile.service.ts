import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { FirebaseService } from './firebase.service';
import { UserProfileDoc, UserProfileUpdate } from '../models';

type ProfileWatchCallback = (profile: UserProfileDoc | null) => void;

/**
 * Firestore I/O for the extended user profile.
 * Path: users/{uid} (root doc — task/wallet/rewards are subcollections).
 */
@Injectable({ providedIn: 'root' })
export class FirestoreProfileService {
  private readonly firebase = inject(FirebaseService);
  private readonly firestore: Firestore = getFirestore(this.firebase.app);

  private profileDoc(uid: string) {
    return doc(this.firestore, 'users', uid);
  }

  /**
   * Create the profile doc with defaults if it doesn't already exist.
   * Returns the doc that ended up persisted.
   */
  async ensureExists(uid: string, defaults: UserProfileDoc): Promise<UserProfileDoc> {
    const ref = this.profileDoc(uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as UserProfileDoc;
    await setDoc(ref, defaults);
    return defaults;
  }

  watch(uid: string, cb: ProfileWatchCallback): () => void {
    return onSnapshot(
      this.profileDoc(uid),
      (snap) => cb(snap.exists() ? (snap.data() as UserProfileDoc) : null),
      (err) => {
        // eslint-disable-next-line no-console
        console.error('[firestore-profile] watch error:', err);
      },
    );
  }

  async update(uid: string, patch: UserProfileUpdate): Promise<void> {
    // Drop undefined fields so Firestore doesn't reject them, and stamp
    // updatedAt on every write.
    const clean: Record<string, string> = { updatedAt: new Date().toISOString() };
    if (patch.displayName !== undefined) clean['displayName'] = patch.displayName;
    if (patch.avatarUrl !== undefined) clean['avatarUrl'] = patch.avatarUrl;
    if (patch.bio !== undefined) clean['bio'] = patch.bio;
    await updateDoc(this.profileDoc(uid), clean);
  }
}
