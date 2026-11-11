# Pantry Meal Planner — Requirements

**Owner:** Shamala
**Last updated:** 2026-10-30 (seven blocking decisions resolved; menu-first planning and the derived shopping list brought into Phase 1)
**Status:** current. Supersedes the phase plans in the two PDFs where they disagree.

---

## 1. What this is

A single-user PWA that plans a week of GSB / coastal-Karnataka vegetarian meals from
a recipe pool. Works offline. No LLM or AI anywhere in the core logic — generation,
substitution and search are all static rules and lookup tables.

**Two ways in, one generator.**

| Path | The user says | How it runs |
|---|---|---|
| Cook from what I have | "Here's roughly what's in the kitchen" | Generation prefers pantry-matching recipes |
| Plan, then shop | "Just plan my week" | Pantry is empty, so every role falls back to the full pool |

These are not two modes. Real kitchens sit between them — staples in the cupboard,
vegetables yet to buy — and the relax-and-mark rule in §3.4 covers the whole spectrum.
Menu-first is simply the empty-pantry end of it.

### Source of recipe truth

**Dakshin Bharat Dishes**, Jaya V. Shenoy, 7th edition 2016 (Saraswatha Prakashana).
Vegetarian recipes across 30 sections, running from printed page 6 to 165. The index
(p. 171) gives the exact count once extracted. A second Konkani recipe book is still
to be supplied and reconciled against this one.

The scanned PDF has no text layer, so every recipe has to be read off page images.
See §6.

---

## 2. Phases

| Phase | Scope |
|---|---|
| **1** | **Weekly menu planner.** Optional pantry entry, 7-day generation from a pantry or from nothing, meal detail, recipe detail, search and browse, and a shopping list derived from the generated week (§3.8). |
| **2** | **Planning meals from a grocery list.** The list becomes an editable object in its own right, accepting manual items — see §4. |
| 3 | Itemised pantry entry: per-category item tags for sharper matching. |
| 4 | Non-GSB recipe tab; lunch box and snack box modules; repeat-avoidance; restocking day-of-week assignment. |
| 5 | Alternative diet patterns (diabetic, vegan), quick/easy tag, stacked filtering. |
| 6 | Kannada localisation. |

Unscoped: reminders and notifications, to be designed after restocking days (Phase 4)
prove out.

---

## 3. Phase 1 — weekly menu planner

### 3.1 A day is a meal, not a dish

The book's own balanced-diet page (p. 166) sets a day out as four slots:

| Slot | Typical size |
|---|---|
| Breakfast | 2–4 dishes |
| Lunch | 4–8 dishes |
| Evening tea | 1–2 dishes |
| Dinner | 3–6 dishes |

A generated week is 7 days × 4 slots, each slot holding several dishes. The earlier
one-dish-per-day model is dropped; no page of the book supports it.

### 3.2 Dishes have roles

Each recipe carries a **role** drawn from the book's 30 section headings — saar,
rasam, kadi, sambar, upkari, masala curry, sasam, chutney, pachadi, kosumbari, rice
dish, roti, dosai, breakfast dish, savoury, sweet, pickle, and so on.

A meal is composed by role, not by free choice. A lunch is, for example, one saar +
one plain curry + one rice or roti + one side. **Swap replaces a dish only with
another of the same role.** This keeps generation rule-based and the results
culturally sensible.

**The swap pool** for a dish is every other recipe of the same role that matches the
pantry. Where that yields fewer than three candidates, it extends to the full role
pool, and dishes drawn from the extension carry the *needs shopping* marker described
in §3.4. Swapping is unavailable, with a stated reason, only when the role holds a
single recipe in total.

### 3.3 Pantry entry

Categories are the book's own glossary groupings (pp. 168–170), not invented ones:

1. Cereal grains and products
2. Pulses
3. Leafy vegetables
4. Roots and tubers
5. Other vegetables
6. Nuts and oilseeds
7. Fruits
8. Condiments and spices

Each takes **little / some / plenty**, used only as a rough presence signal, never
quantitatively. Tapping the selected amount again clears it.

- Pantry entry is **always optional**. The app is fully usable through search and
  browse with no pantry data at all.
- The pantry stays editable at any time, including after a week is generated.
  Editing it **never** recomputes an existing week. The Menu screen instead shows a
  notice that the pantry has changed since the week was generated, offering
  regeneration. The notice clears on regenerate and appears only on Menu, never on
  Pantry while editing.
