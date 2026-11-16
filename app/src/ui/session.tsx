/**
 * Boots the engine once and hands the weeks to the screens. The clock is read here, once,
 * and passed in: the engine never reads it (ARCHITECTURE.md 3.5).
 */
import { createContext, use, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { makeGenerator } from '../engine/generate';
import { historyFor, markViewed, weekState, type Moment } from '../engine/lifecycle';
import { regenerateWeek, type WriteContext } from '../engine/slotWrites';
import type { ISODate, Settings, Week } from '../model/types';
import { openApp } from '../storage/session';
import { PlannerDB, putWeeks, saveSettings } from '../storage/db';
import { index, shape } from './corpus';
import { chosenCount } from './actions';

const db = new PlannerDB();

function localNow(): Moment {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return { date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time: `${p(d.getHours())}:${p(d.getMinutes())}` };
}

const now = localNow();
let booting: ReturnType<typeof openApp> | undefined;
// One promise for the page's life, so StrictMode's double render does not open the app twice.
const boot = () =>
  (booting ??= openApp(db, { index, shape }, now).then((s) => {
    // Ask the browser not to evict the serving history under storage pressure (DECISIONS P3).
    try { void navigator.storage?.persist?.(); } catch { /* best effort */ }
    return s;
  }));

interface Session {
  today: ISODate;
  weeks: Week[];
  currentWeek: Week | undefined;
  /** Next week, if it exists. */
  nextWeek: Week | undefined;
  /** Makes next week now if it does not exist yet (LIF-13). Same week the deadline would make (LIF-15). */
  planNextWeek: () => Promise<void>;
  /** Opening next week: plans it if missing, and marks it viewed so the notice goes (LIF-13, LIF-16). */
  viewNext: () => Promise<void>;
  /** Hides the next-week notice for that week; survives a restart (CAD-10). */
  dismissNotice: () => Promise<void>;
  /** Replaces next week with a fresh plan (LIF-03). The UI confirms first. */
  regenerate: () => Promise<void>;
  /** How many dishes in next week the user changed by hand, for the confirm sheet (ASN-10). */
  chosenInNext: () => number;
  /** Persists first, then shows it: a reload never loses a tick. */
  save: (week: Week) => Promise<void>;
  settings: Settings;
  /** What the engine's slot writes need for `week`: the other weeks' history, never its own. */
  writeContext: (week: Week) => WriteContext;
  /** Persists, then shows it. Applies to weeks planned from now on; existing weeks are untouched (GEN-22). */
  saveSettings: (settings: Settings) => Promise<void>;
}

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const initial = use(boot());
  const [weeks, setWeeks] = useState(initial.weeks);
  const save = useCallback(async (week: Week) => {
    await putWeeks(db, [week]);
    setWeeks((ws) => ws.map((w) => (w.weekStart === week.weekStart ? week : w)));
  }, []);
  const [settings, setSettings] = useState(initial.settings);
  const saveAll = useCallback(async (next: Settings) => {
    await saveSettings(db, next);
    setSettings(next);
  }, []);
  const planNextWeek = useCallback(async () => {
    setWeeks((await openApp(db, { index, shape }, now, { needNextWeek: true })).weeks);
  }, []);
  const generator = useMemo(() => makeGenerator({ index, settings, shape }), [settings]);
  const nextOf = useCallback((ws: Week[]) => ws.find((w) => weekState(w.weekStart, now.date) === 'next'), []);
  const viewNext = useCallback(async () => {
    const next = nextOf(weeks);
    if (!next) return planNextWeek();
    if (!next.viewed) await save(markViewed(next));
  }, [weeks, nextOf, planNextWeek, save]);
  const dismissNotice = useCallback(async () => {
    const next = nextOf(weeks);
    if (next) await save({ ...next, noticeDismissed: true });
  }, [weeks, nextOf, save]);
  const regenerate = useCallback(async () => {
    const next = nextOf(weeks);
    if (!next) return;
    const r = regenerateWeek(generator, initial.history, weeks, next, now.date);
    if (r.ok) await save(r.week);
  }, [weeks, nextOf, generator, initial.history, save]);
  const chosenInNext = useCallback(() => {
    const next = nextOf(weeks);
    return next ? chosenCount(next, generator(historyFor(next, initial.history, weeks, now.date), next.seed, next.weekStart)) : 0;
  }, [weeks, nextOf, generator, initial.history]);
  const writeContext = useCallback(
    (week: Week): WriteContext => ({
      env: { index, settings, shape },
      history: historyFor(week, initial.history, weeks, now.date),
      today: now.date,
    }),
    [initial.history, weeks, settings],
  );
  const value = useMemo<Session>(
    () => ({ today: now.date, weeks, currentWeek: weeks.find((w) => weekState(w.weekStart, now.date) === 'current'), nextWeek: nextOf(weeks), planNextWeek, viewNext, dismissNotice, regenerate, chosenInNext, save, settings, writeContext, saveSettings: saveAll }),
    [weeks, nextOf, save, planNextWeek, viewNext, dismissNotice, regenerate, chosenInNext, settings, writeContext, saveAll],
  );
  return <Ctx value={value}>{children}</Ctx>;
}

export function useSession(): Session {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSession outside SessionProvider');
  return s;
}
