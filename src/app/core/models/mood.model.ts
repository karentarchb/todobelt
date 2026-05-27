export type MoodKey = 'great' | 'good' | 'meh' | 'low' | 'tired';

export interface Mood {
  key: MoodKey;
  label: string;
  emoji: string;
  /** Color token used for highlight */
  accent: 'green' | 'blue' | 'yellow' | 'purple' | 'rose';
}

export interface MoodEntry {
  key: MoodKey;
  /** ISO timestamp */
  at: string;
}
