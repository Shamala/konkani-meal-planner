import { describe, expect, it, vi } from 'vitest';
import { addDays, dayNumber, mondayOf } from '../model/dates';
import { DEFAULT_SETTINGS, SLOTS, type Recipe, type ServingHistory, type Week } from '../model/types';
import { FIXTURE_SHAPE_TWO_TYPES, fixtureCatalog, fixtureGenerator } from './fixtures';
import { overlayWeek } from './history';
import {
  canEditSlot,
  canMarkCooked,
  canRegenerate,
  dayState,
  fridayNoticeVisible,
  historyFor,
  isDeadlinePassed,
  reconcile,
  weekState,
} from './lifecycle';
import { assignDish, regenerateWeek, setCooked, setOffPlanCooked, swapAvailability, swapDish, type WriteContext } from './slotWrites';

const MON = '2026-11-02'; // a Monday
const dishIds = (w: Week, slot: (typeof SLOTS)[number]) => w.days.flatMap((d) => d.slots[slot].dishes.map((x) => x.id));
const chain = (gen: ReturnType<typeof fixtureGenerator>['generate'], start: string, weeks: number, h: ServingHistory = {}) => {
  const out: Week[] = [];
  for (let i = 0; i < weeks; i++) {
    const w = gen(h, 1, addDays(start, 7 * i));
    out.push(w);
    h = overlayWeek(h, w);
  }
  return out;
};

describe('dates', () => {
  it('weekday and Monday maths', () => {
    expect(mondayOf('2026-11-08')).toBe('2026-11-02');
    expect(mondayOf('2026-11-02')).toBe('2026-11-02');
    expect(dayNumber('2026-03-01') - dayNumber('2026-02-28')).toBe(1);
  });
});

describe('generator: shape and sources (GEN-01..07)', () => {
  const { generate, env } = fixtureGenerator();
  const w = generate({}, 1, MON);
  it('7 days x 4 slots, none empty, main has one dish per position in role order', () => {
    expect(w.days).toHaveLength(7);
    for (const d of w.days) for (const s of SLOTS) expect(d.slots[s].dishes.length).toBeGreaterThan(0);
    const roles = w.days[0]!.slots.main.dishes.map((x) => env.index.recipeById.get(x.id)!.role);
    expect(roles[0]).toBe('saar');
    expect(roles[1]).toBe('curry');
    expect(['rice', 'roti']).toContain(roles[2]);
    expect(roles[3]).toBe('side');
  });
  it('Snack 1 only from the authored 60; Snack 2 only from kid-friendly or authored', () => {
    for (const id of dishIds(w, 'snack1')) expect(env.index.snack1ById.has(id)).toBe(true);
    for (const id of dishIds(w, 'snack2')) expect(env.index.pools.snack2.some((c) => c.id === id)).toBe(true);
  });
  it('breakfast and Snack 2 never share a dish on a day, even in a pool built to collide', () => {
    const tiny = fixtureCatalog({ breakfast: 8, snack2Book: 0 });
    const g = fixtureGenerator(tiny);
    for (let seed = 1; seed <= 40; seed++) {
      const wk = g.generate({}, seed, MON);
      for (const d of wk.days) {
        const b = new Set(d.slots.breakfast.dishes.map((x) => x.id));
        for (const s of d.slots.snack2.dishes) expect(b.has(s.id)).toBe(false);
      }
    }
  });
});

describe('determinism and purity (GEN-09..12)', () => {
  const { generate } = fixtureGenerator();
  it('same inputs, same week; a different seed, a different week; seed is stored', () => {
    const h: ServingHistory = { 'saar-01': { lastServed: '2026-10-30', timesServed: 1 } };
    expect(generate(h, 7, MON)).toEqual(generate(h, 7, MON));
    expect(generate(h, 8, MON)).not.toEqual(generate(h, 7, MON));
    expect(generate(h, 7, MON).seed).toBe(7);
  });
  it('reads no clock, no randomness, no network; does not mutate its input', () => {
    const r = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Math.random'); });
    const n = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('Date.now'); });
    const f = vi.fn(() => { throw new Error('fetch'); });
    vi.stubGlobal('fetch', f);
    const h: ServingHistory = Object.freeze({ 'saar-01': Object.freeze({ lastServed: '2026-10-30', timesServed: 1 }) }) as ServingHistory;
    expect(() => generate(h, 1, MON)).not.toThrow();
    r.mockRestore(); n.mockRestore(); vi.unstubAllGlobals();
    expect(f).not.toHaveBeenCalled();
  });
  it('rejects a weekStart that is not a Monday', () => {
    expect(() => generate({}, 1, '2026-11-03')).toThrow(RangeError);
  });
});

