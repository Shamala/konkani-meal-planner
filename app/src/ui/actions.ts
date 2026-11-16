/** Pure state changes the UI asks for. Persistence is the session's job, not theirs. */
import { canEditSlot, dayState } from '../engine/lifecycle';
import { setCooked, swapAvailability, type WriteContext, type WriteResult } from '../engine/slotWrites';
import type { DayPlan, ISODate, Week } from '../model/types';
import { describe } from './corpus';
import { ingredientNames } from './ingredients';
import type { Ingredient } from '../model/types';
import type { PlanRef } from './nav';

/** The day-row tick: every main-meal dish on the day, set together (DECISIONS.md Q4). */
export function setDayMainCooked(week: Week, today: ISODate, date: ISODate, cooked: boolean): WriteResult {
  const day = week.days.find((d) => d.date === date);
  let current = week;
  for (let i = 0; i < (day?.slots.main.dishes.length ?? 0); i++) {
    const r = setCooked(current, today, date, 'main', i, cooked);
    if (!r.ok) return r;
    current = r.week;
  }
  return { ok: true, week: current };
}

/** Name and Kannada-name search. Accents and case ignored; every word of the query must appear. */
export function matchesQuery(name: string, query: string): boolean {
  const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const hay = fold(name);
  return fold(query).split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

export type DishAction = { kind: 'swap' } | { kind: 'inert'; reason: string };

/**
 * What the Dish screen's action position shows (DESIGN 3.3, DSH-09 to DSH-11). Swap only for a
 * dish opened from a plan on a day after today; otherwise a plain reason, never a dead button.
 * A dish opened from Search has no plan; its Add to a meal action is not built yet.
 */
export function dishAction(ctx: WriteContext, week: Week, plan: PlanRef, dishId: string): DishAction {
  const state = dayState(plan.date, ctx.today);
  if (state === 'today') return { kind: 'inert', reason: "Today's plan is fixed. Swap works from tomorrow." };
  if (state === 'past') return { kind: 'inert', reason: 'This day is done. Swapping works on days still to come.' };
  const a = swapAvailability(ctx, week, plan.date, plan.slot, plan.index);
  if (a.available) return { kind: 'swap' };
  const role = describe(dishId).sectionName;
  return {
    kind: 'inert',
    reason: a.reason === 'single-recipe-in-role' && role
      ? `${role} has only one recipe, so there is nothing to swap it for.`
      : 'There is no other dish that fits here right now, so there is nothing to swap it for.',
  };
}

/** Days the Add to a meal picker offers: after today only. Today and passed days are omitted (ASN-04, LIF-23). */
export function pickerDays(week: Week, today: ISODate): DayPlan[] {
  return week.days.filter((d) => canEditSlot(d.date, today));
}

/** Dishes in `week` that differ from the seeded plan `fresh`: swaps and hand-picked dishes (ASN-10, DESIGN 3.6). */
export function chosenCount(week: Week, fresh: Week): number {
  let n = 0;
  week.days.forEach((day, d) => {
    for (const slot of ['breakfast', 'snack1', 'main', 'snack2'] as const) {
      day.slots[slot].dishes.forEach((dish, i) => {
        if (fresh.days[d]?.slots[slot].dishes[i]?.id !== dish.id) n++;
      });
    }
  });
  return n;
}

/** "23 to 29 November" for a week starting on `weekStart` (DESIGN 3.7). */
export function weekRange(weekStart: ISODate): string {
  const end = new Date(`${weekStart}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  const start = new Date(`${weekStart}T00:00:00Z`);
  const month = (d: Date) => new Intl.DateTimeFormat('en-IN', { month: 'long', timeZone: 'UTC' }).format(d);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  return `${start.getUTCDate()}${sameMonth ? '' : ' ' + month(start)} to ${end.getUTCDate()} ${month(end)}`;
}

/** Ingredient search: every word of the query must appear among the recipe's ingredient names (SRC-02). */
export function matchesIngredients(ingredients: Ingredient[], query: string): boolean {
  return query.trim() !== '' && matchesQuery(ingredients.flatMap(ingredientNames).join(' '), query);
}
