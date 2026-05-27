import { Injectable, computed, inject, signal } from '@angular/core';
import {
  RemoteConfig,
  fetchAndActivate,
  getRemoteConfig,
  getValue,
} from 'firebase/remote-config';

import { FirebaseService } from './firebase.service';
import { environment } from '@env/environment';

/**
 * Remote Config parameter keys. The strings must match exactly what is
 * configured in the Firebase Console under Remote Config.
 */
const FLAG_KEYS = {
  enablePomodoroSystem: 'enable_pomodoro_system',
} as const;

/**
 * Compile-time defaults. Used until Remote Config fetches the live values,
 * and as a fallback when Remote Config is unreachable or not yet enabled
 * in the Firebase project.
 *
 * NOTE on `enable_pomodoro_system`:
 * Despite the positive-sounding name, this flag is a kill switch:
 *   - false (default) → the Enfoque (pomodoro) section is VISIBLE
 *   - true            → the Enfoque (pomodoro) section is HIDDEN
 * This was an explicit product decision and the code below mirrors it
 * literally (`!enablePomodoroSystem()` means "show pomodoro").
 */
const DEFAULTS: Record<string, boolean> = {
  [FLAG_KEYS.enablePomodoroSystem]: false,
};

@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private readonly firebase = inject(FirebaseService);

  private remoteConfig?: RemoteConfig;
  private readonly _enablePomodoroSystem = signal<boolean>(
    DEFAULTS[FLAG_KEYS.enablePomodoroSystem],
  );

  /**
   * When true the Enfoque tab and its content are removed from the UI.
   * Reads from Remote Config; falls back to false if RC is unavailable.
   */
  readonly enablePomodoroSystem = computed(() => this._enablePomodoroSystem());

  /** Should be called once at app boot. Safe to call again to refresh. */
  async hydrate(): Promise<void> {
    try {
      this.remoteConfig = getRemoteConfig(this.firebase.app);

      // Fall-back values used while the network request is in flight and
      // when Remote Config is disabled in the project.
      this.remoteConfig.defaultConfig = DEFAULTS;

      // In dev we want flag changes to be visible immediately. In prod we
      // throttle to one fetch per hour to stay well within the free tier.
      this.remoteConfig.settings.minimumFetchIntervalMillis = environment.production
        ? 60 * 60 * 1000
        : 0;

      await fetchAndActivate(this.remoteConfig);

      this._enablePomodoroSystem.set(
        getValue(this.remoteConfig, FLAG_KEYS.enablePomodoroSystem).asBoolean(),
      );
    } catch (err) {
      // Remote Config might be disabled in the Firebase project, or the
      // device is offline. In either case we keep the defaults — the app
      // continues to work, just without remote overrides.
      // eslint-disable-next-line no-console
      console.warn('[feature-flags] using defaults:', err);
    }
  }
}
