# Roadmap

Ordered by how often people search for the thing and how badly the free
alternatives handle it. Registry ids match `docs/assets/js/registry.js`.

## Done

Everything in the original catalogue is live — 26 printables across seven
generators.

- **The studio shell** — `core/studio.js`: state, binding, preview, print and
  export. A new generator is an engine plus a control panel.
- **The imposition helper** — `core/impose.js`: N-up layout, crop and cut
  marks, Avery die-cut stock and duplex card ordering, with the flip geometry
  asserted rather than eyeballed.
- **The table engine** — `core/table.js`: blocks, ruled space, checklists and
  rows. Turned the four form sheets into about 130 lines of layout.
- **calendar** — seven layouts, 30 countries of holidays, moon phases.
- **paper** — graph, dot, ruled, isometric, hex, manuscript, handwriting,
  drawn to measured millimetre scale.
- **tracker** — habit tracker, chore chart, reward chart.
- **cards** — flashcards, gift tags, bookmarks, place cards, Avery labels.
- **puzzles** — sudoku, word search, mazes, bingo, seeded, with answer keys.
- **forms** — budget, packing list, meal plan, day planner.
- **worksheets** — times tables and maths drills, seeded, with answer keys.

## Next

The catalogue is complete, so what is left is depth rather than breadth.

1. **Per-printable landing pages.** One home page is doing all the SEO work for
   26 printables. Each generator wants static, indexable copy — "printable 2027
   calendar A4", "free graph paper 5 mm" — rather than a query string.
2. **A real PDF export.** The browser's print dialog is high quality and
   dependency-free, but it makes the user do two steps. A direct download needs
   a PDF writer with font embedding; worth the weight only once traffic
   justifies it.
3. **More holiday countries**, and a way to express lunar-calendar festivals
   without shipping a table that goes stale.
4. **Saved designs across devices**, which is the first thing that would need
   accounts — and therefore the first thing worth charging for.

## The pattern that worked

Every batch went the same way: build the shared piece the roadmap identified,
then the printables it unlocks fall out cheaply. The studio shell made five
generators possible; the imposition helper turned five small formats into one
generator; the table engine turned four form sheets into 130 lines of layout.

Doing it in the other order — printables first, extract later — would have left
five copies of the state-and-preview code to reconcile.
