# Simulations

**Owner:** testing agent. **Covers:** VAR-01, VAR-02, VAR-03, VAR-04, VAR-05, VAR-06, VAR-07, VAR-08, LIF-04, plus the GEN-08 and GEN-19 pressure cases that the same driver exposes.

These are properties no single generation can show. Each is specified as a driveable run: the corpus, how many synthetic days, what the driver advances, what is asserted.

**Status.** Updated 2026-11-03 to the owner's decisions in `DECISIONS.md`. Nothing here has been run against the app, which does not exist. Every "Reference result" comes from `testing/simulations/reference-model.py`, a small executable reading of `ARCHITECTURE.md` §3.2 as decided. It is evidence about the *rules as documented*, not about any implementation. Nothing is marked passing.

**Decided rules the model now encodes.** Inclusive repeat window (D1, VAR-09). A main-meal position with no in-season candidate is left out, never filled out of season (D2, GEN-23). Season is read from each day's own date (GEN-24). Priority when rules conflict: season, then repeat window, then family adjacency, which is best-effort. Swap and add-to-a-meal reach days after today and all of next week; today and past days refuse both (LIF-23). A Search mark is recorded as served today with no slot (D3, HST-13).

## 0. Conventions

### Harness contract (language-agnostic)

The app must let a test do these, whatever the stack. If it cannot, that is a testability defect to raise with the developer.

| Operation | Meaning |
|---|---|
| `setClock(date, time)` | Replace the clock the lifecycle reads. No wall-clock waiting |
| `loadCorpus(files)` | Replace the static corpus. Windows and settings default as documented |
| `resetStorage()` | Empty servingHistory, weeks, settings |
| `openApp()` | Run the open-time check (cadence, Monday transition) |
| `generateNextWeek()` | Same code path as the Friday deadline or a tap through |
| `markCooked(dishId, date)` | Explicit mark (slot argument pending G-16) |
| `readWeek(weekStart)` | The stored plan: 7 days, 4 slots, dish ids, seed |

### Seeds

Properties are asserted over **seeds 1 to 5 at minimum**. A single seed can pass by luck. The reference model derives a week seed as `base + weekIndex`; the app's real derivation is still undefined (G-14, open), so tests must read the seed the app stored (GEN-11) rather than assume it.

### The repeat window is inclusive (decided, D1)

A dish served on day D is excluded through D + N and may return on D + N + 1. Main meal returns on day 22, breakfast 8, Snack 2 15, and Snack 1 (window pool minus 1) returns after exactly its pool size, which is what makes the cycle exact. The superseded exclusive reading is still available with `EDGE=lt` for comparison; under it Snack 1 was not an exact cycle.

### Dates

All runs start on a Monday. Primary start: **Mon 2026-11-02**. Weeks are Monday to Sunday.

---

## SIM-01 Main meal repeat window (VAR-01, VAR-09)

| | |
|---|---|
| Corpus | `recipes.sim-rich.SYNTHETIC.json` (30 per main-meal position), `snack1.library.json` |
| Span | 26 weeks, 182 days, from 2026-11-02 |
| Advances | Week by week through the normal lifecycle: generate next week, advance the clock to Monday, repeat. No marks (implicit history only) |
| Variant B | Same, but each Wednesday mark one off-plan dish via Search. Per D3 it is recorded as served today with no slot |

**Assert**

1. For every main-meal dish, the gap between appearances is at least **22 days**. Zero violations.
2. Zero fallback events. With 30 per position the window cannot empty a pool.
3. Every day has exactly one dish per composition position, and no dish appears twice on one day.
4. Variant B: the off-plan dish does not return within 22 days; the **planned dishes on that day are unaffected** (HST-08: a Search mark cancels nothing), so they remain subject to their own windows from their planned date.

**Negative twin (GEN-08).** Same span on `recipes.book.SYNTHETIC.json`, pools of 3 to 4. Generation never fails, nothing is left out for repeat-window reasons, and every fallback returns the oldest-served candidate.

**Reference result (seed 1, 26 weeks, 728 position-days, inclusive window)**

| Pool per position | Fallbacks | Min gap between repeats |
|---|---|---|
| 3 | 716 | 3 |
| 10 | 688 | 10 |
| 20 | 648 | 20 |
| 21 | 644 | 21 |
| 22 | **0** | **22** |
| 23 | 0 | 22 |
| 30 | 0 | 22 |

