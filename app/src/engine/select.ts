/**
 * The seven filter steps of ARCHITECTURE.md 3.2, for one position in one slot on one day.
 *
 *   1 slot   2 role (main)   3 season   4 recent   5 same-day collision   6 pick   7 fallback
 *
 * Two rules a naive version gets wrong, both enforced here:
 *  - step 3 is never relaxed by the fallback. Only step 4 (the repeat window) gives way.
 *  - when settings.respectSeasons is off, step 3 does not run at all.
 */
import { dayNumber } from '../model/dates';
import type { ISODate, Role, Settings, Slot } from '../model/types';
import type { Candidate, CatalogIndex } from './catalog';
import { pickIndex } from './prng';

/** id -> day numbers on which it was (or is planned to be) served. */
export type Recency = Map<string, number[]>;

export function addRecency(recency: Recency, id: string, dn: number): void {
  const list = recency.get(id);
  if (list) list.push(dn);
  else recency.set(id, [dn]);
}

/** Days from `dn` to the nearest recorded serving of `id`; Infinity if never served. */
export function nearest(recency: Recency, id: string, dn: number): number {
  const list = recency.get(id);
  if (!list) return Infinity;
  let best = Infinity;
  for (const d of list) best = Math.min(best, Math.abs(d - dn));
  return best;
}

export interface SelectInput {
  index: CatalogIndex;
  settings: Settings;
  slot: Slot;
  /** Step 2. Applied when non-empty; the main meal always supplies it. */
  roles?: readonly Role[] | undefined;
  date: ISODate;
  /** Month (1-12) of the week being planned. */
  month: number;
  recency: Recency;
  /** Step 5. Ids that may not be served today (e.g. today's breakfast, for Snack 2). */
  avoid: ReadonlySet<string>;
  /** Ids removed from the pool before step 4 (swap excludes the dish being replaced). */
  exclude: ReadonlySet<string>;
  /** Snack 1 rotation rule: prefer a family other than yesterday's. Soft. */
  previousFamily?: string | undefined;
  /** Everything that identifies this decision; hashed to choose among the survivors. */
  seedParts: ReadonlyArray<string | number>;
}

function windowFor(slot: Slot, settings: Settings, availablePool: number): number {
  // Snack 1: available pool minus one, so every in-season entry is used once before any repeats.
  if (slot === 'snack1') return availablePool - 1;
  return settings.repeatWindows[slot];
}

/** Returns the chosen id, or null only if no candidate exists at all after steps 1-3 and `exclude`. */
export function selectDish(inp: SelectInput): string | null {
  const { index, settings, slot } = inp;

  // 1. slot
  let pool: Candidate[] = index.pools[slot];

  // 2. role
  const roles = inp.roles;
  if (roles && roles.length > 0) pool = pool.filter((c) => c.role !== undefined && roles.includes(c.role));

  // 3. season, only when enabled. Absent season always passes.
  if (settings.respectSeasons) pool = pool.filter((c) => !c.season || c.season.includes(inp.month));

  // The Snack 1 window is measured on what is available, before the replaced dish is removed.
  const available = pool.length;
  pool = pool.filter((c) => !inp.exclude.has(c.id));
  if (pool.length === 0) return null;

  const dn = dayNumber(inp.date);
  const window = windowFor(slot, settings, available);

  // 4. recent: excluded when served within `window` days (inclusive), either side of today.
  let eligible = pool.filter((c) => nearest(inp.recency, c.id, dn) > window);

  // 5. same-day collision
  eligible = eligible.filter((c) => !inp.avoid.has(c.id));

  // Snack 1 rotation: draw across families, not down them. Soft, so it never empties the pool.
  if (slot === 'snack1' && inp.previousFamily !== undefined) {
    const across = eligible.filter((c) => c.family !== inp.previousFamily);
    if (across.length > 0) eligible = across;
  }

  // 6. pick
  if (eligible.length > 0) {
    return eligible[pickIndex(eligible.length, inp.seedParts)]!.id;
  }

  // 7. fallback: the repeat window gives way; season (step 3) does not. Prefer to still
  // honour the same-day collision, and give way on it only if nothing else exists.
  let fb = pool.filter((c) => !inp.avoid.has(c.id));
  if (fb.length === 0) fb = pool;
  let longest = -1;
  for (const c of fb) longest = Math.max(longest, nearest(inp.recency, c.id, dn));
  const oldest = fb.filter((c) => nearest(inp.recency, c.id, dn) === longest);
  return oldest[pickIndex(oldest.length, [...inp.seedParts, 'fallback'])]!.id;
}
