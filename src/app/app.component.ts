import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterOutlet } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  addOutline,
  apertureOutline,
  arrowForward,
  bookOutline,
  briefcaseOutline,
  cafeOutline,
  checkboxOutline,
  checkmark,
  checkmarkDoneOutline,
  chevronForward,
  colorPaletteOutline,
  eyeOffOutline,
  eyeOutline,
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
  notificationsOutline,
  personOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  tvOutline,
  walkOutline,
} from 'ionicons/icons';

import { OnboardingService } from '@core/services/onboarding.service';
import { AuthService } from '@core/services/auth.service';
import { WalletService } from '@core/services/wallet.service';
import { MoodService } from '@core/services/mood.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonicModule, RouterOutlet],
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

  constructor() {
    addIcons({
      addOutline,
      apertureOutline,
      arrowForward,
      bookOutline,
      briefcaseOutline,
      cafeOutline,
      checkboxOutline,
      checkmark,
      checkmarkDoneOutline,
      chevronForward,
      colorPaletteOutline,
      eyeOffOutline,
      eyeOutline,
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
      notificationsOutline,
      personOutline,
      shieldCheckmarkOutline,
      sparklesOutline,
      tvOutline,
      walkOutline,
      'arrow-forward': arrowForward,
      add: addOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.onboarding.hydrate(),
      this.auth.hydrate(),
      this.wallet.hydrate(),
      this.mood.hydrate(),
    ]);
  }
}
