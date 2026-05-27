import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';

import { CategoriesService } from '@core/services/categories.service';
import { Category, CategoryAccent } from '@core/models';
import {
  ACCENT_VAR,
  CATEGORY_ACCENT_OPTIONS,
  CATEGORY_ICON_OPTIONS,
} from '@core/constants/category-defaults.constants';

import { PrimaryButtonComponent } from '@shared/components/primary-button/primary-button.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

type EditorMode = 'create' | 'edit';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [IonicModule, FormsModule, PrimaryButtonComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./categories.page.scss'],
  templateUrl: './categories.page.html',
})
export class CategoriesPage {
  private readonly categoriesSvc = inject(CategoriesService);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);
  private readonly alertCtrl = inject(AlertController);

  readonly categories = this.categoriesSvc.categories;
  readonly iconOptions = CATEGORY_ICON_OPTIONS;
  readonly accentOptions = CATEGORY_ACCENT_OPTIONS;

  readonly editorOpen = signal(false);
  readonly editorMode = signal<EditorMode>('create');
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);

  readonly draftName = signal('');
  readonly draftIcon = signal(CATEGORY_ICON_OPTIONS[0] ?? 'sparkles-outline');
  readonly draftAccent = signal<CategoryAccent>('rose');

  readonly canSave = computed(() => this.draftName().trim().length > 0 && !this.saving());

  accentVar(accent: CategoryAccent): string {
    return ACCENT_VAR[accent];
  }

  taskCountFor(id: string): number {
    return this.categoriesSvc.taskCount(id);
  }

  goBack(): void {
    void this.router.navigateByUrl('/tabs/tasks');
  }

  openCreate(): void {
    this.editorMode.set('create');
    this.editingId.set(null);
    this.draftName.set('');
    this.draftIcon.set(CATEGORY_ICON_OPTIONS[0] ?? 'sparkles-outline');
    this.draftAccent.set('rose');
    this.editorOpen.set(true);
  }

  openEdit(category: Category): void {
    this.editorMode.set('edit');
    this.editingId.set(category.id);
    this.draftName.set(category.name);
    this.draftIcon.set(category.icon);
    this.draftAccent.set(category.accent);
    this.editorOpen.set(true);
  }

  closeEditor(): void {
    this.editorOpen.set(false);
  }

  async save(): Promise<void> {
    if (!this.canSave()) return;
    this.saving.set(true);
    try {
      if (this.editorMode() === 'create') {
        await this.categoriesSvc.add({
          name: this.draftName(),
          icon: this.draftIcon(),
          accent: this.draftAccent(),
        });
        await this.toast('Categoría creada.');
      } else {
        const id = this.editingId();
        if (!id) return;
        await this.categoriesSvc.update(id, {
          name: this.draftName(),
          icon: this.draftIcon(),
          accent: this.draftAccent(),
        });
        await this.toast('Categoría actualizada.');
      }
      this.editorOpen.set(false);
    } catch {
      await this.toast('No pudimos guardar la categoría.');
    } finally {
      this.saving.set(false);
    }
  }

  async confirmDelete(category: Category): Promise<void> {
    if (category.isDefault) {
      await this.toast('Las categorías por defecto no se pueden eliminar.');
      return;
    }
    const count = this.taskCountFor(category.id);
    if (count > 0) {
      await this.toast(
        `Hay ${count} ${count === 1 ? 'tarea' : 'tareas'} usando esta categoría. Reasígnalas antes de borrarla.`,
      );
      return;
    }

    const alert = await this.alertCtrl.create({
      header: '¿Eliminar categoría?',
      message: `"${category.name}" se eliminará. Esta acción no se puede deshacer.`,
      cssClass: 'tb-alert',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.doDelete(category.id);
          },
        },
      ],
    });
    await alert.present();
  }

  private async doDelete(id: string): Promise<void> {
    const result = await this.categoriesSvc.remove(id);
    if (result.ok) {
      await this.toast('Categoría eliminada.');
    } else if (result.reason === 'cannot-delete-default') {
      await this.toast('Las categorías por defecto no se pueden eliminar.');
    } else if (result.reason === 'in-use') {
      await this.toast(`Hay ${result.taskCount} tareas usando esta categoría.`);
    } else {
      await this.toast('No pudimos eliminar la categoría.');
    }
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
