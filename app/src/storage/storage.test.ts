import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildIndex } from '../engine/catalog';
import { fixtureCatalog, FIXTURE_SHAPE } from '../engine/fixtures';
import { DEFAULT_SETTINGS } from '../model/types';
import { PlannerDB, exportHistory, importHistory, loadHistory, loadSettings, loadWeeks, saveSettings } from './db';
import { openApp } from './session';

const cfg = { index: buildIndex(fixtureCatalog()), shape: FIXTURE_SHAPE };
let n = 0;
let name = '';
beforeEach(() => { name = `test-db-${n++}`; });

describe('storage and open-time lifecycle', () => {
  it('first open generates and stores the current week; a second open creates nothing (idempotent)', async () => {
    const db = new PlannerDB(name);
    const a = await openApp(db, cfg, { date: '2026-11-04', time: '08:00' });
    expect(a.weeks.map((w) => w.weekStart)).toEqual(['2026-11-02']);
    const b = await openApp(db, cfg, { date: '2026-11-04', time: '09:00' });
    expect(b.weeks).toEqual(a.weeks);
  });

  it('survives a cold restart: a fresh connection to the same database sees the same weeks, seed included', async () => {
    const db1 = new PlannerDB(name);
    const a = await openApp(db1, cfg, { date: '2026-11-06', time: '18:00' });
    expect(a.weeks.map((w) => w.weekStart)).toEqual(['2026-11-02', '2026-11-09']);
    db1.close();
    const db2 = new PlannerDB(name);
    expect(await loadWeeks(db2)).toEqual(a.weeks);
    expect((await loadWeeks(db2))[1]!.seed).toBe(a.weeks[1]!.seed);
  });

  it('a week that becomes past is folded into the stored serving history exactly once', async () => {
    const db = new PlannerDB(name);
    await openApp(db, cfg, { date: '2026-11-06', time: '18:00' });
    expect(await loadHistory(db)).toEqual({});
    await openApp(db, cfg, { date: '2026-11-10', time: '08:00' }); // week of 2 Nov is now past
    const h1 = await loadHistory(db);
    expect(Object.keys(h1).length).toBeGreaterThan(0);
    await openApp(db, cfg, { date: '2026-11-11', time: '08:00' });
    expect(await loadHistory(db)).toEqual(h1);
    const weeks = await loadWeeks(db);
    expect(weeks.find((w) => w.weekStart === '2026-11-02')!.folded).toBe(true);
  });

  it('settings round-trip and merge over defaults; history exports and imports', async () => {
    const db = new PlannerDB(name);
    expect(await loadSettings(db)).toEqual(DEFAULT_SETTINGS);
    await saveSettings(db, { ...DEFAULT_SETTINGS, respectSeasons: false });
    expect((await loadSettings(db)).respectSeasons).toBe(false);
    await importHistory(db, JSON.stringify({ 'saar-01': { lastServed: '2026-10-01', timesServed: 2 } }));
    expect(JSON.parse(await exportHistory(db))).toEqual({ 'saar-01': { lastServed: '2026-10-01', timesServed: 2 } });
  });

  it('toggling respectSeasons affects only future generations (GEN-22)', async () => {
    const db = new PlannerDB(name);
    const a = await openApp(db, cfg, { date: '2026-11-04', time: '08:00' });
    await saveSettings(db, { ...DEFAULT_SETTINGS, respectSeasons: false });
    const b = await openApp(db, cfg, { date: '2026-11-04', time: '09:00' });
    expect(b.weeks).toEqual(a.weeks);
  });

  it('a saved schedule moves the next-week deadline on the next open (CAD-06)', async () => {
    const db = new PlannerDB(name);
    await saveSettings(db, { ...DEFAULT_SETTINGS, generationDay: 7 });
    const early = await openApp(db, cfg, { date: '2026-11-06', time: '19:00' });
    expect(early.weeks.map((w) => w.weekStart)).toEqual(['2026-11-02']);
    const sunday = await openApp(db, cfg, { date: '2026-11-08', time: '18:00' });
    expect(sunday.weeks.map((w) => w.weekStart)).toEqual(['2026-11-02', '2026-11-09']);
  });
});