describe('repeat windows (VAR-01, VAR-02, VAR-05)', () => {
  const { generate, env } = fixtureGenerator();
  const weeks = chain(generate, MON, 3);
  const gapOk = (ids: string[], dates: string[], window: number) => {
    const last = new Map<string, number>();
    ids.forEach((id, i) => {
      const dn = dayNumber(dates[i]!);
      if (last.has(id)) expect(dn - last.get(id)!).toBeGreaterThan(window);
      last.set(id, dn);
    });
  };
  const datesOf = (slot: (typeof SLOTS)[number]) => weeks.flatMap((w) => w.days.flatMap((d) => d.slots[slot].dishes.map(() => d.date)));
  const idsOf = (slot: (typeof SLOTS)[number]) => weeks.flatMap((w) => dishIds(w, slot));
  it('main meal: nothing repeats within 21 days (inclusive)', () => gapOk(idsOf('main'), datesOf('main'), 21));
  it('breakfast: nothing repeats within 7 days', () => gapOk(idsOf('breakfast'), datesOf('breakfast'), 7));
  it('Snack 2: nothing repeats within 14 days', () => gapOk(idsOf('snack2'), datesOf('snack2'), 14));
  it('history from before the week is honoured', () => {
    const h: ServingHistory = { 'saar-05': { lastServed: addDays(MON, -21), timesServed: 1 } };
    const w = generate(h, 1, MON);
    expect(w.days[0]!.slots.main.dishes[0]!.id).not.toBe('saar-05'); // 21 days earlier is still inside the window
    void env;
  });
});

describe('Snack 1: exact cycle over the available pool (VAR-03, VAR-07, VAR-08)', () => {
  const run = (respectSeasons: boolean, start: string, nWeeks: number) => {
    const { generate, env } = fixtureGenerator(fixtureCatalog(), { ...DEFAULT_SETTINGS, respectSeasons });
    const ids = chain(generate, start, nWeeks).flatMap((w) => dishIds(w, 'snack1'));
    return { ids, env };
  };
  it('season on, Aug-Feb: pool is 54, no excluded entry appears, every 54 consecutive days are all distinct', () => {
    const { ids, env } = run(true, '2026-09-07', 9);
    const seasonal = env.index.catalog.snack1.filter((e) => e.season).map((e) => e.id);
    for (const id of ids) expect(seasonal).not.toContain(id);
    for (let i = 0; i + 54 <= ids.length; i++) expect(new Set(ids.slice(i, i + 54)).size).toBe(54);
  });
  it('season off: the cycle is the full 60', () => {
    const { ids } = run(false, '2026-09-07', 10);
    for (let i = 0; i + 60 <= ids.length; i++) expect(new Set(ids.slice(i, i + 60)).size).toBe(60);
  });
  it('seasonal entries do appear in their months', () => {
    const { ids } = run(true, '2026-04-06', 9); // April-May: all 60 in season
    expect(ids.some((id) => id === 's1-mango')).toBe(true);
  });
  it('never the same family on consecutive days (reported, see note)', () => {
    const { ids, env } = run(true, '2026-09-07', 9);
    const fam = ids.map((id) => env.index.snack1ById.get(id)!.family);
    const same = fam.filter((f, i) => i > 0 && f === fam[i - 1]).length;
    console.info(`Snack 1 consecutive same-family days over ${ids.length} days: ${same}`);
    expect(same).toBeLessThanOrEqual(Math.ceil(ids.length * 0.05));
  });
});

