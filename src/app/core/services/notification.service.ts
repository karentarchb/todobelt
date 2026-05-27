import { Injectable, signal } from '@angular/core';

import { Task, TaskRecurrence } from '../models';

/**
 * Wraps Capacitor's LocalNotifications plugin so task code stays free
 * of platform-specific concerns.
 *
 * Platform behavior:
 *   - Native (iOS / Android, Capacitor): notifications are scheduled at
 *     the OS level and fire even when the app is closed.
 *   - Web preview (dev server / PWA): the plugin falls back to
 *     setTimeout — notifications only fire while the tab is open.
 *
 * Permission is requested lazily the first time we try to schedule.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  /** null = not asked yet, true = granted, false = denied or unsupported. */
  private readonly _granted = signal<boolean | null>(null);
  readonly granted = this._granted.asReadonly();

  /**
   * Notification ids on the plugin are integers. Task ids are Firestore
   * doc strings, so we derive a stable 32-bit hash from each.
   */
  private notificationId(taskId: string): number {
    let hash = 0;
    for (let i = 0; i < taskId.length; i++) {
      hash = (hash * 31 + taskId.charCodeAt(i)) | 0;
    }
    // Plugin requires a positive integer.
    return Math.abs(hash) || 1;
  }

  /** Request OS / browser permission. Safe to call repeatedly. */
  async ensurePermission(): Promise<boolean> {
    if (this._granted() === true) return true;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') {
        this._granted.set(true);
        return true;
      }
      const req = await LocalNotifications.requestPermissions();
      const ok = req.display === 'granted';
      this._granted.set(ok);
      return ok;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[notifications] permission flow unavailable:', err);
      this._granted.set(false);
      return false;
    }
  }

  /**
   * Schedules a notification for a task. Only fires when:
   *   - the task has a dueAt time
   *   - the dueAt is in the future (we don't backfill past notifications)
   *   - OR the task has a daily / weekly recurrence (the plugin handles
   *     the periodic schedule).
   */
  async scheduleForTask(task: Task): Promise<void> {
    if (!task.dueAt) return;
    if (!(await this.ensurePermission())) return;

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const id = this.notificationId(task.id);
      const due = new Date(task.dueAt);

      const schedule = this.scheduleSpec(due, task.recurrence);
      if (!schedule) return;

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: 'TODO BELT',
            body: this.bodyFor(task),
            schedule,
            extra: { taskId: task.id },
          },
        ],
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[notifications] schedule failed:', err);
    }
  }

  /** Cancels any pending notification associated with this task. */
  async cancelForTask(taskId: string): Promise<void> {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({
        notifications: [{ id: this.notificationId(taskId) }],
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[notifications] cancel failed:', err);
    }
  }

  // -------- helpers --------

  private bodyFor(task: Task): string {
    if (task.recurrence === 'daily') {
      return `Es hora de: ${task.title}`;
    }
    return task.title;
  }

  private scheduleSpec(due: Date, recurrence?: TaskRecurrence) {
    const now = Date.now();

    if (recurrence === 'daily') {
      return {
        on: { hour: due.getHours(), minute: due.getMinutes() },
        allowWhileIdle: true,
      };
    }
    if (recurrence === 'weekly') {
      return {
        on: {
          weekday: due.getDay() + 1, // plugin uses 1=Sun..7=Sat
          hour: due.getHours(),
          minute: due.getMinutes(),
        },
        allowWhileIdle: true,
      };
    }
    // One-shot — only schedule if in the future.
    if (due.getTime() <= now) return null;
    return { at: due, allowWhileIdle: true };
  }
}
