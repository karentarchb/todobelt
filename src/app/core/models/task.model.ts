export type TaskPriority = 'low' | 'medium' | 'high';

/**
 * Tasks reference a category by its Firestore id. The id may be a stable
 * slug for seeded defaults ('work', 'personal', 'health', 'study', 'home',
 * 'creative') or an auto-generated id for user-created custom categories.
 */
export type TaskCategoryId = string;

/**
 * Repetition pattern for a task. When set, completing the task creates a
 * fresh task instance for the next occurrence and notifications are
 * scheduled to repeat on the OS clock (when a native build is used).
 */
export type TaskRecurrence = 'daily' | 'weekly';

export interface Task {
  id: string;
  title: string;
  notes?: string;
  category: TaskCategoryId;
  priority: TaskPriority;
  /** Coins earned when completed */
  reward: number;
  /** ISO date string */
  dueAt?: string;
  /** ISO timestamp */
  createdAt: string;
  /** ISO timestamp when marked done */
  completedAt?: string;
  done: boolean;
  /** When set, the task repeats on this cadence. */
  recurrence?: TaskRecurrence;
  /**
   * Days of the week the task should repeat on, when recurrence is 'weekly'.
   * 0 = Sunday, 1 = Monday, ..., 6 = Saturday (matches Date.getDay()).
   * Common presets:
   *   - [1,2,3,4,5]   Weekdays (L-V)
   *   - [0,6]         Weekends (S-D)
   *   - [1,3,5]       Mon/Wed/Fri
   * Ignored when recurrence is 'daily' or absent.
   */
  recurrenceDays?: number[];
}

export interface NewTaskInput {
  title: string;
  notes?: string;
  category?: TaskCategoryId;
  priority?: TaskPriority;
  dueAt?: string;
  reward?: number;
  recurrence?: TaskRecurrence;
  recurrenceDays?: number[];
}

/**
 * Pre-loaded task suggestion the user can tap to add a real task quickly.
 * Templates never appear in the user's task list — only on the picker UI.
 */
export interface TaskTemplate {
  id: string;
  title: string;
  category: TaskCategoryId;
  priority: TaskPriority;
  /** Time of day (HH:mm) used to compute today's dueAt at insertion. */
  defaultTime?: string;
  /** Ionicon name override (otherwise the category icon is used). */
  icon?: string;
  /** Optional one-line context shown under the title. */
  hint?: string;
  /** Default recurrence to apply when this template is used. */
  recurrence?: TaskRecurrence;
  /** Default weekday selection for weekly templates. */
  recurrenceDays?: number[];
}
