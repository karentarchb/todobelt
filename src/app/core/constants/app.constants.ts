export const APP_NAME = 'TODO BELT';
export const APP_TAGLINE = 'Productividad amable.';

export const COIN_LABEL = 'monedas';
export const COIN_SYMBOL = '✦'; // Used as a non-childish coin glyph in UI

/** Storage keys (Capacitor Preferences) */
export const STORAGE_KEYS = {
  onboardingDone: 'tb.onboarding.done',
  authToken: 'tb.auth.token',
  authUser: 'tb.auth.user',
  walletState: 'tb.wallet.state',
  moodToday: 'tb.mood.today',
} as const;

/**
 * Coin reward earned per completed task by priority.
 * Intentionally low — the design philosophy is that coins should be earned
 * over real time, not farmed by spamming low-priority tasks.
 */
export const TASK_REWARD: Record<'low' | 'medium' | 'high', number> = {
  low: 2,
  medium: 4,
  high: 7,
};

/**
 * Minimum minutes that must elapse between task creation and completion
 * for any reward to be granted. Prevents instant "create and complete"
 * cheesing — to earn coins you actually need to wait and do the task.
 */
export const MIN_ELAPSED_MINUTES: Record<'low' | 'medium' | 'high', number> = {
  low: 10,
  medium: 20,
  high: 30,
};

/**
 * If a task has a dueAt, completing within +/- this many minutes of it
 * grants a small precision bonus (+1 coin). Encourages doing tasks on time.
 */
export const DUE_BONUS_MINUTES = 15;

/**
 * Hard cap on coins earned per calendar day. Once reached, further
 * completions still mark tasks done but stop awarding coins until tomorrow.
 */
export const DAILY_COIN_CAP = 25;

export const MOODS: Array<{
  key: 'great' | 'good' | 'meh' | 'low' | 'tired';
  label: string;
  emoji: string;
  accent: 'green' | 'blue' | 'yellow' | 'purple' | 'rose';
}> = [
  { key: 'great', label: 'Genial', emoji: '🌟', accent: 'green' },
  { key: 'good', label: 'Bien', emoji: '🙂', accent: 'blue' },
  { key: 'meh', label: 'Neutral', emoji: '😐', accent: 'yellow' },
  { key: 'low', label: 'Bajo', emoji: '🌧️', accent: 'purple' },
  { key: 'tired', label: 'Cansada', emoji: '🥱', accent: 'rose' },
];

export const FOCUS_PRESETS = [
  { label: 'Sprint', minutes: 15 },
  { label: 'Pomodoro', minutes: 25 },
  { label: 'Deep', minutes: 50 },
  { label: 'Flow', minutes: 90 },
];
