import { useSession } from '../session';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// Hour steps keep the native select short; the engine accepts any "HH:MM".
const HOURS = Array.from({ length: 24 }, (_, h) => {
  const value = `${String(h).padStart(2, '0')}:00`;
  return { value, label: `${h % 12 || 12}:00 ${h < 12 ? 'am' : 'pm'}` };
});

/** DESIGN.md 3.5. Nothing saves with a button: each change applies as it is made. */
export function Settings({ onBack }: { onBack: () => void }) {
  const { settings, saveSettings } = useSession();
  return (
    <>
      <button className="back" onClick={onBack}>← Today</button>
      <h1 style={{ fontSize: 28 }}>Settings</h1>
      <section className="card">
        <p className="label">Planning</p>
        <label className="field">
          <span>Seasonal dishes</span>
          <span>
            <input type="checkbox" role="switch" checked={settings.respectSeasons}
              onChange={(e) => void saveSettings({ ...settings, respectSeasons: e.target.checked })} />
            {' '}{settings.respectSeasons ? 'On' : 'Off'}
          </span>
        </label>
        <p className="meta">Leave out dishes that are out of season when planning a week. Dishes you choose yourself are never blocked.</p>
        <p className="meta">Changes apply to weeks planned from now on.</p>
      </section>
      <section className="card">
        <p className="label">Plan next week on</p>
        <label className="field">
          <span>Day</span>
          <select value={settings.generationDay} onChange={(e) => void saveSettings({ ...settings, generationDay: Number(e.target.value) })}>
            {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Time</span>
          <select value={settings.generationTime} onChange={(e) => void saveSettings({ ...settings, generationTime: e.target.value })}>
            {!HOURS.some((h) => h.value === settings.generationTime) && <option value={settings.generationTime}>{settings.generationTime}</option>}
            {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
          </select>
        </label>
        <p className="meta">Next week is planned at this time, or the first time you open the app after it.</p>
      </section>
    </>
  );
}
