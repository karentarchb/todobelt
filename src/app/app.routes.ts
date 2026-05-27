import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/guards/auth.guard';
import { onboardingPendingGuard } from '@core/guards/onboarding.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'onboarding',
  },
  {
    path: 'onboarding',
    canActivate: [onboardingPendingGuard],
    loadComponent: () =>
      import('@pages/onboarding/onboarding.page').then((m) => m.OnboardingPage),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('@pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('@pages/tasks/tasks.page').then((m) => m.TasksPage),
      },
      {
        path: 'focus',
        loadComponent: () =>
          import('@pages/focus/focus.page').then((m) => m.FocusPage),
      },
      {
        path: 'rewards',
        loadComponent: () =>
          import('@pages/rewards/rewards.page').then((m) => m.RewardsPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('@pages/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        // Reachable from Home — intentionally not added to the tab bar so
        // the bottom menu stays focused on the five primary destinations.
        // Opt out of preloading: most users will never open Stats in
        // their first session.
        path: 'stats',
        data: { preload: false },
        loadComponent: () =>
          import('@pages/stats/stats.page').then((m) => m.StatsPage),
      },
      {
        // Reachable from TasksPage; also kept out of the tab bar.
        // Opt out of preloading for the same reason as Stats.
        path: 'categories',
        data: { preload: false },
        loadComponent: () =>
          import('@pages/categories/categories.page').then((m) => m.CategoriesPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },
  { path: '**', redirectTo: 'onboarding' },
];
