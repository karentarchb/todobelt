/**
 * A persisted focus session. Only completed sessions are recorded; aborted
 * (paused-and-reset) sessions are intentionally not saved.
 */
export interface FocusSessionRecord {
  id: string;
  /** Total session length in seconds. */
  durationSec: number;
  /** ISO timestamp when the user pressed Start the first time. */
  startedAt: string;
  /** ISO timestamp when the timer reached zero. */
  completedAt: string;
}
