/**
 * The bundled corpus and the engine configuration built from it. Static: the recipes ship
 * with the app and are never written at runtime (ARCHITECTURE.md 4).
 */
import indexFile from '../../../extraction/index.tier1.json';
import recipesFile from '../../../extraction/recipes.tier1.json';
import { SNACK1, SNACK2_AUTHORED } from '../data/snacks';
import { buildIndex, withDerivedSlots } from '../engine/catalog';
import { defaultShape } from '../engine/generate';
import type { Recipe } from '../model/types';

const raw = recipesFile.recipes as unknown as Array<Recipe & { alsoOnPages?: number[] }>;
export const index = buildIndex({ recipes: withDerivedSlots(raw), snack1: SNACK1, snack2Authored: SNACK2_AUTHORED });

/** DECISIONS.md D5: plain-rice meal (liquid, curry, vegetable) or one standalone rice dish. */
export const shape = defaultShape(
  [
    { roles: ['saars-rasams-soups', 'kadis-thamblis', 'sambars-kolambus-hulis'] },
    { roles: ['mixed-vegetable-curries', 'masala-curries', 'stuffed-curries'] },
    { roles: ['plain-curries'] },
  ],
  [{ roles: ['rice-dishes'] }],
);

const sectionName = new Map((indexFile.sections as Array<[number, string, number]>).map(([n, name]) => [n, name]));
export const sections = [...sectionName].map(([number, name]) => ({ number, name }));
const alsoOn = new Map(raw.filter((r) => r.alsoOnPages).map((r) => [r.id, r.alsoOnPages!]));

export interface DishInfo {
  id: string;
  name: string;
  kind: 'recipe' | 'snack1' | 'snack2';
  /** Printed page. Recipes only: a snack has none (DSH-08). */
  page?: number;
  alsoOnPages?: number[];
  section?: number;
  sectionName?: string;
  /** Snacks only: the plain-string components. */
  components?: string;
}

export function describe(id: string): DishInfo {
  const kind = index.kindOf.get(id);
  if (kind === 'recipe') {
    const r = index.recipeById.get(id)!;
    return {
      id, name: r.name, kind, page: r.page, section: r.section, sectionName: sectionName.get(r.section),
      ...(alsoOn.has(id) && { alsoOnPages: alsoOn.get(id)! }),
    };
  }
  const e = kind === 'snack1' ? index.snack1ById.get(id)! : index.catalog.snack2Authored.find((s) => s.id === id)!;
  return { id, name: e.name, kind: kind!, components: e.components };
}

/** Every dish a user may look up, for Search. */
export const allDishes: DishInfo[] = [
  ...index.catalog.recipes.map((r) => describe(r.id)),
  ...index.catalog.snack1.map((s) => describe(s.id)),
  ...index.catalog.snack2Authored.map((s) => describe(s.id)),
];
