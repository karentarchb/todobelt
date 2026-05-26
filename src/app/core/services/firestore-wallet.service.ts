import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  arrayUnion,
  doc,
  getDoc,
  getFirestore,
  increment,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { FirebaseService } from './firebase.service';
import { WalletState, WalletTx } from '../models';

const INITIAL: WalletState = {
  balance: 0,
  totalEarned: 0,
  totalSpent: 0,
  history: [],
};

type WalletWatchCallback = (state: WalletState) => void;

/**
 * Firestore I/O for the user's wallet singleton doc.
 * Path: users/{uid}/wallet/state
 *
 * Uses field-level operators (increment, arrayUnion) so concurrent earn/spend
 * calls from multiple devices don't clobber each other.
 */
@Injectable({ providedIn: 'root' })
export class FirestoreWalletService {
  private readonly firebase = inject(FirebaseService);
  private readonly firestore: Firestore = getFirestore(this.firebase.app);

  private stateDoc(uid: string) {
    return doc(this.firestore, 'users', uid, 'wallet', 'state');
  }

  /** Create the wallet doc with INITIAL values if it doesn't already exist. */
  async ensureExists(uid: string): Promise<void> {
    const snap = await getDoc(this.stateDoc(uid));
    if (!snap.exists()) {
      await setDoc(this.stateDoc(uid), INITIAL);
    }
  }

  watch(uid: string, cb: WalletWatchCallback): () => void {
    return onSnapshot(
      this.stateDoc(uid),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as WalletState;
        cb({
          balance: data.balance ?? 0,
          totalEarned: data.totalEarned ?? 0,
          totalSpent: data.totalSpent ?? 0,
          history: data.history ?? [],
        });
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error('[firestore-wallet] watch error:', err);
      },
    );
  }

  async earn(uid: string, amount: number, tx: WalletTx): Promise<void> {
    await updateDoc(this.stateDoc(uid), {
      balance: increment(amount),
      totalEarned: increment(amount),
      history: arrayUnion(tx),
    });
  }

  async spend(uid: string, amount: number, tx: WalletTx): Promise<void> {
    await updateDoc(this.stateDoc(uid), {
      balance: increment(-amount),
      totalSpent: increment(amount),
      history: arrayUnion(tx),
    });
  }
}
