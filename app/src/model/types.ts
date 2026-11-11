/**
 * Data model from ARCHITECTURE.md section 2.
 * Dates are ISO calendar dates ("2026-11-02"), never Date objects, so nothing in the
 * model depends on a time zone or a clock.
 */

export type ISODate = string;

/** The four slots of a day, in the order they happen. */
export type Slot = 'breakfast' | 'snack1' | 'main' | 'snack2';
export const SLOTS: readonly Slot[] = ['breakfast', 'snack1', 'main', 'snack2'];

/**
 * One of the book's 30 section headings. ARCHITECTURE.md calls this an enum but no
 * document enumerates the 30 values, so it is an open string here. OPEN QUESTION Q1.
 */
export type Role = string;

// ---- Recipe corpus (static, immutable at runtime) ---------------------------------

export interface Ingredient {
  /** Verbatim from the book. The display value. */
  qtyText: string;
  amount?: number;
  unit?: string;
  /** Glossary id. */
  item: string;
  unresolved?: boolean;
}

/** ARCHITECTURE.md names this type but never defines its fields. OPEN QUESTION Q2. */
export interface Variation {
  text: string;
}

/**
 * A book recipe. There is deliberately NO `tier` field: tier is implicit in which
 * fields are present (see recipeTier).
 */
export interface Recipe {
  /** Stable slug. Never reused. Serving history is keyed by it. */
  id: string;
  name: string;
  kannadaName?: string;
  role: Role;
  section: number;
  /** PRINTED page number, not the PDF page. */
  page: number;
  /** Which of the four slots this may fill. Empty = search-only: shown in Search and Dish, never generated. */
  slots: Slot[];
  /** Months (1-12) in which the dish can be made. Absent = all year. */
  season?: number[];
  // tier 2
  ingredients?: Ingredient[];
  needsReview?: boolean;
  // tier 3
  method?: string[];
  variations?: Variation[];
}

/**
 * A Snack 1 entry. NOT a recipe: no role, page or method.
 * `season` is not listed in ARCHITECTURE.md 2.3 but REQUIREMENTS.md 4.7 and
 * SNACK-LIBRARY.md tag six entries with months, so it is carried here. OPEN QUESTION Q3.
 */
export interface Snack1Entry {
  id: string;
  name: string;
  /** A plain string, e.g. "Soaked moong dal, cucumber, coconut, coriander, lemon". */
  components: string;
  family: string;
  season?: number[];
}

/** An authored Snack 2 addition. Shaped like Snack 1 but with no family (SNACK-LIBRARY.md 2.2). */
export interface Snack2Entry {
  id: string;
  name: string;
  components: string;
  family?: string;
  season?: number[];
}

export interface Catalog {
  recipes: Recipe[];
  snack1: Snack1Entry[];
  snack2Authored: Snack2Entry[];
}

export type RecipeTier = 1 | 2 | 3;

/** Tier is derived from field presence, so it cannot disagree with the data. */
export function recipeTier(r: Recipe): RecipeTier {
  if (r.method && r.method.length > 0) return 3;
  if (r.ingredients && r.ingredients.length > 0) return 2;
  return 1;
}

// ---- Mutable state -----------------------------------------------------------------

export interface ServingRecord {
  lastServed: ISODate;
  timesServed: number;
}
/** Keyed by recipe or snack id. The one store whose loss degrades the product. */
export type ServingHistory = Record<string, ServingRecord>;

export interface DishEntry {
  /** A recipe id or a snack id. Ids are unique across all three sources. */
  id: string;
  cooked: boolean;
}

export interface SlotPlan {
  dishes: DishEntry[];
  /**
   * Dishes the user marked cooked for this slot that were never in the plan (reached
   * through Search). Their presence cancels the implicit "plan was followed" record
   * for the slot's planned dishes (REQUIREMENTS.md 4.1.1).
   */
  offPlan: string[];
}

/**
 * 'plain-rice': plain rice (implicit, not a dish) with the shape's main positions.
 * 'standalone': one rice dish that needs no saar or curry (DECISIONS.md D5). Absent on
 * weeks stored before D5, and means 'plain-rice'.
 */
export type MealType = 'plain-rice' | 'standalone';

export interface DayPlan {
  date: ISODate;
  slots: Record<Slot, SlotPlan>;
  mealType?: MealType;
}

export interface Week {
  /** ISO date of the Monday. The store key. */
  weekStart: ISODate;
  /** Stored with the week so it can be reproduced from (history, seed, weekStart). */
  seed: number;
  /** Seven days, Monday first. */
  days: DayPlan[];
  /**
   * Per-slot swap counters, keyed "date|slot|index". Swap advances these, never `seed`,
   * so slot edits are layered over the seeded result and a regenerate still reproduces.
   */
  swapCounters: Record<string, number>;
  /** Whether the user has looked at this week. Suppresses the Friday notice. */
  viewed: boolean;
  /**
   * Bookkeeping: this week has been folded into the stored serving history. Set once,
   * when the week becomes past. Not a user-visible edit. OPEN QUESTION Q9.
   */
  folded: boolean;
}

export interface RepeatWindows {
  main: number;
  breakfast: number;
  snack2: number;
  // Snack 1 is deliberately absent: its window is the available pool minus one.
}

export interface Settings {
  /** ISO weekday, 1 = Monday ... 7 = Sunday. Friday = 5. */
  generationDay: number;
  /** "HH:MM" local time. */
  generationTime: string;
  repeatWindows: RepeatWindows;
  /** Default on. Off = the season step does not run at all. */
  respectSeasons: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  generationDay: 5,
  generationTime: '18:00',
  repeatWindows: { main: 21, breakfast: 7, snack2: 14 },
  respectSeasons: true,
};
