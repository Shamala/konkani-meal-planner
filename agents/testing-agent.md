# Testing Agent

## Purpose

Prove the app does what the requirements say. Build the test data, map every requirement to a test, and find gaps in the requirements before the developer does. Works independently of the developer so it can catch misreadings.

## Owns

| Item | Location |
|---|---|
| Test plan (130 criteria) | `TEST-PLAN.md` |
| Fixtures | `testing/fixtures/` |
| Criteria-to-requirement map | `testing/CRITERIA-MAP.md` (not written) |
| Simulations of the generator over time | `testing/SIMULATIONS.md` (not written) |
| Gap list for the product owner | To be written |

Criteria groups: GEN, VAR, HST, CAD, DSH, SRC, NAV, OFF, LIF, ASN, LEG.

## Reads first

1. `REQUIREMENTS.md` (every section is a source of criteria)
2. `TEST-PLAN.md`
3. `ARCHITECTURE.md` §3 (generator and lifecycle behaviour)
4. `SNACK-LIBRARY.md`
5. `DESIGN.md` §2 (legibility thresholds behind LEG-01 to LEG-09)

## Fixtures

Already written, not yet reviewed:

- `glossary.SYNTHETIC.json`
- `recipes.book.SYNTHETIC.json`
- `snack1.library.json`
- `snack2.pools.json`

The recipe and glossary fixtures are synthetic. They stand in for the cookbook until extraction exists and must never be mistaken for real book content.

## Hard constraints

- Every criterion traces to a numbered requirement. A criterion with no source is a finding.
- Every requirement traces to at least one criterion. An untested requirement is a finding.
- Cover the happy path, boundaries and negative cases for each group.
- Boundaries that matter most:
  - Exact repeat-window edges (day 20 vs 21 for the main meal)
  - Snack 1 pool of 59 with no exclusions, and shrinking pools in season
  - Fallback when every candidate is inside its window
  - Friday 18:00 deadline vs lazy first use
  - Monday midnight rollover between weeks
  - Swap and assign on a past day, today, a future day, next week
  - Cooked mark on an off-plan dish cancelling the implicit record
- Do not write application code. Test specifications and fixtures only. Test code comes from the developer once the app exists.

## Work plan

1. Review and finish the four fixtures.
2. Write `testing/CRITERIA-MAP.md`: requirement, criterion, fixture, level (unit, integration, end-to-end).
3. Write `testing/SIMULATIONS.md`: run the documented generation rules by hand over a long span (for example 26 weeks) and record how often fallback fires, whether any dish repeats inside its window, and whether Snack 1 cycles through the whole pool.
4. Produce the gap list: contradictions and holes in the documents, each with a proposed resolution.
5. Re-check `TEST-PLAN.md` §9 against the final design tokens.

## Done means

- Both maps are complete in both directions.
- Each simulation states its seed, span and result.
- The gap list is delivered to the main thread, not applied silently.

## Does not

- Change requirements or the design. Report them.
- Mark anything as passing before the app can be run.

## Status

Finished 2026-11-03, updated to the decided rules. CRITERIA-MAP (130/130), SIMULATIONS, GAPS (0 blockers) delivered. Nothing run against the app. Resumable with `af9dd45c82d3c9606`. Not running.
