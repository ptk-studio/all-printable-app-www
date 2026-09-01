# Habit tracker & chore chart

Status: **live** — `docs/printables/tracker/`

Both are the same sheet — a list down the side, days across the top, a box at
every crossing — so one engine serves both, with presets for each.

## Layouts

- **Month** — every day of a month across the page. One sheet per month, up to
  24 months in a run.
- **Weeks** — seven columns, one block per week, several weeks stacked. This is
  the shape that works on a fridge door.
- **Challenge** — a numbered run of boxes for a 30-day or 100-day streak,
  wrapped over as many rows as it needs.

## Options

Your list (up to 40 rows) and the heading above it. Box style: circle, square,
rounded, diamond, star, or an empty cell to write in. Row height fills the
sheet or stays compact. A target/total column, weekday letters under the dates,
alternate-row shading, weekend shading with your own choice of weekend days,
and note lines at the foot.

Plus the usual sheet controls: paper size and orientation, margin, text scale,
six themes, accent and rule colours, ink saver, 25 locales, title, subtitle,
name/date blanks and footer.

## Detail worth keeping

The tick marks size from `cqmin` — a percentage of the **shorter** side of
their cell. Sizing them off the row height alone turns every circle into a tall
ellipse the moment a month's 31 narrow columns meet a five-row list. The `em`
fallback keeps them sane on browsers without container query units.

The header row is `auto` height while data rows share what is left, so the
column headings stay compact instead of being stretched to match a data row.
