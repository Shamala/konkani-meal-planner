/**
 * The generator. ARCHITECTURE.md 3.1: a pure function
 *
 *     (servingHistory, seed, weekStart) -> Week
 *
 * No clock read, no Math.random, no network. Catalog, settings and day shape are fixed
 * configuration closed over by makeGenerator, not per-call inputs.
 */
import { addDays, dayNumber, isoWeekday, monthOf } from '../model/dates';
import {
  SLOTS,
  type DayPlan,
  type ISODate,
  type Role,
  type ServingHistory,
  type Settings,
  type Slot,
  type SlotPlan,
  type Week,
} from '../model/types';
import type { CatalogIndex } from './catalog';
import { pickIndex } from './prng';
import { addRecency, nearest, selectDish, type Recency } from './select';

/** One dish position in a slot. Main-meal positions carry the roles they accept. */
export interface Position {
  roles?: readonly Role[];
}

/**
 * How many dishes each slot holds and which roles each main-meal position wants.
 * Not specified anywhere in the documents (no enumerated roles, no composition table),
 * so it is configuration supplied by the caller. OPEN QUESTION Q1 / Q4.
 */
export type DayShape = Record<Slot, Position[]> & {
  /**
   * Main-meal positions for the standalone rice-dish meal (DECISIONS.md D5). When present,
   * exactly one day a week, chosen by seed, uses these in place of `main`. Absent = every
   * day is a plain-rice meal.
   */
  mainStandalone?: Position[];
};

export function defaultShape(mainPositions: Position[], mainStandalone?: Position[]): DayShape {
  return { breakfast: [{}], snack1: [{}], main: mainPositions, snack2: [{}], ...(mainStandalone && { mainStandalone }) };
}

/** Weekday offset (0 = Monday) of the week's standalone meal. Seeded like every other decision. */
export function standaloneDayOffset(seed: number, weekStart: ISODate): number {
  return pickIndex(7, [seed, weekStart, 'standalone-day']);
}

export interface GeneratorEnv {
  index: CatalogIndex;
  settings: Settings;
  shape: DayShape;
}

export type Generator = (history: ServingHistory, seed: number, weekStart: ISODate) => Week;

export function historyToRecency(history: ServingHistory): Recency {
  const r: Recency = new Map();
  for (const [id, rec] of Object.entries(history)) addRecency(r, id, dayNumber(rec.lastServed));
  return r;
}

/** Family of whichever Snack 1 entry was served on day `dn`, if any. */
export function snack1FamilyOn(index: CatalogIndex, recency: Recency, dn: number): string | undefined {
  for (const e of index.catalog.snack1) {
    if (nearest(recency, e.id, dn) === 0) return e.family;
  }
  return undefined;
}

export function emptySlot(): SlotPlan {
  return { dishes: [], offPlan: [] };
}

export function counterKey(date: ISODate, slot: Slot, index: number): string {
  return `${date}|${slot}|${index}`;
}

export function makeGenerator(env: GeneratorEnv): Generator {
  return function generateWeek(history, seed, weekStart) {
    if (isoWeekday(weekStart) !== 1) throw new RangeError(`weekStart must be a Monday: ${weekStart}`);
    const month = monthOf(weekStart);
    const recency = historyToRecency(history);
    const days: DayPlan[] = [];
    const standaloneDay = env.shape.mainStandalone ? standaloneDayOffset(seed, weekStart) : -1;

    for (let d = 0; d < 7; d++) {
      const date = addDays(weekStart, d);
      const dn = dayNumber(date);
      const standalone = d === standaloneDay;
      const plan: DayPlan = {
        date,
        slots: { breakfast: emptySlot(), snack1: emptySlot(), main: emptySlot(), snack2: emptySlot() },
        mealType: standalone ? 'standalone' : 'plain-rice',
      };

      // SLOTS order puts breakfast before Snack 2, so Snack 2 can see breakfast to avoid it (step 5).
      for (const slot of SLOTS) {
        const avoid = new Set<string>(slot === 'snack2' ? plan.slots.breakfast.dishes.map((x) => x.id) : []);
        const positions = standalone && slot === 'main' ? env.shape.mainStandalone! : env.shape[slot];
        positions.forEach((position, i) => {
          const id = selectDish({
            index: env.index,
            settings: env.settings,
            slot,
            roles: position.roles,
            date,
            month,
            recency,
            avoid,
            exclude: new Set(),
            previousFamily: slot === 'snack1' ? snack1FamilyOn(env.index, recency, dn - 1) : undefined,
            seedParts: [seed, weekStart, date, slot, i, 0],
          });
          if (id === null) {
            throw new Error(`No candidate at all for ${slot}[${i}] on ${date}; the catalog cannot fill this position`);
          }
          plan.slots[slot].dishes.push({ id, cooked: false });
          addRecency(recency, id, dn);
        });
      }
      days.push(plan);
    }

    return { weekStart, seed, days, swapCounters: {}, viewed: false, folded: false };
  };
}
