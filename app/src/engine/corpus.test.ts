/**
 * The generator against the real tier-1 corpus (extraction/recipes.tier1.json), not a fixture.
 * Answers GAPS G-25 empirically: do the repeat windows hold with the book's actual pool sizes?
 */
import { describe, expect, it } from 'vitest';
import { index, shape } from '../ui/corpus';
import { addDays, dayNumber, monthOf } from '../model/dates';
import { DEFAULT_SETTINGS, type ServingHistory } from '../model/types';
import { makeGenerator } from './generate';
import { overlayWeek } from './history';

const generate = makeGenerator({ index, settings: DEFAULT_SETTINGS, shape });
const MON = '2026-11-02';

describe('real tier-1 corpus (D5, D6, D7)', () => {
  let history: ServingHistory = {};
  const weeks = Array.from({ length: 52 }, (_, i) => {
    const w = generate(history, 1, addDays(MON, 7 * i));
    history = overlayWeek(history, w);
    return w;
  });
  const mains = weeks.flatMap((w) => w.days.flatMap((d) => d.slots.main.dishes.map((x) => ({ id: x.id, dn: dayNumber(d.date) }))));

  it('generates a year without a position that cannot be filled', () => {
    expect(weeks).toHaveLength(52);
  });
  it('soups never reach the main meal; the dessert pongal never reaches any slot', () => {
    for (const m of mains) expect(index.recipeById.get(m.id)!.role).not.toBe('soup');
    const all = weeks.flatMap((w) => w.days.flatMap((d) => Object.values(d.slots).flatMap((s) => s.dishes.map((x) => x.id))));
    expect(all).not.toContain('pongal-sakkarai');
  });
  it('a standalone rice dish exactly once a week, and it is a rice dish', () => {
    for (const w of weeks) {
      const s = w.days.filter((d) => d.mealType === 'standalone');
      expect(s).toHaveLength(1);
      expect(index.recipeById.get(s[0]!.slots.main.dishes[0]!.id)!.role).toBe('rice-dishes');
    }
  });
  it('no main-meal dish repeats inside the 21-day window, in any position (G-25)', () => {
    const last = new Map<string, number>();
    const violations: string[] = [];
    for (const m of mains) {
      const prev = last.get(m.id);
      if (prev !== undefined && m.dn - prev <= DEFAULT_SETTINGS.repeatWindows.main) violations.push(`${m.id} after ${m.dn - prev} days`);
      last.set(m.id, m.dn);
    }
    expect(violations).toEqual([]);
  });
  it('seasonal dishes are served only in their months (REQUIREMENTS 4.7)', () => {
    let seen = 0;
    for (const w of weeks) {
      for (const d of w.days) {
        for (const slot of Object.values(d.slots)) {
          for (const x of slot.dishes) {
            const season = index.recipeById.get(x.id)?.season;
            if (!season) continue;
            seen++;
            expect(season).toContain(monthOf(w.weekStart));
          }
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });
});
