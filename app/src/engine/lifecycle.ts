/**
 * Week lifecycle (ARCHITECTURE.md 3.4) and lazy cadence (3.5).
 * Driven entirely by comparing dates handed in by the caller; nothing here reads a clock
 * and there is no timer. The app layer reads the clock once, on open, and passes it in.
 */
import { addDays, mondayOf } from '../model/dates';
import type { ISODate, ServingHistory, Settings, Week } from '../model/types';
import type { Generator } from './generate';
import { overlayWeek } from './history';

/** The caller's "now", already in local time. */
export interface Moment {
  date: ISODate;
  /** "HH:MM", zero-padded, 24-hour. */
  time: string;
}

export const INITIAL_SEED = 1;

export type WeekState = 'next' | 'current' | 'past';
export type DayState = 'past' | 'today' | 'ahead';

export function weekState(weekStart: ISODate, today: ISODate): WeekState {
  if (weekStart > today) return 'next';
  return addDays(weekStart, 6) >= today ? 'current' : 'past';
}

export function dayState(date: ISODate, today: ISODate): DayState {
  return date < today ? 'past' : date === today ? 'today' : 'ahead';
}

/** Regenerate: next week only. Never the current week, never a past one. */
export function canRegenerate(week: Week, today: ISODate): boolean {
  return weekState(week.weekStart, today) === 'next';
}

/** Swap and assign: today and every day ahead, in the current week or the next. A past day accepts none. */
export function canEditSlot(date: ISODate, today: ISODate): boolean {
  return date >= today;
}

/** Cooked marks: the current week only, for today and days already passed. Not future days, not next week. */
export function canMarkCooked(week: Week, date: ISODate, today: ISODate): boolean {
  return weekState(week.weekStart, today) === 'current' && date <= today;
}

/** The moment, in the current week, by which next week must exist. Friday 18:00 by default. */
export function deadlineOf(currentWeekStart: ISODate, settings: Settings): Moment {
  return { date: addDays(currentWeekStart, settings.generationDay - 1), time: settings.generationTime };
}

export function isDeadlinePassed(now: Moment, settings: Settings): boolean {
  const d = deadlineOf(mondayOf(now.date), settings);
  return now.date > d.date || (now.date === d.date && now.time >= d.time);
}

export function markViewed(week: Week): Week {
  return week.viewed ? week : { ...week, viewed: true };
}

/** Friday notice: next week exists and has not been looked at. Suppressed once viewed. */
export function fridayNoticeVisible(weeks: Week[], today: ISODate): boolean {
  const next = weeks.find((w) => weekState(w.weekStart, today) === 'next');
  return next !== undefined && !next.viewed;
}

/**
 * History for generating or editing `target`: the stored baseline plus every stored week
 * that has begun and is not yet folded into it, excluding the target itself. Next week is
 * never counted: it is a draft, not a record.
 */
export function historyFor(target: Week | null, stored: ServingHistory, weeks: Week[], today: ISODate): ServingHistory {
  let h = stored;
  for (const w of weeks) {
    if (target && w.weekStart === target.weekStart) continue;
    if (w.folded || weekState(w.weekStart, today) === 'next') continue;
    h = overlayWeek(h, w);
  }
  return h;
}

export interface ReconcileInput {
  weeks: Week[];
  history: ServingHistory;
  now: Moment;
  settings: Settings;
  generate: Generator;
  /**
   * Generate next week now even if the deadline has not passed: a navigation into it.
   * Same result as waiting for the deadline given the same history and seed (LIF-15).
   */
  needNextWeek?: boolean;
}

export interface ReconcileResult {
  /** Stored baseline after folding newly-past weeks into it. */
  history: ServingHistory;
  /** Existing weeks whose `folded` flag changed. Persist these. */
  updated: Week[];
  /** Weeks that did not exist and now do. Persist these. */
  created: Week[];
}

/**
 * Run on app open and on navigation into next week. Idempotent: running it twice with the
 * same inputs creates nothing the second time.
 */
export function reconcile(inp: ReconcileInput): ReconcileResult {
  const today = inp.now.date;
  let history = inp.history;
  const updated: Week[] = [];
  const created: Week[] = [];
  const all = new Map(inp.weeks.map((w) => [w.weekStart, w]));

  // Weeks that have become past are folded into the durable history, once.
  for (const w of inp.weeks) {
    if (weekState(w.weekStart, today) === 'past' && !w.folded) {
      history = overlayWeek(history, w);
      const f = { ...w, folded: true };
      all.set(f.weekStart, f);
      updated.push(f);
    }
  }

  // First launch, or the app was not opened across a Monday: the current week is made on the spot.
  const currentStart = mondayOf(today);
  if (!all.has(currentStart)) {
    const cur = inp.generate(historyFor(null, history, [...all.values()], today), INITIAL_SEED, currentStart);
    all.set(currentStart, cur);
    created.push(cur);
  }

  // Next week: lazily, at the deadline or on first navigation, whichever comes first.
  const nextStart = addDays(currentStart, 7);
  if (!all.has(nextStart) && (inp.needNextWeek === true || isDeadlinePassed(inp.now, inp.settings))) {
    const next = inp.generate(historyFor(null, history, [...all.values()], today), INITIAL_SEED, nextStart);
    // A week made because the user navigated into it has, by definition, been viewed.
    created.push(inp.needNextWeek === true ? { ...next, viewed: true } : next);
  }

  return { history, updated, created };
}
