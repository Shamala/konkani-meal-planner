/**
 * A small SYNTHETIC corpus used only to exercise the engine. Names are invented and pages
 * are placeholders; none of this is, or may be mistaken for, cookbook data. The real
 * fixtures belong to the testing agent (testing/fixtures); the real corpus does not exist
 * until Pass 2 extraction (ARCHITECTURE.md 6).
 */
import { SNACK1, SNACK2_AUTHORED } from '../data/snacks';
import { DEFAULT_SETTINGS, type Catalog, type Recipe, type Settings, type Slot } from '../model/types';
import { buildIndex } from './catalog';
import { defaultShape, makeGenerator, type DayShape, type Generator } from './generate';

let page = 6;
function many(prefix: string, n: number, role: string, section: number, slots: Slot[], season?: number[]): Recipe[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${prefix}-${String(i + 1).padStart(2, '0')}`,
    name: `${prefix} ${i + 1}`,
    role,
    section,
    page: page++ % 150 + 6,
    slots,
    ...(season && { season }),
  }));
}

export interface FixtureOpts {
  saar?: number;
  curry?: number;
  starch?: number;
  side?: number;
  breakfast?: number;
  snack2Book?: number;
  extra?: Recipe[];
}

export function fixtureCatalog(o: FixtureOpts = {}): Catalog {
  const recipes: Recipe[] = [
    ...many('saar', o.saar ?? 30, 'saar', 2, ['main']),
    ...many('curry', o.curry ?? 30, 'curry', 10, ['main']),
    ...many('rice', Math.ceil((o.starch ?? 30) / 2), 'rice', 12, ['main']),
    ...many('roti', Math.floor((o.starch ?? 30) / 2), 'roti', 21, ['main', 'snack2']),
    ...many('side', o.side ?? 30, 'side', 14, ['main']),
    ...many('bkfst', o.breakfast ?? 20, 'breakfast', 17, ['breakfast', 'snack2']),
    ...many('snackbook', o.snack2Book ?? 20, 'savoury', 25, ['snack2']),
    ...(o.extra ?? []),
  ];
  return { recipes, snack1: SNACK1, snack2Authored: SNACK2_AUTHORED };
}

export const FIXTURE_SHAPE: DayShape = defaultShape([
  { roles: ['saar'] },
  { roles: ['curry'] },
  { roles: ['rice', 'roti'] },
  { roles: ['side'] },
]);

export function fixtureGenerator(catalog: Catalog = fixtureCatalog(), settings: Settings = DEFAULT_SETTINGS, shape: DayShape = FIXTURE_SHAPE): {
  generate: Generator;
  env: { index: ReturnType<typeof buildIndex>; settings: Settings; shape: DayShape };
} {
  const env = { index: buildIndex(catalog), settings, shape };
  return { generate: makeGenerator(env), env };
}

/** The D5 shape: the usual four positions, plus a standalone rice-dish meal once a week. */
export const FIXTURE_SHAPE_TWO_TYPES: DayShape = defaultShape(
  [{ roles: ['saar'] }, { roles: ['curry'] }, { roles: ['rice', 'roti'] }, { roles: ['side'] }],
  [{ roles: ['rice'] }],
);