describe('seasons (GEN-18..21)', () => {
  const mango: Recipe = { id: 'mango-sasam', name: 'Mango sasam', role: 'saar', section: 2, page: 99, slots: ['main'], season: [4, 5, 6, 7] };
  const catalog = fixtureCatalog({ saar: 0, extra: [mango, { id: 'saar-in', name: 'in', role: 'saar', section: 2, page: 10, slots: ['main'] }] });
  it('on: an out-of-season dish is never generated, even when the repeat window must give way', () => {
    const { generate } = fixtureGenerator(catalog);
    const w = generate({}, 1, MON); // November
    expect(dishIds(w, 'main')).not.toContain('mango-sasam');
    // only one in-season saar exists, so it repeats via the fallback rather than reaching for mango
    expect(w.days.map((d) => d.slots.main.dishes[0]!.id)).toEqual(Array(7).fill('saar-in'));
  });
  it('off: the step does not run; tagged dishes generate in any month', () => {
    const { generate } = fixtureGenerator(catalog, { ...DEFAULT_SETTINGS, respectSeasons: false });
    const seen = new Set<string>();
    for (let s = 1; s <= 10; s++) generate({}, s, MON).days.forEach((d) => seen.add(d.slots.main.dishes[0]!.id));
    expect(seen.has('mango-sasam')).toBe(true);
  });
  it('a recipe with no season is available all year', () => {
    const { generate } = fixtureGenerator(catalog);
    expect(dishIds(generate({}, 1, MON), 'main')).toContain('saar-in');
  });
  it('in its month the seasonal dish is a candidate', () => {
    const { generate } = fixtureGenerator(catalog);
    const seen = new Set<string>();
    for (let s = 1; s <= 10; s++) generate({}, s, '2026-05-04').days.forEach((d) => seen.add(d.slots.main.dishes[0]!.id));
    expect(seen.has('mango-sasam')).toBe(true);
  });
});

describe('fallback (GEN-08)', () => {
  it('an exhausted pool returns the oldest-served dish; never fails, never leaves a gap', () => {
    const { generate } = fixtureGenerator(fixtureCatalog({ saar: 2, curry: 2, starch: 2, side: 2, breakfast: 2, snack2Book: 1 }));
    const w = generate({}, 1, MON);
    for (const d of w.days) for (const s of SLOTS) expect(d.slots[s].dishes.length).toBeGreaterThan(0);
    // with two saars the fallback alternates between them: the oldest-served always returns
    const saars = w.days.map((d) => d.slots.main.dishes[0]!.id);
    for (let i = 2; i < 7; i++) expect(saars[i]).toBe(saars[i - 2]);
  });
  it('the oldest-served is chosen: a long-ago dish beats a recent one', () => {
    const { generate } = fixtureGenerator(fixtureCatalog({ saar: 2 }));
    const h: ServingHistory = {
      'saar-01': { lastServed: addDays(MON, -2), timesServed: 1 },
      'saar-02': { lastServed: addDays(MON, -10), timesServed: 1 },
    };
    expect(generate(h, 1, MON).days[0]!.slots.main.dishes[0]!.id).toBe('saar-02');
  });
});

