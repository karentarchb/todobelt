import { ToastController } from '@ionic/angular';
import { ToggleResult } from '../services/tasks.service';
import { DAILY_COIN_CAP } from '../constants/app.constants';

/**
 * Surfaces a short, calm toast describing the outcome of completing a task.
 * Returns silently when there is nothing to say (e.g., the user just
 * un-checked a task — that path doesn't deserve a notification).
 */
export async function flashToggle(
  toastCtrl: ToastController,
  result: ToggleResult,
): Promise<void> {
  const copy = describe(result);
  if (!copy) return;

  const toast = await toastCtrl.create({
    message: copy,
    duration: 2400,
    position: 'top',
    cssClass: 'tb-toast',
  });
  await toast.present();
}

function describe(result: ToggleResult): string | null {
  switch (result.reason) {
    case 'ok':
      return result.earned > 0 ? `+${result.earned} monedas. Bien hecho.` : null;
    case 'partial':
      return `+${result.earned} monedas — tope diario casi alcanzado.`;
    case 'too-fast':
      return `La marcaste muy rápido. Vuelve en ${result.waitMinutes} min para ganar monedas.`;
    case 'late':
      return 'Tarea fuera de tiempo — sin monedas esta vez.';
    case 'capped':
      return `Alcanzaste el tope de ${DAILY_COIN_CAP} monedas hoy. Vuelve mañana.`;
    case 'undo':
      return null;
  }
}
