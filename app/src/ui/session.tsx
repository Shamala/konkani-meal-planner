/**
 * Boots the engine once and hands the weeks to the screens. The clock is read here, once,
 * and passed in: the engine never reads it (ARCHITECTURE.md 3.5).
 */
import { createContext, use, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { historyFor, weekState, type Moment } from '../engine/lifecycle';
import type { WriteContext } from '../engine/slotWrites';
import type { ISODate, Settings, Week } from '../model/types';
import { openApp } from '../storage/session';
import { PlannerDB, putWeeks, saveSettings } from '../storage/db';
import { index, shape } from './corpus';

const db = new PlannerDB();

function localNow(): Moment {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return { date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time: `${p(d.getHours())}:${p(d.getMinutes())}` };
}

const now = localNow();
let booting: ReturnType<typeof openApp> | undefined;
// One promise for the page's life, so StrictMode's double render does not open the app twice.
const boot = () => (booting ??= openApp(db, { index, shape }, now));

interface Session {
  today: ISODate;
  weeks: Week[];
  currentWeek: Week | undefined;
  /** Next week, if it exists. */
  nextWeek: Week | undefined;
  /** Makes next week now if it does not exist yet (LIF-13). Same week the deadline would make (LIF-15). */
  planNextWeek: () => Promise<void>;
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
  const writeContext = useCallback(
    (week: Week): WriteContext => ({
      env: { index, settings, shape },
      history: historyFor(week, initial.history, weeks, now.date),
      today: now.date,
    }),
    [initial.history, weeks, settings],
  );
  const value = useMemo<Session>(
    () => ({ today: now.date, weeks, currentWeek: weeks.find((w) => weekState(w.weekStart, now.date) === 'current'), nextWeek: weeks.find((w) => weekState(w.weekStart, now.date) === 'next'), planNextWeek, save, settings, writeContext, saveSettings: saveAll }),
    [weeks, save, planNextWeek, settings, writeContext, saveAll],
  );
  return <Ctx value={value}>{children}</Ctx>;
}

export function useSession(): Session {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSession outside SessionProvider');
  return s;
}
