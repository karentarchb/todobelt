import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/**
 * Custom preloading strategy that holds back lazy-loaded chunks for a
 * short window after the app boots, then preloads them in the background.
 *
 * Why this exists:
 * - The default `PreloadAllModules` starts pulling EVERY lazy chunk as
 *   soon as the router is ready. On a cold load that competes for
 *   bandwidth with the initial render and slows down "time to
 *   interactive" — the user is waiting for the home page to paint while
 *   the network is busy fetching the Categories page they may never visit.
 * - `NoPreloading` is the opposite extreme: navigating between tabs has
 *   to wait for the chunk every single time.
 *
 * This strategy strikes the balance: priority to the first paint, then
 * preload everything quietly once the user has had time to settle.
 *
 * Routes can opt out by setting `data: { preload: false }`.
 */
@Injectable({ providedIn: 'root' })
export class IdlePreloadStrategy implements PreloadingStrategy {
  /** Delay before background preloading kicks in. */
  private static readonly DELAY_MS = 2_500;

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload'] === false) {
      return EMPTY;
    }
    return timer(IdlePreloadStrategy.DELAY_MS).pipe(mergeMap(() => load()));
  }
}
