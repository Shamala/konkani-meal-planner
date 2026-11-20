import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { buildIndex } from '../engine/catalog';
import { makeGenerator } from '../engine/generate';
import { historyFor, markViewed } from '../engine/lifecycle';
import { assignDish, regenerateWeek, swapDish, type WriteContext } from '../engine/slotWrites';
import { PlannerDB, loadWeeks, putWeeks } from '../storage/db';
import { openApp } from '../storage/session';
import { DEFAULT_SETTINGS } from '../model/types';
import { chosenCount, dishAction, matchesIngredients, matchesQuery, pickerDays, setDayMainCooked, weekRange } from './actions';
import { splitIngredients } from './ingredients';
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

describe('dishAction (DSH-09 to DSH-11, LIF-20, LIF-23)', () => {
  const ctx = { env: { index, settings: DEFAULT_SETTINGS, shape }, history: {}, today: WED };
  const at = (date: string) => {
    const day = week.days.find((d) => d.date === date)!;
    return dishAction(ctx, week, { date, slot: 'main', index: 0 }, day.slots.main.dishes[0]!.id);
  };
  it('offers swap on a day after today', () => {
    expect(at('2026-11-06')).toEqual({ kind: 'swap' });
  });
  it("explains why not on today and on a passed day, in place of the control", () => {
    expect(at(WED)).toEqual({ kind: 'inert', reason: "Today's plan is fixed. Swap works from tomorrow." });
    expect(at('2026-11-02')).toEqual({ kind: 'inert', reason: 'This day is done. Swapping works on days still to come.' });
  });
});

describe('pickerDays (ASN-04, ASN-08)', () => {
  it('offers only days after today in the current week', () => {
    expect(pickerDays(week, WED).map((d) => d.date)).toEqual(['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']);
  });
  it('offers all seven days of a week that has not begun', () => {
    expect(pickerDays(week, '2026-11-01')).toHaveLength(7);
  });
});

describe('chosenCount and weekRange (ASN-10, DESIGN 3.6, 3.7)', () => {
  it('counts dishes that differ from the seeded plan', () => {
    const edited = structuredClone(week);
    expect(chosenCount(edited, week)).toBe(0);
    edited.days[2]!.slots.breakfast.dishes[0]!.id = 'some-other-dish';
    edited.days[3]!.slots.main.dishes[0]!.id = 'another-dish';
    expect(chosenCount(edited, week)).toBe(2);
  });
  it('writes the week range with the month once or twice', () => {
    expect(weekRange('2026-11-23')).toBe('23 to 29 November');
    expect(weekRange('2026-11-30')).toBe('30 November to 6 December');
  });
});

describe('ingredients (DSH-04, DSH-06, SRC-02)', () => {
  const list = [
    { qtyText: '2 cups brinjal', item: 'brinjal' },
    { qtyText: '1 tsp mustard seeds', item: 'mustard-seeds' },
    { qtyText: 'salt to taste', item: 'salt', unresolved: true },
    { qtyText: '1 handful bimbli', item: 'bimbli', unresolved: true },
  ];
  it('hides seasonings behind show-all and keeps an unknown ingredient with its own words', () => {
    const { major, seasonings } = splitIngredients(list);
    expect(major.map((i) => i.qtyText)).toEqual(['2 cups brinjal', '1 handful bimbli']);
    expect(seasonings.map((i) => i.qtyText)).toEqual(['1 tsp mustard seeds', 'salt to taste']);
  });
  it('matches a query on the book words and the glossary name', () => {
    expect(matchesIngredients(list, 'brinjal')).toBe(true);
    expect(matchesIngredients(list, 'BIMBLI')).toBe(true);
    expect(matchesIngredients(list, 'jackfruit')).toBe(false);
    expect(matchesIngredients(list, '')).toBe(false);
  });
});

describe('dishAction refusal reasons (GEN-16, DSH-11)', () => {
  // The real corpus has no one-recipe role, so shrink one: keep two 'stuffed-curries' recipes
  // (or one), as the test needs.
  const stuffed = index.catalog.recipes.filter((r) => r.role === 'stuffed-curries');
  const envWith = (keep: typeof stuffed) => {
    const cat = { ...index.catalog, recipes: [...index.catalog.recipes.filter((r) => r.role !== 'stuffed-curries'), ...keep] };
    return { index: buildIndex(cat), settings: DEFAULT_SETTINGS, shape };
  };
  const put = (env: ReturnType<typeof envWith>, id: string) => {
    const w = makeGenerator(env)({}, 1, '2026-11-02');
    w.days[4]!.slots.main.dishes[0]!.id = id; // Friday, after today
    return { ctx: { env, history: {}, today: WED }, w };
  };
  const plan = { date: '2026-11-06', slot: 'main', index: 0 } as const;

  it('single-recipe role: says the section has only one recipe', () => {
    const { ctx, w } = put(envWith([stuffed[0]!]), stuffed[0]!.id);
    const a = dishAction(ctx, w, plan, stuffed[0]!.id);
    expect(a.kind).toBe('inert');
    expect(a.kind === 'inert' && a.reason).toBe(`${dishInfo(stuffed[0]!.id).sectionName} has only one recipe, so there is nothing to swap it for.`);
  });
  it('another recipe exists but is out of season: says no other dish fits right now', () => {
    const other = { ...stuffed[1]!, season: [4, 5] }; // November is not April or May
    const { ctx, w } = put(envWith([stuffed[0]!, other]), stuffed[0]!.id);
    expect(dishAction(ctx, w, plan, stuffed[0]!.id)).toEqual({
      kind: 'inert',
      reason: 'There is no other dish that fits here right now, so there is nothing to swap it for.',
    });
  });
});

