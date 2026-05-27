/**
 * Day-of-week labels (matching Date.getDay(): 0=Sun..6=Sat) and small
 * utilities shared by the recurrence picker, the task card and the
 * next-occurrence calculator.
 */

export interface WeekdayInfo {
  /** Date.getDay() value: 0=Sun..6=Sat */
  index: number;
  /** Single-letter label used in compact UI (L, M, X, J, V, S, D) */
  short: string;
  /** 3-letter label used in longer UI */
  label: string;
}

/** Ordered Monday-first so the picker reads naturally. */
export const WEEKDAYS_MON_FIRST: WeekdayInfo[] = [
  { index: 1, short: 'L', label: 'Lun' },
  { index: 2, short: 'M', label: 'Mar' },
  { index: 3, short: 'X', label: 'Mié' },
  { index: 4, short: 'J', label: 'Jue' },
  { index: 5, short: 'V', label: 'Vie' },
  { index: 6, short: 'S', label: 'Sáb' },
  { index: 0, short: 'D', label: 'Dom' },
];

export const WEEKDAY_PRESETS = {
  WEEKDAYS: [1, 2, 3, 4, 5],
  WEEKENDS: [0, 6],
  EVERYDAY: [0, 1, 2, 3, 4, 5, 6],
} as const;

/**
 * Renders a compact summary of the selected days, choosing the shortest
 * representation that still communicates the pattern unambiguously.
 *
 * Examples:
 *   []                  → ''
 *   [1,2,3,4,5,6,0]     → 'Todos los días'
 *   [1,2,3,4,5]         → 'L a V'
 *   [0,6]               → 'Fines de semana'
 *   [1,3,5]             → 'L · X · V'
 */
export function formatDays(days: number[] | undefined): string {
  if (!days || days.length === 0) return '';
  const sorted = [...new Set(days)].sort((a, b) => a - b);

  if (sorted.length === 7) return 'Todos los días';

  const isWeekdays =
    sorted.length === 5 && sorted.every((d) => d >= 1 && d <= 5);
  if (isWeekdays) return 'L a V';

  const isWeekends =
    sorted.length === 2 && sorted.includes(0) && sorted.includes(6);
  if (isWeekends) return 'Fines de semana';

  return WEEKDAYS_MON_FIRST
    .filter((w) => sorted.includes(w.index))
    .map((w) => w.short)
    .join(' · ');
}

/**
 * Given a base date and a list of allowed weekdays, returns the next
 * date (strictly in the future) that falls on one of those days.
 * Used to compute the next occurrence of a weekly recurring task.
 */
export function nextDateOnDays(from: Date, days: number[]): Date {
  if (!days || days.length === 0) {
    // No constraint → assume next week same day
    const d = new Date(from);
    d.setDate(d.getDate() + 7);
    return d;
  }
  for (let offset = 1; offset <= 7; offset++) {
    const candidate = new Date(from);
    candidate.setDate(candidate.getDate() + offset);
    if (days.includes(candidate.getDay())) return candidate;
  }
  // Falls back to +7 — defensive only, the loop above always finds a hit.
  const d = new Date(from);
  d.setDate(d.getDate() + 7);
  return d;
}