**Finding (open, G-25).** The window needs at least 22 recipes in each composition position to hold at all. Below that the fallback is the normal path. Not a document error; the largest unmeasured product risk until Pass 2 reports pool sizes.

---

## SIM-02 Breakfast repeat window (VAR-02)

| | |
|---|---|
| Corpus | `recipes.sim-rich.SYNTHETIC.json` (12 breakfast), `snack1.library.json` |
| Span | 26 weeks from 2026-11-02, seeds 1 to 5 |

**Assert.** Gap between repeats of any breakfast dish is at least 8. Zero fallbacks. Breakfast and Snack 2 never carry the same dish on one day (GEN-07).

**Reference result (seed 1, 182 days)**

| Breakfast pool | Fallbacks | Min gap |
|---|---|---|
| 4 | 178 | 4 |
| 6 | 176 | 6 |
| 7 | 175 | 7 |
| 8 | **0** | **8** |
| 9 | 0 | 8 |
| 12 | 0 | 8 |

`recipes.book.SYNTHETIC.json` has 7 breakfast-slot recipes (6 in November): fallback nearly every day, correct for that fixture and no basis for judging variety.

---

## SIM-03 Snack 1 exact cycle (VAR-03, VAR-07, VAR-08)

**Why VAR-03 needs care (G-11, narrowed, open).** It asserts "across N consecutive days, N = entries in season that month, each appears exactly once". The in-season counts, computed from the 60 real tags:

| Months | In season | Window (pool minus 1) |
|---|---|---|
| Jan, Feb | 54 | 53 |
| Mar | 59 | 58 |
| Apr, May, Jun | 60 | 59 |
| Jul | 56 | 55 |
| Aug to Dec | 54 | 53 |

N is at least 54 and no month exceeds 31 days, so **no single calendar month contains a full cycle.** The assertion is observable only over a stretch where the pool is constant: **Aug 1 to Feb 28** (212 days at 54, three full cycles) and **Apr 1 to Jun 30** (91 days at 60, one full cycle). `SNACK-LIBRARY.md` §3 still states the months wrongly (G-01, open).

### SIM-03a Pool of 54 (VAR-08)

| | |
|---|---|
| Span | 162 days from **2026-08-03** (3 cycles of 54), one day at a time |
| Assert | Days 1-54, 55-108 and 109-162 each hold 54 distinct ids. No excluded id (the six listed for Aug in `seasonPools.byMonth`) appears. Every id appears exactly 3 times. Cycle order is identical in each pass (forced by the window; a test asserting different orders is wrong) |

### SIM-03b Pool of 60 (VAR-07)

| | |
|---|---|
| Span | 91 days from **2027-04-01**; and a second run with **seasons OFF** for 180 days from 2026-11-02 (the only way to get a pure 60 in November) |
| Assert | Days 1-60 hold all 60 ids once; days 61-91 repeat days 1-31 in the same order. Seasons-off run: every 60-day block exact |

### SIM-03c Boundary crossing (informational)

212 days from 2027-02-01 through pool 54, 59, 60, 56 and back to 54. Record, do not fail, any entry that repeats sooner than the previous month's window would allow.

**Reference results (library fully real, inclusive window)**

| Run | Result |
|---|---|
| SIM-03a, pool 54, 162 days | Exact at offsets 0, 54, 108: `[True, True, True]` |
| SIM-03b, pool 60, 91 days | Exact |
| SIM-03b, seasons off, 180 days | Exact at 0, 60, 120: `[True, True, True]` |
| SIM-03c, 212 days | 212 picks, no fallback |

Superseded exclusive reading (`EDGE=lt`): 03a was `[False, False, True]` and the seasons-off run `[False, True, False]`. The decision removes that failure.

**Family adjacency (VAR-04, best-effort by decision).** The cycle repeats in identical order, so a first-pass adjacency recurs every cycle. Same-family adjacencies over seeds 1 to 20:

| Run | Seeds with at least one | Worst seed |
|---|---|---|
| Aug to Feb, 162 d | 8 of 20 | 5 |
| Apr to Jun, 91 d | 5 of 20 | 1 |
| Feb to Aug, 212 d | 15 of 20 | 6 |
| Seasons off, 180 d | 5 of 20 | 6 |

Per the decided priority these are permitted, so VAR-04 is asserted as a **measured count, with VAR-03 strict**. Open: whether a once-per-pool constructive ordering should drive the count to zero (G-13 priority resolved, the construction is a proposal). Seed 1 shows 0, 1, 0 and 0 on the four runs, so a single-seed test would mislead.

