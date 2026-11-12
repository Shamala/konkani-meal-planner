# Konkani Meal Planner

Tells you what to cook each day, from a Konkani cookbook you already own, without repeating itself. A single-user, offline-first web app (PWA). No account, no server, no AI model.

**Live:** https://shamala.github.io/konkani-meal-planner/ (published from `main`)

**Today:** the four slots for today (breakfast, snack, the main meal, evening snack) with a cooked tick on each dish. **Week:** the current week, with one tick per day. **Dish:** the page number in your book. **Search:** by dish name.

The main meal is plain rice with a saar or sambar, a curry and a vegetable, or, one day a week, a rice dish on its own. Dishes repeat only after about three weeks, and seasonal dishes (mango, jackfruit and so on) appear only in season.

## Run it

```bash
cd app
npm install
npm run dev      # http://localhost:5173/konkani-meal-planner/
npm test         # 63 checks
npm run build
```

React 19, Vite, TypeScript, Dexie (IndexedDB). Needs Node 20.19 or newer.

## Where things are

| Path | What |
|---|---|
| `app/` | The app. `src/engine` is pure logic, `src/ui` the screens |
| `extraction/` | The dish list read from the cookbook index (names and page numbers only) |
| `REQUIREMENTS.md`, `DESIGN.md`, `ARCHITECTURE.md` | What it is and why. [`PROJECT-OVERVIEW.md`](PROJECT-OVERVIEW.md) is the reading order |
| `RELEASE-PLAN.md`, `PHASE-1-DESIGN.md` | The three phases. This is Phase 1 |

The cookbook itself is not in this repository.
