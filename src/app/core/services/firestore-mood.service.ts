import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';

import { FirebaseService } from './firebase.service';
import { MoodEntry, MoodKey } from '../models';

type MoodWatchCallback = (entry: MoodEntry | null) => void;

/**
 * Firestore I/O for mood entries.
 * Path: users/{uid}/moods/{YYYY-MM-DD}
 *
 * One doc per day, keyed by local date string. This naturally enforces
 * "one mood per day" and makes history queries trivial.
 */
@Injectable({ providedIn: 'root' })
export class FirestoreMoodService {
  private readonly firebase = inject(FirebaseService);
  private readonly firestore: Firestore = getFirestore(this.firebase.app);

  private moodsCollection(uid: string) {
    return collection(this.firestore, 'users', uid, 'moods');
  }

  private moodDoc(uid: string, dateKey: string) {
    return doc(this.firestore, 'users', uid, 'moods', dateKey);
  }

  /** YYYY-MM-DD in local time. */
  static todayKey(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  watchToday(uid: string, cb: MoodWatchCallback): () => void {
    const key = FirestoreMoodService.todayKey();
    return onSnapshot(
      this.moodDoc(uid, key),
      (snap) => cb(snap.exists() ? (snap.data() as MoodEntry) : null),
      (err) => {
        // eslint-disable-next-line no-console
        console.error('[firestore-mood] watch error:', err);
      },
    );
  }

  async setMood(uid: string, key: MoodKey): Promise<void> {
    const entry: MoodEntry = { key, at: new Date().toISOString() };
    await setDoc(this.moodDoc(uid, FirestoreMoodService.todayKey()), entry);
  }

  async getToday(uid: string): Promise<MoodEntry | null> {
    const snap = await getDoc(this.moodDoc(uid, FirestoreMoodService.todayKey()));
    return snap.exists() ? (snap.data() as MoodEntry) : null;
  }

  /** Fetches the user's full mood history sorted newest-first. */
  async fetchAll(uid: string): Promise<MoodEntry[]> {
    const q = query(this.moodsCollection(uid), orderBy('at', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as MoodEntry);
  }
}