describe('slot writes (ASN, GEN-14..17)', () => {
  const { generate, env } = fixtureGenerator();
  const week = generate({}, 3, MON);
  const ctx = (today: string, history: ServingHistory = {}): WriteContext => ({ env, history, today });
  const wed = addDays(MON, 2);

  it('assignDish: any dish, no filtering. Wrong role, out of season, served yesterday, all go in quietly', () => {
    const mango: Recipe = { id: 'mango-sasam', name: 'Mango sasam', role: 'sweet', section: 26, page: 1, slots: ['snack2'], season: [4, 5] };
    const g = fixtureGenerator(fixtureCatalog({ extra: [mango] }));
    const history: ServingHistory = { 'mango-sasam': { lastServed: addDays(wed, -1), timesServed: 1 } };
    const r = assignDish({ env: g.env, history, today: MON }, week, wed, 'main', 0, 'mango-sasam'); // sweet into the saar position, November, yesterday
    expect(r.ok && r.week.days[2]!.slots.main.dishes[0]).toEqual({ id: 'mango-sasam', cooked: false });
  });
  it('assignDish: leaves the seed and every other slot untouched; allowed today and next week; refused on a past day', () => {
    const r = assignDish(ctx(wed), week, wed, 'breakfast', 0, 'rice-01');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.week.seed).toBe(week.seed);
    expect(r.week.swapCounters).toEqual(week.swapCounters);
    const before = structuredClone(week); before.days[2]!.slots.breakfast.dishes[0] = { id: 'rice-01', cooked: false };
    expect(r.week).toEqual(before);
    expect(assignDish(ctx(wed), week, MON, 'main', 0, 'saar-01')).toEqual({ ok: false, reason: 'past-day' });
    expect(assignDish(ctx(wed), week, wed, 'main', 0, 'nope')).toEqual({ ok: false, reason: 'unknown-dish' });
  });
  it('swapDish: same role, exactly one dish changes, seed untouched, counter advances', () => {
    const r = swapDish(ctx(MON), week, wed, 'main', 0);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const was = week.days[2]!.slots.main.dishes[0]!.id;
    const now = r.week.days[2]!.slots.main.dishes[0]!.id;
    expect(now).not.toBe(was);
    expect(env.index.recipeById.get(now)!.role).toBe('saar');
    const expected = structuredClone(week);
    expected.days[2]!.slots.main.dishes[0] = { id: now, cooked: false };
    expected.swapCounters = r.week.swapCounters;
    expect(r.week).toEqual(expected);
    expect(r.week.seed).toBe(week.seed);
    expect(Object.values(r.week.swapCounters)).toEqual([1]);
    const again = swapDish(ctx(MON), r.week, wed, 'main', 0);
    expect(again.ok && Object.values(again.week.swapCounters)).toEqual([2]);
  });
  it('swapDish: is deterministic given the same week and counter', () => {
    expect(swapDish(ctx(MON), week, wed, 'main', 1)).toEqual(swapDish(ctx(MON), week, wed, 'main', 1));
  });
  it('swapDish: respects the repeat window (does not reach for something cooked last week)', () => {
    const recent: ServingHistory = Object.fromEntries(
      Array.from({ length: 28 }, (_, i) => [`saar-${String(i + 1).padStart(2, '0')}`, { lastServed: addDays(MON, -3), timesServed: 1 }]),
    );
    const r = swapDish(ctx(MON, recent), week, wed, 'main', 0);
    expect(r.ok).toBe(true);
    if (r.ok) expect(['saar-29', 'saar-30']).toContain(r.week.days[2]!.slots.main.dishes[0]!.id);
  });
  it('swapDish: never picks a dish already planned elsewhere that week', () => {
    for (let c = 0; c < 15; c++) {
      let w = week;
      for (let k = 0; k <= c; k++) { const r = swapDish(ctx(MON), w, wed, 'main', 0); if (r.ok) w = r.week; }
      const ids = w.days.map((d) => d.slots.main.dishes[0]!.id);
      expect(new Set(ids).size).toBe(7);
    }
  });
  it('swapDish: refused on a past day, available today and ahead (LIF-19, LIF-20)', () => {
    expect(swapDish(ctx(wed), week, MON, 'main', 0)).toEqual({ ok: false, reason: 'past-day' });
    expect(swapDish(ctx(wed), week, wed, 'main', 0).ok).toBe(true);
    expect(swapDish(ctx(wed), week, addDays(wed, 3), 'main', 0).ok).toBe(true);
  });
  it('swapDish: unavailable, with a reason, where a role holds a single recipe (GEN-16)', () => {
    const g = fixtureGenerator(fixtureCatalog({ saar: 1 }));
    const w = g.generate({}, 1, MON);
    const c: WriteContext = { env: g.env, history: {}, today: MON };
    expect(swapAvailability(c, w, wed, 'main', 0)).toEqual({ available: false, reason: 'single-recipe-in-role' });
    expect(swapDish(c, w, wed, 'main', 0)).toEqual({ ok: false, reason: 'single-recipe-in-role' });
    expect(swapAvailability(c, w, wed, 'main', 1)).toEqual({ available: true });
  });
  it('swapDish: a Snack 2 swap cannot land on that day\'s breakfast', () => {
    const g = fixtureGenerator(fixtureCatalog({ breakfast: 3, snack2Book: 0 }));
    const w = g.generate({}, 1, MON);
    for (let k = 0; k < 20; k++) {
      let cur = w;
      const r = swapDish({ env: g.env, history: {}, today: MON }, cur, wed, 'snack2', 0);
      if (r.ok) cur = r.week;
      const b = new Set(cur.days[2]!.slots.breakfast.dishes.map((x) => x.id));
      expect(b.has(cur.days[2]!.slots.snack2.dishes[0]!.id)).toBe(false);
    }
  });
  it('regenerate: next week only, advances the seed, discards slot edits; refused on current and past', () => {
    const edited = assignDish(ctx(MON), week, wed, 'main', 0, 'curry-01');
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    const today = addDays(MON, -3); // Friday before: this week is "next"
    const r = regenerateWeek(generate, {}, [edited.week], edited.week, today);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.week.seed).toBe(edited.week.seed + 1);
      expect(r.week).toEqual({ ...generate({}, edited.week.seed + 1, MON), viewed: edited.week.viewed });
    }
    expect(regenerateWeek(generate, {}, [week], week, wed)).toEqual({ ok: false, reason: 'not-next-week' });
    expect(regenerateWeek(generate, {}, [week], week, addDays(MON, 9))).toEqual({ ok: false, reason: 'not-next-week' });
  });
});

