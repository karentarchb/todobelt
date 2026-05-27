import { Category, CategoryAccent } from '../models';

/**
 * Default categories seeded into Firestore on first sign-in.
 *
 * Ids are stable slugs (not auto-generated) so existing tasks created
 * before the categories feature shipped — which stored category as
 * 'work', 'personal', etc. — keep referencing valid documents.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work',     name: 'Trabajo',  icon: 'briefcase-outline',     accent: 'blue',   sortOrder: 10, isDefault: true },
  { id: 'personal', name: 'Personal', icon: 'sparkles-outline',      accent: 'rose',   sortOrder: 20, isDefault: true },
  { id: 'health',   name: 'Salud',    icon: 'heart-outline',         accent: 'green',  sortOrder: 30, isDefault: true },
  { id: 'study',    name: 'Estudio',  icon: 'book-outline',          accent: 'purple', sortOrder: 40, isDefault: true },
  { id: 'home',     name: 'Hogar',    icon: 'home-outline',          accent: 'yellow', sortOrder: 50, isDefault: true },
  { id: 'creative', name: 'Creativo', icon: 'color-palette-outline', accent: 'rose',   sortOrder: 60, isDefault: true },
];

/** Curated icon set for the category picker. */
export const CATEGORY_ICON_OPTIONS = [
  'briefcase-outline',
  'sparkles-outline',
  'heart-outline',
  'book-outline',
  'home-outline',
  'color-palette-outline',
  'cafe-outline',
  'musical-notes-outline',
  'airplane-outline',
  'cash-outline',
  'people-outline',
  'bicycle-outline',
  'film-outline',
  'gift-outline',
  'bulb-outline',
  'restaurant-outline',
];

export const CATEGORY_ACCENT_OPTIONS: CategoryAccent[] = [
  'rose',
  'blue',
  'green',
  'yellow',
  'purple',
];

/** Map an accent token to its concrete CSS variable. */
export const ACCENT_VAR: Record<CategoryAccent, string> = {
  rose: 'var(--tb-rose)',
  blue: 'var(--tb-blue)',
  green: 'var(--tb-green)',
  yellow: 'var(--tb-yellow)',
  purple: 'var(--tb-purple)',
};
