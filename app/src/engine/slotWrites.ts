/**
 * Slot-level writes (ARCHITECTURE.md 3.2): swapDish, assignDish, and the cooked marks, plus
 * regenerate for next week. All are immutable: they return a new Week and never touch the
 * week seed (except regenerate, which advances it by design).
 *
 * assignDish deliberately applies NO rules. Not role, not season, not the repeat window.
 * Rules bind the generator, not the user (REQUIREMENTS.md 4.5.1). The only checks are
 * structural: the day exists, the day is not in the past, the slot position exists, and
 * the id names something in the catalog. Do not add validation here.
 */
import { dayNumber, monthOf } from '../model/dates';
import type { DishEntry, ISODate, ServingHistory, Slot, Week } from '../model/types';
import { counterKey, historyToRecency, snack1FamilyOn, type GeneratorEnv } from './generate';
import type { Generator } from './generate';
import { canEditSlot, canMarkCooked, canRegenerate, historyFor } from './lifecycle';
import { addRecency, selectDish, type Recency } from './select';
import { SLOTS } from '../model/types';

/** What every write needs besides the week: configuration, history, and today's date. */
export interface WriteContext {
  env: GeneratorEnv;
  /**
   * History EXCLUDING the week being edited (use lifecycle.historyFor). The week's own other
   * dishes are added here, so a swap never reaches for something already planned that week.
   */
  history: ServingHistory;
  today: ISODate;
}

export type Refusal =
  | 'past-day'
  | 'no-such-day'
  | 'no-such-position'
  | 'unknown-dish'
  | 'single-recipe-in-role'
  | 'no-alternative'
  | 'not-next-week'
  | 'not-markable';

export type WriteResult = { ok: true; week: Week } | { ok: false; reason: Refusal };

const refuse = (reason: Refusal): WriteResult => ({ ok: false, reason });

function locate(week: Week, date: ISODate, slot: Slot, index: number) {
  const dayIdx = week.days.findIndex((d) => d.date === date);
  if (dayIdx < 0) return { ok: false as const, reason: 'no-such-day' as Refusal };
  const entry = week.days[dayIdx]!.slots[slot].dishes[index];
  if (!entry) return { ok: false as const, reason: 'no-such-position' as Refusal };
  return { ok: true as const, dayIdx, entry };
}

/** Recency from history plus every dish in the week except the one at `skip`. */
function weekRecency(history: ServingHistory, week: Week, skip: { date: ISODate; slot: Slot; index: number }): Recency {
  const r = historyToRecency(history);
  for (const day of week.days) {
    const dn = dayNumber(day.date);
    for (const slot of SLOTS) {
      day.slots[slot].dishes.forEach((d, i) => {
        if (day.date === skip.date && slot === skip.slot && i === skip.index) return;
        addRecency(r, d.id, dn);
      });
      for (const id of day.slots[slot].offPlan) addRecency(r, id, dn);
    }
  }
  return r;
}

// ---- swap ---------------------------------------------------------------------------

export type SwapAvailability = { available: true } | { available: false; reason: Refusal };

type SwapPlan = { ok: false; reason: Refusal } | { ok: true; id: string; key: string; counter: number; dayIdx: number };

function swapPlan(ctx: WriteContext, week: Week, date: ISODate, slot: Slot, index: number): SwapPlan {
  if (!canEditSlot(date, ctx.today)) return { ok: false, reason: 'past-day' };
  const loc = locate(week, date, slot, index);
  if (!loc.ok) return loc;

  const { env } = ctx;
  const currentId = loc.entry.id;
  const recipe = env.index.recipeById.get(currentId);

  // Main meal: "another of the same role" is the role of the dish being replaced, so a
  // saar never becomes a sweet. If the dish is not a recipe (it was assigned by hand from
  // elsewhere) fall back to the position's own roles. OPEN QUESTION Q5.
  const roles = slot === 'main' && recipe ? [recipe.role] : env.shape[slot][index]?.roles;

  // "Where a role holds a single recipe, swap is unavailable and says why."
  if (slot === 'main' && recipe) {
    const sameRole = env.index.pools.main.filter((c) => c.role === recipe.role).length;
    if (sameRole <= 1) return { ok: false, reason: 'single-recipe-in-role' };
  }

  const dn = dayNumber(date);
  const recency = weekRecency(ctx.history, week, { date, slot, index });
  const dayPlan = week.days[loc.dayIdx]!;
  const avoid = new Set<string>();
  if (slot === 'snack2') dayPlan.slots.breakfast.dishes.forEach((d) => avoid.add(d.id));
  if (slot === 'breakfast') dayPlan.slots.snack2.dishes.forEach((d) => avoid.add(d.id));

  const key = counterKey(date, slot, index);
  const counter = (week.swapCounters[key] ?? 0) + 1;

  const id = selectDish({
    index: env.index,
    settings: env.settings,
    slot,
    roles,
    date,
    month: monthOf(week.weekStart),
    recency,
    avoid,
    exclude: new Set([currentId]),
    previousFamily: slot === 'snack1' ? snack1FamilyOn(env.index, recency, dn - 1) : undefined,
    seedParts: [week.seed, week.weekStart, date, slot, index, counter],
  });
  if (id === null) return { ok: false, reason: 'no-alternative' };
  return { ok: true, id, key, counter, dayIdx: loc.dayIdx };
}

