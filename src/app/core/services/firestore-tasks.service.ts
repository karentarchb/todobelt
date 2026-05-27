import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';

import { FirebaseService } from './firebase.service';
import { Task } from '../models';

type TaskWatchCallback = (tasks: Task[]) => void;

/**
 * Firestore I/O for a single user's tasks collection.
 * Path: users/{uid}/tasks/{taskId}
 *
 * Keeps Firestore SDK details out of TasksService so that the latter stays
 * focused on business rules (reward calculation, anti-cheat).
 */
@Injectable({ providedIn: 'root' })
export class FirestoreTasksService {
  private readonly firebase = inject(FirebaseService);
  private readonly firestore: Firestore = getFirestore(this.firebase.app);

  private tasksCollection(uid: string) {
    return collection(this.firestore, 'users', uid, 'tasks');
  }

  /**
   * Realtime listener. Returns the unsubscribe function — callers MUST
   * invoke it when the user changes or the consumer is destroyed.
   */
  watch(uid: string, cb: TaskWatchCallback): () => void {
    const q = query(this.tasksCollection(uid), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const tasks = snapshot.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<Task, 'id'>) }) satisfies Task,
        );
        cb(tasks);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error('[firestore-tasks] watch error:', err);
      },
    );
  }

  async add(uid: string, task: Omit<Task, 'id'>): Promise<string> {
    const ref = await addDoc(this.tasksCollection(uid), task);
    return ref.id;
  }

  async update(uid: string, id: string, patch: Partial<Task>): Promise<void> {
    await updateDoc(doc(this.tasksCollection(uid), id), patch);
  }

  async remove(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(this.tasksCollection(uid), id));
  }
}
