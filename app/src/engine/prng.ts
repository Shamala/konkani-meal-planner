/**
 * Seeded, stateless choice. Every decision hashes its own coordinates, so a result
 * never depends on the order other decisions were made in. That is what lets a single
 * slot be re-picked (swap) without disturbing the rest of the week.
 */

/** FNV-1a over the parts, then a murmur3 finaliser for avalanche. Returns uint32. */
export function hash32(parts: ReadonlyArray<string | number>): number {
  let h = 0x811c9dc5;
  const s = parts.join('\u001f');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Index in [0, n). n must be >= 1. */
export function pickIndex(n: number, parts: ReadonlyArray<string | number>): number {
  if (n < 1) throw new RangeError('pickIndex needs a non-empty pool');
  return hash32(parts) % n;
}
