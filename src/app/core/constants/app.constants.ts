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

/** Default reward (coins) earned per task priority */
export const TASK_REWARD: Record<'low' | 'medium' | 'high', number> = {
  low: 3,
  medium: 6,
  high: 10,
};

/** Categories meta */
export const CATEGORY_META: Record<
  'work' | 'personal' | 'health' | 'study' | 'home' | 'creative',
  { label: string; icon: string; accent: string }
> = {
  work:     { label: 'Trabajo',  icon: 'briefcase-outline',      accent: 'var(--tb-blue)' },
  personal: { label: 'Personal', icon: 'sparkles-outline',       accent: 'var(--tb-rose)' },
  health:   { label: 'Salud',    icon: 'heart-outline',          accent: 'var(--tb-green)' },
  study:    { label: 'Estudio',  icon: 'book-outline',           accent: 'var(--tb-purple)' },
  home:     { label: 'Hogar',    icon: 'home-outline',           accent: 'var(--tb-yellow)' },
  creative: { label: 'Creativo', icon: 'color-palette-outline',  accent: 'var(--tb-rose-soft)' },
};

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
