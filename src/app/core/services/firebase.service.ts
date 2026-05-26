import { Injectable } from '@angular/core';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { Analytics, getAnalytics, isSupported } from 'firebase/analytics';

import { environment } from '@env/environment';

/**
 * Centralized Firebase initialization. Created once at app bootstrap
 * (via Angular DI's providedIn: 'root' singleton) and shared across services.
 *
 * Analytics is initialized lazily because `getAnalytics()` requires a browser
 * environment that supports it (skipped on SSR / unsupported clients).
 */
@Injectable({ providedIn: 'root' })
export class FirebaseService {
  readonly app: FirebaseApp;
  readonly auth: Auth;
  analytics?: Analytics;

  constructor() {
    this.app = getApps().length
      ? getApps()[0]!
      : initializeApp(environment.firebase);

    this.auth = getAuth(this.app);

    void setPersistence(this.auth, browserLocalPersistence).catch(() => {
      /* persistence may already be set or unsupported; safe to ignore */
    });

    void isSupported()
      .then((supported) => {
        if (supported) this.analytics = getAnalytics(this.app);
      })
      .catch(() => {
        /* analytics unsupported in this environment */
      });
  }
}
