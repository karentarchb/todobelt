import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';

import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [IonicModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./register.page.scss'],
  templateUrl: './register.page.html',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);

  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly acceptedTerms = signal(false);

  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);
  readonly legalOpen = signal(false);
  readonly loading = signal(false);

  /** True only when both fields have something AND they match. */
  readonly passwordsMatch = computed(() => {
    const p = this.password();
    const c = this.confirmPassword();
    return p.length > 0 && p === c;
  });

  readonly canSubmit = computed(
    () =>
      this.firstName().trim().length > 0 &&
      this.lastName().trim().length > 0 &&
      this.isEmail(this.email()) &&
      this.password().length >= 6 &&
      this.passwordsMatch() &&
      this.acceptedTerms() &&
      !this.loading(),
  );

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirm(): void {
    this.showConfirm.update((v) => !v);
  }

  toggleTerms(): void {
    this.acceptedTerms.update((v) => !v);
  }

  toggleLegal(): void {
    this.legalOpen.update((v) => !v);
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    if (!this.passwordsMatch()) {
      await this.showError('Las contraseñas no coinciden.');
      return;
    }
    if (!this.acceptedTerms()) {
      await this.showError('Acepta los términos para continuar.');
      return;
    }

    this.loading.set(true);
    try {
      const displayName = `${this.firstName().trim()} ${this.lastName().trim()}`
        .replace(/\s+/g, ' ')
        .trim();
      await this.auth.signUp(
        { email: this.email().trim(), password: this.password() },
        displayName,
      );
      await this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
    } catch (err) {
      await this.showError(this.friendlyError(err));
    } finally {
      this.loading.set(false);
    }
  }

  goLogin(): void {
    void this.router.navigateByUrl('/login');
  }

  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  private async showError(message: string): Promise<void> {
    const t = await this.toastCtrl.create({
      message,
      duration: 2400,
      position: 'top',
      cssClass: 'tb-toast',
    });
    await t.present();
  }

  private friendlyError(err: unknown): string {
    const code = (err as { code?: string } | null)?.code ?? '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta con ese correo. Inicia sesión.';
      case 'auth/invalid-email':
        return 'El correo no tiene un formato válido.';
      case 'auth/weak-password':
        return 'La contraseña es muy débil. Usa al menos 6 caracteres.';
      case 'auth/network-request-failed':
        return 'Sin conexión. Verifica tu red e inténtalo de nuevo.';
      case 'auth/operation-not-allowed':
        return 'El registro por correo no está habilitado en este momento.';
      default:
        return 'No pudimos crear tu cuenta. Inténtalo otra vez.';
    }
  }
}
