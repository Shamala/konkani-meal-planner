import { describe, expect, it } from 'vitest';
import { makeGenerator } from '../engine/generate';
import { DEFAULT_SETTINGS } from '../model/types';
import { matchesQuery, setDayMainCooked } from './actions';
import { allDishes, describe as dishInfo, index, shape } from './corpus';

const week = makeGenerator({ index, settings: DEFAULT_SETTINGS, shape })({}, 1, '2026-11-02');
const WED = '2026-11-04';

describe('setDayMainCooked', () => {
  it('sets every main dish on a past day or today, and undoes it', () => {
    const on = setDayMainCooked(week, WED, '2026-11-02', true);
    expect(on.ok && on.week.days[0]!.slots.main.dishes.every((d) => d.cooked)).toBe(true);
    const off = on.ok && setDayMainCooked(on.week, WED, '2026-11-02', false);
    expect(off && off.ok && off.week.days[0]!.slots.main.dishes.some((d) => d.cooked)).toBe(false);
  });
  it('refuses a day ahead and leaves the week untouched', () => {
    expect(setDayMainCooked(week, WED, '2026-11-06', true)).toEqual({ ok: false, reason: 'not-markable' });
  });
});

describe('matchesQuery', () => {
  it('ignores case and accents; every word must appear', () => {
    expect(matchesQuery('Kokum saar', 'KOKUM')).toBe(true);
    expect(matchesQuery('Kokum saar', 'saar kokum')).toBe(true);
    expect(matchesQuery('Kokum saar', 'kokum sambar')).toBe(false);
    expect(matchesQuery('Pāyasam', 'payasam')).toBe(true);
  });
});

describe('describe', () => {
  it('a recipe has a page and no components; a snack has components and no page (DSH-03, DSH-08)', () => {
    const kokum = dishInfo('kokum-saar');
    expect(kokum.page).toBe(9);
    expect(kokum.components).toBeUndefined();
    const snack = allDishes.find((d) => d.kind === 'snack1')!;
    expect(snack.page).toBeUndefined();
    expect(snack.components).toBeTruthy();
  });
  it('a two-page dish carries both pages', () => {
    expect(dishInfo('alu-fry').alsoOnPages).toEqual([36]);
  });
});