- **Pantry entry never gates generation.** With nothing set, the week generates from
  the full recipe pool and the shopping list covers all of it (§3.8). Where fewer than
  two categories are set, say inline what adding more would buy the user — as a hint,
  never as a block. The earlier two-category minimum is withdrawn: it forced anyone
  planning before shopping to enter data they did not have.

### 3.4 Generation

Matches recipes against pantry data at category level. Phase 1 generates against the
book's **balanced** pattern only; other patterns are Phase 5.

**Perishable ordering.** Each recipe carries a `primaryCategory` — the glossary
category of its defining ingredient, not of every ingredient it lists. Curry leaves
appear in almost everything and must not make every dish count as leafy. Placement is
then constrained by tier:

| Tier | Categories | Permitted days |
|---|---|---|
| Highly perishable | Leafy vegetables | 1–3 |
| Perishable | Other vegetables, Roots and tubers, Fruits | 1–5 |
| Stable | Cereal grains, Pulses, Nuts and oilseeds, Condiments and spices | any |

Late-week meals therefore lean on dal, rice, roti, kokum and tamarind — which is how
the week actually runs in a real kitchen.

**Unmatched roles — relax and mark.** Where a slot's required role has no
pantry-matching recipe, generation falls back to the full pool for that role and marks
the dish *needs shopping*. It never shortens the meal and never blocks. Preserving the
role composition matters more than pretending the pantry is complete; the marker keeps
it honest, and is what the Phase 2 grocery list will read. The Menu screen shows the
week's total count of marked dishes.

This is also what makes menu-first planning work. With an **empty** pantry every role
falls back, so the generator produces a complete, role-correct week for a user who
intends to shop afterwards. No separate code path.

**The marker is suppressed when the pantry is empty.** Marking all 28 dishes carries no
information. Where no category is set, dishes render unmarked and the Menu screen
states plainly that nothing is logged, so the shopping list covers the full week. Where
any category is set, per-dish markers apply as above.

**Tier anchoring with an empty pantry.** The perishable day limits still apply, and
matter more here: shopping once for seven days is exactly the case they exist for. With
nothing logged there is no last-set date, so the window anchors to day 1 as the assumed
shopping day.

**Seed and regeneration.** Generation takes an explicit seed and is a pure function of
pantry state plus seed — same inputs, same week, every time. Regenerate advances the
seed. The seed is stored with the week, so any generated week is exactly reproducible
from a bug report.

**Regeneration clears all swaps.** A swap is intent aimed at one dish in one position;
once the week beneath it changes, re-applying it would attach it to an unrelated dish.
Where swaps exist, regeneration confirms first and names how many will be lost. Where
none exist, it proceeds without a prompt.

Swaps persist across navigation (§3.2).

### 3.5 Recipe detail

Dish name, Kannada name where the glossary gives one, role, ingredients, method,
and any variations the book states in prose (for example Kokum saar with a ground
coconut paste; saar-cum-upkari made with raw banana or potato).

Ingredients show Have / Buy against pantry data when the recipe was opened from the
generated week. Opened from search, they render plain with a note that the pantry was
not compared — never imply a comparison that did not happen.

Where a recipe has not yet been extracted from the book, say so plainly. Never show
invented quantities.

### 3.6 Search and browse

Live text filter over the whole recipe pool, matching dish name, ingredient names and
**Kannada names** from the glossary. Filter chips by role. Case- and
diacritic-insensitive. Reachable from launch with no pantry data.

**Partial extraction must not mislead.** Until extraction completes (§6.2), most
recipes have a name but no ingredients. Results are therefore shown in two groups:
extracted recipes, matched on name, ingredients and Kannada name; and unextracted
recipes, matched on **name only**, under a heading saying their ingredients were not
searched. A coverage line states how many recipes had their ingredients searched out
of the total. Both the group and the line disappear once extraction is complete.

### 3.7 Navigation

Three tabs in Phase 1: **Pantry, Menu, Search**. The shopping list (§3.8) is reached
from the Menu screen, not as a fourth tab — it is an artefact of a generated week and
has no meaning without one.

### 3.8 Shopping list (derived)

Brought forward from Phase 2, because menu-first planning without a list is a half
feature: the user would read 28 slots and copy them out by hand.

- Walks every dish in the generated week, collects required ingredients, and subtracts
  anything the pantry covers. With an empty pantry nothing is subtracted, so the list
  is simply everything the week needs.
