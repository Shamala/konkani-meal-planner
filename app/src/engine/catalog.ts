import type { Catalog, Recipe, Role, Slot, Snack1Entry, Snack2Entry } from '../model/types';

export type DishKind = 'recipe' | 'snack1' | 'snack2';

/** What the generator needs to know about a dish, whatever its source. */
export interface Candidate {
  id: string;
  role?: Role;
  season?: number[];
  family?: string;
}

export interface CatalogIndex {
  catalog: Catalog;
  kindOf: Map<string, DishKind>;
  /** Step 1 of generation: candidates per slot, sorted by id so order never depends on file order. */
  pools: Record<Slot, Candidate[]>;
  snack1ById: Map<string, Snack1Entry>;
  recipeById: Map<string, Recipe>;
}

/** Book sections that may fill breakfast (REQUIREMENTS.md 3: 17, 18, 19, 20). */
export const BREAKFAST_SECTIONS: readonly number[] = [17, 18, 19, 20];
/** Snack 2 section proxy (SNACK-LIBRARY.md 2.1). */
export const SNACK2_SECTIONS: readonly number[] = [17, 18, 19, 20, 21, 23, 24, 25, 26];

/**
 * Adds 'breakfast' and 'snack2' to `slots` for recipes in the proxy sections. A loader
 * helper: the generator itself reads only `slots`, so the proxy lives in one place.
 * Never removes a slot (section 21 is both a Snack 2 section and a roti/main section).
 */
export function withDerivedSlots(recipes: Recipe[]): Recipe[] {
  return recipes.map((r) => {
    const slots = new Set(r.slots);
    if (BREAKFAST_SECTIONS.includes(r.section)) slots.add('breakfast');
    if (SNACK2_SECTIONS.includes(r.section)) slots.add('snack2');
    return { ...r, slots: [...slots] as Slot[] };
  });
}

function checkSeason(id: string, season: number[] | undefined, errors: string[]): void {
  if (season === undefined) return;
  if (season.length === 0) errors.push(`${id}: empty season array (omit the field for all-year)`);
  for (const m of season) {
    if (!Number.isInteger(m) || m < 1 || m > 12) errors.push(`${id}: season month ${m} out of range`);
  }
}

export function validateCatalog(catalog: Catalog): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const all: Array<{ id: string; season?: number[] }> = [
    ...catalog.recipes,
    ...catalog.snack1,
    ...catalog.snack2Authored,
  ];
  for (const e of all) {
    if (seen.has(e.id)) errors.push(`${e.id}: duplicate id (ids must be unique across recipes and snacks)`);
    seen.add(e.id);
    checkSeason(e.id, e.season, errors);
  }
  for (const r of catalog.recipes) {
    if (!Number.isInteger(r.page) || r.page < 1) errors.push(`${r.id}: bad page ${r.page}`);
  }
  return errors;
}

function byId(a: Candidate, b: Candidate): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function buildIndex(catalog: Catalog): CatalogIndex {
  const errors = validateCatalog(catalog);
  if (errors.length) throw new Error(`Invalid catalog:\n${errors.join('\n')}`);

  const kindOf = new Map<string, DishKind>();
  const recipeCand = (r: Recipe): Candidate => ({ id: r.id, role: r.role, ...(r.season && { season: r.season }) });
  const snack2Cand = (e: Snack2Entry): Candidate => ({ id: e.id, ...(e.family && { family: e.family }), ...(e.season && { season: e.season }) });

  const pools: Record<Slot, Candidate[]> = { breakfast: [], snack1: [], main: [], snack2: [] };
  for (const r of catalog.recipes) {
    kindOf.set(r.id, 'recipe');
    for (const s of r.slots) if (s !== 'snack1') pools[s].push(recipeCand(r));
  }
  for (const e of catalog.snack1) {
    kindOf.set(e.id, 'snack1');
    pools.snack1.push({ id: e.id, family: e.family, ...(e.season && { season: e.season }) });
  }
  for (const e of catalog.snack2Authored) {
    kindOf.set(e.id, 'snack2');
    pools.snack2.push(snack2Cand(e));
  }
  for (const s of Object.keys(pools) as Slot[]) pools[s].sort(byId);

  return { catalog, kindOf, pools, snack1ById: new Map(catalog.snack1.map((e) => [e.id, e])),
    recipeById: new Map(catalog.recipes.map((r) => [r.id, r])),
  };
}
