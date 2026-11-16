import { useState } from 'react';
import { matchesIngredients, matchesQuery } from '../actions';
import { allDishes, extractedCount, recipeCount, sections, type DishInfo } from '../corpus';
import type { OpenDish } from '../nav';

function Results({ dishes, open }: { dishes: DishInfo[]; open: OpenDish }) {
  return (
    <div className="card">
      {dishes.map((d) => (
        <div className="row" key={d.id}>
          <button className="dish" onClick={() => open(d.id, 'search')}>
            {d.name}
            <small>{d.page === undefined ? 'Snack' : `${d.sectionName} · page ${d.page}`}</small>
          </button>
        </div>
      ))}
    </div>
  );
}

export function Search({ open }: { open: OpenDish }) {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<number | null>(null);
  const active = query.trim() !== '' || section !== null;
  const results = active
    ? allDishes.filter(
        (d) =>
          (section === null || d.section === section) &&
          (matchesQuery(d.name, query) || (d.ingredients !== undefined && matchesIngredients(d.ingredients, query))),
      )
    : [];
  // Recipes with no ingredients extracted can only match on name, and are headed as such (SRC-08).
  const nameOnly = results.filter((d) => d.kind === 'recipe' && !d.ingredients);
  const searched = results.filter((d) => !(d.kind === 'recipe' && !d.ingredients));
  const incomplete = extractedCount < recipeCount;

  return (
    <>
      <h1>Search</h1>
      <input
        className="search" type="search" placeholder="Dish or ingredient" aria-label="Search dishes and ingredients"
        value={query} onChange={(e) => setQuery(e.target.value)}
      />
      <div className="chips">
        {sections.map((s) => (
          <button key={s.number} className="chip" aria-pressed={section === s.number} onClick={() => setSection(section === s.number ? null : s.number)}>
            {s.name}
          </button>
        ))}
      </div>
      {incomplete && (
        <p className="meta">Searched dish names in all {allDishes.length} dishes, and ingredients in {extractedCount} of {recipeCount} recipes.</p>
      )}

      {active && results.length === 0 && (
        <div className="card">
          <h2>No dishes match “{query.trim()}”.</h2>
          <p className="meta">
            Searched dish names{extractedCount > 0 ? ` and the ingredients of ${extractedCount} recipes` : ''}. Try a shorter word, or clear the section chip.
          </p>
        </div>
      )}
      {searched.length > 0 && <Results dishes={searched} open={open} />}
      {incomplete && nameOnly.length > 0 && (
        <>
          <p className="label" style={{ marginTop: 20 }}>Matched on name only: ingredients not extracted yet</p>
          <Results dishes={nameOnly} open={open} />
        </>
      )}
      {!incomplete && nameOnly.length > 0 && <Results dishes={nameOnly} open={open} />}
    </>
  );
}
