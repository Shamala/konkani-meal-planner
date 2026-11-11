# Konkani Meal Planner — Requirements

**Owner:** Shamala
**Last updated:** 2026-11-02 (a week regenerates, a dish swaps)
**Status:** current. Replaces the pantry-first spec in `archive/`.

---

## 1. The problem

Deciding what to cook, every day, forever.

Not waste. Not the weekly shop. Not nutrition. The fatigue of making the same small
decision again and again — and the thing that fatigue produces, which is cooking the
same six dishes while a 400-recipe book sits unopened on the shelf.

Everything below follows from that. Where a feature does not reduce the cost of that
decision, it does not belong in v1.

### Why the previous design was dropped

The earlier spec asked the user to log a pantry each week and matched recipes against
it. Three things killed it:

- It added a weekly chore to remove a daily one. Bad trade.
- Category-level matching cannot tell toor dal from green gram, so it narrowed the
  choices without improving them — and the first wrong suggestion costs trust.
- Removing the pantry entirely left the generator working fine, which showed it was
  never load-bearing.

It is archived, not deleted. If waste later turns out to matter, it is the starting
point.

---

## 2. The premise

> **Tell me what to cook, from the book I already own, without repeating myself.**

Three consequences, each load-bearing:

1. **The book stays on the shelf and that is fine.** The app plans; a page number is a
   legitimate answer. This is what makes it shippable (§5).
2. **Repetition is the failure mode**, not a nice-to-have. A planner that suggests last
   Tuesday's dinner has failed at its only job.
3. **No data entry.** Nothing is asked of the user before the app is useful.

### Source

**Dakshin Bharat Dishes**, Jaya V. Shenoy, 7th ed. 2016. Vegetarian, 30 sections,
printed pages 6–165, glossary 168–170, index 171 on. A second Konkani book is still to
be supplied. The scan has no text layer (§6).

---

## 3. The day

Four slots, taken from how the kitchen actually runs — not from the book's
balanced-diet page, which separates lunch and dinner and does not match.

| Slot | Character | Dishes | Drawn from |
|---|---|---|---|
| **Breakfast** | Cooked, substantial | 1–2 plus an accompaniment | Breakfast dishes, idlis and idiappam, dosai varieties, appe and patholi |
| **Snack 1** (morning) | Light, raw, assembled not cooked | 1 | A separate authored library of 60 — **not the book** (`SNACK-LIBRARY.md` §1) |
| **Main meal** | The composed meal | 2–3 (plain-rice meal) or 1 (standalone rice dish) | See §3.3 |
| **Snack 2** (evening) | Breakfast-like, kid-facing | 1–2 | The book by section proxy, plus authored healthy additions (`SNACK-LIBRARY.md` §2) |

### 3.1 The main meal is cooked once

**Lunch and dinner are the same food and therefore one decision.** The planner
produces one main meal per day and states that it serves both. This is the single
biggest departure from the book, and from the earlier spec, which planned them
separately and doubled the work for no reason.

So a week is **7 main-meal decisions**, not 14.

### 3.2 The two snacks are not the same slot

- **Snack 1 does not come from the book.** It is a separate authored library of 60
  light assemblies — soaked lentils, sprouts, cut fruit, chopped salads, curd dishes,
  soaked and roasted nuts. One a day, **repeating after 60 days**, which is far enough
  apart that a repeat does not read as repetition. No method is stored; nobody needs
  instructions for a cucumber kosumbari. The generator draws *across* families rather
  than down them, so a week does not become seven sprouts.
- **Snack 2 is kid-facing.** Overlaps heavily with breakfast in what it draws on, and
  that overlap is a constraint, not a convenience: **breakfast and snack 2 must not
  serve the same dish on the same day.**

Snack 2's book pool is derived by **section proxy** — breakfast dishes, bondas, bajes,
savouries and sweets in; sharp masala curries and pickles out. Mechanical, no
per-recipe judgement, good enough for v1. Because those sections lean fried and sweet,
it is supplemented by a dozen authored healthy additions (moong dal chilla, dahi poha,
roasted chana, thalipeeth and so on).

Both libraries live in `SNACK-LIBRARY.md` and ship complete. Unlike the book's
recipes, there is nothing to extract.

### 3.3 Composition by role

Each recipe carries a **role** from the book's 30 section headings. The main meal is
composed by role, not by free choice. This is what keeps generated meals culturally
sensible without any model involved.

**There are two kinds of main meal** (owner decision, 2026-11-11; `DECISIONS.md` D5):

