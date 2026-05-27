export type CategoryAccent = 'rose' | 'blue' | 'green' | 'yellow' | 'purple';

/**
 * User-managed task category.
 *
 * Stored at users/{uid}/categories/{categoryId}. The id may be a fixed
 * slug for seeded defaults (so existing tasks created before this feature
 * keep working) or an auto-generated Firestore id for custom ones.
 */
export interface Category {
  id: string;
  name: string;
  /** Ionicon name (e.g. 'briefcase-outline'). */
  icon: string;
  accent: CategoryAccent;
  /** Sort order for the picker UI. Lower = earlier. */
  sortOrder: number;
  /** True for the original seeded set — used to prevent deletion. */
  isDefault: boolean;
}

export interface NewCategoryInput {
  name: string;
  icon?: string;
  accent?: CategoryAccent;
}

export interface CategoryUpdate {
  name?: string;
  icon?: string;
  accent?: CategoryAccent;
  sortOrder?: number;
}

export type CategoryDeleteReason =
  | 'not-found'
  | 'cannot-delete-default'
  | 'in-use';

export interface CategoryDeleteResult {
  ok: boolean;
  reason?: CategoryDeleteReason;
  /** When reason === 'in-use', the number of tasks blocking deletion. */
  taskCount?: number;
}