---

## SIM-04 Snack 1 across a mid-cycle pool change

| | |
|---|---|
| Span | 2027-06-15 to 2027-08-05: pool 60, then 56 on Jul 1, then 54 on Aug 1 |
| Assert | No excluded entry appears on or after the day it leaves season. Every day has a Snack 1. The window is recomputed on the first day of the new month |

---

## SIM-05 Snack 2 window (VAR-05)

| | |
|---|---|
| Corpus | `recipes.sim-rich.SYNTHETIC.json` (12 dual-slot breakfast, 20 sweets) plus the 12 authored additions: pool 44 |
| Span | 26 weeks from 2026-11-02, seeds 1 to 5 |
| Assert | Gap at least **15**. Zero fallbacks. Never the same dish as that day's breakfast |

**Reference result (seed 1):** 182 ok, 0 fallback, min gap 15. 8-week distinct Snack 2 dishes: 33.

**Interaction (open, G-28).** On `recipes.book.SYNTHETIC.json` (pool 20 to 21) Snack 2 is on fallback for **165 of 182 days** with seasons ON and **167** with seasons OFF. Serving history is keyed by recipe id and shared across slots, which is a likely contributor; not isolated, and undocumented.

---

## SIM-06 Variety against the pre-app baseline (VAR-06)

| | |
|---|---|
| Corpus | `recipes.sim-rich.SYNTHETIC.json` |
| Span | 8 weeks, 56 days, seeds 1 to 5 |
| Measure | Distinct main-meal ids; distinct complete main meals; distinct breakfast ids |

**Reference result (seed 1):** 119 of 120 main-meal dishes appear in 8 weeks; 12 of 12 breakfasts.

**Still not assertable as written (open, G-24).** "Substantially exceed 6" has no number, and a pool of 30 makes any number pass. Pending the owner: suggest at least 30 distinct main-meal dishes in 8 weeks and no repeated complete main meal. The real answer needs the real corpus after Pass 2.

---

## SIM-07 A position with no in-season candidate (GEN-23, GEN-19, GEN-01)

Replaces the earlier GEN-08 / GEN-19 collision (resolved by D2: season wins, completeness gives).

| | |
|---|---|
| Corpus | `recipes.book.SYNTHETIC.json`; composition overridden to four positions, the fourth holding role `sasam` only (both sasam recipes are seasonal) |
| Span | 4 weeks (28 days) per run, seeds 1 to 5 |
| Runs | (a) 2026-11-02, seasons ON; (b) 2027-05-03, seasons ON (both in season); (c) 2026-11-02, seasons OFF |
| Slot-empty case | Breakfast pool restricted to `syn-colocasia-patholi` (Jun to Sep), 2026-11-02, seasons ON |

**Assert**

1. (a) The sasam position is absent on all 28 days: each day has **3** main-meal dishes. No sasam dish is placed. The day is never padded with an out-of-season dish.
2. (b) 4 dishes every day. (c) 4 dishes every day, with out-of-season dishes allowed because the filter does not run (GEN-21).
3. A slot is empty only when it has no candidate at all; the screen then offers *Add to a meal* (slot-empty case).
4. GEN-19: when the repeat window, not season, empties a pool, the oldest-served in-season candidate returns and no out-of-season dish does.

**Reference result (seed 1)**

| Run | Sasam position | Main-meal dishes per day | Out-of-season placed |
|---|---|---|---|
| (a) Nov, ON | LEFT_OUT 28 of 28 | 3 on 28 days | 0 |
| (b) May, ON | 2 ok, 26 fallback | 4 on 28 days | 0 |
| (c) Nov, OFF | 2 ok, 26 fallback | 4 on 28 days | 28 (filter off, expected) |
| Breakfast, one seasonal dish, Nov | LEFT_OUT 14 of 14 | slot empty | 0 |

Note (b) and (c): a pool of 2 against a 21-day window is on fallback almost daily. That is correct behaviour and the reason the small corpus cannot test VAR-01.

---

## SIM-08 Season follows each day's own date (GEN-24)

| | |
|---|---|
| Corpus | `recipes.book.SYNTHETIC.json`, one position holding `sasam` only |
| Span | The weeks of Mon 2027-03-29 (Mar 29 to Apr 4) and Mon 2027-07-26 (Jul 26 to Aug 1) |
| Assert | Every placed dish is in season **on the date it is cooked**; days with no in-season candidate are left out |

**Reference result**

