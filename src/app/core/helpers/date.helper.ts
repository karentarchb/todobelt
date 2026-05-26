const DAY_MS = 86_400_000;

export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isToday(iso: string | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const s = startOfDay();
  return d.getTime() >= s.getTime() && d.getTime() < s.getTime() + DAY_MS;
}

export function relativeDay(iso: string | undefined): string {
  if (!iso) return '';
  const target = startOfDay(new Date(iso)).getTime();
  const today = startOfDay().getTime();
  const diff = Math.round((target - today) / DAY_MS);

  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  if (diff > 1 && diff < 7) return `En ${diff} días`;
  if (diff < -1 && diff > -7) return `Hace ${Math.abs(diff)} días`;

  return new Date(iso).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
  });
}

export function greetingForHour(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 6) return 'Buenas noches';
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
