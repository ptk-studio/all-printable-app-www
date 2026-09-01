# Roadmap

Ordered by how often people search for the thing and how badly the free
alternatives handle it. Registry ids match `public/assets/js/registry.js`.

## Next

1. **graph-paper** — square grid in mm or inches, any line weight and colour,
   optional heavier every-nth line, margin box. Trivial to build on the
   platform, and the existing sites all get the scale wrong when printing.
2. **lined-paper** — wide / college / narrow rule, margin line, name-and-date
   header, handwriting variant with dashed midlines.
3. **dot-grid** — bullet-journal dots at true 5 mm spacing, sized for A5 and
   planner inserts. The differentiator is sizes other than Letter.
4. **habit-tracker** — a month of circles, habits down the side. Shares the
   calendar's month grid and holiday engine.

## After that

5. **weekly-planner** — currently the calendar's week layout. Worth splitting
   into its own generator once daily/undated variants are wanted.
6. **chore-chart** — names × days, sticker-sized squares.
7. **flashcards** — double-sided with accurate cut lines and back-side mirroring
   so duplex printing lines up. The hard part is the duplex geometry, which is
   exactly why the free options are bad.
8. **times-tables** — drill sheets with a separate answer key page.
9. **sudoku**, **word-search**, **maze**, **bingo** — generated puzzles with
   solution pages. Each needs a generator plus a difficulty model.
10. **budget**, **packing-list**, **meal-planner** — form-shaped sheets; mostly
    a table engine plus good typography.
11. **gift-tags**, **bookmarks**, **place-cards**, **labels** — small formats
    with trim and fold marks; needs a shared imposition helper.

## Platform work worth doing first

- **A table/form engine.** Half the roadmap is "rows and columns with headings
  and writing space". Building it once turns items 6, 10 and 11 into
  configuration.
- **An imposition helper.** N-up placement with trim marks, bleed and duplex
  mirroring, shared by flashcards, tags, bookmarks and place cards.
- **A real PDF export.** Today the browser's print dialog does the conversion,
  which is high quality and dependency-free but makes the user do two steps.
  A direct download would need a PDF writer with font embedding — worth it only
  once traffic justifies the weight.
- **Per-printable SEO pages.** Each generator should have static, indexable
  landing copy (e.g. "printable 2027 calendar A4") rather than relying on one
  home page.
