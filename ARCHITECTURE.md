# Konkani Meal Planner — Architecture

**Owner:** Shamala
**Last updated:** 2026-11-02 (a week regenerates, a dish swaps)
**Derived from:** `REQUIREMENTS.md`. Where the two disagree, requirements win.

Replaces the pantry-first implementation document in `archive/`.

---

## 1. Shape of the system

A single-user offline PWA with no server. Everything runs in the browser; the only
network use is the first load and subsequent app updates.

```
Static bundle                 Device storage
├── recipes.json    (tier 1)  ├── servingHistory
├── recipes/*.json  (tier 2/3)├── weeks
├── snack1.json     (60)      └── settings
└── snack2.json
```

The recipe corpus is **immutable at runtime**. It ships with the build and is replaced
by deploying a new build. Nothing the user does writes to it. Only three things
persist: what was served, the generated weeks, and settings.

This split is the central architectural decision. It means the corpus can be large and
read-only, while the mutable state stays tiny.

---

## 2. Data model

### 2.1 Recipe (static)

| Field | Type | Tier | Notes |
|---|---|---|---|
| `id` | string | 1 | Stable slug. Never reused |
| `name` | string | 1 | English or transliterated |
| `kannadaName` | string? | 1 | Transliterated Latin. **Not from the glossary**: the glossary names foodstuffs, not dishes. No source for dish names yet (`extraction/ROLE-MAP.md` open item 3) |
| `role` | enum | 1 | From the book's 30 section headings |
| `section` | int | 1 | Book section number |
| `page` | int | 1 | **Printed** page number, not PDF |
| `slots` | enum[] | 1 | Which of the four slots this may fill |
| `season` | int[]? | 1 | Months the dish can be made. Absent = all year. Hand-set at Pass 2 from the name |
| `ingredients` | Ingredient[]? | 2 | Absent until extracted |
| `method` | string[]? | 3 | Rewritten steps, absent until extracted |
| `variations` | Variation[]? | 3 | Where the book states one. A Variation is a labelled alternative the book gives for the dish (a short label plus the changed ingredients or steps as text); its exact shape is fixed at Pass 3 |
| `needsReview` | bool | 2 | Set when the scan was ambiguous |

**Tier is implicit in field presence.** There is no `tier` field — a recipe with no
`ingredients` is tier 1, and the UI decides what to show from that. This avoids a field
that can disagree with reality.

### 2.2 Ingredient

| Field | Type | Notes |
|---|---|---|
| `qtyText` | string | **Verbatim** from the book. "A lemon-sized ball of tamarind" |
| `amount` | number? | Absent when unparseable, which is common |
| `unit` | string? | Absent when unparseable |
| `item` | string | Glossary id |
| `unresolved` | bool | True when `item` matched no glossary entry |

`qtyText` is the display value. The parsed fields are conveniences and may be absent;
nothing in v1 depends on them, because there is no pantry and no shopping list.

### 2.3 Snack entries

Snack 1 entries are **not recipes**. They carry `id`, `name`, `components` (a plain
string), `family` and an optional `season` (months, as on recipes; six entries carry one) — and no role, page or method, because none exists. Modelling them
as recipes would mean seven optional fields that are always empty.

Snack 2 draws from two sources: book recipes whose `section` is in the kid-friendly
list, and authored entries shaped like Snack 1 entries.

### 2.4 Mutable state

| Store | Key | Holds |
|---|---|---|
| `servingHistory` | recipe or snack id | `lastServed` date, `timesServed` count |
| `weeks` | ISO week start | The generated plan, its seed, per-dish cooked flags, `noticeDismissed` |
| `settings` | fixed key | Generation day and time, repeat windows, **respectSeasons** |

`servingHistory` is the only store whose loss degrades the product — losing it resets
variety to zero. A next week is regenerable from history plus seed; a current or past
week is not, because it carries cooked marks that exist nowhere else.

**Serving history has two sources**: the implicit one, where a current week's planned
dishes count as served, and the explicit one, where the user marks a dish cooked —
including a dish never in any plan, reached through Search. A mark made from
Search records the dish as served on today's date. It has no slot and cancels no implicit
record. Marking a planned dish cooked never affects its siblings: a main meal of several
dishes keeps one record per dish.

---

## 3. Generation

### 3.1 Signature

Generation is a **pure function**: `(servingHistory, seed, weekStart) → Week`.

