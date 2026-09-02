# Form sheets

Status: **live** — `docs/printables/forms/`, tables in
`docs/assets/js/core/table.js`

Budget, packing list, meal plan and day planner. All four are compositions of
the shared table primitives, which is the point: the next form-shaped sheet is
a layout function, not a rendering engine.

## The table engine

The roadmap said to build this before the sheets that need it, and that was
right — the four layouts together are about 130 lines.

A block is declared rather than drawn:

```js
AP.table.block({
  title: 'Fixed costs',
  columns: [{ label: 'Item', flex: 3 },
            { label: 'Planned', flex: 1, kind: 'num' }],
  rows: 8,
  total: { label: 'Total', from: 1 }
}, state)
```

Alongside `block` there is `lines` (ruled writing space), `checklist` (ticks
down a column, optionally in several columns) and `row` (blocks side by side).
Cell kinds — `text`, `num`, `check`, `dot`, `rule` — decide what is printed in
an empty cell; layout comes from the column's `flex`. A `weight` lets one block
claim more of the sheet than its siblings, which is how the meal planner's week
grid stays dominant over the panels beneath it.

## Input

Groups are one line each: `Heading: item, item, item`. A heading on its own
gives an empty block. It is a single textarea for the whole sheet rather than a
row-builder UI, which is faster to fill in and round-trips through the URL.

## The four sheets

**Budget** — groups two or three across, planned/actual/difference columns,
a total row with a heavier rule per group. A twelve-sheet run steps forward one
month per sheet.

**Packing list** — categories as checklists with blank lines to add to. Tell it
how many nights and each category gets a quantity hint: clothing counts as
nights + 1, toiletries suggest travel sizes. A nudge, not a rule.

**Meal plan** — the week as the sheet, with a shopping checklist and notes
sharing what is left. Meal slots are yours: add a snack row, drop breakfast.

**Day planner** — hour rows against priorities, to-dos and notes, with the
split between the two adjustable. Half-hour rows and a 24-hour clock optional.

## Detail worth keeping

A notes block given no row count rules itself to fill the space instead of
stretching three lines across a whole column. The first version stretched, and
a day planner's notes area looked like three enormous bands.
