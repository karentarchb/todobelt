/** Lightweight URL-safe id generator — Web Crypto when available, fallback otherwise. */
export function uid(prefix = 'id'): string {
  const rand =
    typeof crypto !== 'undefined' && 'getRandomValues' in crypto
      ? Array.from(crypto.getRandomValues(new Uint8Array(8)))
          .map((b) => b.toString(36))
          .join('')
          .slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `${prefix}_${rand}`;
}
