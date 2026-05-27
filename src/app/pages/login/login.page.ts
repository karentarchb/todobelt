import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';

import { AuthService } from '@core/services/auth.service';

type SocialProvider = 'google' | 'apple';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, FormsModule],
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
  readonly socialLoading = signal<SocialProvider | null>(null);

  readonly canSubmit = () =>
    this.isEmail(this.email()) && this.password().length >= 6 && !this.loading();

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleRemember(): void {
    this.remember.update((v) => !v);
  }

  goRegister(): void {
    void this.router.navigateByUrl('/register');
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.loading.set(true);
    try {
      await this.auth.login({ email: this.email().trim(), password: this.password() });
      await this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
    } catch (err) {
      await this.showError(this.friendlyAuthError(err));
    } finally {
      this.loading.set(false);
    }
  }

  async continueWith(provider: SocialProvider): Promise<void> {
    if (this.socialLoading()) return;
    this.socialLoading.set(provider);
    try {
      if (provider === 'google') {
        await this.auth.loginWithGoogle();
      } else {
        await this.auth.loginWithApple();
      }
      await this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
    } catch (err) {
      await this.showError(this.friendlyAuthError(err));
    } finally {
      this.socialLoading.set(null);
    }
  }

  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  private async showError(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2600,
      position: 'top',
      cssClass: 'tb-toast',
    });
    await toast.present();
  }

  /** Maps Firebase auth/* codes to friendly Spanish messages. */
  private friendlyAuthError(err: unknown): string {
    const code = (err as { code?: string } | null)?.code ?? '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/invalid-email':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Correo o contraseña incorrectos.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Inténtalo de nuevo más tarde.';
      case 'auth/network-request-failed':
        return 'Sin conexión. Verifica tu red e inténtalo otra vez.';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Cancelaste el inicio de sesión.';
      case 'auth/popup-blocked':
        return 'Tu navegador bloqueó la ventana. Habilítala e intenta de nuevo.';
      case 'auth/account-exists-with-different-credential':
        return 'Ya existe una cuenta con ese correo en otro proveedor.';
      default:
        return 'No pudimos iniciar sesión. Inténtalo de nuevo.';
    }
  }
}
