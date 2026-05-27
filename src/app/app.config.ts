import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { routes } from './app.routes';
import { IdlePreloadStrategy } from '@core/routing/idle-preload.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      IonicModule.forRoot({
        mode: 'ios',
        animated: true,
        backButtonText: '',
        rippleEffect: false,
        swipeBackEnabled: true,
      }),
    ),
    // Custom preloading: defer lazy chunks until ~2.5s after the
    // router is ready so the first paint is not competing with
    // background downloads. Routes can opt out via data.preload = false.
    provideRouter(routes, withPreloading(IdlePreloadStrategy)),
  ],
};
