import { useActionState } from 'react';
import { swapDish } from '../../engine/slotWrites';
import { OffPlanTick, SlotTick } from '../components';
import { dishAction } from '../actions';
import { describe } from '../corpus';
import type { Origin, PlanRef } from '../nav';
import { useSession } from '../session';

const ORIGIN_LABEL: Record<Origin, string> = { today: 'Today', week: 'Week', search: 'Search' };

/** Swap is a form action: it persists, then returns to where the user came from, since this dish has left the slot. */
function SwapButton({ plan, onDone }: { plan: PlanRef; onDone: () => void }) {
  const { weeks, save, writeContext } = useSession();
  const [error, submit] = useActionState(async (): Promise<string | null> => {
    const week = weeks.find((w) => w.days.some((d) => d.date === plan.date));
    if (!week) return 'That change could not be made.';
    const r = swapDish(writeContext(week), week, plan.date, plan.slot, plan.index);
    if (!r.ok) return 'There is no other dish that fits here right now.';
    await save(r.week);
    onDone();
    return null;
  }, null);
  return (
    <form action={submit}>
      <button type="submit" className="btn-secondary">Swap with a different dish</button>
      {error && <p role="status" className="meta">{error}</p>}
    </form>
  );
}

export function Dish({ id, origin, plan, onBack }: { id: string; origin: Origin; plan: PlanRef | undefined; onBack: () => void }) {
  const { currentWeek, weeks, writeContext } = useSession();
  const planWeek = plan ? weeks.find((w) => w.days.some((d) => d.date === plan.date)) : undefined;
  const action = plan && planWeek ? dishAction(writeContext(planWeek), planWeek, plan, id) : null;
  const dish = describe(id);
  const pages = dish.page === undefined ? '' : [dish.page, ...(dish.alsoOnPages ?? [])].join(', ');

  return (
    <>
      <button className="back" onClick={onBack}>← {ORIGIN_LABEL[origin]}</button>
      <h1 style={{ fontSize: 28 }}>{dish.name}</h1>
      {dish.sectionName && <p className="meta">{dish.sectionName}</p>}

      <div className="row" style={{ margin: '16px 0' }}>
        <span className="meta" style={{ flex: 1 }}>Cooked</span>
        {plan && currentWeek ? <SlotTick week={currentWeek} date={plan.date} slot={plan.slot} index={plan.index} /> : <OffPlanTick dishId={id} />}
      </div>

      {plan && action?.kind === 'swap' && <SwapButton plan={plan} onDone={onBack} />}
      {action?.kind === 'inert' && (
        <section className="inert">
          <p className="inert-title"><span aria-hidden="true">⇄ </span>Swap is not available</p>
          <p className="meta">{action.reason}</p>
        </section>
      )}

      {dish.kind === 'recipe' ? (
        <section className="card page-block">
          <div className="num">{pages.includes(',') ? pages : dish.page}</div>
          <div className="cap">{pages.includes(',') ? 'Pages' : 'Page'}</div>
          <div className="src">in your cookbook</div>
        </section>
      ) : (
        <section className="card">
          <p className="label">What it is</p>
          <p style={{ margin: 0 }}>{dish.components}</p>
        </section>
      )}
    </>
  );
}