| Kind | Composition | Frequency |
|---|---|---|
| **Plain-rice meal** | Plain rice, plus **one liquid dish** (a saar, kadi, sambar, kolambu or huli), plus **one curry** (a masala, mixed-vegetable or stuffed curry), plus **an optional sauteed vegetable** (plain curries, upkari). The vegetable side is not mandatory | Every day except the standalone day |
| **Standalone rice dish** | One dish from *Rice Dishes* (book section 14). It needs no saar or curry beside it | **About once a week**: exactly one day per week, chosen by the week's seed like every other generator decision |

- **Plain rice is not a dish.** The book has no entry for it. It is a fixed part of the
  plain-rice meal, shown as such, never selected and never repeat-avoided.
- **Soups are snacks, not main dishes** (D6). The four soups in *Saars, Rasams and Soups*
  (tomato, potato, mushroom, mixed vegetable) are drawn only for Snack 2.
- **Desserts are out of the main meal.** *Pongal, sakkarai* is a dessert and is excluded from the standalone rice pool
  (D7). An optional dessert on alternating Saturdays is a **later-phase** feature
  (release plan Phase 3), not required for v1.

Role is also what a future swap will be constrained by (§9).

---

## 4. Generation

### 4.1 Variety is the product

Repeat-avoidance is **core to v1**, not a later refinement.

- Every recipe carries a last-served date.
- A dish served within the last N days is excluded from selection. N differs by slot:
  the main meal pool is large and N can be generous; breakfast is habitual and N should
  be short.
- Where a role's pool is exhausted under the rule, the oldest-served dish returns
  rather than generation failing.
- Breakfast and snack 2 must not collide on a day (§3.2).
- Snack 1 runs a 60-day cycle by construction (`SNACK-LIBRARY.md` §1).

The exact values of N are an open question (§9) and should be tunable without a
rebuild.

### 4.1.1 Marking a dish cooked

Repeat-avoidance depends on knowing what was actually eaten, so a dish can be **marked
cooked**, which sets its last-served date.

This is the correction for history drift. If the app assumes the plan was followed, the
serving record diverges from reality every time it was not, and the core feature decays
quietly with no visible failure.

**It stays optional and one tap.** Requiring it would reintroduce exactly the daily
chore this app exists to remove. An unmarked slot falls back to assuming the plan was
followed.

**Marking works off-plan too.** Because the plan is a suggestion and not a commitment
(§4.6), the user may cook something entirely different. Any dish reached through
Search can therefore be marked cooked, not only the four on today's plan.

Marking a dish from Search records it as served **today**. It has no slot and cancels
nothing: the planned dishes keep their assumed record. This errs toward repeating less,
which is the safe direction, and avoids guessing which of a main meal's several dishes
was replaced. A user who did not cook a planned dish can leave it unmarked or swap it
out before the day (§4.5.2). Search-marking is today only.

### 4.2 Seeded, not random

Generation is a pure function of the last-served history plus an explicit seed. Same
inputs, same week. Regenerate advances the seed. The seed is stored with the week, so
any week can be reproduced exactly from a bug report.

This is what "deterministic" means here. No model, no network, no hidden state.

### 4.3 When the week is planned

**The next week is generated on Friday evening, automatically.** That leaves the
weekend to shop for it.

- Generation is unprompted. The premise is that the app decides; asking the user to
  press a button every Friday would be a weekly chore, which is the thing being
  removed.
- The new week surfaces as a notice, not an interruption. Nothing is required of the
  user before it is useful.
- A week runs Monday to Sunday. Friday evening therefore plans the week starting in
  three days.
- If the app is not opened on Friday, the upcoming week is generated on next open.
  Generation is cheap and seeded (§4.2), so when it runs makes no difference to what
  it produces.
- The generation day and time are configurable. Friday evening is the default, not an
  assumption baked into the logic.
- **Friday is a deadline, not a trigger.** Next week is generated the first time
  anything needs it — a tap through from the current week, or the configured moment,
  whichever comes first. Once generated it is stable.
- Generation is instantaneous: a pure function over data already held (§4.2). There is
  nothing to wait for, so generating on demand needs no loading state and shows none.
- **Later generation produces better weeks.** Generation reads serving history, so a
  week computed close to its own start has fresher history than one computed a week
  ahead. Lazy generation is not only simpler, it improves variety.
- Where next week has already been viewed, the Friday notice is suppressed — the app
  does not announce something the user went and fetched themselves.

The current week stays visible and untouched while next week exists alongside it.

### 4.4 Today first

