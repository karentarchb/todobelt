import { Reward } from '../models';

/**
 * Default rewards catalog written to Firestore on first sign-in (per user).
 * After seeding the user can modify their own catalog freely; this list is
 * only consulted when the user has no rewards collection yet.
 */
export const DEFAULT_REWARDS: Omit<Reward, 'id'>[] = [
  {
    title: 'Café especial',
    description: 'Un latte de tu cafetería favorita.',
    cost: 12,
    kind: 'coffee',
    accent: 'yellow',
    claimedCount: 0,
  },
  {
    title: 'Helado',
    description: 'Una bola de tu sabor preferido.',
    cost: 18,
    kind: 'icecream',
    accent: 'rose',
    claimedCount: 0,
  },
  {
    title: '15 min de pausa',
    description: 'Cierra los ojos y respira.',
    cost: 6,
    kind: 'break',
    accent: 'green',
    claimedCount: 0,
  },
  {
    title: 'Caminata corta',
    description: 'Un paseo de 10 minutos al aire libre.',
    cost: 8,
    kind: 'walk',
    accent: 'blue',
    claimedCount: 0,
  },
  {
    title: 'Capricho dulce',
    description: 'Algo pequeño que te haga sonreír.',
    cost: 22,
    kind: 'treat',
    accent: 'purple',
    claimedCount: 0,
  },
  {
    title: '30 min pantalla',
    description: 'Una pausa para tu serie favorita.',
    cost: 14,
    kind: 'screen',
    accent: 'blue',
    claimedCount: 0,
  },
];
