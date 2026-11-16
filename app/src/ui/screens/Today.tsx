import { fridayNoticeVisible } from '../../engine/lifecycle';
import { SLOTS, type Slot } from '../../model/types';
import { weekRange } from '../actions';
import { SLOT_LABEL, SlotTick, formatDate } from '../components';
import { describe } from '../corpus';
import { useSession } from '../session';
import type { OpenDish } from '../nav';

export function Today({ open, openSettings, seeNext }: { open: OpenDish; openSettings: () => void; seeNext: () => void }) {
  const { today, currentWeek, nextWeek, weeks, dismissNotice } = useSession();
  const day = currentWeek?.days.find((d) => d.date === today);
  if (!currentWeek || !day) return null;

  return (
    <>
      <div className="row">
        <h1 style={{ flex: 1 }}>Today</h1>
        <button className="icon" aria-label="Settings" onClick={openSettings}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2.5" fill="var(--bg-page, #fff)" /><circle cx="15" cy="17" r="2.5" fill="var(--bg-page, #fff)" />
          </svg>
        </button>
      </div>
      <p className="meta">{formatDate(today)}</p>
      {nextWeek && fridayNoticeVisible(weeks, today) && (
        <section className="notice" aria-label="Next week">
          <p className="notice-title">Next week is planned.</p>
          <p className="meta">{weekRange(nextWeek.weekStart)}</p>
          <div className="notice-actions">
            <button type="button" className="see" onClick={seeNext}>See next week →</button>
            <button type="button" className="dismiss" onClick={() => void dismissNotice()}>Dismiss</button>
          </div>
        </section>
      )}
      {SLOTS.map((slot: Slot) => {
        const dishes = day.slots[slot].dishes;
        const isMain = slot === 'main';
        return (
          <section key={slot} className={`card${isMain ? ' main' : slot === 'breakfast' ? '' : ' later'}`}>
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
