import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';

import { AuthService } from '@core/services/auth.service';
import { WalletService } from '@core/services/wallet.service';
import { TasksService } from '@core/services/tasks.service';
import { MoodService } from '@core/services/mood.service';
import { ProfileService } from '@core/services/profile.service';

import { BellLogoComponent } from '@shared/components/bell-logo/bell-logo.component';
import { PrimaryButtonComponent } from '@shared/components/primary-button/primary-button.component';
import { initials } from '@core/helpers/format.helper';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonicModule, FormsModule, BellLogoComponent, PrimaryButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./profile.page.scss'],
  templateUrl: './profile.page.html',
})
export class ProfilePage {
  private readonly auth = inject(AuthService);
  private readonly wallet = inject(WalletService);
  private readonly tasksSvc = inject(TasksService);
  private readonly moodSvc = inject(MoodService);
  private readonly profileSvc = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);

  readonly user = this.auth.user;
  readonly profile = this.profileSvc.profile;
  readonly saving = this.profileSvc.saving;

  // Editable drafts — initialized from the Firestore profile when it loads.
  readonly editing = signal(false);
  readonly draftName = signal('');
  readonly draftBio = signal('');

  readonly stats = computed(() => ({
    balance: this.wallet.balance(),
    earned: this.wallet.state().totalEarned,
    done: this.tasksSvc.completed().length,
  }));

  readonly mood = computed(() => {
    const today = this.moodSvc.today();
    return today ? this.moodSvc.byKey(today.key) : null;
  });

  readonly displayName = computed(() => this.profile()?.displayName || this.user()?.name || 'Invitado');
  readonly bioText = computed(() => this.profile()?.bio ?? '');

  constructor() {
    // Sync drafts whenever the profile signal lands (or changes externally),
    // but only when we aren't already mid-edit (to avoid stomping the user's
    // unsaved changes if a realtime update arrives).
    effect(() => {
      const p = this.profile();
      if (!p) return;
      if (this.editing()) return;
      this.draftName.set(p.displayName);
      this.draftBio.set(p.bio ?? '');
    });
  }

  initialsFor(name?: string): string {
    return name ? initials(name) : '··';
  }

  startEdit(): void {
    const p = this.profile();
    if (p) {
      this.draftName.set(p.displayName);
      this.draftBio.set(p.bio ?? '');
    }
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  async saveEdit(): Promise<void> {
    const name = this.draftName().trim();
    if (!name) {
      await this.toast('El nombre no puede estar vacío.');
      return;
    }
    try {
      await this.profileSvc.update({
        displayName: name,
        bio: this.draftBio().trim(),
      });
      this.editing.set(false);
      await this.toast('Perfil actualizado.');
    } catch {
      await this.toast('No pudimos guardar los cambios. Inténtalo de nuevo.');
    }
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private async toast(message: string): Promise<void> {
    const t = await this.toastCtrl.create({
      message,
      duration: 1800,
      position: 'top',
      cssClass: 'tb-toast',
    });
    await t.present();
  }
}
