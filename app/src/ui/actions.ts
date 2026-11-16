/** Pure state changes the UI asks for. Persistence is the session's job, not theirs. */
import { dayState } from '../engine/lifecycle';
import { setCooked, swapAvailability, type WriteContext, type WriteResult } from '../engine/slotWrites';
import type { ISODate, Week } from '../model/types';
import { describe } from './corpus';
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
