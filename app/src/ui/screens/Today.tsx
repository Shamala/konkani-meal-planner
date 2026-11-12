import { SLOTS, type Slot } from '../../model/types';
import { SLOT_LABEL, SlotTick, formatDate } from '../components';
import { describe } from '../corpus';
import { useSession } from '../session';
import type { OpenDish } from '../nav';

export function Today({ open }: { open: OpenDish }) {
  const { today, currentWeek } = useSession();
  const day = currentWeek?.days.find((d) => d.date === today);
  if (!currentWeek || !day) return null;

  return (
    <>
      <h1>Today</h1>
      <p className="meta">{formatDate(today)}</p>
      {SLOTS.map((slot: Slot) => {
        const dishes = day.slots[slot].dishes;
        const isMain = slot === 'main';
        return (
          <section key={slot} className={`card${isMain ? ' main' : ''}`}>
            <p className="label">{SLOT_LABEL[slot]}</p>
            {isMain && <p className="meta">Serves lunch and dinner.</p>}
            {isMain && day.mealType !== 'standalone' && (
              <div className="row"><span className="static">Plain rice</span></div>
            )}
            {dishes.length === 0 && <p className="meta">Nothing planned.</p>}
            {dishes.map((d, i) => (
              <div className="row" key={`${d.id}-${i}`}>
                <button className="dish" onClick={() => open(d.id, 'today', { date: today, slot, index: i })}>
                  {describe(d.id).name}
                </button>
                <SlotTick week={currentWeek} date={today} slot={slot} index={i} />
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}
