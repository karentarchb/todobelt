import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  getFirestore,
  increment,
  onSnapshot,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { FirebaseService } from './firebase.service';
import { Reward } from '../models';

type RewardsWatchCallback = (rewards: Reward[]) => void;

/**
 * Firestore I/O for the user's rewards catalog.
 * Path: users/{uid}/rewards/{rewardId}
 *
 * The catalog is per-user (rather than shared) so each user can curate
 * their own list of personal rewards in the future. On first sign-in we
 * seed the catalog with sensible defaults via ensureSeeded().
 */
@Injectable({ providedIn: 'root' })
export class FirestoreRewardsService {
  private readonly firebase = inject(FirebaseService);
  private readonly firestore: Firestore = getFirestore(this.firebase.app);

  private rewardsCollection(uid: string) {
    return collection(this.firestore, 'users', uid, 'rewards');
  }

  /** Write the default catalog if the user has none. */
  async ensureSeeded(uid: string, seed: Omit<Reward, 'id'>[]): Promise<void> {
    const snap = await getDocs(this.rewardsCollection(uid));
    if (!snap.empty) return;

    const batch = writeBatch(this.firestore);
    for (const reward of seed) {
      const ref = doc(this.rewardsCollection(uid));
      batch.set(ref, reward);
    }
    await batch.commit();
  }

  watch(uid: string, cb: RewardsWatchCallback): () => void {
    return onSnapshot(
      this.rewardsCollection(uid),
      (snap) => {
        const rewards = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<Reward, 'id'>) }) satisfies Reward,
        );
        cb(rewards);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error('[firestore-rewards] watch error:', err);
      },
    );
  }

  async recordClaim(uid: string, rewardId: string): Promise<void> {
    await updateDoc(doc(this.rewardsCollection(uid), rewardId), {
      claimedCount: increment(1),
      lastClaimedAt: new Date().toISOString(),
    });
  }
}
