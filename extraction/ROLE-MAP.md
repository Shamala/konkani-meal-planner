# Role and slot map for the tier-1 corpus

Applies to `recipes.tier1.json` (416 recipes). Status: proposed 2026-11-11; the position mapping is the owner's to confirm. `REQUIREMENTS.md` §3.3 and `DECISIONS.md` D5 to D7 are the source of the rules.

## Role

`role` is the book's section heading as a slug (30 values), so it is read, not judged. One exception: the four soups carry `soup` (D6).

## Which recipes can fill which slot

| Rule | Slots | Count |
|---|---|---|
| Sections 2 (not soups), 3, 4, 7, 8, 10, 12, 14 (not Pongal, sakkarai) | `main` | 120 |
| The four soups (Mixed veg. soup, Mushroom soup, Potato soup, Tomato soup) | `snack2` | 4 |
| Everything else, and Pongal, sakkarai (dessert, D7) | none: search-only | 292 |
| Sections 17 to 20 (and 21, 23 to 26 for Snack 2) | breakfast, Snack 2 | added at load by `withDerivedSlots`, not stored |

## Main-meal positions (the shape the engine is given)

| Position | Meal type | Roles | Candidates |
|---|---|---|---|
| Liquid dish | plain-rice | `saars-rasams-soups` (16 after soups), `kadis-thamblis` (8), `sambars-kolambus-hulis` (9) | 33 |
| Curry | plain-rice | `mixed-vegetable-curries` (5), `masala-curries` (39), `stuffed-curries` (4) | 48 |
| Sauteed vegetable | plain-rice | `plain-curries` | 22 |
| Rice dish | standalone | `rice-dishes` | 17 |

Plain rice is implicit and not in the data (D5a).

**Left out of `main` on purpose, owner to confirm:** section 11 *Pickle Type Curries* (10), which read as condiments, section 9 *Pathravade, Sannan and Sanna Polo* (8), section 22 *Puri, Chapathi and Side Dishes* (49: puri and north-Indian dishes, not rice-meal companions), and section 6 *Chutneys, Pachadis and Kosumbaris* (20: accompaniments).

## Measured, not estimated (G-25)

`app/src/engine/corpus.test.ts` generates 52 consecutive weeks from this corpus: no position was unfillable, no main-meal dish repeated inside the 21-day window, soups never reached `main`, one standalone rice dish every week.

## Open items

1. **Season: 12 tags applied and confirmed by the owner (2026-11-11); the untagged candidates below are still open.** Months follow the Snack 1 library's convention (raw mango 3 to 6, ripe mango 4 to 7). Only dishes whose *name* carries the season were tagged, per `REQUIREMENTS.md` §4.7.

   | Dish (page) | Months | Basis |
   |---|---|---|
   | Raw mango pachadi (29), Mango upkari (39), Mango murabba (164) | Mar to Jun | raw mango |
   | Mango pachadi (29) | Mar to Jul | raw or ripe unclear |
   | Jam, mango (163), Mango rasayan (85), Mango pineapple saasam (57) | Apr to Jul | ripe mango |
   | Tender jack chakko (56) | Mar to May | tender jackfruit |
   | Jack fruit payasam (82) | Apr to Jul | ripe jackfruit |
   | Tender cashewnut upkari (39) | Feb to May | tender cashew |
   | Bread fruit ghushi (47) | May to Sep | **low confidence** |
   | Kharbuza rasayan (85) | Mar to Jun | muskmelon, as Snack 1 |

   **Not tagged, needs the owner or the recipe page:** Alambe ambat, buthi and Phanna upkari (alambe may be wild mushroom, a monsoon dish), Tender thur upkari (fresh pigeon pea, probably winter), Tender cucumber hulel and saasam, Tender shoots thambli (which shoots?), Gooseberry murabba and jam (probably winter), Colocasia root upkari (the root is all-year; only the leaf is seasonal), Pumpkin flower fries, Brahmi leaf chutney. **12 tagged against the 30 to 50 §4.7 expects:** names alone do not reach that many, so the rest need a page read.
   **Effect:** with seasons on, mango upkari and tender cashewnut upkari leave the sauteed-vegetable pool (22) outside their months, leaving 20 in November. `corpus.test.ts` still shows no repeat inside the 21-day window across 52 weeks, and a new test shows no tagged dish is ever served out of season.
2. **Two-page dishes.** Alu fry (35, 36), Brinjal bhurta (127, 128), Potato soup (11, 12), Ridge gourd skin chutney (28, 29), Semia kheer (83, 84). The `Recipe` type has one `page`. File carries the second as `alsoOnPages`. Proposal: add `alsoOnPages?: number[]` to the type, so the Dish screen can say "pages 35, 36".
3. **Kannada names.** `ARCHITECTURE.md` §2.1 says `kannadaName` comes from the glossary. It cannot: the glossary lists **foodstuffs** (ragi, avalakki), not dishes. No source for dish Kannada names has been found yet.
4. **Optional side.** D5 says the sauteed vegetable is optional. The engine always fills every position it is given. v1 can either always include the side (as the corpus test does) or add seeded omission to the engine. Owner to choose.
5. **"Horse gram upkari" (p.8)** may be a pointer inside another recipe, not a recipe. Check before it ships.
6. **Section proxy.** "Twelve in one chutney" (p.138) sits in the bajes section; the section label may be wrong for a few dishes.
