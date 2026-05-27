import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OnboardingService } from '../services/onboarding.service';

/** Redirects to /onboarding the first time the user opens the app. */
export const onboardingGuard: CanActivateFn = async () => {
  const onboarding = inject(OnboardingService);
  const router = inject(Router);

  if (!onboarding.done()) {
    await onboarding.hydrate();
  }

  if (onboarding.done()) return true;
  return router.parseUrl('/onboarding');
};

/** Used on the onboarding route to bounce already-onboarded users away. */
export const onboardingPendingGuard: CanActivateFn = async () => {
  const onboarding = inject(OnboardingService);
  const router = inject(Router);
  await onboarding.hydrate();
  if (onboarding.done()) return router.parseUrl('/login');
  return true;
};