The Menu opens on **today**, not on a seven-day list. "What do I cook tonight" is the
decision; the week is context for it.

The week remains viewable and plannable — it is how you see variety and cook ahead —
but it is the second screen, not the first.

### 4.5 Changing the plan

**Two verbs, because they do two different things.**

| Verb | Scope | Available on | What it does |
|---|---|---|---|
| **Regenerate** | A week | Next week only | Replaces all 28 slots and advances the seed |
| **Swap** | A dish | Any day after today, and all of next week. Not today, not past days | Replaces one dish with another of the same role, respecting §4.1 and §4.7 |

An earlier draft called both of these "regenerate", on the reasoning that it was one
idea at two scopes. That was wrong at the label: *regenerate this dish* reads as **make
this dish again, differently** — close to the opposite of replacing it. A label's job
is to be understood, not to mirror the internal model.

**The axis is whole versus single, not current versus next.**

A week-level regenerate on the current week would waste the shopping the week was
planned for — that is what the Friday cadence (§4.3) exists to protect. A dish-level
regenerate costs at most one dish's ingredients and leaves the other 27 slots standing.

**No reason is required.** The dish may be out of season, the shop may have been out of
it, or you may simply not fancy it. All three are the same action and the app does not
ask which. Where the dish was unobtainable it costs nothing at all, since a dish you
could not buy was never shopped for; where you simply changed your mind, you are
choosing to waste one dish's ingredients, which is your business and not the app's.

Swap replaces a dish with another of the same role, so the meal stays composed (§3.3) —
a saar never becomes a sweet. Where a role holds a single recipe, swap is unavailable
and says why, rather than presenting a control that does nothing.

#### 4.5.1 Choosing a dish yourself

Swap says *give me another of these*. Sometimes the user knows exactly what they want,
and no amount of swapping will land on it.

**Any dish found through Search can be assigned to a slot.** Pick the day and the slot;
it replaces whatever was there. Available on the same days as swap — today, any day
ahead, and all of next week.

**The role constraint governs the generator, not the user.** If someone searches out a
sweet and puts it in the main meal's saar position, the app allows it. Composition rules
(§3.3) exist to stop the machine producing nonsense, not to overrule a deliberate
choice. A warning would be condescending; a refusal would be wrong.

This is also what finally gives Search a job beyond browsing.

So a slot can be changed three ways, and they answer different needs:

| Route | For |
|---|---|
| **Swap** | "Not this one" — the app picks the replacement |
| **Add to a meal** (search and assign) | "I want that one" — the user picks |
| Ignore it and mark something else cooked (§4.6) | "Not following the plan today" |

#### 4.5.2 What stays fixed

| Day | Regenerate week | Change a slot | Mark cooked |
|---|---|---|---|
| Current week, days already passed | No | No | Yes |
| Current week, today | No | **No** — today's plan is fixed once the day begins | Yes |
| Current week, days after today | No | Yes | No |
| Next week | Yes | Yes | No |

"Change a slot" covers both swap and add-to-a-meal — they have the same reach.

A past day is a record, not a plan. Nothing rewrites it.

At the Monday boundary, next week becomes the current week: regenerate goes away, swap
and add-to-a-meal stay. **The week's plan as a whole is fixed; its
individual slots are not.** That is the accurate statement of the rule, and the blast
radius is the whole of the reasoning — a week-level regenerate silently wastes a
shopping trip, a slot-level change wastes at most one dish.

### 4.6 The plan is a suggestion, not a commitment

The user is free to ignore any part of a week and cook something else. Nothing in the
app treats deviation as an error, asks why, or tries to get the plan back on track.

Swap (§4.5) handles a plan that is *wrong*. This handles one that is merely *unwanted*: browse, cook something else, mark that instead (§4.1.1), and the
planned dish goes unused. Neither route requires the other.

**Nothing in the interface should imply obligation.** No streaks, no adherence
percentage, no "you missed a meal". The app answers a question; it does not keep
score.

### 4.7 Seasonality

A generator that suggests mango sasam in November is wrong before the user has any say
in it — **where seasons apply at all.**

**Seasonality is a setting, default on, and it is local.** With frozen and imported
produce widely available, a user in the United States would find the whole idea
irrelevant, and even in coastal Karnataka it is a strong tendency rather than a rule.
Turned off, the tags are ignored entirely and the filter simply does not run. The data
ships either way; it costs nothing to carry and nothing to ignore.

- A recipe carries an optional `season`: the months in which it can be made. Absent
  means all year, which covers the great majority — dal, rice, kokum, coconut and the
  spice box have no season.
