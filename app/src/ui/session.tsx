/**
 * Boots the engine once and hands the weeks to the screens. The clock is read here, once,
 * and passed in: the engine never reads it (ARCHITECTURE.md 3.5).
 */
import { createContext, use, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { weekState, type Moment } from '../engine/lifecycle';
import type { ISODate, Week } from '../model/types';
import { openApp } from '../storage/session';
import { PlannerDB, putWeeks } from '../storage/db';
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
  /** Persists first, then shows it: a reload never loses a tick. */
  save: (week: Week) => Promise<void>;
}

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const initial = use(boot());
  const [weeks, setWeeks] = useState(initial.weeks);
  const save = useCallback(async (week: Week) => {
    await putWeeks(db, [week]);
    setWeeks((ws) => ws.map((w) => (w.weekStart === week.weekStart ? week : w)));
  }, []);
  const value = useMemo<Session>(
    () => ({ today: now.date, weeks, currentWeek: weeks.find((w) => weekState(w.weekStart, now.date) === 'current'), save }),
    [weeks, save],
  );
  return <Ctx value={value}>{children}</Ctx>;
}

export function useSession(): Session {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSession outside SessionProvider');
  return s;
}
