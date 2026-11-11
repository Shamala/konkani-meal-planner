# Component Inventory — what to ask Token Forge for

**Owner:** product architect, from the development agent's draft
**Last updated:** 2026-11-03, reconciled with `DESIGN.md` and `DECISIONS.md` after the design pass. This is the version to hand to Token Forge.
**Derived from:** the nine v3 mocked screens, the nine v4 boards (dark, states, components), `DESIGN.md` §2–§7, `DECISIONS.md`, `REQUIREMENTS.md` §4, and the
Token Forge gallery (https://claude.ai/artifact/5iZcnSSPzu45QjB82R1qgF).

Purpose: a buildable list of components for Token Forge to supply, each named in Token Forge's
own semantic token vocabulary. **`DESIGN.md` is the source of truth.** The nine v3 mocks pre-date
it and are stale in the places listed in §6; where a mock and `DESIGN.md` disagree, build to
`DESIGN.md`. The v4 boards follow `DESIGN.md` but have never been rendered.

Nothing here is signed off as UI. This is a procurement list, not a screen spec.

---

## 1. Token vocabulary

Token Forge's semantic layer, with this project's values from `DESIGN.md` §2.2 and §2.6. Every
component below names its tokens in these terms.

| Token | Light | Dark | Used by this project |
|---|---|---|---|
| `bg.canvas` | `#e2e8f0` | `#020617` | Yes — every screen body |
| `bg.surface` | `#ffffff` | `#0f172a` | Yes — all cards, rows, headers, tab bar |
| `bg.sunken` | `#f1f5f9` | `#1e293b` | Yes — passed days, provisional groups |
| `fg.default` | `#0f172a` | `#f8fafc` | Yes |
| `fg.muted` | `#334155` | `#cbd5e1` | Yes — all meta and label text |
| `fg.subtle` | `#475569` | `#cbd5e1` | Yes — cooked dish names, row chevrons. Light: on `bg.surface` only (6.2 and 6.9 fail elsewhere). Dark equals `fg.muted` |
| `fg.onAccent` | `#ffffff` | `#020617` | Yes |
| `action.primary` | `#115e59` | `#5eead4` | Yes |
| `action.primaryHover` | `#134e4a` | `#99f6e4` | Yes — link and button hover |
| `action.secondary` | **not given** | **not given** | No — this project's secondary is an outline, not a fill (C21) |
| `border.default` | `#cbd5e1` | `#334155` | Yes — decorative only, carries no meaning alone |
| `border.subtle` | `#e2e8f0` | `#1e293b` | Yes — row separators inside cards (new) |
| `border.strong` | `#64748b` | `#94a3b8` | Yes — field borders, unset tick, dashed draft borders |
| `border.focus` | `#0f172a` | `#f8fafc` | Yes — 3px ring with a 2px gap on `:focus-visible` (`DESIGN.md` §2.7). Alias of `fg.default` |
| `status.success` | `#15803d` | `#4ade80` | **No — dropped from this project.** Every tick is `action.primary`. Leave it unused |
| `status.warning` / `.danger` / `.info` | not given | not given | No. Nothing in this app is a warning, an error or an alert |
| `radius.control` | 12px | — | Yes |
| `density.scale` | ×1.15 | — | Yes |
| `font.ui` | system (`-apple-system`/`BlinkMacSystemFont`/Inter) | — | Yes |

**Token requests beyond the existing set** (full list: `DESIGN.md` §7, ten items):

- **`radius.pill`** — half the control's height. The cooked tick (48px), the filter chips (56px)
  and the method step numbers are all fully round. The mocks hard-code 22/24/13/15px to fake it.
- **A nested-radius rule.** Child radius = parent radius minus the gap, floor 0. The week switcher
  is a 12px frame with a 3px inset, so its segments are 9px.
- **`border.subtle`** and **`border.focus`**, both defined above.

**Resolved:** row separators were drawn with `#e2e8f0`, a background token in a border property. They now use `border.subtle`, which has the same light value but its own name and a dark value.

---

## 2. Summary

| # | Component | Token Forge |
|---|---|---|
| C1 | Tab bar (bottom) | **New** — its Nav bar is a top bar |
| C2 | Screen header | **New** |
| C3 | Pushed-screen header | **New** |
| C4 | Back link | **New** |
| C5 | Section heading | **New** — its `.cap` is 10px |
| C6 | Caption | **New** |
| C7 | Grouped list card | Variant of **Card** |
| C8 | List row | **New** |
| C9 | Slot card | Variant of **Card** |
| C10 | Dish row | **New** |
| C11 | Cooked tick | Variant of **Checkbox** |
| C12 | Week switcher | Variant of **Tabs** |
| C13 | Day row | **New** |
| C14 | Frozen-week block | Variant of **Alert** |
| C15 | Planned label row | **New** |
| C16 | Page-number block | **New** |
| C17 | Ingredient row | **New** |
| C18 | Disclosure text button | Variant of **Buttons** (ghost) |
| C19 | Method step list | **New** |
| C20 | Primary action button | Variant of **Buttons** |
| C21 | Secondary action button | Variant of **Buttons** (outline) |
| C22 | Search field | Variant of **Input** |
| C23 | Filter chip | **New** |
| C24 | Day accordion | **New** |
| C25 | Slot picker row | **New** |
| C26 | Regenerate confirm sheet | **New** — bottom sheet, `DESIGN.md` §3.6 |
| C27 | Next-week notice | Variant of **Alert**, with a Dismiss action — `DESIGN.md` §3.7 |
| C28 | Setting switch | **New** — `DESIGN.md` §3.5 |
| C29 | Schedule field | Variant of **Select** — native selects, `DESIGN.md` §3.5 |
| C30 | Zero-results state | **New** — `DESIGN.md` §3.4.1 |
| C31 | Inert reason block | **New** — replaces every disabled control, `DESIGN.md` §2.8 |
| C32 | Settings button | Variant of **Buttons** (icon) — Today header, `DESIGN.md` §3.1 |

Twenty-five components exist in the nine v3 mocks; seven more (C26 to C32) are specified in
`DESIGN.md` and drawn only on the v4 boards. In all, **twenty are new to Token Forge** and twelve are variants.
The gap is real on all five examples the owner asked about, with one nuance: the tab bar, the
page-number block and the day-and-slot picker are wholly new, while the week switcher and the
cooked tick have only a distant relative in the gallery (Token Forge's segmented control lives in
its own chrome, not its gallery, and its Checkbox is a 17px square) — treat both as new work with
a token-compatible starting point, not as a restyle.

---

## 3. Chrome and cross-cutting

### C1 — Tab bar (bottom)
- **Screens:** all nine.
- **States:** default; active (one of three); no disabled or empty state — all three tabs always reachable.
- **Tokens:** `bg.surface`, `border.default` (2px top rule), `fg.muted` inactive, `action.primary` active, `font.ui`.
- **Minimum target:** 56px high × 64px wide per tab, as mocked. Safe-area padding below (mocks use 20px).
- **Specific accessibility:** active is marked by colour **and** weight 600 **and** icon stroke 2.2 vs 2.0, so it survives the no-hue-alone rule. It needs `aria-current="page"`, which no mock sets. **The active tab tracks the screen's origin, not the screen itself** — the Dish screen keeps Today, Week or Search lit according to where it was opened from (verified across all four Dish mocks), so `active` must be a prop fed by the navigation state in `ARCHITECTURE.md` §5, not inferred from the route.
- **Token Forge delta:** its Nav bar is a horizontal top bar with a logo and an avatar. Same tokens, different geometry and orientation. Ask for a bottom variant with icon-above-label tabs.

### C2 — Screen header
- **Screens:** Main (with eyebrow), WeekCurrent, WeekNext, Search.
- **States:** default; with eyebrow label (Main's "MONDAY 2 NOVEMBER"); with a trailing control slot (Today puts the Settings button C32 there; the week switcher sits below the title on Week).
- **Tokens:** `bg.canvas` (it is not a surface), `fg.default` title, `fg.muted` eyebrow.
- **Minimum target:** not interactive. 44px top padding for the status bar; 32px/600 title per `DESIGN.md` §2.3.
- **Specific accessibility:** exactly one `h1` per screen. The eyebrow is a sibling `p`, not a heading, so it does not break the heading order.

### C3 — Pushed-screen header
- **Screens:** DishExtracted, DishTier1, DishSnack, DishFromSearch, AddToMeal.
- **States:** default; with trailing cooked tick (all four Dish screens); without it (AddToMeal); one-line title vs wrapping title.
- **Tokens:** `bg.surface`, `border.default` (2px bottom rule), `fg.default` title, `fg.muted` meta line.
- **Minimum target:** not interactive itself; its two children (C4, C11) carry their own.
- **Specific accessibility:** the title is the screen's `h1` and must be the focus target after navigation, so a screen reader announces the dish rather than re-reading the tab bar.
- **Size:** 28px / 600 on every pushed screen (`DESIGN.md` §2.3). Three v3 mocks drew 30px; they are stale.

### C4 — Back link
- **Screens:** the five pushed screens.
- **States:** default; hover (`action.primaryHover`). No disabled state — it is always valid.
- **Tokens:** `action.primary`, `font.ui`.
- **Minimum target:** 56px (`DESIGN.md` §2.4). The v3 mocks drew 44px.
- **Specific accessibility:** its label names the origin — "Today", "Week", "Search", or the dish name on AddToMeal. The accessible name must therefore be "Back to Today", not bare "Today", or the control announces as a place rather than an action. This is the one component that reads the in-memory navigation state in `ARCHITECTURE.md` §5, so it is where a state leak would show.

### C5 — Section heading
- **Screens:** Search, DishExtracted, DishTier1, DishSnack, DishFromSearch. Main's slot labels are the same style but belong to C9. WeekNext's "PLANNED" is C15; WeekCurrent and AddToMeal carry no section headings (AddToMeal's day labels are spans, not headings).
- **States:** default; with a trailing control (DishExtracted/DishFromSearch pair it with C18); with a following note paragraph (Search's name-only group).
- **Tokens:** `fg.muted`, `font.ui`.
- **Minimum target:** not interactive.
- **Specific accessibility:** 15px/600, uppercase, 0.5px tracking. These are real `h2`s inside the screen, not styled spans. Uppercase is applied with `text-transform` so the accessible name stays sentence-case for speech.
- **Token Forge delta:** its gallery caption is 10px uppercase in mono — **below this project's 15px floor by 5px**. Ask for the 15px/600 system-font version.

### C6 — Caption
- **Screens:** WeekNext, DishFromSearch (under-action); Search, DishExtracted, DishSnack, AddToMeal (group note); Search (coverage footer); DishTier1, DishSnack (prose).
- **Variants:** *under-action*, centred under a full-width button ("A new week, avoiding what you have cooked recently."; "No swap here — this dish is in no plan yet."); *group note*, left-aligned under or over a list ("Seasonings hidden — …"; "Not extracted yet, so their ingredients were not searched."); *coverage line*, directly under the role chips and **above** the results ("Ingredients searched for 62 of 412 recipes."); *explanatory prose*, 17px `fg.muted`, 1.5 line height, standing alone between two sections (DishTier1's "Ingredients and method are on the page…", DishSnack's "Soak the moong dal an hour ahead…").
- **States:** the three variants. No empty state — a caption with nothing to say is not rendered.
- **Tokens:** `fg.muted`, `border.default` (footer variant only; no longer used on Search), `bg.canvas`.
- **Minimum target:** not interactive. 15px floor — this is the component most at risk of being shrunk.
- **Specific accessibility:** the under-action variant explains the button above it and must be joined to it with `aria-describedby`, or the explanation is orphaned from the control it qualifies. The coverage line is the honesty line from `DESIGN.md` §3.4 and sits before the results it qualifies, in layout and in reading order. The v3 Search mock puts it last and is stale.

---

## 4. Today, Week and lists

### C7 — Grouped list card
- **Screens:** Search, DishExtracted, DishTier1, DishSnack, DishFromSearch. (Main's cards are C9 and the week's rows are C13 — each row there is its own bordered box, not a separator-divided group.)
- **Variants:** *plain* (`bg.surface`, no border); *name-only* (`bg.sunken` + **solid** 2px `border.default`), used for Search's name-only group (`DESIGN.md` §3.4). The dashed treatment is no longer a variant of this card; it belongs to next week's draft day rows (C13) alone.
- **States:** default; name-only; single-row (no separators); empty — not rendered; a fully empty result is the zero-results state C30.
- **Tokens:** `bg.surface` / `bg.sunken`, `border.default` (name-only variant), `radius.control`, separator `border.subtle`. In dark every card also carries a 2px `border.default` edge (`DESIGN.md` §2.6).
- **Minimum target:** n/a; its rows carry it.
- **Specific accessibility:** it is a `ul`/`li` list, and the row count must be announced. The name-only variant is told apart by its heading and sentence, not by a dashed border.

### C8 — List row
- **Screens:** Search (both groups), DishTier1 ("Also in this section"), DishSnack ("Others in this family").
- **Variants by trailing content:** page number (`p. 44`); chevron; name + meta + page (Search's extracted results).
- **States:** default; pressed; first-in-group (no top separator). No disabled state.
- **Tokens:** `bg.surface`, `fg.default` name, `fg.muted` meta and page, `fg.subtle` chevron.
- **Minimum target:** 56px is a floor, not a fixed height; a two-line row grows (`DESIGN.md` §2.4).
- **Specific accessibility:** `p. 44` must be announced as "page 44"; the abbreviation needs expanding for speech. Where the row is a link, the whole row is the target, not the name alone.

### C9 — Slot card
- **Screens:** Main.
- **Variants:** *standard* (Breakfast, Snack 1, Snack 2: `bg.surface`, no border, 12/14px padding, 19px dish names); *dominant* (Main meal: 3px `action.primary` border, 14/16px padding, `action.primary` label, 20px dish names).
- **States:** standard; dominant; with a note ("light", "lunch and dinner", "kid-facing"); without.
- **Tokens:** `bg.surface`, `action.primary` (dominant border and label), `fg.muted` label and note, `radius.control`.
- **Minimum target:** n/a.
- **Specific accessibility:** dominance is carried by border, padding and type size — not by colour alone, and **not by dimming the other three**. `DESIGN.md` §3.1 says later slots are "visually lighter" while §2.5 bans opacity; the mocks resolve this correctly by making the main meal heavier instead of making the others fainter. Keep it that way. The slot label is an `h2`, and the note must be part of the card's accessible description, since "lunch and dinner" is the §3.1 promise that the meal serves both sittings.

### C10 — Dish row
- **Screens:** Main.
- **States:** default; cooked (name shifts `fg.default` → `fg.subtle`); dominant-card size (20px name). No disabled state.
- **Tokens:** `fg.default` / `fg.subtle` name, `fg.muted` role, `fg.subtle` chevron, `bg.surface`.
- **Minimum target:** 56px; it contains a 48px tick and a 56px link region.
- **Specific accessibility:** **two targets in one row** — the tick (C11) sets state, the rest of the row navigates. They must be separate focus stops with distinct names, and the tick must not be nested inside the link. The cooked state is conveyed by a lightness change on the name plus the tick's own filled state, so it is not hue-alone. In dark `fg.subtle` equals `fg.muted`, so the name shift disappears and the tick alone carries the state.

### C11 — Cooked tick
- **Screens:** Today (per dish), Week (one per day, for the main meal), all four Dish screens (in the header). One control, one size, one meaning (`DESIGN.md` §2.9, §3.2.3).
- **States:** **unset**; **set**; pressed; focused. No disabled state. It is **absent**, not disabled, on days after today, on all of next week and on past weeks (`REQUIREMENTS.md` §4.5.2); it is **present** on today and on days already passed in the current week.
- **Tokens:** unset — `bg.surface` fill, 2.5px `border.strong` ring, `border.strong` tick; set — `action.primary` fill, `fg.onAccent` tick, no border; `radius.pill`; focus ring per `DESIGN.md` §2.7.
- **Minimum target:** **48px everywhere.** The 30px tick on the v3 WeekCurrent mock is stale.
- **Specific accessibility:**
  - It is a `<button>` labelled *Mark X cooked* / *Unmark X cooked* (`DESIGN.md` §2.9). Do not also set `aria-pressed`, or state is announced twice.
  - The unset state keeps a grey tick inside the ring, as `DESIGN.md` specifies. The development review noted that a tick meaning "not cooked" is a possible false affordance; the design stands, and a user-test question is whether an empty ring reads better.
  - One tap, no dialog, reversible by a second tap (`DESIGN.md` §4) — so no confirmation and no toast.
  - On Week the tick is the main meal's real mark. An unset mark on a passed day means *nothing recorded*, never a missed meal.
- **Token Forge delta:** its Checkbox is a 17px square with a 1.5px border. Same tokens and the same filled-check idea at roughly a third of the required size. Ask for a 48px circular variant.

### C12 — Week switcher
- **Screens:** WeekCurrent, WeekNext.
- **States:** segment selected (`action.primary` fill, `fg.onAccent`, weight 600); unselected (`action.primary` text on `bg.surface`, weight 500); focused. Two segments only; no disabled segment — next week is always reachable, generating on arrival (`DESIGN.md` §3.2.1, LIF-13).
- **Tokens:** `bg.surface` container, 2px `border.default`, `action.primary`, `fg.onAccent`, nested radius per §1.
- **Minimum target:** 56px (`DESIGN.md` §2.4). The v3 mocks drew 48px.
- **Specific accessibility:** both segments are links to the same screen with different content (`DESIGN.md` §3.2.2, §4), so both are `<a>` elements and the selected one carries `aria-current="page"`. The v3 mocks mix a `<button>` and an `<a>`; that is stale. The same control appears in the Add-to-a-meal picker (C24).
- **Token Forge delta:** the gallery's Tabs are underline tabs; the segmented control exists only in Token Forge's own chrome, not in the gallery, and at 5px/11px padding and 13px type. Ask for the segmented control to be promoted into the gallery at 56px.

### C13 — Day row
- **Screens:** WeekCurrent, WeekNext.
- **Variants:** *passed* (`bg.sunken`); *today* (`bg.surface` + 3px `action.primary` border); *ahead* (`bg.surface`); *draft* (WeekNext: `bg.sunken` + 2px dashed `border.strong`).
- **States:** the four above. A tick (C11, main meal only) appears on *passed* and *today* rows and never on *ahead* or *draft* rows. It is unset until the main meal is marked.
- **Tokens:** `bg.surface` / `bg.sunken`, `action.primary` (today border and day label), `fg.default` main meal, `fg.muted` day label and the three-slot summary line, `radius.control`.
- **Minimum target:** 68px as mocked — above the floor, because the row carries two lines plus a tick.
- **Specific accessibility:** the three zones of `DESIGN.md` §3.2.1 (passed · today · still to come) are distinguished by surface and border, not hue — correct. Today's row needs an accessible marker beyond the border: the day label alone reads identically for Monday-as-today and Monday-as-past. The compact second line ("Idli · kosumbari · chilla") uses `·` as a separator and will be read as a run-on; it needs either commas for speech or per-item markup.
- **Note:** the v3 mock computed the tick as `isToday || isPassed`, showing a tick unconditionally. That was wrong and is replaced by the rule above.

### C14 — Frozen-week block
- **Screens:** WeekCurrent.
- **States:** one. **The copy is constant** (`DESIGN.md` §3.2.1, LIF-12b) — it does not vary with whether next week has been viewed, nor through the week. No empty and no disabled state.
- **Tokens:** `bg.surface`, 2px `border.default`, `fg.default` copy, `action.primary` inline action, `radius.control`.
- **Minimum target:** the inline "Plan next week" action is 56px. The v3 mock drew 44px.
- **Specific accessibility:** it is one block that both explains and redirects, so the explanatory sentence must be the inline link's `aria-describedby` — the reason and the action have to arrive together. It occupies the same position next week gives to Regenerate (C20), which is what keeps the action slot from ever being empty; a screen reader should therefore find it in the same place in the reading order on both weeks.
- **Token Forge delta:** its Alert is the nearest shape — a bordered block with a left accent, a bold line and muted body. This variant has no status colour, no icon and an embedded action. Ask for a neutral, actionable Alert.

### C15 — Planned label row
- **Screens:** WeekNext.
- **States:** one ("PLANNED" + "9 to 15 November").
- **Tokens:** `fg.muted`.
- **Minimum target:** not interactive.
- **Specific accessibility:** this is the label that marks next week as a draft rather than a record. It must be announced before the day rows, since it is the only thing distinguishing them from the current week's.

---

## 5. Dish, Search and assignment

### C16 — Page-number block
- **Screens:** DishTier1.
- **Variants:** *prominent* — 60px/700 `action.primary` numeral, "PAGE" label beneath, 2px vertical rule, book title and section (tier 1); *inline* — folded into the C3 meta line as "· page 8" (tier 2/3, as on DishExtracted and DishFromSearch).
- **States:** prominent; inline. **No loading, no empty and no error state** — `DESIGN.md` §3.3 is explicit that tier 1 is not a failure: no spinner, no "coming soon", no greyed headings.
- **Tokens:** `bg.surface`, `action.primary` numeral, `fg.default` book title, `fg.muted` label and section, `border.default` rule, `radius.control`.
- **Minimum target:** not interactive.
- **Specific accessibility:** the 60px numeral and its "PAGE" label are one semantic unit; the accessible name must be "page 44", not "44" followed by "page". The 60px display size is well outside the `DESIGN.md` §2.3 type scale and should be added to it as a display size rather than left as a one-off.

### C17 — Ingredient row
- **Screens:** DishExtracted, DishFromSearch ("Ingredients"), DishSnack ("What goes in").
- **States:** default; first-in-group; hidden-by-stoplist (revealed by C18).
- **Tokens:** `bg.surface`, `fg.default`, separator per §1.
- **Minimum target:** not interactive. 19px text; 13/16px padding gives ~46px rows, which is acceptable for non-interactive content.
- **Specific accessibility:** `qtyText` is verbatim from the book (`ARCHITECTURE.md` §2.2) and must never be reflowed or abbreviated — "A lemon-sized ball of tamarind" renders as written. The same component serves Snack 1 components, which are a plain string with no quantity, so it must not assume a quantity exists.

### C18 — Disclosure text button
- **Screens:** DishExtracted, DishFromSearch ("Show all 8").
- **States:** collapsed ("Show all 8"); expanded ("Show fewer" or equivalent); focused. Absent — not disabled — where nothing is hidden.
- **Tokens:** `action.primary`, `action.primaryHover`, `font.ui`.
- **Minimum target:** 56px, with horizontal padding so the target is wider than its text. The v3 mock drew 44px with no padding.
- **Specific accessibility:** a disclosure, so it needs `aria-expanded` and `aria-controls` pointing at the ingredient list. The count in the label must be the true total; the paired caption ("Seasonings hidden — mustard, cumin, curry leaves, ghee.") names what is behind it, which satisfies §5.2's honesty rule and must stay in sync with the stoplist.
- **Token Forge delta:** the gallery has primary, secondary and danger fills, plus small and large sizes — no ghost or text-only variant. Ask for one.

### C19 — Method step list
- **Screens:** DishExtracted, DishFromSearch.
- **States:** default. Absent where no method is extracted — never an empty heading (`DESIGN.md` §3.3).
- **Tokens:** `action.primary` numeral disc, `fg.onAccent` numeral, `fg.default` step text, `bg.surface`, `radius.pill`.
- **Minimum target:** not interactive. The 26px numeral disc carries 15px/700 text — at the floor.
- **Specific accessibility:** it must be an `ol`, with the numerals generated from the list rather than rendered as content. The mock puts the digit in a span inside a div, so the order is visual only and a reordering would not be announced.

### C20 — Primary action button
- **Screens:** WeekNext ("Regenerate"), DishFromSearch ("Add to a meal").
- **States:** default; hover (`action.primaryHover`); pressed; focused. **No disabled state** — where the action is unavailable the button is absent (`DESIGN.md` §3.2.1).
- **Tokens:** `action.primary`, `action.primaryHover`, `fg.onAccent`, `radius.control`, `font.ui`.
- **Minimum target:** 56px, full width, as mocked. Leading icon at 20px.
- **Specific accessibility:** the icon is decorative (`aria-hidden`) and the label carries the meaning. Regenerate confirms before acting (`DESIGN.md` §4) and so must be wired to C26, not act on first press; "Add to a meal" does not confirm and opens the picker. Both carry an under-action caption (C6) that must be their `aria-describedby`.
- **Note:** Regenerate and Add to a meal are both `<button>`s (`DESIGN.md` §4: links navigate, buttons change things). The v3 mock draws "Add to a meal" as an `<a>`; stale.
- **Token Forge delta:** the gallery's primary is an inline auto-width button at `calc(u*2)` padding. Ask for a full-width, 56px, icon-plus-label variant.

### C21 — Secondary action button
- **Screens:** DishExtracted, DishTier1, DishSnack ("Swap with a different dish").
- **States:** default (outline: `bg.surface` fill, 2.5px `action.primary` border, `action.primary` label); hover; pressed; focused. **Unavailable-with-reason** — see below.
- **Tokens:** `bg.surface`, `action.primary`, `radius.control`, `font.ui`.
- **Minimum target:** 56px, full width.
- **Specific accessibility:** the label is **"Swap with a different dish"** and never "Regenerate" (LIF-22). Swap is offered only on days **after today** and on next week (`DECISIONS.md`). On a dish reached from Search it is replaced by C20 ("Add to a meal").
- **Where it cannot work it is replaced by the inert reason block C31**, in the same position: when the role holds a single recipe, when the day is today, and when the day has passed. No greyed button, no tooltip (`DESIGN.md` §2.8).
- **Token Forge delta:** its secondary is a grey fill with a `border.default` edge; this is an outline in `action.primary`. And **its disabled state is `opacity: .45`, which `DESIGN.md` §2.5 bans outright** — do not use it anywhere (§7).

### C22 — Search field
- **Screens:** Search.
- **States:** empty (placeholder); filled; focused; no disabled state. No clear button in the mock — worth adding, since the field is the only way back to all results.
- **Tokens:** `bg.surface`, 2px `border.strong`, `fg.default` value, `fg.subtle` placeholder, `border.focus` ring when focused, `radius.control`.
- **Minimum target:** 56px, as mocked. 19px value text; 22px leading icon.
- **Specific accessibility:** the visible label is omitted and carried by a visually-hidden span, so the field needs a real `label` association. The mock's hidden span is `position: absolute` inside a non-positioned `label`, which can escape its container — use a standard clip pattern. The leading icon is decorative. Results are live-filtered, so the result count needs a polite live region or the change is silent.
- **Token Forge delta:** its Input is 34px with no leading icon and a `.focus` ring built from `color-mix` on `border.focus` — a token this project now defines (§1). Ask for a 56px variant with a leading icon slot.

### C23 — Filter chip
- **Screens:** Search (All · Saar · Kadi · Pickle).
- **States:** unselected (`bg.surface`, 2px `border.strong`, `fg.default`, weight 500); selected (`action.primary` fill, `fg.onAccent`, weight 600); focused. No disabled state. **Overflow is unhandled** — the mock wraps four chips; the role list runs to 30.
- **Tokens:** `bg.surface`, `border.strong`, `action.primary`, `fg.onAccent`, `radius.pill`.
- **Minimum target:** **56px** (`DESIGN.md` §2.4, decided). The v3 mock drew 44px.
- **Specific accessibility:** selection differs by fill, text colour and weight, so it clears the no-hue-alone rule. The set is single-select in the mock ("All" plus one role), so it is a radio group, not a set of toggle buttons; `aria-pressed` on four independent buttons would misreport it. Selecting a chip re-filters live and needs the same live region as C22.
- **Token Forge delta:** the gallery's only pill is the Status badge, which is non-interactive and distinguished by a coloured dot. Nothing here is reusable beyond the radius.

### C24 — Day accordion
- **Screens:** AddToMeal. The v3 mock opens on Today and lists today's slots; stale, because today is not offered.
- **States:** shut (`bg.surface`, hint "tap to open"); open (3px `action.primary` border, `action.primary` day label, hint "4 slots", four C25 rows revealed); focused. Today and past days are **omitted entirely**, not shown disabled, and explained by a trailing caption. A This week / Next week switcher (C12) sits above the days; on Next week all seven days are offered.
- **Tokens:** `bg.surface`, `action.primary`, `fg.muted` label and hint, `radius.control`.
- **Minimum target:** the day header is **56px**. The v3 mock gives it no height floor at all — it is a padded `div`.
- **Specific accessibility:** **the header is not a control in the mock.** It is a plain `div` with no role, no `tabindex` and no `aria-expanded`; the only cue is the words "tap to open". It must become a button with `aria-expanded` and `aria-controls`, or the picker is keyboard-unreachable. Only one day is open at a time in the mock, which should be stated as a rule rather than left as mock state.
- **Token Forge delta:** the gallery has no disclosure or accordion of any kind. Entirely new.

### C25 — Slot picker row
- **Screens:** AddToMeal.
- **States:** default; pressed; focused. No disabled and no empty state — every slot always holds a dish, because generation never leaves a gap (`ARCHITECTURE.md` §3.2).
- **Tokens:** `bg.surface`, `fg.muted` slot name, `fg.default` current dish, `action.primary` chevron, nested radius per §1.
- **Minimum target:** 56px floor; a row with a long current dish name grows.
- **Specific accessibility:** the row's accessible name must carry both the slot and what is being replaced — "Main meal, currently Kokum saar, rice, daali thoi" — because that is the whole point of showing the current dish (ASN-03). **It performs the assignment on press with no confirmation and no warning**, even where the role does not match (ASN-05) and even for an out-of-season or recently-cooked dish (ASN-06, ASN-07). It must therefore not acquire a confirm step, and its name must not hint at a mismatch.

---

### C26 — Regenerate confirm sheet
- **Screens:** Week (next week), over the screen. Spec: `DESIGN.md` §3.6.
- **States:** open (with and without the "N dishes you chose will be replaced" sentence); closed. No loading.
- **Tokens:** `bg.surface`, 3px `border.strong` top edge, `radius.control` on the top corners, `action.primary` fill button, outline button, `fg.muted` body. **No scrim**: dimming is opacity (`DESIGN.md` §2.5).
- **Minimum target:** both buttons 56px, full width.
- **Specific accessibility:** a dialog; focus moves to **Keep this plan** on open (the safe action), Escape closes with nothing changed, the screen behind is inert to assistive technology rather than dimmed. No red, no warning icon.
- **Token Forge delta:** nothing equivalent exists — no dialog, sheet or modal.

### C27 — Next-week notice
- **Screens:** Today. Spec: `DESIGN.md` §3.7.
- **States:** visible; dismissed; hidden once next week has been viewed (LIF-16).
- **Tokens:** `bg.surface`, 2px `border.strong`, `radius.control`, `fg.default` title, `fg.muted` date range, `action.primary` link.
- **Minimum target:** **See next week** link and **Dismiss** button, 56px each.
- **Specific accessibility:** a notice, never a modal; `role="status"` is not needed because it is present at load. Dismissal is remembered per week (`noticeDismissed`, `ARCHITECTURE.md` §2).
- **Token Forge delta:** nearest is the Alert; this has no status colour or icon and carries two actions.

### C28 — Setting switch
- **Screens:** Settings (Seasonal dishes). Spec: `DESIGN.md` §3.5.
- **States:** on; off; focused. Its state is also written as the word **On** or **Off**.
- **Tokens:** `bg.surface` row, `action.primary` on, `border.strong` off, `fg.onAccent`, focus ring.
- **Minimum target:** the whole row is at least 56px; the switch is a real `<input type="checkbox" role="switch">` inside a `<label>`.
- **Token Forge delta:** the gallery has no switch.

### C29 — Schedule field
- **Screens:** Settings (day and time next week is planned). Spec: `DESIGN.md` §3.5.
- **States:** default; focused. Two native `<select>`s with visible `<label>`s (day, time).
- **Tokens:** as C22 (`border.strong` 2px, `radius.control`, `fg.default`).
- **Minimum target:** 56px. Native pickers scale with OS text size (LEG-08).
- **Token Forge delta:** its Select is 34px; re-specify at 56px.

### C30 — Zero-results state
- **Screens:** Search. Spec: `DESIGN.md` §3.4.1.
- **States:** no match at all; no match with a role chip active; no match in one group (the empty group is omitted, never an empty shell).
- **Tokens:** `bg.surface` card, `fg.default` statement (22px/600), `fg.muted` body, outline button (C21 styling) **Clear search** / **Show all roles**.
- **Minimum target:** the button is 56px and returns focus to the field.
- **Specific accessibility:** the statement quotes the query exactly as typed; it is announced when results change (same live region as C22).

### C31 — Inert reason block
- **Screens:** Dish (in the Swap position). Spec: `DESIGN.md` §2.8.
- **States:** one visual; three reasons — role holds one recipe, today, day passed (`DESIGN.md` §2.8 table).
- **Tokens:** `bg.sunken`, 2px solid `border.default`, `radius.control`, `fg.default` title (17px/600), `fg.muted` reason (17px).
- **Minimum target:** not interactive. It occupies the footprint of a 56px button so the action slot is never empty.
- **Specific accessibility:** not focusable, not a button, no `aria-disabled`; it is text read in order. Solid border, because dashed means *draft week*.
- **Token Forge delta:** replaces its disabled variant entirely.

### C32 — Settings button
- **Screens:** Today header only. Spec: `DESIGN.md` §3.1.
- **States:** default; pressed; focused.
- **Tokens:** `bg.surface` or transparent, `fg.default` sliders icon, focus ring.
- **Minimum target:** 48px icon button, labelled **Settings**. It opens a pushed screen, so it is a link.

---

## 6. Where the nine v3 mocks no longer match

The mocks were left untouched when `DESIGN.md` moved on. Build to `DESIGN.md`. The earlier inconsistencies in this list are all decided:

| Mock shows | Decided |
|---|---|
| Pushed titles 30px and 28px | 28px |
| Rows 56px and 60px | 56px floor, rows grow |
| Dashed grey meaning both draft week and not-extracted | Dashed = draft week only; name-only is a solid sunken card |
| Cooked tick 30px on WeekCurrent | 48px everywhere |
| Day tick always on for today, derived | Real mark of the main meal; unset until marked |
| Coverage line below results | Above them |
| `status.success` unused | Dropped |
| Chips, switcher, buttons under 56px | 56px |
| Button and anchor mixed in one control | Links navigate, buttons change things |
| No focus style | `DESIGN.md` §2.7 |
| AddToMeal opens on Today | Today is not offered; days after today only |
| Swap shown on today's dishes | Swap not offered for today (C31) |
| Main has no Settings button | C32 |

Two items from the original audit remain mock bugs, not decisions:
- **Cross-links break the origin rule.** `DESIGN.md` §4 says Dish returns to where it was opened from. The mocks do not (Search name-only rows open DishTier1 with a "Week" back link and a lit Week tab). C1 and C4 must be driven by navigation state, not copied from the mocks.
- **"One of 60" is hard-coded** on DishSnack. The cycle is the available pool (54 to 60), so the number is computed.
- DishExtracted shows the "Seasonings hidden — …" caption under the ingredient list and DishFromSearch omits it. The caption belongs to C18 and appears wherever C18 does.

---

## 7. Remaining constraints on the build

1. **Never use Token Forge's disabled variant** (`opacity: .45`). Use C31.
2. **Token Forge's density undershoots the floors.** At `density.scale` ×1.15 the gallery's base font computes to about 14.2px and its small button to about 12.5px, against a 15px floor; its input is 34px against 56px; its caption is 10px against 15px. Re-specify every component at this project's sizes (`DESIGN.md` §7 request 9) rather than inheriting the gallery's.
3. **Light text on canvas or sunken:** `action.primary` and `fg.subtle` fail 7:1 there (6.2 and 6.9). Use them on `bg.surface` only (`DESIGN.md` §2.2.1).
4. **Dark cards need a 2px `border.default` edge**, because surface sits only 1.13:1 off the canvas.
5. **Dark `fg.subtle` equals `fg.muted`** unless Token Forge adds a `gray.350` primitive (request 8, optional).
6. **The v4 boards are static and unrendered.** Treat them as drawings of the spec, not proof it works.

---

## 8. Token Forge gallery components this project does not need

**Data table**, **Progress** and **Status badge** have no use in any of the nine screens. The
coverage line is prose, not a progress bar; there is no tabular data; and nothing in the app has a
status worth badging — `DESIGN.md` §4 bans adherence signals, which is what a badge here would
become. **Switch**, **Select** and **Dialog/Sheet** are needed (C28, C29, C26) and the gallery has none of them at this size. **Alert** is needed only as the two neutral variants C14 and C27, never with
`status.warning`, `.danger` or `.info`: nothing in this app is an error, because generation never
fails and nothing blocks on network.