| Week | Result |
|---|---|
| 2027-03-29 | 7 days placed. Mango sasam (Apr to Jul) appears only on Apr 1 and Apr 3; none on Mar 29 to 31. 0 out of season |
| 2027-07-26 | 6 days placed. Aug 1 left out (both sasam dishes end in July). 0 out of season |

Under the old Monday-month rule the first week would never have used mango and the second would have served a July dish on Aug 1. DECISIONS notes the engine still uses the Monday's month and needs this change.

---

## SIM-09 Swap and add-to-a-meal reach (LIF-19, LIF-20, LIF-23, ASN-04, ASN-08)

Pure state table; no generation needed. Today = Wed 2026-11-04, current week W1 (Nov 2), next week W2 (Nov 9).

| Target | Swap and Add to a meal | Dish screen shows |
|---|---|---|
| W1 Mon 2, Tue 3 (passed) | refused | inert: *This day is done. Swapping works on days still to come.* |
| W1 Wed 4 (today) | **refused** | inert: *Today's plan is fixed. Swap works from tomorrow.* Picker lists no slot for today |
| W1 Thu 5 to Sun 8 | allowed | Swap with a different dish (or the inert single-recipe reason) |
| W2 every day | allowed | same |
| Any past week | refused | inert |

The model's `swap_allowed` reproduces this table exactly. Advance the clock to Thursday and assert Wed 4 flips to refused for the same plan. A cooked mark exists only on today and passed days, so a swap and a cooked mark can never meet on one slot (assert: no day has both).

---

## SIM-LIF04 The Monday boundary (LIF-04, LIF-21, LIF-05)

A clock-controlled test, per `TEST-PLAN.md` §10. Nothing waits in real time.

**Setup.** `resetStorage`, `setClock(2026-11-02 09:00)`, `openApp()`. Expect a current week starting 2026-11-02 generated from today onward (CAD-08, CAD-09; Monday is today so no earlier days).

**Drive.** For each instant below, `setClock`, `openApp()`, read state. Repeat in `Asia/Kolkata`, `America/New_York` (DST ended 2026-11-01) and `Europe/London`.

| Instant (local) | Next week W2 (Nov 9) | Current week W1 | Expected |
|---|---|---|---|
| Mon 2026-11-02 09:00 | absent | current | Swap on Tue to Sun, **not Mon**; no regenerate; cooked on Mon only |
| Thu 2026-11-05 12:00 | absent | current | *Plan next week* generates W2 on the spot (LIF-13); no notice before Friday (LIF-07) |
| Fri 2026-11-06 17:59 | absent unless viewed | current | No notice |
| Fri 2026-11-06 18:00 | exists, notice shown | current | Notice, never a modal (CAD-02); Dismiss hides it and survives restart (CAD-10); already-viewed W2 means no notice (LIF-16) |
| Sat 2026-11-07 10:00 | exists | current | W1 unchanged except cooked marks (CAD-05) |
| Sun 2026-11-08 23:59:59 | exists | current | W2: regenerate yes, cooked no, swap on all days. W1: no regenerate |
| Mon 2026-11-09 00:00:00 | **current** | **past** | W2: regenerate **gone**, swap on Tue to Sun but **not Mon (today)** (LIF-21, LIF-23); W1 immutable (LIF-05) |
| Mon 2026-11-09 00:00:00, opened 3 days late | **current** | **past** | Same state; the transition is by date comparison on open |

**Assert across the boundary**

1. W2's stored plan is byte-identical before and after the Monday transition (state changes, content does not).
2. W1's plan and cooked marks are byte-identical.
3. The transition generates nothing by itself; a new next week appears per cadence.
4. Cooked mark is available on W2's Monday only (today), and on no later day (Q9).

**Still undefined (do not assert until ruled)**

| Case | Question | Gap |
|---|---|---|
| App unopened for 17 days | Which weeks exist; are skipped weeks backfilled | G-17 (first-launch part resolved by Q5) |
| Timezone change between Sunday and Monday; clock set backwards | Which Monday; can a past week become current | G-29 |
| Friday 18:00 with the app open and untouched | Does anything happen without a navigation | G-18 |

---

## How to rerun the reference model

```
python3 -I testing/simulations/reference-model.py            # decided rules (inclusive)
EDGE=lt python3 -I testing/simulations/reference-model.py    # superseded exclusive reading, comparison only
```

It reads only `testing/fixtures/`. Each remaining undocumented behaviour it must assume is a named constant at its top, tied to a still-open gap. Delete it when the app can be driven directly.
