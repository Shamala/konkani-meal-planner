# Konkani Meal Planner — Design

**Owner:** Shamala
**Last updated:** 2026-11-03 (dark mode, focus, inert state, settings, confirm, notice, zero results)
**Derived from:** `REQUIREMENTS.md`. Where the two disagree, requirements win.

The visual system below is carried forward from the original design document in
`archive/` — palette, type and iOS patterns still hold. Its screen list does not: the
app had five screens built around a pantry.

---

## 1. Principle

**The answer before the interface.**

Someone opening this app at 6pm has already made enough decisions today. The first
thing on screen is what to cook, not a menu of ways to find out what to cook. Every
screen is judged by how many taps stand between opening the app and knowing.

This is why Today is the landing screen, why generation is unprompted, and why marking
a dish cooked is one tap and optional.

**The second principle follows from it: the app does not keep score.** The plan is a
suggestion. Nothing shows adherence, streaks, or a missed meal. An interface that
implies obligation turns a tool that removes a decision into one that adds a judgement.

---

## 2. Visual system

Tokens follow the two-layer model from **Token Forge**
(https://claude.ai/artifact/5iZcnSSPzu45QjB82R1qgF): shared primitives, and a semantic
layer that names them. Only the semantic layer is referenced in screens.

### 2.1 Why this changed

The earlier palette — pale mint `#f1ffe7` under white cards — failed in practice. The
canvas and the cards sat within 4% lightness of each other, so the card edges did
nothing, and the supporting text ran at 10–11px in `#5a5d7a`. For a reader over about
fifty, that is a page of grey mush.

**The target is WCAG AAA (7:1) for every text pair, not AA.** AA is a floor for
general audiences; this app is for a household that includes older eyes, used in a
kitchen, often at arm's length. Every *permitted* text pair below clears 7:1. Some
token and ground combinations do not, and §2.2.1 forbids them by name rather than
leaving them to be avoided by habit.

### 2.2 Semantic tokens — light

Ratios were recomputed on 2026-11-03 with the WCAG relative-luminance formula. The
earlier table understated `fg.default` and `fg.muted`; no verdict changed.

| Token | Primitive | Hex | On canvas | On surface | On sunken |
|---|---|---|---|---|---|
| `bg.canvas` | gray.200 | `#e2e8f0` | — | — | — |
| `bg.surface` | gray.0 | `#ffffff` | — | — | — |
| `bg.sunken` | gray.100 | `#f1f5f9` | — | — | — |
| `fg.default` | gray.900 | `#0f172a` | 14.5:1 | 17.9:1 | 16.3:1 |
| `fg.muted` | gray.700 | `#334155` | 8.4:1 | 10.4:1 | 9.5:1 |
| `fg.subtle` | gray.600 | `#475569` | 6.2:1 **fails** | 7.6:1 | 6.9:1 **fails** |
| `action.primary` | teal.800 | `#115e59` | 6.2:1 **fails** | 7.6:1 | 6.9:1 **fails** |
| `action.primaryHover` | teal.900 | `#134e4a` | 7.7:1 | 9.5:1 | 8.7:1 |
| `fg.onAccent` | gray.0 | `#ffffff` | — | 7.6:1 on primary, 9.5:1 on hover | — |
| `border.default` | gray.300 | `#cbd5e1` | — | 1.5:1 (decorative) | — |
| `border.subtle` | gray.200 | `#e2e8f0` | — | 1.2:1 (decorative) | — |
| `border.strong` | gray.500 | `#64748b` | 3.9:1 | 4.8:1 | 4.3:1 |
| `border.focus` | gray.900 | `#0f172a` | 14.5:1 | 17.9:1 | 16.3:1 |

`border.strong` and `border.focus` are non-text, so they need 3:1 and clear it
everywhere. `border.default` and `border.subtle` carry no meaning on their own (§2.5), so
they have no contrast requirement; they only separate things that already differ in
surface or position.

`status.success` is **dropped from this project's token set.** It is green.700
(`#15803d`) at 5.0:1 on surface, which cannot carry text under a 7:1 floor, and nothing in
the app has a success state: the cooked tick is a record, not an achievement
(§1, second principle), and it is `action.primary`. The token stays in Token Forge
unused here. A dark value is given in §2.6 only so the two themes do not diverge if it is
ever reintroduced.

**The canvas moved two steps darker**, from gray.50 to gray.200, so white cards
separate without needing a border to do the work.

`action.primary` is **teal.800**, not teal.700. Teal 700 clears AA at 5.5:1 but fails
AAA; 800 reaches 7.6:1 and keeps the coastal character that a generic blue would lose.

#### 2.2.1 Which token may sit on which ground

This is the rule that makes "every pair clears 7:1" true. Each row is permitted; anything
not listed is not.

| Token as text or icon | Permitted on | Never on |
|---|---|---|
| `fg.default`, `fg.muted` | canvas, surface, sunken | — |
| `fg.subtle` | **surface only** | canvas, sunken |
| `action.primary` (links, labels, page numbers) | **surface only** | canvas, sunken |
| `action.primaryHover` | canvas, surface, sunken | — |
| `fg.onAccent` | `action.primary` and `action.primaryHover` fills | any other fill |

A link or accent label therefore never sits directly on the canvas or on a sunken group:
it goes inside a surface card. The switcher, the frozen-week block and every list row
already do. In dark (§2.6) the restrictions fall away because the dark pairs all clear
7:1 on every ground, but the rule is kept identical across themes so a component never
has to know which theme it is in.

### 2.3 Type scale

Density ×1.15 — Token Forge's generous setting.

| Role | Size | Weight |
|---|---|---|
| Screen title (tab screens) | 32px | 600 |
| Pushed-screen title (Dish, Add to a meal, Settings) | 28px | 600 |
| Section heading | 22px | 600 |
| Dish name | 19px | 500 |
| Body | 17px | 400 |
| Label | 15px | 600, uppercase, 0.5px tracking |
| Meta | 15px | 400 |

The pushed-screen title is 28px, not 30: it must fit *Cucumber kosumbari* on one line at
390px beside a 48px control, and a 30px title wraps. The first set of mocks used both
(30 on three screens, 28 on two); 28 is now the only value.

**Nothing renders below 15px.** The old scale bottomed out at 10px, which is the single
biggest legibility problem in the previous mocks. 15px is the floor even for a timestamp
or a count.

### 2.4 Shape and target size

| Property | Value |
|---|---|
| `radius.control` | 12px (Token Forge `radius.lg`) |
| `radius.pill` | Half the control's height. Filter chips (56px, so 28px) and cooked ticks (48px, so 24px) |
| Nested radius | A child inside a rounded parent takes the parent's radius minus the gap between them, never less than 0. The week switcher is a 12px frame with a 3px inset, so its segments are 9px |
| Row and button minimum height | **56px**, up from 44 |
| Icon-button target | 48px |
| Card padding | 16–20px |
| Filter chip | **56px** tall, matching the button floor. The first mocks drew chips at 44px |

**56px is a floor, not a fixed height.** A row that holds a name and a second line (a
search result with its ingredients, a slot in the picker) grows past 56 as its content
needs; no row is given a fixed height of its own. The first mocks used 56 on some lists
and 60 on others for the same kind of row, and that was an accident rather than a
decision.

56px is above the 44px platform minimum because a larger target matters more than a
denser screen here — and because the number of things on any screen is small.

### 2.5 Never used

| Banned | Why |
|---|---|
| **Opacity as a de-emphasis cue** | It lowers contrast on text, which is exactly the wrong lever. The old Snack 2 card sat at 72% |
| Text below 15px | See §2.3 |
| Colour as the only difference | Anything distinguished by colour also differs in lightness or weight |
| Hairline borders carrying meaning | 0.5px rules vanish on a bright kitchen screen. Separation comes from surface, not line |
| A disabled control, in any form | Token Forge's disabled state is `opacity: .45`, which is banned above, and a greyed control that does nothing is banned by §3.2.1. Where an action is unavailable, the control is *replaced* by an inert reason block (§2.8) |
| Danger or warning colour | Nothing in the app is an error: generation never fails and nothing blocks on network. A confirmation is distinguished by its wording and its safe default, not by red |

### 2.6 Dark

Dark follows `prefers-color-scheme` only. There is no in-app override; the device setting
decides (DECISIONS.md). The same 7:1 floor applies, and every text pair below clears it **on all three
grounds**, so unlike light there is no surface-only restriction (§2.2.1).

| Token | Primitive | Hex | On canvas | On surface | On sunken |
|---|---|---|---|---|---|
| `bg.canvas` | gray.950 | `#020617` | — | — | — |
| `bg.surface` | gray.900 | `#0f172a` | — | — | — |
| `bg.sunken` | gray.800 | `#1e293b` | — | — | — |
| `fg.default` | gray.50 | `#f8fafc` | 19.3:1 | 17.1:1 | 14.0:1 |
| `fg.muted` | gray.300 | `#cbd5e1` | 13.6:1 | 12.0:1 | 9.9:1 |
| `fg.subtle` | gray.300 | `#cbd5e1` | 13.6:1 | 12.0:1 | 9.9:1 |
| `action.primary` | teal.300 | `#5eead4` | 13.6:1 | 12.1:1 | 9.9:1 |
| `action.primaryHover` | teal.200 | `#99f6e4` | 16.0:1 | 14.2:1 | 11.6:1 |
| `fg.onAccent` | gray.950 | `#020617` | — | 13.6:1 on primary, 16.0:1 on hover | — |
| `border.default` | gray.700 | `#334155` | 2.0:1 (decorative) | 1.7:1 (decorative) | 1.4:1 (decorative) |
| `border.subtle` | gray.800 | `#1e293b` | 1.4:1 (decorative) | 1.2:1 (decorative) | — |
| `border.strong` | gray.400 | `#94a3b8` | 7.9:1 | 7.0:1 | 5.7:1 |
| `border.focus` | gray.50 | `#f8fafc` | 19.3:1 | 17.1:1 | 14.0:1 |
| `status.success` | green.400 | `#4ade80` | 11.6:1 | 10.3:1 | 8.4:1 — unused, see §2.2 |

**`fg.subtle` equals `fg.muted` in dark.** The only Token Forge primitive that would sit
between them is gray.400 (`#94a3b8`), and it reaches 6.96:1 on `bg.surface` — 0.04 short
of the floor. Rather than invent a hex outside the primitives, dark has one tier where
light has two. What `fg.subtle` does in light (a cooked dish's name, a row chevron) is
carried by the tick and by position, not by the shade, so nothing is lost. If the
distinction is wanted, request #8 in §7 asks Token Forge for a `gray.350` primitive near
`#9fadc0` (7.8:1 on surface).

**Card separation is weaker in dark.** Surface on canvas is 1.13:1 in dark against 1.23:1
in light, and dark cards drift into the page. So in dark, every card, row group and
sheet carries a 2px `border.default` edge (2.0:1 against the canvas). This is separation
by surface *and* edge, not a hairline carrying meaning, and it does not change light.

The tick, the active tab and the primary button invert correctly with no extra work:
`fg.onAccent` on `action.primary` is 13.6:1 in dark, against 7.6:1 in light. In dark the
primary button is a light-teal fill with near-black text.

### 2.7 Focus

Every interactive element has a visible focus state. The first nine mocks had none, which
makes the whole app unusable from a keyboard or a switch device.

| Property | Value |
|---|---|
| Ring | 3px `border.focus` |
| Gap | 2px of the element's own ground colour between the element and the ring |
| Shape | Follows the element: a button's radius plus the gap, a circle for a tick |
| When | `:focus-visible`, so a tap does not show it and a keyboard or switch does |

`border.focus` is `fg.default`'s primitive in each theme (`#0f172a` light, `#f8fafc`
dark), which means it needs no new colour, clears 14:1 against every ground in both themes
(§2.2, §2.6), and cannot be mistaken for the teal that means *selected* or *today*. The
gap is what lets one ring work on a teal-filled button: the ring sits against the ground,
never against the fill, where `#0f172a` on `#115e59` would be only 2.4:1.

Focus is a ring, not a fill change, so it never collides with the pressed or selected
states. The selected tab, switcher segment and chip keep their fill; a focus ring appears
around them on top of it.

### 2.8 Inert reason block

Where an action exists in principle and is unavailable now, the control is **replaced**,
not dimmed (§2.5). The replacement says what the action would have been and why it is not
possible, in the position the control would have held, so the action slot is never empty
(§3.2.1).

| Part | Spec |
|---|---|
| Container | `bg.sunken`, 2px solid `border.default`, `radius.control`, 16px padding. In dark the same, with `border.default` on `bg.sunken` |
| Icon | The action's own icon (swap), 24px, `fg.muted`, `aria-hidden`. Present so the shape of the slot is recognisable, not so it reads as a control |
| Title | The action's name with *not available*: **Swap is not available**. 17px, 600, `fg.default` |
| Reason | One sentence, 17px, 400, `fg.muted`. Names the cause in plain terms, never a rule |
| Not interactive | Not focusable, not a button, no `aria-disabled`. It is text. Screen readers read it in order |

Solid border, not dashed: dashed means *a draft week* (§3.2.1), and an inert block is not
provisional.

Reasons the app needs, written so nobody has to look anything up:

| Cause | Reason line |
|---|---|
| The role holds one recipe | *Chutney has only one recipe, so there is nothing to swap it for.* |
| The day has passed | *This day is done. Swapping works on days still to come.* |
| It is today | *Today's plan is fixed. Swap works from tomorrow.* |

Both are shown as the dish's own role or day, never as a rule name. A third cause will be
added the same way.

### 2.9 The cooked mark

One control, one size, one meaning, wherever a dish is displayed:

- 48px circle (`radius.pill`), a `<button>`, labelled *Mark X cooked* / *Unmark X cooked*.
- **Unset:** `bg.surface` fill, 2.5px `border.strong` ring, `border.strong` tick. **Set:**
  `action.primary` fill, `fg.onAccent` tick. A set mark also differs from an unset one in
  lightness and shape (a filled disc against a ring), not hue alone.
- The set mark is `action.primary`, not `status.success`: it records, it does not praise.


## 3. Screens

Three tabs: **Today, Week, Search.** The Dish screen is pushed from any of them, and so is
Settings (§3.5), reached from a sliders button on Today. Settings is not a fourth tab: exactly three
tabs is a requirement (`TEST-PLAN.md` NAV-01).

### 3.1 Today — the landing screen

Four slots stacked in the order they happen: Breakfast, Snack 1, Main meal, Snack 2.

- The **main meal is visually dominant** — it is the real decision, and it carries the
  note that it serves both lunch and dinner.
- Each dish is tappable through to Dish, and carries a **cooked** control.
- The cooked control is a one-tap toggle, not a dialog. It is small and quiet: it
  matters to the system but should not look like the point of the screen.
- Slots later in the day are present but visually lighter. At 8am, Snack 2 is
  information; at 5pm it is the decision. "Lighter" is done with weight and size, never
  with opacity (§2.5).
- The header carries a **Settings** button (a sliders icon) at its right: a 48px icon button labelled
  *Settings*. It is the only route to Settings.
- From Friday evening, until next week has been viewed, a **notice banner** (§3.7) sits
  between the header and the first slot. It is in the flow, so it pushes the slots down
  and never covers them. The slot list scrolls beneath it; the tab bar does not.

**Empty state:** none in normal use. A week always exists, because generation never
fails (`ARCHITECTURE.md` §3.2). On genuine first launch, generate immediately and show
the result rather than an onboarding screen (§3.2.4).

### 3.2 Week

Seven day cards, each showing the main meal prominently with the other three slots as
a compact line.

- **Regenerate belongs to next week only**, and appears nowhere on the current week.
  The current week is frozen once it begins (`REQUIREMENTS.md` §4.5).
- From Friday evening, **next week is reachable from this one** through the switcher
  (§3.2.2), labelled *Planned* and carrying the regenerate action. Both weeks are never
  on screen at once; the switcher is what makes shopping possible without that.
  (This bullet used to say next week appears *above* this one; §3.2.2 superseded it.)
- A day that has a cooked main meal shows its mark (§3.2.3), so the week doubles as a
  record.

See §3.2.1 for how the two weeks are differentiated.

#### 3.2.1 Resolving the asymmetry

The current week has cooked marks and no regenerate; next week has regenerate and no
cooked marks. **Only one half of this is a problem.**

| Missing | Confusing? | Why |
|---|---|---|
| Cooked marks on next week | No | You cannot have cooked next Wednesday's dinner. The semantics explain themselves |
| Regenerate on the current week | **Yes** | Nothing about a week in progress suggests it is unchangeable |

So there is one problem to solve, not two. Fixing both would make next week worse for
no gain.

**Root cause.** The two weeks are rendered as two instances of one component, so they
read as the same kind of object and invite the same controls. They are not the same
kind of object: the current week is a **record in progress**, partly history and partly
committed plan; next week is a **draft**. A missing control on an identical-looking
thing reads as broken. A different control set on a visibly different kind of thing
reads as obvious.

**Fix, in three layers.**

*1 — The action slot is never empty.* Each week carries one primary action in the same
position:

| Week | That position holds | Result |
|---|---|---|
| Current | The explanatory line, carrying **→ Plan next week** inline | Opens next week, generating it on the spot if it does not yet exist. No loading state |
| Next | **Regenerate** | A fresh next week |

The user never finds a hole where a control should be, and the impulse to change
something is caught and redirected to the week where changing something is both legal
and useful.

The current week's slot is one block that both explains and redirects, rather than a
bare button. This avoids duplicating the switcher (§3.2.2): navigation to next week is
chrome, while this is the contextual answer to "why can I not change this".

*2 — The two weeks look like different kinds of thing.* The current week renders as a
log: days already passed settle back visually, cooked marks show as ticks, today is the
bright row. It has three internal zones — **passed · today · still to come** — not
seven equal cards. Next week renders as a draft: lighter weight, a *Planned* label,
collapsed day detail.

*3 — One line of copy as the safety net.* On the current week, where regenerate would
have been:

> **This week is planned and shopped for. Changes start from Monday.**

That sentence names the *reason* rather than the rule. "You cannot change this" invites
argument; "you already shopped for this" ends it.

**The copy is constant.** It does not change once next week has been viewed, and it
does not vary through the week. The statement is true on Monday and on Saturday
regardless of what the user has done, so varying it would make the same screen say
different things for a reason the user cannot infer. Stable copy is learnable; copy
that shifts is noise.

**Explicitly rejected.**

| Rejected | Why |
|---|---|
| A disabled regenerate with a tooltip | A greyed control promises it works sometimes, and invites tapping to find out when |
| The two weeks side by side as peers | The arrangement that makes the asymmetry loudest. Use a segmented control or a forward affordance — both weeks are never needed on screen at once |
| Softening the freeze | The restriction is load-bearing. It was the presentation that was wrong |

#### 3.2.2 Moving between the two weeks

**A switcher, not a stacked card.** The Week screen carries a segmented control —
*This week · Next week* — and shows one at a time.

Looking at next week is an occasional, deliberate act: the user goes there when they
are organising or about to shop, not daily. So it should be findable on demand rather
than pushed at them, and it should not take vertical space from the current week every
day of the week.

This is also why the two weeks are never shown as peers side by side (see the rejected
options above) — that arrangement makes the asymmetry loudest while serving a need that
arises roughly once a week.

**Known weak spot.** The freeze bites hardest on the *remaining* days of the current
week — on Tuesday, Thursday's dinner is a future plan that cannot be touched, which
feels more arbitrary than a locked Monday. The shopping argument does cover it, which
is why layer 3's copy must mention shopping rather than merely state a rule.

#### 3.2.3 What the tick on a day row means

The first mocks drew a tick on today's row unconditionally, and drew it 30px. Both were
wrong. A tick that appears whether or not anything was cooked is a false record, and a
30px control is under the 48px floor on the one screen where §4 says the tick *is* the
control.

**The tick on a day row is the cooked control for that day's main meal.** One tick, one
dish. The main meal is the real decision (§3.1) and the dish whose last-served date
matters most to repeat-avoidance. The other three slots are marked from Today or from
their own Dish screen, which always carries the control.

| Day | What the row shows |
|---|---|
| Today | A 48px cooked mark (§2.9), **unset until the main meal is marked** |
| A day already passed | The same mark, set if the main meal was marked, unset if not |
| A day ahead | No mark. You cannot have cooked Thursday's dinner on Tuesday |
| Any day of next week | No mark |

An unset mark on a passed day means *nothing was recorded*, which the system treats as
"the plan was followed" (`REQUIREMENTS.md` §4.1.1). It does not mean a meal was missed
and must never be styled as if it did (§1, second principle). It is the same neutral
ring the user sees on today, and the row's second line never mentions marks.

#### 3.2.4 First launch

On genuine first launch there is no empty state and no onboarding (§5). A week is
generated before the first frame and the app opens on **Today** like any other day
(`TEST-PLAN.md` CAD-08, NAV-02). Opening Week shows that same week.

What differs from a week in progress is only what is absent: no mark is set anywhere. If the
first launch is mid-week, the week is generated **from today onward**; the days before it
appear as passed days with no dishes and no marks, and are not history.
Nothing is added to say the app is new: no banner, no welcome line, no hint toward
Search. The frozen-week block and its copy are unchanged (§3.2.1).

A week generated with no serving history has nothing to avoid repeating, so first launch
is the one moment the plan carries no memory of what was cooked. That is a property of
the data, not of the interface, and the interface says nothing about it.

### 3.3 Dish

| Element | When |
|---|---|
| Name, Kannada name, role | Always |
| Cooked control | Always, for a dish in the current week or reached from Search |
| **Swap with a different dish** | Only when the dish was opened from a plan, and only for a day after today, and only where its role holds more than one recipe. Where it would be shown but cannot work, the **inert reason block** (§2.8) takes its place |
| **Add to a meal** | Only when the dish was opened from Search |
| **Page number** | Always, and prominent for tier 1 |
| Ingredients | When extracted |
| Method | When extracted |

**Tier 1 is not an error state.** A dish with only a page number shows the page large
and calm — *Kokum saar · page 9* — because that is a complete answer for someone
holding the book. It must not look like something failed to load. No spinner, no
"coming soon", no greyed-out section headers.

Ingredients show the major ones by default, with the seasoning stoplist behind *show
all*.

**Swap lives here, not on the row.** Today already carries a cooked
control per dish; a second per-row control would crowd it. Tapping through to the dish
is the natural order anyway — you look at what it is, decide it is wrong, and replace it
from the same screen. Two taps is right for an occasional corrective action.

It is absent when the dish was reached from Search, because a dish in no plan has
nothing to be swapped out of. That makes this screen origin-dependent in the same way
the back affordance is, and the same state-leak risk applies.

**When swap cannot work, a block says why, in the same position.** There are two causes:
the role holds a single recipe (`REQUIREMENTS.md` §4.5; GEN-16) and the day has passed
(LIF-20). Either way the action slot holds a block reading *Swap is not available* with
one sentence naming the cause (§2.8): never a greyed button, never a gap. This is the
third use of the principle that an action slot is never empty (§3.2.1, and Add to a
meal below).

**From Search, the action is Add to a meal instead.** The two are complementary and
mutually exclusive by origin: a dish inside a plan can be replaced, a dish outside one can
be placed. Both sit in the same position, so the screen never has an empty action slot —
the same principle as §3.2.1.

*Add to a meal* opens a day-and-slot picker with a This week / Next week switcher: each
day after today expands to its four slots, showing the dish currently in each so the user
knows what they are replacing. Today and past days are not offered.

**No warning when the role does not match.** Put a sweet in the saar position and it goes
there quietly. The user asked; a confirmation would imply they had made a mistake.

### 3.4 Search

Live filter, role chips, results as rows.

Until extraction is complete, results split into two groups: extracted recipes, and
unextracted ones matched on name only under a heading that says their ingredients were
not searched. A coverage line states how many recipes had ingredients searched.

**The coverage line sits above the results**, directly under the role chips, not below
them. Its job is to stop a user trusting a short list, and a line that arrives after the
list, below the fold, comes too late to do that. The first mocks put it last.

**This honesty costs a line of interface and buys trust.** A user who finds four
results for "jaggery" and assumes that is all will conclude the app is wrong, not
incomplete.

**The two groups look different, and neither looks like a draft week.** The extracted
group is a white `bg.surface` card. The name-only group is a `bg.sunken` card with a
solid 2px `border.default` edge, its meaning carried by its heading and its own
sentence. The dashed `border.strong` treatment belongs to next week's draft rows alone
(§3.2.1): dashed means *provisional plan*, and a name-only result is not provisional,
only less searched. The first mocks used one treatment for both.

#### 3.4.1 Zero results

A query that matches nothing never leaves a blank panel (`TEST-PLAN.md` SRC-11). In place
of both groups, one `bg.surface` card holds:

| Part | Spec |
|---|---|
| Statement | **No dishes match "ragi".** 22px, 600, `fg.default`. The query appears exactly as typed. With a role chip active the statement names the role: *No saar match "ragi".* |
| What was searched | 17px, `fg.muted`: *Searched dish names and Kannada names in all 412 recipes, and ingredients in 62.* The counts are the coverage line's counts |
| Why it may be incomplete | While extraction is partial, a second sentence: *The other 350 were searched by name only, so a dish may use it without being found.* It goes, with the coverage line, once extraction is complete (SRC-10) |
| Action | One outline button, **Clear search** (or **Show all roles** when a chip is active), 56px. It returns focus to the field |

The coverage line stays above the card, as in every other result state. No illustration,
no apology and no suggested dish: a suggestion would be the app recommending something
nobody asked for.

**One group empty, the other not.** The empty group is omitted with its heading. It does
not appear as an empty shell.

### 3.5 Settings

A pushed screen reached from the sliders button on Today (§3.1). It answers the open question of
where the seasonality setting lives (`REQUIREMENTS.md` §4.7; `ARCHITECTURE.md` §2.4): not
on Search or Week, where it would sit beside controls that act on a single week.

| Section | Control | Notes |
|---|---|---|
| **Planning** | **Seasonal dishes**, an on/off switch | Default on. Beneath it: *Leave out dishes that are out of season when planning a week. Dishes you choose yourself are never blocked.* then *Changes apply to weeks planned from now on.* (GEN-22) |
| **Planning** | **Plan next week on**, a day select and a time select | Default Friday and 6:00 pm. Beneath: *Next week is planned at this time, or the first time you open the app after it.* (CAD-03, CAD-06) |

- The switch is a real `<input type="checkbox" role="switch">` inside a `<label>`, in a
  56px-minimum row, and its state is also written as the word **On** or **Off**, so state
  is never colour alone.
- Each select is a real `<select>` with a visible `<label>`. Native pickers scale with the
  OS text size (LEG-08) and work with every assistive technology without extra effort.
- Nothing saves with a button. A change applies as it is made; there is no *Save*,
  *Done* or *Cancel*, because a commit step is a way to lose a change.
- No other setting is added. Repeat windows stay tunable in code, not in the interface
  (`ARCHITECTURE.md` §3.3).

### 3.6 Regenerate confirmation

Regenerating next week discards a whole week and any slot changes made in it
(`TEST-PLAN.md` ASN-10), so it confirms (§4), as a **bottom sheet** rising over the Week
screen.

| Part | Spec |
|---|---|
| Container | `bg.surface`, `radius.control` on its top corners, 3px `border.strong` along the top. In dark, also the §2.6 edge |
| No scrim | The screen behind is not dimmed or tinted. A scrim is opacity used to de-emphasise (§2.5), and the sheet's own border is enough to lift it. The screen behind is made inert to assistive technology instead |
| Title | **Replace next week's plan?** 22px, 600 |
| Body | 17px, `fg.muted`. Always: *This plans all seven days again.* If the user has changed slots in it, add: *2 dishes you chose will be replaced too.* with the real count. With none changed, that sentence is absent |
| Primary | **Regenerate**, `action.primary` fill, 56px |
| Secondary | **Keep this plan**, outline, 56px. **It takes focus when the sheet opens**, so the safe action is the one Enter reaches |
| Dismiss | Escape, and Keep this plan, close it with nothing changed |

No red, no warning icon, no *Are you sure*. The wording names what is lost, which is the
whole point of a confirmation. Swap and cooked do not confirm (§4).

### 3.7 Next-week notice

Next week surfaces as a notice, never a modal or a blocking step (`REQUIREMENTS.md` §4.3;
CAD-02). It is a card on Today.

| Part | Spec |
|---|---|
| Container | `bg.surface`, 2px solid `border.strong`, `radius.control`, in the flow below the header |
| Text | **Next week is planned.** 19px, 600. Beneath, 15px `fg.muted`: the date range, *9 to 15 November* |
| Action | **See next week**, `action.primary` 17px, 600, with a chevron; a link to Week on its Next week segment, at least 56px tall |
| Appears | From the configured moment until next week has been viewed by any route (LIF-16) |
| Dismiss | A text button **Dismiss**, `fg.muted` 17px, 56px tall, at the right of the container. It hides the notice for that week and is remembered (a `noticeDismissed` flag on the week). Viewing next week hides it too (LIF-16) |

It does not repeat on Week, whose own block already carries *Plan next week* (§3.2.1).

---

## 4. Interaction rules

| Rule | Why |
|---|---|
| The Dish screen returns to wherever it was opened from, with search state intact | Coming back to a reset search after one tap is the most common small frustration |
| No Have / Buy markers anywhere | There is no pantry. Any such marker would be a lie |
| Regenerate confirms; swap and cooked do not | Regenerate discards a whole week. The other two change one thing and undo by repeating |
| The cooked control appears wherever a dish is displayed — Today, Week and Dish alike | A toggle present in some lists and absent from others makes people hunt for it |
| On the Week screen, the tick **is** the control | The element that displays state also sets it, so nothing is added to the week's visual weight |
| A dish reached from Search can be marked cooked | Deviation is expected. Off-plan cooking must be recordable, or history drifts |
| No adherence signals anywhere | No streaks, no percentages, no "you missed a meal" |
| Two verbs: a week **regenerates**, a dish **swaps** | One word for both was tried. "Regenerate this dish" reads as making that dish again, differently — nearly the opposite of replacing it |
| Rules constrain the generator, never the user | A dish assigned by hand bypasses role, season and repeat filtering without comment |
| Regenerate never appears on the current week; swap does | The cost differs by an order of magnitude — one wastes the shopping, the other wastes one dish |
| Nothing blocks on network | Offline-first. No connection state exists in the UI |
| Next week never interrupts | It appears; it does not modal |
| Nothing is ever disabled. An unavailable action is replaced by a block that says why | Opacity and greyed controls are banned (§2.5), and a control that looks live but does nothing teaches people to tap it |
| Every interactive element shows a 3px focus ring on keyboard focus | Keyboard and switch users otherwise cannot tell where they are (§2.7) |
| A control that goes to another place is a link; a control that changes something is a button | Same look must mean same element and same keyboard behaviour. Regenerate and Add to a meal are both buttons; the week switcher's two segments are both links |
| The same 7:1 floor holds in dark | Light and dark are one design in two palettes, not two designs (§2.6) |
| A confirmation names what is lost and focuses the safe action | Wording does the work colour would otherwise be asked to do (§3.6) |

---

## 5. What the design does not have

No pantry screen, no shopping list, no Have/Buy, no onboarding, and no settings beyond
the two in §3.5 (seasonal dishes; the day and time next week is planned). Per-dish swap is **in** v1 (`REQUIREMENTS.md` §4.5); an earlier line
here calling it next-version was stale.

The absence of onboarding is deliberate. There is nothing to configure before the app
is useful, so a first-run flow would exist only to explain features the user can see.

---

## 6. Open

Nothing is open. The questions raised by the design pass were decided on 2026-11-03; see `DECISIONS.md`.

Resolved earlier:

| Was open | Resolved |
|---|---|
| Where does the seasonality setting live | A Settings screen from a sliders button on Today (§3.5) |
| Pushed-screen title 30px or 28px | 28px (§2.3) |
| Row height 56px or 60px | 56px is a floor; two-line rows grow (§2.4) |
| Dashed rows mean draft week and not-extracted | Dashed is draft week only; name-only is a solid sunken card (§3.4) |
| Day-row tick 30px and always on | 48px, the main meal's real state (§3.2.3) |
| `border.subtle` for row separators | Defined, gray.200 light and gray.800 dark (§2.2, §2.6) |
| Coverage line below the results | Above them (§3.4) |
| `status.success` unused | Dropped from this project's tokens (§2.2) |
| Button or anchor | Navigates: link. Changes something: button (§4) |
| Focus treatment | §2.7 |
| Dark values for the five missing tokens | §2.6 |
| Inert state | §2.8 |
| Current-week asymmetry | §3.2.1 — action slot, differentiated rendering, explanatory copy |
| Does the copy change once next week is viewed | No. Constant all week |
| Portion cue on the main meal | Not needed |
| Where the cooked control lives | Wherever a dish is displayed; on Week the tick is the control |
| Next week: card or switcher | A switcher (§3.2.2) |
| Picker offers next week | Yes, through the same This week / Next week switcher |
| Appearance override | None. Follows the device |
| Dismissing the notice | Dismissible (§3.7) |
| Filter chip height | 56px (§2.4) |
| Day-row tick | Main meal only (§3.2.3) |
| First launch mid-week | From today onward (§3.2.4) |
| Frozen-week copy on first launch | Unchanged, by decision |
| Settings entry point | Today only |
| Swap reach | Days after today and all of next week; not today (§2.8, §3.3) |

---

## 7. Token Forge requests

What this design needs from Token Forge that the gallery does not give, in priority order.
Components are listed in `app/COMPONENTS.md`; these are the *token-level* gaps.

| # | Request | Why | Value or rule |
|---|---|---|---|
| 1 | `border.focus` semantic token | Nothing in the gallery shows focus (`app/COMPONENTS.md` §7.6) | Alias of `fg.default`: `#0f172a` light, `#f8fafc` dark. Ring 3px with a 2px gap (§2.7) |
| 2 | `border.subtle` semantic token | Row separators were hard-coded `#e2e8f0` | gray.200 light, gray.800 dark. Decorative only (§2.2) |
| 3 | `radius.pill` | Chips and ticks use half-height radii that no token names | Half the control height. Not a fixed number |
| 4 | **Nested-radius rule** | A child inside a rounded parent drifts from it unless computed | Child radius = parent radius minus the gap, floor 0. Week switcher: 12 minus 3 = 9 |
| 5 | `action.primaryHover` in both themes | The gallery gives none; mocks used `#134e4a` by eye | teal.900 `#134e4a` light, teal.200 `#99f6e4` dark |
| 6 | Dark values for `fg.subtle`, `border.default`, `border.strong`, `status.success` | `app/COMPONENTS.md` §7.7: dark could not be built | `#cbd5e1`, `#334155`, `#94a3b8`, `#4ade80` (§2.6) |
| 7 | Replace the disabled variant with an **inert reason block** | The only disabled state is `opacity: .45`, which is banned | See §2.8. The gallery's disabled variant is not used anywhere in this app |
| 8 | A `gray.350` primitive near `#9fadc0` | Dark `fg.subtle` has no primitive that clears 7:1 and differs from `fg.muted` (gray.400 reaches 6.96:1) | 7.8:1 on `bg.surface` dark. Optional: without it dark has one text tier below `fg.default` |
| 9 | Re-specify gallery sizes at this project's floors | Gallery body computes to about 14.2px, input to 34px, caption to 10px (`app/COMPONENTS.md` §7.8) | 15px text, 56px controls, 48px icon targets |
| 10 | Bottom sheet, switch and native-select components | No dialog or sheet exists; the gallery has no switch or schedule field | §3.6, §3.5 |

Not requested: Data table, Progress, Status badge (`app/COMPONENTS.md` §8).
