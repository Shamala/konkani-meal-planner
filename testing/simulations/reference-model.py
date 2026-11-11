"""
Reference model of the ARCHITECTURE.md section 3.2 generation rules.

NOT the app and NOT a test of the app. It is an executable reading of the documents,
used to produce the numbers in testing/SIMULATIONS.md and to make the simulation
specifications concrete. Delete it the day the app can be driven directly.

Run:  python3 -I testing/simulations/reference-model.py            (prints all results)
Pure standard library. Deterministic: every pick is seeded from (seed, date, slot, position).

Rules are DECIDED in DECISIONS.md (2026-11-03): inclusive repeat window (D1), a main-meal
position with no in-season candidate is LEFT OUT (D2), season from each day's own date, priority
season > window > family adjacency, swap only on days after today (LIF-23). EDGE=lt shows the
superseded exclusive reading. Where the documents are still silent the model uses a named
ASSUMPTION constant tied to a
still-open gap in testing/GAPS.md. Changing an assumption changes the results; that is the point.
"""
import json, os, random, datetime as dt, collections, sys

HERE = os.path.dirname(os.path.abspath(__file__))
FIX = os.path.join(HERE, "..", "fixtures")
load = lambda n: json.load(open(os.path.join(FIX, n)))

# ---- ASSUMPTIONS (documents silent) ------------------------------------------------
A_WINDOW_EDGE = os.environ.get("EDGE", "le")  # DECIDED D1: "le" = excluded through D+N, first allowed D+N+1. "lt" is superseded, kept only for comparison.
A_INTRAWEEK_HISTORY = True  # OPEN G-10: dishes placed earlier in the same generation count as served
A_SEASON_BASIS = "day"      # DECIDED (GEN-24): season uses each day's own date. Fixed.
A_TIEBREAK = "id"           # OPEN G-12: oldest-served ties broken by id
A_FAMILY_RELAX = "family"   # DECIDED (ARCHITECTURE 3.2 priority): family adjacency is best-effort, dropped before the window
WINDOWS = {"main": 21, "breakfast": 7, "snack2": 14}   # ARCHITECTURE.md 3.3

R = load("recipes.book.SYNTHETIC.json")
S1 = load("snack1.library.json")
S2 = load("snack2.pools.json")
RECIPES = R["recipes"]
S1E = S1["entries"]
S2_IN = {s["section"] for s in S2["sectionProxy"]["in"]}
POSITIONS = [p["roles"] for p in R["_meta"]["mainMealComposition"]["positions"]]


def in_season(item, month, respect=True):
    return (not respect) or ("season" not in item) or (month in item["season"])


def pick(rng_key, cands):
    return random.Random(rng_key).choice(sorted(cands, key=lambda c: c["id"]))


def eligible(cands, hist, d, window, month, respect, extra_excl=()):
    """steps 3-5 of ARCHITECTURE 3.2. Returns (after_season, after_window)."""
    s = [c for c in cands if in_season(c, month, respect) and c["id"] not in extra_excl]
    w = [c for c in s if c["id"] not in hist or (d - hist[c["id"]]).days >= window]
    if A_WINDOW_EDGE == "le":
        w = [c for c in s if c["id"] not in hist or (d - hist[c["id"]]).days > window]
    return s, w


def choose(key, cands, hist, d, window, month, respect, extra_excl=()):
    s, w = eligible(cands, hist, d, window, month, respect, extra_excl)
    if not s:
        return None, "LEFT_OUT"          # D2 / GEN-23: season wins, completeness gives
    if w:
        return pick(key, w), "ok"
    oldest = sorted(s, key=lambda c: (hist.get(c["id"], dt.date.min), c["id"]))[0]
    return oldest, "fallback"


def snack1_pool_size(d, respect=True):
    return len([e for e in S1E if in_season(e, d.month, respect)])


