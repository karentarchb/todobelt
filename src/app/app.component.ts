import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  airplaneOutline,
  apertureOutline,
  arrowForward,
  arrowUndoOutline,
  barbellOutline,
  bicycleOutline,
  bookOutline,
  briefcaseOutline,
  bulbOutline,
  cafeOutline,
  cashOutline,
  checkboxOutline,
  checkmark,
  checkmarkDoneOutline,
  checkmarkOutline,
  chevronBack,
  chevronForward,
  closeOutline,
  colorPaletteOutline,
  createOutline,
  eyeOffOutline,
  eyeOutline,
  filmOutline,
  fitnessOutline,
  giftOutline,
  heartOutline,
  homeOutline,
  iceCreamOutline,
  informationCircleOutline,
  leafOutline,
  lockClosedOutline,
  logoApple,
  logoFacebook,
  logoGoogle,
  mailOutline,
  musicalNotesOutline,
  notificationsOutline,
  peopleOutline,
  personOutline,
  pricetagOutline,
  pricetagsOutline,
  repeatOutline,
  restaurantOutline,
  schoolOutline,
  settingsOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  statsChartOutline,
  trashOutline,
  tvOutline,
  walkOutline,
  waterOutline,
} from 'ionicons/icons';

import { OnboardingService } from '@core/services/onboarding.service';
import { AuthService } from '@core/services/auth.service';
import { WalletService } from '@core/services/wallet.service';
import { MoodService } from '@core/services/mood.service';
import { FeatureFlagsService } from '@core/services/feature-flags.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonicModule],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
})
export class AppComponent implements OnInit {
  private readonly onboarding = inject(OnboardingService);
  private readonly auth = inject(AuthService);
  private readonly wallet = inject(WalletService);
  private readonly mood = inject(MoodService);
  private readonly featureFlags = inject(FeatureFlagsService);

  constructor() {
    addIcons({
      addOutline,
      airplaneOutline,
      apertureOutline,
      arrowForward,
      arrowUndoOutline,
      barbellOutline,
      bicycleOutline,
      bookOutline,
      briefcaseOutline,
      bulbOutline,
      cafeOutline,
      cashOutline,
      checkboxOutline,
      checkmark,
      checkmarkDoneOutline,
      checkmarkOutline,
      chevronBack,
      chevronForward,
      closeOutline,
      colorPaletteOutline,
      createOutline,
      eyeOffOutline,
      eyeOutline,
      filmOutline,
      fitnessOutline,
      giftOutline,
      heartOutline,
      homeOutline,
      iceCreamOutline,
      informationCircleOutline,
      leafOutline,
      lockClosedOutline,
      logoApple,
      logoFacebook,
      logoGoogle,
      mailOutline,
      musicalNotesOutline,
      notificationsOutline,
      peopleOutline,
      personOutline,
      pricetagOutline,
      pricetagsOutline,
      repeatOutline,
      restaurantOutline,
      schoolOutline,
      settingsOutline,
      shieldCheckmarkOutline,
      sparklesOutline,
      statsChartOutline,
      trashOutline,
      tvOutline,
      walkOutline,
      waterOutline,
      'arrow-forward': arrowForward,
      'chevron-back': chevronBack,
      'stats-chart-outline': statsChartOutline,
      add: addOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.onboarding.hydrate(),
      this.auth.hydrate(),
      this.wallet.hydrate(),
      this.mood.hydrate(),
      this.featureFlags.hydrate(),
    ]);
  }
}
