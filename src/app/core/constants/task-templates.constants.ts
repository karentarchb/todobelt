import { TaskTemplate } from '../models';

/**
 * Curated quick-pick task templates. The user taps any of these to create a
 * real task instantly with sensible defaults. Times are HH:mm in local time
 * and get applied to today's date at insertion.
 *
 * Keep this list short and high-signal — too many options defeats the
 * "quick add" purpose.
 */
export const TASK_TEMPLATES: TaskTemplate[] = [
  // ---- Hidratación: vasos de agua repartidos por el día (todos diarios) ----
  { id: 'tpl-water-09', title: 'Vaso de agua',         category: 'health',  priority: 'low',    defaultTime: '09:00', icon: 'water-outline', recurrence: 'daily' },
  { id: 'tpl-water-12', title: 'Vaso de agua',         category: 'health',  priority: 'low',    defaultTime: '12:00', icon: 'water-outline', recurrence: 'daily' },
  { id: 'tpl-water-15', title: 'Vaso de agua',         category: 'health',  priority: 'low',    defaultTime: '15:00', icon: 'water-outline', recurrence: 'daily' },
  { id: 'tpl-water-18', title: 'Vaso de agua',         category: 'health',  priority: 'low',    defaultTime: '18:00', icon: 'water-outline', recurrence: 'daily' },

  // ---- Trabajo ----
  { id: 'tpl-emails',     title: 'Revisar correos',           category: 'work', priority: 'medium', defaultTime: '09:30', icon: 'mail-outline', recurrence: 'daily' },
  { id: 'tpl-deep-work',  title: 'Sesión de trabajo profundo', category: 'work', priority: 'high',   defaultTime: '10:00', icon: 'briefcase-outline', hint: '90 min sin distracciones' },

  // ---- Ejercicio / cuerpo ----
  { id: 'tpl-exercise-2h', title: 'Ejercicio 2 horas',  category: 'health', priority: 'high',   defaultTime: '07:00', icon: 'barbell-outline', hint: 'Sesión completa', recurrence: 'daily' },
  { id: 'tpl-walk-30',     title: 'Caminar 30 minutos', category: 'health', priority: 'medium', defaultTime: '18:30', icon: 'walk-outline', recurrence: 'daily' },
  { id: 'tpl-stretch-10',  title: 'Estirar 10 minutos', category: 'health', priority: 'low',    defaultTime: '08:00', icon: 'fitness-outline', recurrence: 'daily' },

  // ---- Bienestar personal ----
  { id: 'tpl-meditate',  title: 'Meditar 10 minutos',  category: 'personal', priority: 'low',    defaultTime: '07:30', icon: 'leaf-outline', recurrence: 'daily' },
  { id: 'tpl-journal',   title: 'Escribir en mi diario', category: 'personal', priority: 'low',    defaultTime: '22:00', icon: 'create-outline', recurrence: 'daily' },

  // ---- Estudio ----
  { id: 'tpl-read-15',  title: 'Leer 15 minutos',  category: 'study', priority: 'low',  defaultTime: '21:30', icon: 'book-outline' },
  { id: 'tpl-study-1h', title: 'Estudiar 1 hora', category: 'study', priority: 'high', icon: 'school-outline' },

  // ---- Hogar / creativo ----
  { id: 'tpl-tidy',       title: 'Ordenar mi espacio',   category: 'home',     priority: 'low',    icon: 'home-outline' },
  { id: 'tpl-creative-30', title: 'Proyecto creativo 30 min', category: 'creative', priority: 'medium', icon: 'color-palette-outline' },
];
