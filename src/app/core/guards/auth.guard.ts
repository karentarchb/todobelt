import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { OnboardingService } from '../services/onboarding.service';

/** Requires a logged-in user, otherwise routes to login (or onboarding if pending). */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const onboarding = inject(OnboardingService);
  const router = inject(Router);

  await Promise.all([auth.hydrate(), onboarding.hydrate()]);

  if (!onboarding.done()) return router.parseUrl('/onboarding');
  if (!auth.isAuthenticated()) return router.parseUrl('/login');
  return true;
};

/** Public-only routes (login). Already-authenticated users get bounced to /tabs/home. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.hydrate();
  if (auth.isAuthenticated()) return router.parseUrl('/tabs/home');
  return true;
};