- With the setting on, generation excludes any dish out of season for the week being
  planned. With it off, no dish is excluded on these grounds.
- The setting never blocks the user. Search and assign (§4.5.1) reaches an out-of-season
  dish regardless — the filter constrains the generator only.
- Tags are **hand-assigned during Pass 2, from the dish name**, which is all that
  exists at tier 1. Names carry it: anything naming mango, jackfruit, tender cashew,
  bamboo shoot, breadfruit or colocasia leaf is seasonal on its face. Expect on the
  order of 30 to 50 out of roughly 400.
- The Snack 1 library is tagged the same way — cut mango, watermelon and pineapple are
  not January food.
- Local availability is **not** seasonality. A shop being out of something is what
  slot-level editing is for, and that works whether the setting is on or off.

**When a position has nothing in season.** If a main-meal position's role has no
in-season recipe, that position is left out of the day and the day shows one dish fewer.
The generator never fills it with an out-of-season dish. A slot is never empty while any
other position or candidate exists; if a whole slot has no candidate it says so and
offers *Add to a meal*.

**This changes the Snack 1 cycle.** With seasonal entries excluded, fewer than 60 remain
available in a given month, so a fixed 59-day window would starve the pool. The window
becomes *available pool size minus one*, computed for the month, keeping the rotation
exact over whatever is in season.

---

## 5. Recipe depth — three tiers, lazily filled

This is what makes the app shippable in days rather than months.

| Tier | Content | Source | When |
|---|---|---|---|
| **1** | Name, role, **page number** — every recipe | The index, p. 171 on | Before launch. Days of work |
| **2** | Ingredients | The recipe page | On demand, per recipe |
| **3** | Method | The recipe page | On demand, rarely |

**Tier 1 alone is a working app.** Tap a dish and, if nothing deeper exists, it says
*Kokum saar — page 9*. The book is on the shelf; that is a real answer, not a failure
state. Dishes that actually get cooked earn their extraction over time. The long tail
may never need it.

### 5.1 Ingredient display

Extract **all** ingredients — no per-recipe judgement about what counts as major, which
would be slow and inconsistent.

Filter at **display** time instead: hide a fixed seasoning stoplist — mustard, curry
leaves, asafoetida, oil, salt and the like — behind *show all*. That yields "brinjal,
toor dal, coconut, tamarind" at a glance, it is mechanical rather than a judgement, and
revising the stoplist costs nothing because no re-extraction is involved.

### 5.2 Honesty rules

- Never invent a quantity, an ingredient or a step. Where a tier is missing, say so and
  give the page number.
- Search must not imply completeness it does not have. Until tier 2 is widely filled,
  ingredient search covers only extracted recipes — results state the coverage, and
  unextracted matches appear separately, matched on name alone.

---

## 6. Data work

- 172 scanned pages, no text layer. Page images go **straight to structured JSON** —
  OCR is skipped deliberately, because it mangles fractions and vernacular names and
  every page would need hand-correction anyway. Two passes to get one result.
- Pre-render all 172 pages to JPEG once, so extraction never reopens the 533 MB file.
- **Printed page 3 is PDF page 2.** Store the printed number and convert at extraction
  time, or the whole corpus drifts by one.
- The glossary (168–170) gives the ingredient master list with Kannada names in
  transliterated Latin script. Extract it alongside tier 1 — it underpins search.
- **The book gives no prep times.** Any quick/easy notion must be hand-assigned or
  dropped.
- Relative quantities are common ("a lemon-sized ball of tamarind"). Store `qtyText`
  verbatim; never normalise to grams.
- **Copyright.** Names, ingredients and the glossary are facts. The method prose is the
  author's — rewrite it in plainer, shorter wording if the app is ever shared.

---

## 7. Screens

| Screen | Holds |
|---|---|
| **Today** | The four slots for today, each dish markable as cooked. The landing screen |
| **Week** | Seven days, main meal prominent. Regenerate lives here. Next week appears here from Friday (§4.3) |
| **Dish** | Name, Kannada name, role, page number; ingredients and method where extracted |
| **Search** | Live filter over the whole pool by name, ingredient and Kannada name; role chips |

Three tabs: **Today, Week, Search**.

---

## 8. Not in v1

Named explicitly so they are not re-litigated by accident. Things actively planned for
the next version are in §9, not here.

