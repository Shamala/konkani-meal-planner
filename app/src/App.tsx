import { Suspense, useEffect, useState } from 'react';
import { Dish } from './ui/screens/Dish';
import { Settings } from './ui/screens/Settings';
import { Search } from './ui/screens/Search';
import { Today } from './ui/screens/Today';
import { Week, type WeekView } from './ui/screens/Week';
import type { Origin, PlanRef } from './ui/nav';
import { SessionProvider } from './ui/session';
import './ui/ui.css';

type Tab = 'today' | 'week' | 'search';
const TABS: Array<[Tab, string]> = [['today', 'Today'], ['week', 'Week'], ['search', 'Search']];

function Shell() {
  const [tab, setTab] = useState<Tab>('today');
  const [dish, setDish] = useState<{ id: string; origin: Origin; plan: PlanRef | undefined } | null>(null);
  const [settings, setSettings] = useState(false);
  const [weekView, setWeekView] = useState<WeekView>('this');

  // The browser back button steps out of Dish and Settings instead of leaving the app. Each push is
  // one history entry; popstate (the button, or history.back() from our own back links) clears the screen.
  useEffect(() => {
    const onPop = () => { setDish(null); setSettings(false); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const push = () => window.history.pushState({ screen: true }, '');
  const back = () => (window.history.state?.screen ? window.history.back() : (setDish(null), setSettings(false)));
  const open = (id: string, origin: Origin, plan?: PlanRef) => { push(); setDish({ id, origin, plan }); };

  // Every tab stays mounted, hidden when not shown, so Search keeps its query and chip while a
  // Dish is open and when the user comes back (NAV-03, NAV-04). Dish carries nothing between visits.
  if (settings) return <main className="app"><Settings onBack={back} /></main>;
  return (
    <>
      <main className="app">
        {dish && <Dish key={`${dish.id}|${dish.origin}|${dish.plan?.date}|${dish.plan?.slot}|${dish.plan?.index}`} {...dish} onBack={back} />}
        <div className="panel" hidden={dish !== null || tab !== 'today'}><Today open={open} openSettings={() => { push(); setSettings(true); }} seeNext={() => { setWeekView('next'); setTab('week'); }} /></div>
        <div className="panel" hidden={dish !== null || tab !== 'week'}><Week open={open} which={weekView} setWhich={setWeekView} /></div>
        <div className="panel" hidden={dish !== null || tab !== 'search'}><Search open={open} /></div>
      </main>
      <nav className="tabs" aria-label="Main">
        {TABS.map(([id, label]) => (
          <button key={id} aria-current={tab === id && !dish ? 'page' : undefined} onClick={() => { setDish(null); setTab(id); }}>
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}

export function App() {
  return (
    <Suspense fallback={null}>
      <SessionProvider>
        <Shell />
      </SessionProvider>
    </Suspense>
  );
}