/** For the UI: is the swap control offered, and if not, why. Never offer a control that does nothing. */
export function swapAvailability(ctx: WriteContext, week: Week, date: ISODate, slot: Slot, index: number): SwapAvailability {
  const p = swapPlan(ctx, week, date, slot, index);
  return p.ok ? { available: true } : { available: false, reason: p.reason };
}

/**
 * Runs steps 1-7 for one slot, excluding the dish being replaced, advancing that slot's own
 * counter and never the week seed. The replacement starts uncooked.
 */
export function swapDish(ctx: WriteContext, week: Week, date: ISODate, slot: Slot, index: number): WriteResult {
  const p = swapPlan(ctx, week, date, slot, index);
  if (!p.ok) return refuse(p.reason);
  const next = structuredClone(week);
  next.days[p.dayIdx]!.slots[slot].dishes[index] = { id: p.id, cooked: false };
  next.swapCounters[p.key] = p.counter;
  return { ok: true, week: next };
}

// ---- assign -------------------------------------------------------------------------

/** Writes `dishId` into the slot position. No role, season or repeat-window filtering of any kind. */
export function assignDish(ctx: WriteContext, week: Week, date: ISODate, slot: Slot, index: number, dishId: string): WriteResult {
  if (!canEditSlot(date, ctx.today)) return refuse('past-day');
  const loc = locate(week, date, slot, index);
  if (!loc.ok) return refuse(loc.reason);
  if (!ctx.env.index.kindOf.has(dishId)) return refuse('unknown-dish');
  if (loc.entry.id === dishId) return { ok: true, week };
  const next = structuredClone(week);
  next.days[loc.dayIdx]!.slots[slot].dishes[index] = { id: dishId, cooked: false };
  return { ok: true, week: next };
}

// ---- regenerate ---------------------------------------------------------------------

/**
 * Replaces all slots of NEXT week and advances the seed. Discards slot edits (the UI confirms
 * first, ASN-10). Refused on the current and past weeks.
 */
export function regenerateWeek(
  generate: Generator,
  stored: ServingHistory,
  weeks: Week[],
  week: Week,
  today: ISODate,
): WriteResult {
  if (!canRegenerate(week, today)) return refuse('not-next-week');
  const fresh = generate(historyFor(week, stored, weeks, today), week.seed + 1, week.weekStart);
  return { ok: true, week: { ...fresh, viewed: week.viewed } };
}

// ---- cooked marks -------------------------------------------------------------------

/** One tap, reversible by a second. Current week only; today and days already passed. */
export function setCooked(week: Week, today: ISODate, date: ISODate, slot: Slot, index: number, cooked: boolean): WriteResult {
  if (!canMarkCooked(week, date, today)) return refuse('not-markable');
  const loc = locate(week, date, slot, index);
  if (!loc.ok) return refuse(loc.reason);
  const next = structuredClone(week);
  const e = next.days[loc.dayIdx]!.slots[slot].dishes[index] as DishEntry;
  e.cooked = cooked;
  return { ok: true, week: next };
}

/**
 * Mark a dish cooked that is in no plan (reached through Search). Cancels the implicit record
 * for that slot's planned dishes. `on = false` removes the mark again.
 */
export function setOffPlanCooked(
  week: Week,
  today: ISODate,
  catalogHas: (id: string) => boolean,
  date: ISODate,
  slot: Slot,
  dishId: string,
  on: boolean,
): WriteResult {
  if (!canMarkCooked(week, date, today)) return refuse('not-markable');
  const dayIdx = week.days.findIndex((d) => d.date === date);
  if (dayIdx < 0) return refuse('no-such-day');
  if (!catalogHas(dishId)) return refuse('unknown-dish');
  const next = structuredClone(week);
  const list = next.days[dayIdx]!.slots[slot].offPlan;
  const at = list.indexOf(dishId);
  if (on && at < 0) list.push(dishId);
  if (!on && at >= 0) list.splice(at, 1);
  return { ok: true, week: next };
}