| Excluded | Why | Revisit when |
|---|---|---|
| Pantry logging | Adds a weekly chore to remove a daily one; matching too coarse to earn it | Waste becomes the stated problem |
| Shopping list | Serves the shop, not the decision | The shop becomes the stated problem |
| Have / Buy on ingredients | Requires a pantry | With the pantry |
| Diabetic and vegan patterns | Variations on a planner that does not exist yet | After v1 holds up |
| Non-GSB tab | Separate corpus, separate problem | After v1 holds up |
| Kannada UI localisation | Names are already transliterated; UI strings are a separate effort | Later |
| Reminders and notifications | Never scoped. iOS support is weak | Deliberately unscoped |

---

## 9. Next version

Wanted, understood, and deliberately held back so v1 stays small.

| Item | Note |
|---|---|
| Shopping list derived from the week | The Friday cadence (§4.3) already serves shopping by giving the weekend's notice. A list makes it easier, not possible |
| Per-slot tuning of the repeat window | v1 ships with fixed defaults; exposing them needs real use first |
| Week-level regenerate on the current week | Deliberately absent, not deferred. It would waste the week's shopping (§4.5) |

**Swap and season tags were both here and are now in v1** (§4.5, §4.7).
Between them they answer the case that moved them: a plan containing a dish that cannot
actually be made.

---

## 10. Open questions

- **Repeat window N per slot** (§4.1). Needs real use to tune. Start generous for the
  main meal, short for breakfast.
- Does the main meal need a portion note, given it covers two sittings?
- Does the second recipe book change the role taxonomy?
- Which produce needs a season tag, and for which months? The list in §4.7 comes from
  general coastal-Karnataka seasons and is not verified.
- Should seasonality default on or off, given it is only right for some locales? On,
  for now, since the corpus is coastal.
- Does search-and-assign need to warn when the chosen dish does not match the slot's
  role, or is silence correct? Silence, for now.
- The spec says single user, one device (§11), yet the seasonality question is about
  *different* users in different places. If this is ever for more than one household,
  locale and settings stop being constants.
- Does a swap need to confirm, or is it cheap enough to be instant and repeatable?
- Does a frozen current week feel restrictive in practice, given deviation is always
  available (§4.6)? If so, the fix is a better next-week flow, not an unfreeze.
- Do the 60 Snack 1 variants read as genuinely distinct in use, or do some feel like
  the same dish? Rebalance the families if so.
- Does Snack 2 eventually need hand-tagging, or does the section proxy hold?

**The main risk is the cooked marker going unused** (§4.1.1). Repeat-avoidance is the
core feature and it rests on the serving history being true. If marking never happens,
quality degrades silently. This is the most likely way the app quietly stops being
good.

---

## 11. Tech stack

### Fixed

- **PWA**, installable on Android and iOS. One codebase, no app-store review.
- **No LLM anywhere in core logic.** Generation and search are lookup tables and plain
  conditionals.
- **Offline-first.** No "no connection" state.
- **No backend.** No accounts, no sync, single user.

### Proposed, not yet decided

| Layer | Recommendation | Why |
|---|---|---|
| Build and framework | Vite + React + TypeScript | PWA plugin handles manifest and service worker; types earn their keep against the recipe schema |
| Local storage | Dexie over IndexedDB | Last-served history and the current week; small and read-mostly |
| Recipe data | Static JSON bundle, cached | Tier 1 ships with the app; tiers 2–3 are added by rebuild, not at runtime |
| Hosting | Any static host | There is no server component |

---

## 12. Documents

### Current

| Document | Where | Holds |
|---|---|---|
| `REQUIREMENTS.md` | this file | What the product is and is not |
| PRD | [claude.ai](https://claude.ai/artifact/JHrEXXJuS9ho32XReT2SQP) | The same decisions, written for sharing and comment |
| `DESIGN.md` | this folder | Screens, interaction, visual system |
| `ARCHITECTURE.md` | this folder | Data model, generation algorithm, storage, state |
| `TEST-PLAN.md` | this folder | Acceptance criteria mapped to requirements |
| `SNACK-LIBRARY.md` | this folder | The 60 Snack 1 variants and the Snack 2 pools |
| `README.md` | this folder | Orientation — what to read first |

### Not documents

`CLAUDE.md` is the working profile for this project. `jayavshenoy_gsb_cook_book.pdf`
is the source cookbook.

### Superseded

Everything in `archive/`, with a README explaining what each was and why it went. That
includes the original PRD, design document and implementation details, all of which
describe the pantry-first product.

The **v2 mockup canvas** (https://claude.ai/artifact/NE53EZAHACiFDe3sbqnyNX) is also
stale — its tabs are Pantry, Menu and Search. It has not been redone.
