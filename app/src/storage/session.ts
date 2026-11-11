/**
 * Glue between storage and the pure engine. This is the only place a clock-derived value
 * (`now`) enters, and it enters as an argument: the caller reads the clock once.
 */
import type { CatalogIndex } from '../engine/catalog';
import { makeGenerator, type DayShape } from '../engine/generate';
import { reconcile, type Moment } from '../engine/lifecycle';
import type { ServingHistory, Settings, Week } from '../model/types';
import { loadHistory, loadSettings, loadWeeks, putWeeks, saveHistory, type PlannerDB } from './db';

export interface EngineConfig {
  index: CatalogIndex;
  shape: DayShape;
}

export interface SessionState {
  weeks: Week[];
  history: ServingHistory;
  settings: Settings;
}

/**
 * On app open (and on navigation into next week, with needNextWeek): fold weeks that have
 * become past, make the current week if it does not exist (first launch shows a week, never
 * an empty state), and make next week if its deadline has passed. One transaction.
 */
export async function openApp(
  db: PlannerDB,
  cfg: EngineConfig,
  now: Moment,
  opts: { needNextWeek?: boolean } = {},
): Promise<SessionState> {
  return db.transaction('rw', db.servingHistory, db.weeks, db.settings, async () => {
    const settings = await loadSettings(db);
    const generate = makeGenerator({ index: cfg.index, settings, shape: cfg.shape });
    const result = reconcile({
      weeks: await loadWeeks(db),
      history: await loadHistory(db),
      now,
      settings,
      generate,
      needNextWeek: opts.needNextWeek === true,
    });
    await saveHistory(db, result.history);
    await putWeeks(db, [...result.updated, ...result.created]);
    return { weeks: await loadWeeks(db), history: result.history, settings };
  });
}
