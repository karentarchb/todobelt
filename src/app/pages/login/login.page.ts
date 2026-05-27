import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';

import { PrimaryButtonComponent } from '@shared/components/primary-button/primary-button.component';
import { AuthService } from '@core/services/auth.service';

type SocialProvider = 'google' | 'apple' | 'facebook';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, FormsModule, PrimaryButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./login.page.scss'],
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);

  readonly email = signal('');
  readonly password = signal('');
  readonly showPassword = signal(false);
  readonly remember = signal(true);
  readonly loading = signal(false);

  readonly canSubmit = () =>
    this.isEmail(this.email()) && this.password().length >= 4 && !this.loading();

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleRemember(): void {
    this.remember.update((v) => !v);
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.loading.set(true);
    try {
      await this.auth.login({ email: this.email().trim(), password: this.password() });
      await this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
    } catch {
      const toast = await this.toastCtrl.create({
        message: 'No pudimos iniciar sesión. Inténtalo de nuevo.',
        duration: 2400,
        position: 'top',
        cssClass: 'tb-toast',
      });
      await toast.present();
    } finally {
      this.loading.set(false);
    }
  }

  async continueWith(provider: SocialProvider): Promise<void> {
    const labels: Record<SocialProvider, string> = {
      google: 'Google',
      apple: 'Apple',
      facebook: 'Facebook',
    };
    const toast = await this.toastCtrl.create({
      message: `Login con ${labels[provider]} estará disponible pronto.`,
      duration: 1800,
      position: 'top',
      cssClass: 'tb-toast',
    });
    await toast.present();
  }

  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }
}
