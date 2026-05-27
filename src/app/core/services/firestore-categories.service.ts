import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { FirebaseService } from './firebase.service';
import { Category, CategoryUpdate, NewCategoryInput } from '../models';
import { DEFAULT_CATEGORIES } from '../constants/category-defaults.constants';

type CategoriesWatchCallback = (categories: Category[]) => void;

/**
 * Firestore I/O for the user's category catalog.
 * Path: users/{uid}/categories/{categoryId}
 *
 * On first sign-in, the catalog is seeded with the six built-in defaults
 * ('work', 'personal', etc.) using fixed ids so that any existing tasks
 * that referenced those category slugs keep resolving.
 */
@Injectable({ providedIn: 'root' })
export class FirestoreCategoriesService {
  private readonly firebase = inject(FirebaseService);
  private readonly firestore: Firestore = getFirestore(this.firebase.app);

  private categoriesCollection(uid: string) {
    return collection(this.firestore, 'users', uid, 'categories');
  }

  async ensureSeeded(uid: string): Promise<void> {
    const snap = await getDocs(this.categoriesCollection(uid));
    if (!snap.empty) return;

    const batch = writeBatch(this.firestore);
    for (const cat of DEFAULT_CATEGORIES) {
      const { id, ...data } = cat;
      const ref = doc(this.categoriesCollection(uid), id);
      batch.set(ref, data);
    }
    await batch.commit();
  }

  watch(uid: string, cb: CategoriesWatchCallback): () => void {
    const q = query(this.categoriesCollection(uid), orderBy('sortOrder', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        const cats = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) }) satisfies Category,
        );
        cb(cats);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error('[firestore-categories] watch error:', err);
      },
    );
  }

  async add(uid: string, input: NewCategoryInput): Promise<string> {
    const data: Omit<Category, 'id'> = {
      name: input.name.trim(),
      icon: input.icon ?? 'sparkles-outline',
      accent: input.accent ?? 'rose',
      sortOrder: Date.now(),
      isDefault: false,
    };
    const ref = await addDoc(this.categoriesCollection(uid), data);
    return ref.id;
  }

  async update(uid: string, id: string, patch: CategoryUpdate): Promise<void> {
    const clean: Partial<Category> = {};
    if (patch.name !== undefined) clean.name = patch.name.trim();
    if (patch.icon !== undefined) clean.icon = patch.icon;
    if (patch.accent !== undefined) clean.accent = patch.accent;
    if (patch.sortOrder !== undefined) clean.sortOrder = patch.sortOrder;
    await updateDoc(doc(this.categoriesCollection(uid), id), clean);
  }

  async remove(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(this.categoriesCollection(uid), id));
  }
}
