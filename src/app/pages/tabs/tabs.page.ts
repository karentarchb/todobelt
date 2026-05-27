import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { FeatureFlagsService } from '@core/services/feature-flags.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./tabs.page.scss'],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home">
          <ion-icon name="home-outline" aria-hidden="true"></ion-icon>
          <ion-label>Hoy</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="tasks">
          <ion-icon name="checkbox-outline" aria-hidden="true"></ion-icon>
          <ion-label>Tareas</ion-label>
        </ion-tab-button>
        @if (!featureFlags.enablePomodoroSystem()) {
          <ion-tab-button tab="focus">
            <ion-icon name="aperture-outline" aria-hidden="true"></ion-icon>
            <ion-label>Enfoque</ion-label>
          </ion-tab-button>
        }
        <ion-tab-button tab="rewards">
          <ion-icon name="gift-outline" aria-hidden="true"></ion-icon>
          <ion-label>Premios</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile">
          <ion-icon name="person-outline" aria-hidden="true"></ion-icon>
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {
  protected readonly featureFlags = inject(FeatureFlagsService);
}
