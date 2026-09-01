# Layout engines

`docs/printables/calendar/layouts.js`. All seven share one annotation
pipeline — holidays, moon phases and user events are resolved once per date —
so every option behaves the same way in every layout.

## month
One month filling the sheet. The workhorse: big day cells, optional ruled or
dotted writing lines inside each day, a notes panel below or beside the grid,
mini previous/next months in the header, week-number column, holiday names and
event bullets in the cells.

## multi
2, 3, 4 or 6 months on a sheet. Column count is chosen from the sheet's aspect
unless overridden. Cells shrink gracefully: day names drop to single letters
and only one annotation shows per day.

## year
Twelve miniature months, 2/3/4/6 columns. Minis stretch to fill their grid
cell so the sheet is evenly weighted rather than top-heavy, and holidays
appear as coloured day numbers. Optional holiday list at the foot.

## yeargrid
The whole year as one matrix — 31 day rows against 12 month columns, or
flipped so months run down the page. This is the layout wall planners use and
the reference site does not have. Non-existent dates (31 February) are hatched.
Holiday names can be printed inside the cells on large paper.

## agenda
One line per day, vertically, single or two-up. Reads like a bullet-journal
monthly log: date, weekday, holiday, moon, then open space.

## week
A week per sheet as rows, columns or a grid, with either an open writing
surface (blank, ruled, dotted) or hourly slots over a configurable range.
An optional eighth block holds notes.

## photo
A framed image area over a compact month grid. With no image supplied it
prints an empty frame sized to glue a photo into.

## Adding a layout

1. Add an entry to `LAYOUTS` with a `label`, a `unit` (`months`, `years` or
   `weeks`) and a one-line `hint`.
2. Write `RENDER.<id>(state, dims, cursor, annotate)` returning a page element;
   start from `newPage()` and reuse `headerEl`, `monthGridEl`, `miniMonth`,
   `notesEl` and `footerEl`.
3. Add thumbnail art to `LAYOUT_ART` in `app.js`.
4. Add any layout-specific controls to `index.html` wrapped in
   `data-when="layout=<id>"`.