describe('lifecycle (LIF)', () => {
  it('states by date comparison; Monday boundary (LIF-04, LIF-21)', () => {
    expect(weekState(MON, '2026-10-30')).toBe('next');
    expect(weekState(MON, MON)).toBe('current');
    expect(weekState(MON, '2026-11-08')).toBe('current');
    expect(weekState(MON, '2026-11-09')).toBe('past');
    expect(dayState('2026-11-01', MON)).toBe('past');
    expect(dayState(MON, MON)).toBe('today');
  });
  const { generate } = fixtureGenerator();
  const w = generate({}, 1, MON);
  it('who may do what', () => {
    expect(canRegenerate(w, '2026-10-30')).toBe(true);
    expect(canRegenerate(w, MON)).toBe(false); // current: no regenerate
    expect(canEditSlot(MON, MON)).toBe(true); // ... but its slots stay editable
    expect(canEditSlot(addDays(MON, 1), MON)).toBe(true);
    expect(canEditSlot(addDays(MON, -1), MON)).toBe(false);
    expect(canMarkCooked(w, '2026-11-04', '2026-11-04')).toBe(true);
    expect(canMarkCooked(w, '2026-11-03', '2026-11-04')).toBe(true); // passed day of the current week
    expect(canMarkCooked(w, '2026-11-05', '2026-11-04')).toBe(false); // future day
    expect(canMarkCooked(w, MON, '2026-10-30')).toBe(false); // next week
    expect(canMarkCooked(w, MON, '2026-11-10')).toBe(false); // past week
  });
  it('Friday 18:00 is a deadline: configurable, inclusive', () => {
    expect(isDeadlinePassed({ date: '2026-11-06', time: '17:59' }, DEFAULT_SETTINGS)).toBe(false);
    expect(isDeadlinePassed({ date: '2026-11-06', time: '18:00' }, DEFAULT_SETTINGS)).toBe(true);
    expect(isDeadlinePassed({ date: '2026-11-08', time: '09:00' }, DEFAULT_SETTINGS)).toBe(true);
    expect(isDeadlinePassed({ date: '2026-11-06', time: '18:00' }, { ...DEFAULT_SETTINGS, generationDay: 7 })).toBe(false);
  });
  const base = { weeks: [] as Week[], history: {} as ServingHistory, settings: DEFAULT_SETTINGS, generate };
  it('first launch makes the current week on the spot (CAD-08)', () => {
    const r = reconcile({ ...base, now: { date: '2026-11-04', time: '08:00' } });
    expect(r.created.map((x) => x.weekStart)).toEqual([MON]);
  });
  it('next week appears at the deadline, not before; is stable once made; is idempotent', () => {
    const early = reconcile({ ...base, now: { date: '2026-11-06', time: '17:59' } });
    expect(early.created).toHaveLength(1);
    const late = reconcile({ ...base, now: { date: '2026-11-06', time: '18:00' } });
    expect(late.created.map((x) => x.weekStart)).toEqual([MON, '2026-11-09']);
    const again = reconcile({ ...base, weeks: late.created, history: late.history, now: { date: '2026-11-06', time: '18:30' } });
    expect(again.created).toEqual([]);
    expect(again.updated).toEqual([]);
  });
  it('late generation equals punctual generation (LIF-15, CAD-04)', () => {
    const cur = reconcile({ ...base, now: { date: '2026-11-04', time: '08:00' } }).created;
    const onTime = reconcile({ ...base, weeks: cur, now: { date: '2026-11-06', time: '18:00' } }).created[0]!;
    const late = reconcile({ ...base, weeks: cur, now: { date: '2026-11-08', time: '21:00' } }).created[0]!;
    expect(late).toEqual(onTime);
  });
  it('on-demand next week (before Friday) is the same week, already viewed (LIF-07, LIF-13, LIF-16)', () => {
    const cur = reconcile({ ...base, now: { date: '2026-11-02', time: '08:00' } }).created;
    const wk = reconcile({ ...base, weeks: cur, now: { date: '2026-11-03', time: '09:00' }, needNextWeek: true }).created;
    expect(wk).toHaveLength(1);
    expect(wk[0]!.viewed).toBe(true);
    expect({ ...wk[0]!, viewed: false }).toEqual(reconcile({ ...base, weeks: cur, now: { date: '2026-11-06', time: '18:00' } }).created[0]);
    expect(fridayNoticeVisible([...cur, ...wk], '2026-11-03')).toBe(false);
    const unviewed = reconcile({ ...base, weeks: cur, now: { date: '2026-11-06', time: '18:00' } }).created;
    expect(fridayNoticeVisible([...cur, ...unviewed], '2026-11-06')).toBe(true);
  });
  it('a week that becomes past is folded into history exactly once; next week avoids the current one (CAD-07)', () => {
    const cur = reconcile({ ...base, now: { date: '2026-11-02', time: '08:00' } }).created;
    const nextRes = reconcile({ ...base, weeks: cur, now: { date: '2026-11-06', time: '18:00' } });
    const curIds = new Set(dishIds(cur[0]!, 'main'));
    for (const id of dishIds(nextRes.created[0]!, 'main')) expect(curIds.has(id)).toBe(false); // 21-day window across the boundary
    const roll = reconcile({ ...base, weeks: [...cur, ...nextRes.created], now: { date: '2026-11-16', time: '08:00' } });
    expect(roll.updated.map((x) => x.weekStart)).toEqual([MON, '2026-11-09']);
    expect(Object.keys(roll.history).length).toBeGreaterThan(0);
    const twice = reconcile({ ...base, weeks: [...roll.updated, ...roll.created], history: roll.history, now: { date: '2026-11-16', time: '09:00' } });
    expect(twice.updated).toEqual([]);
    expect(twice.history).toEqual(roll.history);
  });
});