No clock read, no randomness, no network, no model. The same three inputs always give
the same week. This is what `REQUIREMENTS.md` §4.2 means by deterministic, and it is
what makes the algorithm testable at all.

The seed is stored with the week, so any week a user reports as bad can be reproduced
exactly from its three inputs.

### 3.2 Order of operations

Per day, per slot:

1. **Filter by slot.** Only recipes whose `slots` includes this slot are candidates.
2. **Filter by role**, for the main meal only — each position in the composition wants
   a specific role.
3. **Exclude out of season**, when `settings.respectSeasons` is on. Drop anything whose
   `season` excludes the month **of that day's own date** (a week can straddle two
   months); absent `season` always passes.
   With the setting off this step does not run at all.
4. **Exclude recent.** Drop anything whose `lastServed` is within that slot's repeat
   window.
5. **Exclude same-day collision.** Snack 2 may not repeat that day's breakfast.
6. **Pick** using the seeded sequence.
7. **Fallback.** If step 4 empties the pool, return the oldest-served candidate rather
   than failing.

**Window edge is inclusive.** A dish served on day D is excluded through day D + N, so the
earliest it can return is D + N + 1 (22 days for the main meal). This is the only reading
under which Snack 1's exact cycle holds.

Step 7 guarantees generation never fails. A **main-meal position with no in-season
candidate is left out** of that day, never filled out of season. A slot is empty only if
no candidate exists for it at all, and the screen then offers *Add to a meal*.

**Priority when rules conflict:** season, then repeat window, then not repeating the same
family on adjacent days. The last is best-effort.

**The fallback never relaxes step 3.** Running short of in-season candidates must not
reach for an out-of-season dish — that would reintroduce exactly the suggestion season
tags exist to prevent. Only the repeat window gives way.

**Slot-level writes.** Two operations change one slot without regenerating a week, and
both are plain writes against the stored week rather than a generation pass:

| Operation | Behaviour |
|---|---|
| `swapDish(week, day, slot, index)` | Runs steps 1–7 for that one slot, excluding the dish being replaced, advancing a per-slot counter rather than the week seed |
| `assignDish(week, day, slot, index, recipeId)` | Writes the given recipe into the slot. **No filtering of any kind** — not role, not season, not the repeat window |

`assignDish` deliberately applies no rules. Every filter in §3.2 exists to keep the
*generator* from producing nonsense; a user naming a dish has already decided
(`REQUIREMENTS.md` §4.5.1). Enforcing role there would be the app overruling an explicit
instruction.

Both refuse on a past day, and `swapDish` additionally refuses where the role holds a
single recipe. Neither touches the week seed, so a later week-level regenerate still
reproduces from `(history, seed, weekStart)` — slot edits are layered over that result,
not folded into it.

### 3.3 Repeat windows

Defaults, fixed in v1 and configurable later:

| Slot | Window | Reasoning |
|---|---|---|
| Main meal | 21 days | Large pool. Three weeks is comfortably past noticing |
| Breakfast | 7 days | Habitual by nature. A short window is honest about that |
| Snack 1 | *available pool − 1* | Forces an exact cycle over whatever is in season that month. A fixed 59 would exceed the in-season pool, so every day would fall through to the oldest-served fallback instead of the normal path. The cycle would still look exact; the window is chosen so Snack 1 stays on the normal path |
| Snack 2 | 14 days | Mid-sized pool, and a child notices repetition faster |

Snack 1's window is its **available** pool size minus one, recomputed per month, which
keeps the rotation exact: every in-season entry is used once before any repeats. With no
seasonal exclusions this is 59, the full library.

### 3.4 Week lifecycle

A week is in exactly one of three states, and the state determines what may touch it.

| State | Regenerate | Mark cooked | Becomes |
|---|---|---|---|
| **Next** — exists, not yet begun | Yes | No | Current, at its Monday |
| **Current** — in progress | **No** regenerate; **yes** swap and assign, for days after today only | Yes, for today and days already passed; never for a day still ahead | Past, at the next Monday |
| **Past** | No | No | Kept for history |

A week **regenerates** and a dish **swaps** (`REQUIREMENTS.md` §4.5) — two verbs, since
"regenerate this dish" reads as remaking the same dish. Regenerate is next-week-only;
swap and assign reach every day **after today** and all of next week. Today and past days accept none of the three, so a cooked mark and a swap can never meet on the same day.

