/** Pure state changes the UI asks for. Persistence is the session's job, not theirs. */
import { setCooked, type WriteResult } from '../engine/slotWrites';
import type { ISODate, Week } from '../model/types';

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
