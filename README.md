# Konkani Meal Planner

A single-user offline PWA that decides what to cook each day, drawing on a 400-recipe
GSB cookbook the household already owns — and never repeating itself.

**Status:** design complete, nothing built. No code exists yet.

---

## The one-line premise

> Tell me what to cook, from the book I already own, without repeating myself.

The problem is decision fatigue, not waste and not shopping. The app has no pantry, no
shopping list and no onboarding, because none of those reduce the cost of the daily
decision — and two of them add chores of their own.

---

## Read in this order

| # | Document | Read it for |
|---|---|---|
| 1 | [`REQUIREMENTS.md`](REQUIREMENTS.md) | **Start here.** What the product is, what it is not, and why |
| 2 | [PRD](https://claude.ai/artifact/JHrEXXJuS9ho32XReT2SQP) | The same decisions, written for sharing and comment |
| 3 | [`DESIGN.md`](DESIGN.md) | Screens, interaction rules, palette and type |
| 4 | [`ARCHITECTURE.md`](ARCHITECTURE.md) | Data model, generation algorithm, storage |
| 5 | [`TEST-PLAN.md`](TEST-PLAN.md) | 130 acceptance criteria, mapped to requirements |
| 6 | [`SNACK-LIBRARY.md`](SNACK-LIBRARY.md) | The 60 Snack 1 variants, and the Snack 2 pools |

`REQUIREMENTS.md` wins any disagreement between documents.

---

## The seven things that shape everything

1. **The day is four slots, and lunch equals dinner.** Breakfast, a light morning
   snack, one main meal serving both sittings, and a kid-facing evening snack. Seven
   main-meal decisions a week, not fourteen.
2. **Variety is the product.** Repeat-avoidance is the core feature, not a refinement.
   A plan that suggests last Tuesday's dinner has failed at its only job.
3. **The book stays on the shelf, and that is fine.** Most recipes ship as a name, a
   role and a page number. Tapping a dish and getting *Kokum saar · page 9* is a
   complete answer, not a failure state. This is what makes the app shippable in days
   rather than months.
4. **The week is planned Friday evening, unprompted.** That leaves the weekend to shop.
   Nothing is asked of the user before the app is useful.
5. **The week's plan as a whole is fixed; its individual slots are not.** A week-level
   regenerate only reaches next week, because changing a whole week mid-week wastes the
   shopping it justified. But any single slot can be changed on any day after today —
   swap it for another of the same role, or search out a dish and assign it. The blast
   radius is the whole of the reasoning: a **week** regenerates, a **dish** swaps.
6. **Rules bind the generator, not the user.** Role, season and repeat filtering keep the
   machine from producing nonsense. A dish you name yourself bypasses all three, without
   warning or confirmation.
7. **Generation is a pure function** of serving history plus a seed. No model, no
   network, no randomness. Any week can be reproduced exactly from a bug report.

---

## Before anything can be built

**Pass 2 extraction is the ship gate.** The cookbook scan has no text layer, so every
recipe must be read off page images. Pass 2 reads the index (printed p. 171 on) into a
name, role and page number for all ~400 recipes. That is days of work and the only
thing standing between here and a working app.

Passes 1 (glossary) and 0 (schema) come first and are small. Pass 3 — ingredients and
methods — fills in over time and blocks nothing. `ARCHITECTURE.md` §6 has the detail.

---

## Open decisions

The stack is proposed but unconfirmed: Vite + React + TypeScript, Dexie over IndexedDB,
static JSON corpus, any static host. It is also the least consequential open decision —
the recipe schema and the id contract will outlive whatever framework is picked.

No blocking design questions remain. The last one — what happens to cooked marks when a
week is regenerated — was dissolved rather than answered: because regenerate touches
only next week and cooked marks live only on the current week, the two can never
collide. `TEST-PLAN.md` §7 keeps the reasoning.

---

## Also in this folder

- `CLAUDE.md` — the working profile for this project.
- `jayavshenoy_gsb_cook_book.pdf` — *Dakshin Bharat Dishes*, Jaya V. Shenoy, 7th ed.
  2016. 533 MB, 172 pages, no text layer.
- `archive/` — superseded specs, with a README explaining what each was and why it
  went. The whole pantry-first design lives there.