def snack1_pick(key, hist, d, last_family, respect=True):
    pool = [e for e in S1E if in_season(e, d.month, respect)]
    window = len(pool) - 1                       # ARCHITECTURE 3.3, recomputed per month
    if A_WINDOW_EDGE == "le":
        ok = [e for e in pool if e["id"] not in hist or (d - hist[e["id"]]).days > window]
    else:
        ok = [e for e in pool if e["id"] not in hist or (d - hist[e["id"]]).days >= window]
    note = "ok"
    if not ok:                                   # fallback: oldest served
        ok = [sorted(pool, key=lambda e: (hist.get(e["id"], dt.date.min), e["id"]))[0]]
        note = "fallback"
    fam_ok = [e for e in ok if e["family"] != last_family]
    if fam_ok:
        ok = fam_ok
    elif last_family is not None:
        note = note + "+familyRelaxed"           # best-effort family rule
    return pick(key, ok), note


def build_corpus(P_main=None, B=None, S=None, positions=None):
    """Optional parametric corpus for pool-size sweeps. Returns recipe list."""
    recs = []
    for pi, roles in enumerate(positions or POSITIONS):
        for i in range(P_main):
            recs.append({"id": f"p{pi}-{i:02d}", "role": roles[0], "slots": ["main"], "section": 99})
    for i in range(B):
        recs.append({"id": f"b-{i:02d}", "role": "breakfast", "slots": ["breakfast", "snack2"], "section": 17})
    for i in range(S):
        recs.append({"id": f"s-{i:02d}", "role": "sweet", "slots": ["snack2"], "section": 26})
    return recs


def snack2_pool(recs):
    book = [r for r in recs if "snack2" in r["slots"] and r["section"] in S2_IN]
    auth = [{"id": a["id"]} for a in S2["authoredAdditions"]]
    return book + auth


def run(recs, start, weeks, seed=1, respect=True, positions=None, with_snack2_authored=True):
    positions = positions or POSITIONS
    hist = {}                # lastServed by id, shared across slots (ARCHITECTURE 2.4)
    ev = collections.Counter()
    placed = []              # (date, slot, position, id, note)
    bfast = [r for r in recs if "breakfast" in r["slots"]]
    mains = [[r for r in recs if "main" in r["slots"] and r["role"] in roles] for roles in positions]
    s2 = snack2_pool(recs) if with_snack2_authored else [r for r in recs if "snack2" in r["slots"] and r["section"] in S2_IN]
    last_fam = None
    for w in range(weeks):
        wk = start + dt.timedelta(days=7 * w)
        wseed = seed + w                      # OPEN G-14: initial week seed derivation is unspecified
        for k in range(7):
            d = wk + dt.timedelta(days=k)
            m = d.month                   # GEN-24: each day's own month
            b, note = choose((wseed, d, "bf"), bfast, hist, d, WINDOWS["breakfast"], m, respect)
            ev["breakfast:" + note] += 1
            if b:
                hist[b["id"]] = d; placed.append((d, "breakfast", 0, b["id"], note))
            sn, note = snack1_pick((wseed, d, "s1"), hist, d, last_fam, respect)
            ev["snack1:" + note] += 1
            hist[sn["id"]] = d; last_fam = sn["family"]; placed.append((d, "snack1", 0, sn["id"], note))
            for pi, pool in enumerate(mains):
                c, note = choose((wseed, d, "m", pi), pool, hist, d, WINDOWS["main"], m, respect)
                ev[f"main{pi}:" + note] += 1
                if c:
                    hist[c["id"]] = d; placed.append((d, "main", pi, c["id"], note))
            c, note = choose((wseed, d, "s2"), s2, hist, d, WINDOWS["snack2"], m, respect,
                             extra_excl=(b["id"],) if b else ())
            ev["snack2:" + note] += 1
            if c:
                hist[c["id"]] = d; placed.append((d, "snack2", 0, c["id"], note))
    return placed, ev


def min_gaps(placed, slot):
    last, gaps = {}, collections.defaultdict(list)
    for d, s, p, i, n in placed:
        if s != slot:
            continue
        if i in last:
            gaps[i].append((d - last[i]).days)
        last[i] = d
    return gaps


def report_fixture(label, start, weeks, respect):
    placed, ev = run(RECIPES, start, weeks, respect=respect)
    print(f"\n== {label}  start={start} weeks={weeks} seed=1 respectSeasons={respect} ==")
    for k in sorted(ev):
        print(f"  {k:28s} {ev[k]}")
    same_day = [d for d, s, p, i, n in placed if s == "snack2"
                and any(x[0] == d and x[1] == "breakfast" and x[3] == i for x in placed)]
    print("  breakfast/snack2 same-dish days:", len(same_day))
    nov = [x for x in placed if x[1] != "snack1"]
    oos = [(d, i) for d, s, p, i, n in placed if s != "snack1"
           for r in RECIPES if r["id"] == i and "season" in r and respect and d.month not in r["season"]]
    print("  out-of-season picks on actual date:", len(oos))
    return placed, ev