The transition is driven by date comparison on app open, not by a timer. Nothing needs
to run at midnight on Monday.

**This lifecycle removes a whole class of problem.** Cooked marks only ever exist on a
current week; regenerate only ever touches a next week. They cannot collide, so there
is no reconciliation logic and no question about what a regenerate does to a recorded
serving.

### 3.5 Weekly cadence

Next week is generated **lazily**, on first need: either a navigation into it, or the
configured moment (Friday 18:00 by default) having passed, whichever comes first. The
check runs on app open and on navigation.

**Friday is a deadline, not a trigger.** This matters for quality, not just simplicity:
generation reads `servingHistory`, so a week computed nearer its own start reflects more
of what was actually eaten. Eager generation at the start of the previous week would
miss any off-plan dish marked during it, and could then repeat it.

Because generation is a pure in-memory function, on-demand generation completes within
a screen transition. No loading state is warranted and none is shown.

There is no background job. A PWA cannot rely on one — iOS background execution is too
limited — so the check runs on open. Because generation is seeded and deterministic,
running late produces exactly the same week as running on time.

---

## 4. Storage

IndexedDB via a thin wrapper. Three object stores matching §2.4.

| Concern | Decision |
|---|---|
| Corpus | Static JSON in the bundle, cached by the service worker. Never in IndexedDB |
| Tier 2/3 loading | Separate files, fetched on first view of that dish, then cached |
| History durability | The one store worth protecting. An export action is cheap insurance |
| Migration | Corpus is versioned with the build; `servingHistory` keys are recipe ids, so a recipe id must never be reused |

**The recipe id contract matters more than it looks.** Serving history references ids.
Reusing a retired id would silently attribute one dish's history to another.

---

## 5. State

| State | Lives in | Survives restart |
|---|---|---|
| Current, next and past weeks | IndexedDB | Yes |
| Whether next week has been viewed | IndexedDB | Yes — suppresses a redundant Friday notice |
| Per-slot edits (swapped or assigned) | IndexedDB, on the week | Yes — layered over the seeded result, never folded into it |
| Serving history | IndexedDB | Yes |
| Settings | IndexedDB | Yes |
| Active search query, chip | Memory | No |
| Scroll position, open dish | Memory | No |

The Dish screen needs to know where it was opened from, so it can return there and
carry nothing from the previous visit. This is in-memory navigation state, and it is
the one place a state leak would be visible — see `TEST-PLAN.md`.

---

## 6. Extraction pipeline

Not application code. A one-off authoring process, documented because its output shape
is a hard dependency.

| Pass | Output | Blocking |
|---|---|---|
| 0 | Schema fixed (§2.1) | Yes — changing it later means re-reading pages |
| 1 | Glossary → ingredient master list | Yes — ingredient ids resolve against it |
| 2 | Index → `recipes.json`, all tier 1 | **Yes — this is the ship gate** |
| 3 | Per-recipe tier 2/3 | No — fills over time |

Pass 2 is the only one between here and a working app.

**Page numbers are printed, not PDF.** Printed page 3 is PDF page 2. Converting at
extraction time and storing the printed number keeps the app's display honest, since
the user is holding the physical book.

---

## 7. What is deliberately absent

| Absent | Why |
|---|---|
| Server, API, accounts | Single user, offline. Nothing to synchronise |
| Pantry matching | Out of the premise — `REQUIREMENTS.md` §8 |
| Any model call | Generation is lookup tables and conditionals |
| Background jobs | iOS PWAs cannot rely on them; the open-time check replaces it |
| A `tier` field | Derivable from field presence, and cannot then disagree |
| Swap of a dish within a day by role-aware suggestion lists | Not built. Swap re-runs the generator for one slot; there is no suggestion list |
| Cooked-mark reconciliation | Unnecessary. The week lifecycle (§3.4) makes the collision impossible |
| A single verb for both scopes | Tried and dropped. "Regenerate this dish" misreads as remaking it |
| Role enforcement on `assignDish` | Deliberate. Rules bind the generator, not the user |

---

## 8. Stack

Fixed: PWA, no backend, offline-first, no LLM in core logic.

Proposed and not yet confirmed: Vite + React + TypeScript, Dexie over IndexedDB, static
JSON corpus, any static host. The rationale is in `REQUIREMENTS.md` §11.

**The stack is the least consequential open decision here.** The recipe schema and the
id contract will outlive whatever framework is chosen.
