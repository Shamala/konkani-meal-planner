/** Tier 2 display rules (REQUIREMENTS 5.1, 5.2): extract everything, filter at display time. */
import glossary from '../../../extraction/glossary.tier1.json';
import type { Ingredient } from '../model/types';

const english = new Map((glossary.items as Array<{ id: string; english: string }>).map((i) => [i.id, i.english]));

/** Seasonings hidden behind "show all". A fixed list, not a per-recipe judgement. Revising it needs no re-extraction. */
const SEASONING = new Set([
  'asafoetida', 'curry-leaves', 'mustard-seeds', 'turmeric', 'chillies', 'cumin-seeds', 'fenugreek-seeds',
  'coriander-seeds', 'pepper-corns', 'poppy-seeds', 'aniseed', 'omum', 'cinnamon', 'cloves', 'cardamom', 'nutmeg',
]);
// Salt and oil are not in the book's glossary, so they arrive unresolved and are matched on the verbatim text.
const PLAIN_SEASONING = /\b(salt|oil)\b/i;

const isSeasoning = (i: Ingredient) => (i.unresolved ? PLAIN_SEASONING.test(i.qtyText) : SEASONING.has(i.item));

/** An unresolved ingredient is never guessed at: it stays in the main list with its own words (DSH-06). */
export function splitIngredients(list: Ingredient[]): { major: Ingredient[]; seasonings: Ingredient[] } {
  return { major: list.filter((i) => !isSeasoning(i)), seasonings: list.filter(isSeasoning) };
}

/** Everything a search may match on for one ingredient: the book's words and the glossary name. */
export function ingredientNames(i: Ingredient): string[] {
  return [i.qtyText, english.get(i.item)].filter((x): x is string => !!x);
}
