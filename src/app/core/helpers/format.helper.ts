export function formatCoins(value: number): string {
  if (value < 1000) return value.toString();
  if (value < 10_000) return (value / 1000).toFixed(1).replace('.0', '') + 'k';
  return Math.floor(value / 1000) + 'k';
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

export function pluralize(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