describe('Add to a meal beyond the picker (ASN-02, ASN-04, ASN-08, ASN-09)', () => {
  const env = { index, settings: DEFAULT_SETTINGS, shape };
  const gen = makeGenerator(env);
  const next = gen({}, 1, '2026-11-09');
  const ctx: WriteContext = { env, history: {}, today: WED };
  const dish = allDishes.find((d) => d.kind === 'snack2' && d.id !== week.days[5]!.slots.snack2.dishes[0]!.id)!.id;

  it('replaces the dish in a later day of this week, leaving seed and the rest alone', () => {
    const r = assignDish(ctx, week, '2026-11-07', 'snack2', 0, dish);
    expect(r.ok && r.week.days[5]!.slots.snack2.dishes[0]).toEqual({ id: dish, cooked: false });
    expect(r.ok && r.week.seed).toBe(week.seed);
    expect(r.ok && chosenCount(r.week, week)).toBe(1);
  });
  it('reaches every day of next week, which the picker offers in full', () => {
    expect(pickerDays(next, WED)).toHaveLength(7);
    for (const d of next.days) {
      const r = assignDish(ctx, next, d.date, 'main', 0, dish);
      expect(r.ok && r.week.days.find((x) => x.date === d.date)!.slots.main.dishes[0]!.id).toBe(dish);
    }
  });
  it('never writes today or a passed day', () => {
    expect(assignDish(ctx, week, WED, 'main', 0, dish)).toEqual({ ok: false, reason: 'past-day' });
    expect(assignDish(ctx, week, '2026-11-02', 'main', 0, dish)).toEqual({ ok: false, reason: 'past-day' });
  });
});

describe('main flow end to end, on a real IndexedDB stand-in', () => {
  it('generate week, view next week, swap, add to a meal, restart, regenerate', async () => {
    const db = new PlannerDB('e2e-main-flow');
    const cfg = { index, shape };
    const now = { date: WED, time: '10:00' }; // Wednesday: next week not yet due
    const gen = makeGenerator({ index, settings: DEFAULT_SETTINGS, shape });

    // First launch makes this week only.
    let s = await openApp(db, cfg, now);
    expect(s.weeks.map((w) => w.weekStart)).toEqual(['2026-11-02']);
    const current = s.weeks[0]!;

    // Next week on demand; viewing it marks it viewed and persists.
    s = await openApp(db, cfg, now, { needNextWeek: true });
    let nextWeek = s.weeks.find((w) => w.weekStart === '2026-11-09')!;
    expect(nextWeek).toBeDefined();
    await putWeeks(db, [markViewed(nextWeek)]);
    nextWeek = (await loadWeeks(db)).find((w) => w.weekStart === '2026-11-09')!;
    expect(nextWeek.viewed).toBe(true);
    const seeded = structuredClone(nextWeek);

    // Swap one dish, then assign another by hand; both change exactly their own slot.
    const ctx = (w: typeof nextWeek): WriteContext => ({ env: { index, settings: s.settings, shape }, history: historyFor(w, s.history, s.weeks, WED), today: WED });
    const swapped = swapDish(ctx(nextWeek), nextWeek, '2026-11-10', 'main', 0);
    expect(swapped.ok).toBe(true);
    if (!swapped.ok) return;
    expect(swapped.week.days[1]!.slots.main.dishes[0]!.id).not.toBe(seeded.days[1]!.slots.main.dishes[0]!.id);
    const pick = allDishes.find((d) => d.kind === 'snack1')!.id;
    const added = assignDish(ctx(swapped.week), swapped.week, '2026-11-12', 'snack1', 0, pick);
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.week.days[3]!.slots.snack1.dishes[0]!.id).toBe(pick);
    expect(chosenCount(added.week, seeded)).toBeGreaterThanOrEqual(2);
    await putWeeks(db, [added.week]);

    // Restart: the choices survive and the current week is untouched.
    s = await openApp(db, cfg, now);
    nextWeek = s.weeks.find((w) => w.weekStart === '2026-11-09')!;
    expect(nextWeek).toEqual(added.week);
    expect(s.weeks.find((w) => w.weekStart === '2026-11-02')).toEqual(current);

    // Regenerate replaces what was chosen (the sheet says so), advances the seed, keeps `viewed`.
    const r = regenerateWeek(gen, s.history, s.weeks, nextWeek, WED);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.week.seed).toBe(nextWeek.seed + 1);
    expect(r.week.viewed).toBe(true);
    expect(r.week.days[3]!.slots.snack1.dishes[0]!.id).not.toBe(pick);
    expect(chosenCount(r.week, gen(historyFor(r.week, s.history, s.weeks, WED), r.week.seed, r.week.weekStart))).toBe(0);
    // And it is refused on the current week.
    expect(regenerateWeek(gen, s.history, s.weeks, current, WED)).toEqual({ ok: false, reason: 'not-next-week' });
  });
});
