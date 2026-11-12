import { dayState } from '../../engine/lifecycle';
import { DayTick, SLOT_LABEL, formatDate } from '../components';
import { describe } from '../corpus';
import type { OpenDish } from '../nav';
import { useSession } from '../session';

const ZONE = { past: 'Passed', today: 'Today', ahead: 'Still to come' } as const;

export function Week({ open }: { open: OpenDish }) {
  const { today, currentWeek } = useSession();
  if (!currentWeek) return null;
  let lastZone = '';

  return (
    <>
      <h1>This week</h1>
      <div className="sunken">This week is planned and shopped for. Changes start from Monday.</div>
      {currentWeek.days.map((day) => {
        const state = dayState(day.date, today);
        const zone = state === 'ahead' ? ZONE.ahead : ZONE[state];
        const header = zone !== lastZone ? <p className="zone">{zone}</p> : null;
        lastZone = zone;
        const others = (['breakfast', 'snack1', 'snack2'] as const)
          .map((s) => ({ s, names: day.slots[s].dishes.map((d) => describe(d.id).name) }))
          .filter((o) => o.names.length > 0);
        return (
          <div key={day.date}>
            {header}
            <article className={`day ${state}`}>
              <div className="row">
                <div style={{ flex: 1 }}>
                  <div className="when">{formatDate(day.date)}</div>
                  {day.mealType !== 'standalone' && day.slots.main.dishes.length > 0 && <div className="meta">Plain rice</div>}
                  {day.slots.main.dishes.map((d, i) => (
                    <button key={`${d.id}-${i}`} className="dish" onClick={() => open(d.id, 'week', { date: day.date, slot: 'main', index: i })}>
                      {describe(d.id).name}
                    </button>
                  ))}
                  {day.slots.main.dishes.length === 0 && <p className="meta">Nothing planned.</p>}
                </div>
                <DayTick week={currentWeek} date={day.date} />
              </div>
              {others.length > 0 && (
                <p className="compact">{others.map((o) => `${SLOT_LABEL[o.s].split(' ·')[0]}: ${o.names.join(', ')}`).join(' · ')}</p>
              )}
            </article>
          </div>
        );
      })}
    </>
  );
}
