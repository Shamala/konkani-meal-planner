/**
 * Calendar arithmetic on ISO date strings, done in UTC day numbers so no local time
 * zone, daylight-saving shift or clock read can leak in. Nothing here calls Date.now().
 */
import type { ISODate } from './types';

const DAY_MS = 86_400_000;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function dayNumber(iso: ISODate): number {
  const m = ISO.exec(iso);
  if (!m) throw new RangeError(`Not an ISO date: ${iso}`);
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (toISO(Math.round(t / DAY_MS)) !== iso) throw new RangeError(`Not a real date: ${iso}`);
  return Math.round(t / DAY_MS);
}

export function toISO(day: number): ISODate {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(iso: ISODate, n: number): ISODate {
  return toISO(dayNumber(iso) + n);
}

/** 1 = Monday ... 7 = Sunday. 1970-01-01 (day 0) was a Thursday. */
export function isoWeekday(iso: ISODate): number {
  return ((((dayNumber(iso) + 3) % 7) + 7) % 7) + 1;
}

export function mondayOf(iso: ISODate): ISODate {
  return addDays(iso, 1 - isoWeekday(iso));
}

export function monthOf(iso: ISODate): number {
  return Number(iso.slice(5, 7));
}

export function daysBetween(a: ISODate, b: ISODate): number {
  return dayNumber(b) - dayNumber(a);
}