def snack1_cycle(label, start, days, respect=True):
    hist, last_fam, seq, notes = {}, None, [], collections.Counter()
    for k in range(days):
        d = start + dt.timedelta(days=k)
        e, note = snack1_pick((1, d, "s1"), hist, d, last_fam, respect)
        hist[e["id"]] = d; last_fam = e["family"]; seq.append((d, e)); notes[note] += 1
    print(f"\n== {label}  start={start} days={days} ==")
    sizes = collections.Counter(snack1_pool_size(d, respect) for d, _ in seq)
    print("  pool size by day-count:", dict(sizes))
    print("  notes:", dict(notes))
    adj = sum(1 for a, b in zip(seq, seq[1:]) if a[1]["family"] == b[1]["family"])
    print("  consecutive same-family days:", adj)
    return seq


def cycle_exact(seq, n, offset=0):
    """First n entries from offset: each distinct exactly once?"""
    ids = [e["id"] for _, e in seq[offset:offset + n]]
    return len(ids) == n and len(set(ids)) == n


def swap_allowed(target, today, week_kind):
    """LIF-19 / LIF-20 / LIF-23: swap and add-to-a-meal on days AFTER today in the current week, and all of next week."""
    if week_kind == "next":
        return True
    if week_kind == "current":
        return target > today
    return False   # past week