- Grouped by glossary category, **not by day** — the list is for one shopping trip.
- An exact item tag suppresses an ingredient even where the broad category reads low.
- Per-item purchased state for checking off.
- Derived only. It is read from the week and regenerated with it. It accepts no manual
  entry and cannot be edited item by item; both are Phase 2 (§4).

**Extraction coverage.** The list can only include ingredients from recipes already
extracted (§6.2). Where the week contains dishes that are not, the list says how many
it could not read, naming them. It must never present a partial list as complete —
the same honesty rule as search (§3.6).

---

## 4. Phase 2 — the list as an editable object

Phase 1 derives a list from a week (§3.8). Phase 2 makes the list a thing in its own
right, which is a different feature and a harder one.

**4.1 List → menu (plan from a list).** The user holds or enters a grocery list and the
app plans meals around it. This **inverts** the Phase 1 flow, where the list is derived
and never entered.

**4.2 Manual items.** A list must accept items no recipe implies — soap, an extra bunch
of coriander. These survive regeneration and group separately from derived entries.

**4.3 Editing.** Removing or amending a derived entry, and what that means for the week
it came from.

Open: whether the derived list (§3.8) and the editable list are one screen or two, and
whether a manually entered item also counts as pantry presence.

---

## 5. Standing decisions

Do not re-litigate without reason.

- No LLM or AI dependency in core logic. Offline, and **deterministic in the sense
  that generation is a pure function of pantry state plus an explicit seed** — no
  model, no network, no hidden state. Regeneration advances the seed, which is how the
  week changes without the function becoming unpredictable.
- Single user, one device. No sync or shared household accounts.
- PWA, installable on Android and iOS.
- Little / some / plenty is a presence signal only.
- Pantry entry is optional; search and browse never depend on it.
- Substitutions are predefined twin recipes and a static lookup table, never generated.
- Lunch and snack box modules are for the whole household, with an optional
  kid-friendly tag — not a kid-only feature.
- Kannada names come from the book's glossary, in **transliterated Latin script**.
  (This settles an earlier open question: the source already exists in that form.)

---

## 6. Recipe data — prerequisite, not a feature

Phase 1 cannot ship without recipe data, and none of it is machine-readable yet.
172 scanned pages, no text layer. Recipes run from printed page 6 to 165, the
glossary sits at 168–170 and the index at 171.

### 6.1 Method — read the images, do not OCR

Page images go straight to structured JSON. OCR is skipped deliberately: on this book
it mangles fractions, vernacular dish names and the ingredient column breaks, and
every page would need hand-correction anyway — two passes to get one result. Reading
the image directly also lets the running section heading set the role while it is
there.

Pre-render all 172 pages to JPEG once, so extraction never reopens the 533 MB file.

### 6.2 Order of work

Each pass gates the next.

| Pass | Scope | Why in this position |
|---|---|---|
| 0 | Fix the schema (§6.3) | Changing a field after 300 recipes means re-reading 300 pages |
| 1 | Glossary, pp. 168–170 | Ingredient master list and the eight categories — everything downstream validates against it |
| 2 | Index, p. 171 on | Every recipe name and page, so extraction becomes a checklist with a known total |
| 3 | Recipes, by priority | See below |

Pass 3 runs in priority order, not page order: first the dishes named on the balanced
and diabetic diet pages (166–167), then whichever roles the four slots leave thin.
That is roughly 60–80 dishes, not the whole book. The remainder is a backlog that
does not block the build.

### 6.3 Format

One JSON file per recipe, slug-named, under `recipes/`. Not one large file — a bad
extraction is then one file to redo, diffs stay readable, and the set is bundled into
a single payload at build time regardless.

| Field | Note |
|---|---|
| `name`, `kannadaName` | Transliterated Latin script |
| `role` | From the section heading, never inferred from the dish |
| `primaryCategory` | Glossary category of the **defining** ingredient only. Drives perishable ordering (§3.4) |
| `section` | The book's own section number and title |
| `ingredients[]` | Each carries `qtyText` **verbatim** plus a parsed `{amount, unit, item}` |
| `item` | Must resolve to a glossary id — an unresolved name is flagged, not accepted |
| `method[]` | Rewritten steps (see copyright below) |
| `variations[]` | Where the book states one in prose |
| `sourcePage` | **Printed** page number |
| `needsReview` | Set during extraction when the scan or a quantity was ambiguous |

Never normalise quantities to grams. "A lemon-sized ball of tamarind" does not
convert, and the verbatim string is what gets displayed.

