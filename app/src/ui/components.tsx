import { useActionState, useOptimistic } from 'react';
import { canMarkCooked } from '../engine/lifecycle';
import { setCooked, setOffPlanCooked, type Refusal } from '../engine/slotWrites';
import type { ISODate, Slot, Week } from '../model/types';
import { setDayMainCooked } from './actions';
import { describe, index } from './corpus';
import { useSession } from './session';

export const SLOT_LABEL: Record<Slot, string> = {
  breakfast: 'Breakfast',
  snack1: 'Snack 1 · morning',
  main: 'Main meal',
  snack2: 'Snack 2 · evening',
};

export function formatDate(iso: ISODate, long = true): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: long ? 'long' : 'short', day: 'numeric', month: long ? 'long' : 'short', timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

function refusalText(reason: Refusal): string {
  return reason === 'not-markable' ? 'Dishes can be marked cooked on today and on days already passed.' : 'That change could not be made.';
}

/**
 * The one cooked control. A React 19 form action: the tick flips at once (useOptimistic) and
 * reverts by itself if the engine refuses, because the action returns the refusal as a value.
 */
function Tick({ cooked, label, apply }: { cooked: boolean; label: string; apply: (next: boolean) => Promise<string | null> }) {
  const [shown, setShown] = useOptimistic(cooked);
  const [error, submit] = useActionState(async (): Promise<string | null> => {
    const next = !cooked;
    setShown(next);
    return apply(next);
  }, null);
  return (
    <form action={submit}>
      <button type="submit" className="tick" aria-pressed={shown} aria-label={`Cooked: ${label}`}>{shown ? '✓' : ''}</button>
      {error && <p role="status" className="tick-note">{error}</p>}
    </form>
  );
}

export function SlotTick({ week, date, slot, index: i }: { week: Week; date: ISODate; slot: Slot; index: number }) {
  const { today, save } = useSession();
  const dish = week.days.find((d) => d.date === date)?.slots[slot].dishes[i];
  if (!dish || !canMarkCooked(week, date, today)) return null;
  return (
    <Tick
      cooked={dish.cooked}
      label={describe(dish.id).name}
      apply={async (next) => {
        const r = setCooked(week, today, date, slot, i, next);
        if (!r.ok) return refusalText(r.reason);
        await save(r.week);
        return null;
      }}
    />
  );
}

/** Week screen: the tick is the control, and it covers the day's whole main meal (DECISIONS.md Q4). */
export function DayTick({ week, date }: { week: Week; date: ISODate }) {
  const { today, save } = useSession();
  const dishes = week.days.find((d) => d.date === date)?.slots.main.dishes ?? [];
  if (dishes.length === 0 || !canMarkCooked(week, date, today)) return null;
  return (
    <Tick
      cooked={dishes.every((d) => d.cooked)}
      label={`main meal, ${formatDate(date, false)}`}
      apply={async (next) => {
        const r = setDayMainCooked(week, today, date, next);
        if (!r.ok) return refusalText(r.reason);
        await save(r.week);
        return null;
      }}
    />
  );
}

/** A dish reached from Search was cooked outside the plan; record it for today (DECISIONS.md D3). */
export function OffPlanTick({ dishId }: { dishId: string }) {
  const { today, currentWeek, save } = useSession();
  if (!currentWeek) return null;
  const slot: Slot = describe(dishId).kind === 'snack1' ? 'snack1' : (index.recipeById.get(dishId)?.slots[0] ?? 'snack2');
  const on = currentWeek.days.find((d) => d.date === today)?.slots[slot].offPlan.includes(dishId) ?? false;
  return (
    <Tick
      cooked={on}
      label={describe(dishId).name}
      apply={async (next) => {
        const r = setOffPlanCooked(currentWeek, today, (id) => index.kindOf.has(id), today, slot, dishId, next);
        if (!r.ok) return refusalText(r.reason);
        await save(r.week);
        return null;
      }}
    />
  );
}
