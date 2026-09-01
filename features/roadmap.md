# Roadmap

Ordered by how often people search for the thing and how badly the free
alternatives handle it. Registry ids match `docs/assets/js/registry.js`.

## Done

- **The studio shell** — state, binding, preview, print and export extracted to
  `core/studio.js`; a new generator is now an engine plus a control panel.
- **graph-paper, dot-grid, lined-paper, isometric, hex, manuscript,
  handwriting** — all seven from one `paper` generator, drawn to measured scale.
- **habit-tracker and chore-chart** — one `tracker` generator, three layouts.
- **The imposition helper** — `core/impose.js`: N-up layout, crop and cut
  marks, Avery die-cut stock and duplex card ordering, with the flip geometry
  asserted rather than eyeballed.
- **flashcards, gift-tags, bookmarks, place-cards, labels** — one `cards`
  generator on top of it.

## Next

1. **times-tables** — drill sheets with a separate answer key page.
3. **sudoku**, **word-search**, **maze**, **bingo** — generated puzzles with
   solution pages. Each needs a generator plus a difficulty model.
4. **budget**, **packing-list**, **meal-planner** — form-shaped sheets; mostly
   a table engine plus good typography.
5. **gift-tags**, **bookmarks**, **place-cards**, **labels** — small formats
   with trim and fold marks; needs a shared imposition helper.
6. **daily-planner** — time-blocked day sheets; close to the calendar's week
   layout but per-day.

## Platform work worth doing first

- **A table/form engine.** Half of what is left is "rows and columns with
  headings and writing space". The tracker's grid is most of it already —
  generalising it turns the budget, packing-list and meal-planner sheets into
  configuration.
- **A real PDF export.** Today the browser's print dialog does the conversion,
  which is high quality and dependency-free but makes the user do two steps.
  A direct download would need a PDF writer with font embedding — worth it only
  once traffic justifies the weight.
- **Per-printable SEO pages.** Each generator should have static, indexable
  landing copy (e.g. "printable 2027 calendar A4") rather than relying on one
  home page.