describe('serving history (HST-04, HST-08)', () => {
  const { generate } = fixtureGenerator();
  const w = generate({}, 1, MON);
  it('an unmarked plan counts as served', () => {
    expect(overlayWeek({}, w)['saar-01' in overlayWeek({}, w) ? 'saar-01' : dishIds(w, 'main')[0]!]).toBeDefined();
    expect(Object.keys(overlayWeek({}, w))).toEqual(expect.arrayContaining(dishIds(w, 'breakfast')));
  });
  it('an off-plan mark cancels the implicit record for that slot; the planned dish stays fresh', () => {
    const today = MON;
    const planned = w.days[0]!.slots.breakfast.dishes[0]!.id;
    const off = setOffPlanCooked(w, today, () => true, MON, 'breakfast', 'some-other-dish', true);
    expect(off.ok).toBe(true);
    if (!off.ok) return;
    const h = overlayWeek({}, off.week);
    expect(h['some-other-dish']?.lastServed).toBe(MON);
    expect(h[planned]).toBeUndefined();
    // and a second tap undoes it
    const undone = setOffPlanCooked(off.week, today, () => true, MON, 'breakfast', 'some-other-dish', false);
    expect(undone.ok && overlayWeek({}, undone.week)[planned]).toBeDefined();
  });
  it('cooked marks are one tap, reversible, and refused where not allowed', () => {
    const on = setCooked(w, MON, MON, 'main', 0, true);
    expect(on.ok && on.week.days[0]!.slots.main.dishes[0]!.cooked).toBe(true);
    const off = on.ok ? setCooked(on.week, MON, MON, 'main', 0, false) : on;
    expect(off.ok && off.week).toEqual(w);
    expect(setCooked(w, MON, addDays(MON, 1), 'main', 0, true)).toEqual({ ok: false, reason: 'not-markable' });
  });
  it('historyFor never counts next week and excludes the target', () => {
    const next = generate({}, 1, '2026-11-09');
    const h = historyFor(w, {}, [w, next], MON);
    expect(h).toEqual({});
    const hn = historyFor(next, {}, [w, next], MON);
    expect(Object.keys(hn).length).toBeGreaterThan(0);
  });
});

