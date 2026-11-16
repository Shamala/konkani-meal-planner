import { useState } from 'react';
import { assignDish } from '../../engine/slotWrites';
import type { Slot, Week } from '../../model/types';
import { pickerDays } from '../actions';
import { SLOT_LABEL, formatDate } from '../components';
import { describe } from '../corpus';
import { useSession } from '../session';

type Which = 'this' | 'next';

/**
 * Day-and-slot picker (DESIGN 3.3, ASN-01 to ASN-09). Choosing a row assigns at once: no
 * confirmation and no role warning, because the user asked for this dish. Every dish position
 * is its own row and names the dish it replaces (ASN-03).
 */
export function AddToMeal({ dishId, onDone, onCancel }: { dishId: string; onDone: (where: string) => void; onCancel: () => void }) {
  const { today, currentWeek, nextWeek, planNextWeek, save, writeContext } = useSession();
  const [which, setWhich] = useState<Which>('this');
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const week: Week | undefined = which === 'this' ? currentWeek : nextWeek;

  async function show(next: Which) {
    if (next === 'next' && !nextWeek) await planNextWeek();
    setOpen(null);
    setWhich(next);
  }

  async function assign(w: Week, date: string, slot: Slot, i: number) {
    const r = assignDish(writeContext(w), w, date, slot, i, dishId);
    if (!r.ok) return setError('That change could not be made.');
    await save(r.week);
    onDone(`${formatDate(date)} · ${SLOT_LABEL[slot].split(' ·')[0]}`);
  }

  return (
    <section>
      <h1 style={{ fontSize: 28 }}>Add to a meal</h1>
      <p className="meta">{describe(dishId).name}</p>
      <div className="seg" role="group" aria-label="Week">
        {(['this', 'next'] as const).map((k) => (
          <button key={k} type="button" aria-pressed={which === k} onClick={() => show(k)}>{k === 'this' ? 'This week' : 'Next week'}</button>
        ))}
      </div>
      {week ? (
        <>
          {pickerDays(week, today).map((day) => {
            const shut = open !== day.date;
            return (
              <div key={day.date} className="acc">
                <button type="button" className="acc-head" aria-expanded={!shut} aria-controls={`d-${day.date}`} onClick={() => setOpen(shut ? day.date : null)}>
                  <span>{formatDate(day.date)}</span>
                  <span className="meta">{shut ? 'tap to open' : 'choose a meal'}</span>
                </button>
                {!shut && (
                  <div id={`d-${day.date}`}>
                    {(['breakfast', 'snack1', 'main', 'snack2'] as const).flatMap((slot) =>
                      day.slots[slot].dishes.map((d, i) => (
                        <button key={`${slot}-${i}`} type="button" className="slot-row" aria-label={`${SLOT_LABEL[slot]}, currently ${describe(d.id).name}`} onClick={() => assign(week, day.date, slot, i)}>
                          <span className="meta">{SLOT_LABEL[slot]}</span>
                          <span className="slot-dish">{describe(d.id).name}</span>
                        </button>
                      )),
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <p className="meta" style={{ margin: '12px 0' }}>Today and days already passed are not shown. Today's plan is fixed.</p>
        </>
      ) : (
        <p className="meta">Next week could not be planned.</p>
      )}
      {error && <p role="status" className="meta">{error}</p>}
      <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
    </section>
  );
}