### 6.4 Known traps

- **Relative quantities** are common — "a small lemon-sized ball", "2 cups of the same
  dal". The schema must tolerate an unparseable quantity rather than reject the
  recipe. Phase 1 matching needs the ingredient *set*, not amounts, so a shaky parse
  blocks nothing until Phase 2.
- **Page offset.** Printed page 3 is PDF page 2. Store `sourcePage` as the printed
  number and convert at extraction time, or the whole corpus drifts by one.
- **No prep times anywhere in the book.** `prepTimeMinutes` has no source. Either drop
  the field or populate the quick/easy tag by hand.
- **Second recipe book** — reconcile its categories and dish names against this one
  before the schema hardens.

**Copyright.** Dish names, ingredient lists and the glossary are facts and fine to
use. The method prose is the author's. For personal use this does not matter; if the
app is ever shared, methods must be rewritten in shorter, plainer wording. That is the
working default.

---

## 7. Tech stack

### 7.1 Fixed

- **PWA**, installable on Android and iOS. One codebase, no app-store review, and
  offline caching covers the need.
- **No LLM anywhere in core logic.** Generation, substitution and search are lookup
  tables and plain conditionals.
- **Offline-first.** No "no connection" error state — once loaded, data is there.
- **No backend.** Everything fits in local device storage. No server to host, no
  accounts, no sync.

The Implementation Details PDF deliberately stopped here, leaving the rest "a separate,
later decision."

### 7.2 Proposed — not yet decided

| Layer | Recommendation | Why |
|---|---|---|
| Build and framework | Vite + React + TypeScript | The PWA plugin generates manifest and service worker; types earn their keep against the recipe schema, which is the hard part |
| Local storage | Dexie over IndexedDB | Bulk-loaded, read-mostly data in a few lines |
| Recipe data | Static JSON bundle, cached | Recipes never change at runtime — only pantry state and the generated week need to persist |
| Hosting | Any static host | There is no server component to host |

---

## 8. Open questions

- Stack: confirm or replace the §7.2 recommendation before any code is written.
- Phase 2: is "plan meals from a grocery list" one screen with the derived list, or a
  separate flow? (§4.2)
- Does a manually added grocery item count as pantry presence?
- Item tags: free text, or a curated list per category drawn from the glossary?
- How is a partial category match judged sufficient for a recipe, beyond the rough
  presence rule?
- Should localisation extend to Tulu, and is language selection manual or from device
  locale?
- Does the second book change the role taxonomy or the eight category groupings?
- `prepTimeMinutes`: drop the field, or hand-populate a quick/easy tag? (§6.4)

---

## 9. Related documents

This file is the current source of truth. Where anything below disagrees with it,
this file wins.

### Live

| Document | Link | Standing |
|---|---|---|
| PRD | https://claude.ai/artifact/YMSaHSDDNkhKvdHtwPzYXQ | Current. Synced to this file on 2026-10-30, except §6 extraction method |
| Design Document | https://claude.ai/code/artifact/b6db42d8-225f-45a9-94fa-217039e93743 | Colour, type and layout hold. Screen list and phase table superseded |
| Implementation Details | https://claude.ai/code/artifact/f83890fb-ce06-4d27-9931-d1f74d2f1c1d | Data model and logic hold. Phase table and 4-category pantry superseded |
| v2 redesign canvas | https://claude.ai/artifact/NE53EZAHACiFDe3sbqnyNX | Current Phase 1 screens |
| v1 mockup | https://claude.ai/artifact/RqSA14khBg6pysXeDT6Rje | Historical. One dish per day, pre-cookbook |

### In this folder

- `Pantry Meal Planner - Design Document.pdf` — flat export of the Design Document above.
- `Pantry Meal Planner - Implementation Details.pdf` — flat export of the Implementation
  Details above. Being exports, they cannot be edited in place; they are regenerated,
  not amended.
- `TEST-PLAN.md` — Phase 1 acceptance criteria and QA matrix. Its §6 lists fourteen
  points this file leaves undetermined; seven block implementation.
- `jayavshenoy_gsb_cook_book.pdf` — the source cookbook. 533 MB, 172 pages, no text layer.
- `context-2026-09.md` — pre-cookbook conversation history, superseded 2026-10-30.
  Retained only as a record of how the standing decisions in §5 were reached. Its
  palette values, phase numbers and screen list are wrong — do not read it as current.
