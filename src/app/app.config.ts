import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { routes } from './app.routes';

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
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
};
