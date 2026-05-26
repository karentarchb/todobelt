import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  getDocs,
  getFirestore,
  orderBy,
  query,
} from 'firebase/firestore';

import { FirebaseService } from './firebase.service';
import { FocusSessionRecord } from '../models';

/**
 * Firestore I/O for completed focus sessions.
 * Path: users/{uid}/focusSessions/{id}
 *
 * Designed for write-on-complete + read-on-demand: the StatsPage queries
 * the full collection when the user visits it, so no realtime listener
 * is needed here.
 */
@Injectable({ providedIn: 'root' })
export class FirestoreFocusService {
  private readonly firebase = inject(FirebaseService);
  private readonly firestore: Firestore = getFirestore(this.firebase.app);

  private sessionsCollection(uid: string) {
    return collection(this.firestore, 'users', uid, 'focusSessions');
  }

  async record(uid: string, session: Omit<FocusSessionRecord, 'id'>): Promise<string> {
    const ref = await addDoc(this.sessionsCollection(uid), session);
    return ref.id;
  }

  async fetchAll(uid: string): Promise<FocusSessionRecord[]> {
    const q = query(this.sessionsCollection(uid), orderBy('completedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<FocusSessionRecord, 'id'>) }),
    );
  }
}