if __name__ == "__main__":
    print("#### WINDOW EDGE:", A_WINDOW_EDGE, "(le = decided inclusive)")
    mon = dt.date(2026, 11, 2)
    report_fixture("S-A1 fixture corpus, seasons ON", mon, 26, True)
    report_fixture("S-A2 fixture corpus, seasons OFF", mon, 26, False)

    print("\n== S-B main-meal pool sweep, 26 weeks, window 21 ==")
    for P in (3, 10, 20, 21, 22, 23, 30):
        pl, ev = run(build_corpus(P, 12, 20), mon, 26, respect=False)
        fb = sum(v for k, v in ev.items() if k.startswith("main") and k.endswith("fallback"))
        g = min_gaps(pl, "main")
        mg = min((min(v) for v in g.values()), default=None)
        d8 = len({i for d, s_, p, i, n in pl if s_ == "main" and d < mon + dt.timedelta(days=56)})
        print(f"  pool/position={P:2d}  main fallbacks={fb:4d}/{26*7*4}  min gap={mg}  distinct main dishes in first 8 wks={d8}")

    print("\n== S-C breakfast pool sweep, 26 weeks, window 7 ==")
    for B in (4, 6, 7, 8, 9, 12):
        pl, ev = run(build_corpus(30, B, 20), mon, 26, respect=False)
        g = min_gaps(pl, "breakfast")
        print(f"  breakfast pool={B:2d} fallbacks={ev['breakfast:fallback']:3d}/182  min gap={min((min(v) for v in g.values()), default=None)}")

    print("\n== S-C2 Snack 2 on the rich corpus (pool 44), 26 weeks ==")
    pl, ev = run(build_corpus(30, 12, 20), mon, 26, respect=False)
    g = min_gaps(pl, "snack2")
    print("  snack2:", {k: v for k, v in ev.items() if k.startswith("snack2")}, "min gap", min(min(v) for v in g.values()))

    seq = snack1_cycle("S-D1 Aug-Feb constant pool 54", dt.date(2026, 8, 3), 54 * 3)
    print("  exact at offsets 0,54,108:", [cycle_exact(seq, 54, o) for o in (0, 54, 108)])
    seq = snack1_cycle("S-D2 Apr-Jun constant pool 60", dt.date(2027, 4, 1), 91)
    print("  exact (n=60):", cycle_exact(seq, 60))
    seq = snack1_cycle("S-D3 boundary crossing Feb 1 - Aug 31", dt.date(2027, 2, 1), 212)
    seq = snack1_cycle("S-D4 seasons OFF, 60 days x3", dt.date(2026, 11, 2), 180, respect=False)
    print("  exact at offsets 0,60,120 (n=60):", [cycle_exact(seq, 60, o) for o in (0, 60, 120)])

    print("\n== S-D5 family adjacency (best-effort) over seeds 1-20, relaxations per run ==")
    for label, start, days, resp in (("Aug-Feb 162d", dt.date(2026, 8, 3), 162, True), ("Apr-Jun 91d", dt.date(2027, 4, 1), 91, True),
                                      ("Feb-Aug 212d", dt.date(2027, 2, 1), 212, True), ("seasons off 180d", dt.date(2026, 11, 2), 180, False)):
        r = []
        for sd in range(1, 21):
            hist, lf, rel = {}, None, 0
            for k in range(days):
                d = start + dt.timedelta(days=k)
                e, n = snack1_pick((sd, d, "s1"), hist, d, lf, resp)
                hist[e["id"]] = d; lf = e["family"]; rel += "familyRelaxed" in n
            r.append(rel)
        print(f"  {label}: min {min(r)} max {max(r)} seeds with >0: {sum(x > 0 for x in r)}/20")

    comp4 = [["saar"], ["masala-curry", "sambar"], ["rice", "roti"], ["sasam"]]
    print("\n== S-E GEN-23: composition with a sasam-only fourth position ==")
    for label, start, resp in (("November 2026, seasons ON", dt.date(2026, 11, 2), True),
                               ("May 2027, seasons ON", dt.date(2027, 5, 3), True),
                               ("November 2026, seasons OFF", dt.date(2026, 11, 2), False)):
        pl, ev = run(RECIPES, start, 4, respect=resp, positions=comp4)
        per_day = collections.Counter(d for d, s_, p, i, n in pl if s_ == "main")
        oos = [1 for d, s_, p, i, n in pl if s_ == "main" and p == 3
               for r in RECIPES if r["id"] == i and "season" in r and d.month not in r["season"]]
        p3 = {k.split(":")[1]: v for k, v in sorted(ev.items()) if k.startswith("main3")}
        print(f"  {label}: sasam position {p3}; main-meal dishes per day {dict(collections.Counter(per_day.values()))} (of 28 days); out-of-season placed {len(oos)}")
    only = [r for r in RECIPES if "breakfast" not in r["slots"] or r["id"] == "syn-colocasia-patholi"]
    pl, ev = run(only, dt.date(2026, 11, 2), 2, respect=True)
    print("  breakfast pool = {colocasia patholi, Jun-Sep}, Nov, 2 weeks:", {k: v for k, v in ev.items() if k.startswith("breakfast")})

    print("\n== S-F GEN-24: week straddling a month boundary, sasam-only position ==")
    for label, wk in (("Mon 2027-03-29 (Mar 29 - Apr 4)", dt.date(2027, 3, 29)), ("Mon 2027-07-26 (Jul 26 - Aug 1)", dt.date(2027, 7, 26))):
        pl, ev = run(RECIPES, wk, 1, respect=True, positions=[["sasam"]])
        got = {str(d): i for d, s_, p, i, n in pl if s_ == "main"}
        left = [str(wk + dt.timedelta(days=k)) for k in range(7) if str(wk + dt.timedelta(days=k)) not in got]
        bad = [1 for d, i in got.items() for r in RECIPES if r["id"] == i and dt.date.fromisoformat(d).month not in r["season"]]
        print(f"  {label}: placed {len(got)} days {sorted(set(got.values()))}; left out {left}; out-of-season on its own date: {len(bad)}")
        print("    mango sasam dates:", [d for d, i in got.items() if i == "syn-mango-sasam"])

    print("\n== S-G LIF-19/20/23 swap reach, today = Wed 2026-11-04 ==")
    today = dt.date(2026, 11, 4)
    for k in range(7):
        d = dt.date(2026, 11, 2) + dt.timedelta(days=k)
        print(f"  current week {d:%a %d}: swap/assign allowed = {swap_allowed(d, today, 'current')}")
    print("  next week (any day):", swap_allowed(dt.date(2026, 11, 10), today, "next"))
    print("  past week (any day):", swap_allowed(dt.date(2026, 10, 28), today, "past"))
