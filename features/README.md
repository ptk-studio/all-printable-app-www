# Features

This directory holds the product specification for All Printable: what each
printable does, why it is built the way it is, and what is planned next.
Code lives in `docs/`; nothing here is served.

```
features/
  README.md          this file
  platform.md        conventions every printable follows
  analytics.md       what is measured, and the consent model
  roadmap.md         what is planned, in priority order
  calendar/
    README.md        the calendar maker's full feature spec
    holidays.md      holiday rule coverage and its known limits
    layouts.md       the seven layout engines in detail
  paper/
    README.md        graph, dot, ruled, isometric, hex, manuscript, handwriting
  tracker/
    README.md        habit tracker and chore chart
  cards/
    README.md        flashcards, tags, bookmarks, place cards, labels
  puzzles/
    README.md        sudoku, word search, mazes, bingo
  forms/
    README.md        budget, packing list, meal plan, day planner
  worksheets/
    README.md        times tables and maths drills
```

## Adding a printable

1. Write a spec under `features/<name>/README.md` first — options, paper
   behaviour, and what the printed sheet must look like.
2. Add an entry to `docs/assets/js/registry.js` with `status: 'soon'`.
   The home page picks it up automatically.
3. Build under `docs/printables/<name>/`: an `engine.js` that turns state into
   pages, a `print.css` for the sheet, an `index.html` of controls, and a short
   `app.js` that hands both to `AP.studio`. See `platform.md`.
4. Flip the registry entry to `status: 'live'` with an `href` and `bullets`.

## Principles

- **True size or nothing.** A sheet prints at the dimensions the user picked.
  Never rely on "fit to page".
- **No server.** Everything is computed in the browser. Nothing is uploaded,
  including photos.
- **Recoverable.** Every setting round-trips through the URL, so a design can
  be bookmarked, shared and edited later.
- **Any year, any locale.** Prefer computed rules over lookup tables that go
  stale, and `Intl` over hardcoded English.
