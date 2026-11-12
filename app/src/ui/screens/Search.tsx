import { useState } from 'react';
import { matchesQuery } from '../actions';
import { allDishes, sections } from '../corpus';
import type { OpenDish } from '../nav';

export function Search({ open }: { open: OpenDish }) {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<number | null>(null);
  const active = query.trim() !== '' || section !== null;
  const results = active
    ? allDishes.filter((d) => (section === null || d.section === section) && matchesQuery(d.name, query))
    : [];

  return (
    <>
      <h1>Search</h1>
      <input
        className="search" type="search" placeholder="Dish name" aria-label="Search dishes"
        value={query} onChange={(e) => setQuery(e.target.value)}
      />
      <div className="chips">
        {sections.map((s) => (
          <button key={s.number} className="chip" aria-pressed={section === s.number} onClick={() => setSection(section === s.number ? null : s.number)}>
            {s.name}
          </button>
        ))}
      </div>
      <p className="meta">Searched dish names in all {allDishes.length} dishes. Ingredients are not searched yet.</p>

      {active && results.length === 0 && (
        <div className="card">
          <h2>No dishes match “{query.trim()}”.</h2>
          <p className="meta">Try a shorter name, or clear the section chip.</p>
        </div>
      )}
      {results.length > 0 && (
        <div className="card">
          {results.map((d) => (
            <div className="row" key={d.id}>
              <button className="dish" onClick={() => open(d.id, 'search')}>
                {d.name}
                <small>{d.page === undefined ? 'Snack' : `${d.sectionName} · page ${d.page}`}</small>
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