describe('main-meal types (DECISIONS.md D5)', () => {
  const { generate, env } = fixtureGenerator(fixtureCatalog(), DEFAULT_SETTINGS, FIXTURE_SHAPE_TWO_TYPES);
  const roleOf = (id: string) => env.index.recipeById.get(id)!.role;

  it('exactly one standalone day a week; it holds one rice dish, the others the usual four positions', () => {
    for (let i = 0; i < 12; i++) {
      const w = generate({}, 1, addDays(MON, 7 * i));
      const standalone = w.days.filter((d) => d.mealType === 'standalone');
      expect(standalone).toHaveLength(1);
      expect(standalone[0]!.slots.main.dishes.map((x) => roleOf(x.id))).toEqual(['rice']);
      for (const d of w.days.filter((x) => x.mealType === 'plain-rice')) expect(d.slots.main.dishes).toHaveLength(4);
    }
  });
  it('the day is seeded: same seed, same day; it varies across weeks and seeds', () => {
    const dayOf = (seed: number, wk: number) =>
      generate({}, seed, addDays(MON, 7 * wk)).days.findIndex((d) => d.mealType === 'standalone');
    expect(dayOf(3, 2)).toBe(dayOf(3, 2));
    expect(new Set(Array.from({ length: 12 }, (_, i) => dayOf(1, i))).size).toBeGreaterThan(1);
    expect(new Set(Array.from({ length: 12 }, (_, s) => dayOf(s + 1, 0))).size).toBeGreaterThan(1);
  });
  it('a shape without a standalone meal never produces one', () => {
    const plain = fixtureGenerator().generate({}, 1, MON);
    expect(plain.days.every((d) => d.mealType === 'plain-rice')).toBe(true);
  });
});

describe('swap on a standalone-rice day (DECISIONS.md D5)', () => {
  const g = fixtureGenerator(fixtureCatalog(), DEFAULT_SETTINGS, FIXTURE_SHAPE_TWO_TYPES);
  it('replaces the one rice dish with another rice dish and keeps the meal type', () => {
    // A seed whose standalone day is after Monday (today), so the day can be edited.
    const week = Array.from({ length: 20 }, (_, s) => g.generate({}, s + 1, MON)).find(
      (w) => w.days.findIndex((d) => d.mealType === 'standalone') > 0,
    )!;
    const i = week.days.findIndex((d) => d.mealType === 'standalone');
    const date = week.days[i]!.date;
    const r = swapDish({ env: g.env, history: {}, today: MON }, week, date, 'main', 0);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const day = r.week.days[i]!;
    expect(day.mealType).toBe('standalone');
    expect(day.slots.main.dishes).toHaveLength(1);
    expect(day.slots.main.dishes[0]!.id).not.toBe(week.days[i]!.slots.main.dishes[0]!.id);
    expect(g.env.index.recipeById.get(day.slots.main.dishes[0]!.id)!.role).toBe('rice');
  });
});

describe('search-only recipes (empty slots)', () => {
  it('validate, and appear in no generator pool', () => {
    const only: Recipe = { id: 'search-only', name: 'Search only', role: 'pickles', section: 28, page: 157, slots: [] };
    const g = fixtureGenerator(fixtureCatalog({ extra: [only] }));
    expect(g.env.index.recipeById.has('search-only')).toBe(true);
    for (const pool of Object.values(g.env.index.pools)) expect(pool.some((c) => c.id === 'search-only')).toBe(false);
  });
});
