/**
 * Serving history has two sources (ARCHITECTURE.md 2.4):
 *  - implicit: a current week's planned dishes count as served on their planned day
 *  - explicit: the user marked a dish cooked, including a dish never in any plan
 * An off-plan mark cancels no planned dish's implicit record (DECISIONS.md D3, HST-08): the
 * generator errs toward repeating less.
 */
import type { ISODate, ServingHistory, Week } from '../model/types';
import { SLOTS } from '../model/types';

export function recordServed(history: ServingHistory, id: string, date: ISODate): ServingHistory {
  const prev = history[id];
  const lastServed = prev && prev.lastServed > date ? prev.lastServed : date;
  return { ...history, [id]: { lastServed, timesServed: (prev?.timesServed ?? 0) + 1 } };
}

/** Everything a week contributes to history: planned (implicit), cooked and off-plan (explicit). */
export function weekServings(week: Week): Array<{ id: string; date: ISODate }> {
  const out: Array<{ id: string; date: ISODate }> = [];
  for (const day of week.days) {
    for (const slot of SLOTS) {
      const sp = day.slots[slot];
      for (const d of sp.dishes) out.push({ id: d.id, date: day.date });
      for (const id of sp.offPlan) out.push({ id, date: day.date });
    }
  }
  return out;
}

/** History as the generator should see it, with `week` laid over `history`. Pure. */
export function overlayWeek(history: ServingHistory, week: Week): ServingHistory {
  let h = history;
  for (const s of weekServings(week)) h = recordServed(h, s.id, s.date);
  return h;
}
