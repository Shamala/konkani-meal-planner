import { OffPlanTick, SlotTick } from '../components';
import { describe } from '../corpus';
import type { Origin, PlanRef } from '../nav';
import { useSession } from '../session';

const ORIGIN_LABEL: Record<Origin, string> = { today: 'Today', week: 'Week', search: 'Search' };

export function Dish({ id, origin, plan, onBack }: { id: string; origin: Origin; plan: PlanRef | undefined; onBack: () => void }) {
  const { currentWeek } = useSession();
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
