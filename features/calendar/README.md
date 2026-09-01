# Calendar maker

Status: **live** — `docs/printables/calendar/`

The reference point is print-a-calendar.com's "make a calendar" page. It offers
five layouts, two paper sizes, and a handful of toggles. This does more, and
the extra is deliberately the part people actually need a second tab for:
holidays, their own dates, and a sheet that fits their planner.

## What it does that the reference does not

| | Reference | Here |
|---|---|---|
| Layouts | Month, 2/4/6-up, year | Those, plus year grid, agenda list, week planner, photo |
| Paper | Letter + a poster size | 18 sizes: US, ISO A2–A6, B5, squares, posters, planner inserts |
| Holidays | — | 30 countries, computed from rules for any year |
| Own events | — | One-off, annual and monthly repeats; CSV import |
| Language | English | 25 locales via `Intl` |
| Extras | Weekend shading, grid lines | Moon phases, ISO/US week numbers, day-of-year, equinoxes, mini months, ink saver |
| Recall | Rebuild from scratch | Whole design lives in the URL; named saves in the sidebar |

## Options

**Format** — layout; months per page (2/3/4/6); year-page columns; year-grid
direction; agenda single/two-up; week arrangement (rows, columns, grid),
hourly slots with a configurable range, notes block, writing surface; photo
height and image.

**Dates** — start month and year, how many pages, first day of week
(Sun/Mon/Sat), which days count as the weekend (any subset — Fri/Sat works),
language.

**Paper** — size, orientation, margin (0–30 mm), overall text scale.

**Style** — six themes (classic serif, modern sans, minimal, bold, editorial,
monospace), accent colour with a swatch row, grid-line colour, rules
(all/outer/none), weekend treatment (plain/shaded/coloured) with its own tint,
day-number position and size, day-name length and alignment, title alignment,
coloured month name, ink saver.

**Day contents** — week numbers (ISO or US), a second small number (day of
year, days remaining, week), how adjacent-month days are treated
(show/faded/blank), forced six-week rows so every month is the same height,
today's date circled, mini previous/next months, moon phases, ruled or dotted
lines inside each day, and a notes area (ruled, dotted, squared or blank;
below or beside; sized; with its own heading).

**Holidays** — any combination of countries, shown as names, a dot, both or
off; optional "observed" substitute days; common observances; Chinese New
Year; equinoxes and solstices; and an optional holiday list printed at the
foot of the sheet. See `holidays.md`.

**Your events** — a plain textarea, one per line:

```
2026-03-14 Flight to Osaka     exact date
06-21 Mum's birthday           every year
*-01 Rent due                  that day of every month
```

CSV and plain text files can be imported; a leading `date,title` pair is
normalised.

## Output

- **Print / Save PDF** — the primary path. Switches to all-pages view, prints
  at true media size. Vector text, no rasterisation.
- **Download HTML** — a self-contained file with the styles inlined, for
  printing later or handing to someone else.
- **Copy link** — the entire design encoded in the URL.

## Presets

Ten one-click starting points: family wall, desk month, year planner, year at
a glance, weekly planner, hourly week, six months, minimal poster, bullet
journal, photo calendar. A preset keeps the user's dates, events and wording
and replaces only the design.

## Known limits

- Moon phases and equinoxes are computed in UTC. Near midnight a date can
  differ by one day at extreme longitudes.
- Lunar-calendar festivals are not computed; see `holidays.md`.
- Very large event lists can exceed a browser's URL length; the design still
  saves locally, only the shareable link is affected.
