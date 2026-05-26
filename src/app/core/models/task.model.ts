export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskCategory =
  | 'work'
  | 'personal'
  | 'health'
  | 'study'
  | 'home'
  | 'creative';

export interface Task {
  id: string;
  title: string;
  notes?: string;
  category: TaskCategory;
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
}

export interface NewTaskInput {
  title: string;
  notes?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  dueAt?: string;
  reward?: number;
}
