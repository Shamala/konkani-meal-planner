import { useEffect, useRef, useState } from 'react';
import { dayState } from '../../engine/lifecycle';
import type { Week as WeekT } from '../../model/types';
import { weekRange } from '../actions';
import { DayTick, SLOT_LABEL, formatDate } from '../components';
import { describe } from '../corpus';
import type { OpenDish } from '../nav';
import { useSession } from '../session';

export type WeekView = 'this' | 'next';
const ZONE = { past: 'Passed', today: 'Today', ahead: 'Still to come' } as const;

function DayRows({ week, open, draft }: { week: WeekT; open: OpenDish; draft: boolean }) {
  const { today } = useSession();
  let lastZone = '';
  return (
    <>
      {week.days.map((day) => {
        const state = draft ? 'ahead' : dayState(day.date, today);
        const zone = ZONE[state];
        const header = !draft && zone !== lastZone ? <p className="zone">{zone}</p> : null;
        lastZone = zone;
        const others = (['breakfast', 'snack1', 'snack2'] as const)
          .map((s) => ({ s, names: day.slots[s].dishes.map((d) => describe(d.id).name) }))
          .filter((o) => o.names.length > 0);
        return (
          <div key={day.date}>
            {header}
            <article className={`day ${draft ? 'draft' : state}`}>
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
                {!draft && <DayTick week={week} date={day.date} />}
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

/** DESIGN 3.6: a bottom sheet, no scrim. Focus starts on the safe action; Escape keeps the plan. */
function RegenerateSheet({ chosen, onKeep, onRegenerate }: { chosen: number; onKeep: () => void; onRegenerate: () => void }) {
  const keep = useRef<HTMLButtonElement>(null);
  useEffect(() => { keep.current?.focus(); }, []);
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onKeyDown={(e) => e.key === 'Escape' && onKeep()}>
      <h2 id="sheet-title">Replace next week's plan?</h2>
      <p className="meta" style={{ fontSize: 17 }}>
        This plans all seven days again.
        {chosen > 0 && ` ${chosen} ${chosen === 1 ? 'dish' : 'dishes'} you chose will be replaced too.`}
      </p>
      <button type="button" className="btn-primary" onClick={onRegenerate}>Regenerate</button>
      <button type="button" className="btn-secondary" ref={keep} onClick={onKeep}>Keep this plan</button>
    </div>
  );
}

export function Week({ open, which, setWhich }: { open: OpenDish; which: WeekView; setWhich: (w: WeekView) => void }) {
  const { currentWeek, nextWeek, viewNext, regenerate, chosenInNext } = useSession();
  const [sheet, setSheet] = useState(false);

  const show = (w: WeekView) => {
    setWhich(w);
    if (w === 'next') void viewNext();
  };
  // Arriving here from the Today notice sets `which` from outside; make sure next week exists and counts as viewed.
  useEffect(() => { if (which === 'next') void viewNext(); }, [which]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div inert={sheet}>
        <h1>{which === 'this' ? 'This week' : 'Next week'}</h1>
        <div className="seg" role="group" aria-label="Week">
          {(['this', 'next'] as const).map((k) => (
            <button key={k} type="button" aria-pressed={which === k} onClick={() => show(k)}>{k === 'this' ? 'This week' : 'Next week'}</button>
          ))}
        </div>

        {which === 'this' && currentWeek && (
          <>
            <div className="sunken">
              This week is planned and shopped for. Changes start from Monday.{' '}
              <button type="button" className="linkish" onClick={() => show('next')}>→ Plan next week</button>
            </div>
            <DayRows week={currentWeek} open={open} draft={false} />
          </>
        )}

        {which === 'next' && nextWeek && (
          <>
            <p className="meta">Planned · {weekRange(nextWeek.weekStart)}</p>
            <button type="button" className="btn-primary" aria-describedby="regen-cap" onClick={() => setSheet(true)}>Regenerate</button>
            <p id="regen-cap" className="meta" style={{ marginTop: -8 }}>Plans all seven days again.</p>
            <DayRows week={nextWeek} open={open} draft />
          </>
        )}
      </div>
      {sheet && (
        <RegenerateSheet
          chosen={chosenInNext()}
          onKeep={() => setSheet(false)}
          onRegenerate={async () => { await regenerate(); setSheet(false); }}
        />
      )}
    </>
  );
}
