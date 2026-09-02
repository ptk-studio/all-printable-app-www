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
- **calendar** — seven layouts, 42 countries of holidays, moon phases.
- **paper** — graph, dot, ruled, isometric, hex, manuscript, handwriting,
  drawn to measured millimetre scale.
- **tracker** — habit tracker, chore chart, reward chart.
- **cards** — flashcards, gift tags, bookmarks, place cards, Avery labels.
- **puzzles** — sudoku, word search, mazes, bingo, seeded, with answer keys.
- **forms** — budget, packing list, meal plan, day planner.
- **worksheets** — times tables and maths drills, seeded, with answer keys.
- **Landing pages** — one indexable page per printable at its own URL, generated
  from the registry by `tools/build-landing.mjs`, with copy written per sheet
  rather than templated, and a picture of the sheet photographed from the real
  generator by `tools/build-previews.mjs`. Open Graph metadata throughout.
- **Twelve more holiday countries** — Bulgaria, Chile, Croatia, Estonia,
  Hungary, Iceland, Latvia, Lithuania, Luxembourg, Romania, Slovakia and
  Slovenia, taking the total to 42.

## Next

The catalogue is complete, so what is left is depth rather than breadth.

1. **A real PDF export.** The browser's print dialog is high quality and
   dependency-free, but it makes the user do two steps. A direct download needs
   a PDF writer with font embedding; worth the weight only once traffic
   justifies it.
2. **Lunar-calendar festivals** — Diwali, Eid, Seollal. Still deliberately
   absent: they depend on sighting or on ephemeris tables that go stale, and a
   wrong date on a printed wall calendar is worse than no date. Chinese New
   Year is the one exception, offered from a bounded table, because it is
   unambiguous. Anything further needs a real source, not a guess.
3. **Checkout.** Accounts, entitlement and both Pro features are built and
   verified — see `accounts.md`. Signing in works, `pro` is read from Firestore,
   the sheet credit disappears when it is true, and the security rules refuse
   any attempt by a browser to set it. What is missing is the ability to *buy*
   it: Cloud Functions and the Stripe extension need the Blaze plan, which needs
   billing details from the account owner. Until then `docs/pro/` says the thing
   is not on sale rather than collecting interest in a product with no cart.

   Also waiting on the same unblock: scheduled Firestore backups.

## The pattern that worked

Every batch went the same way: build the shared piece the roadmap identified,
then the printables it unlocks fall out cheaply. The studio shell made five
generators possible; the imposition helper turned five small formats into one
generator; the table engine turned four form sheets into 130 lines of layout.

Doing it in the other order — printables first, extract later — would have left
five copies of the state-and-preview code to reconcile.
