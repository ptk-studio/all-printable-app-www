# All Printable — app

Static, dependency-free printable generators. Everything renders in the
browser and prints at true paper size.

**This repo publishes to `app.all-printable.com`.** It holds the whole
catalogue: the index at `/` listing all 26 printables, the seven makers, the
six category pages, the 26 landing pages, and `/pro/`. Its sibling
`all-printable-www` publishes the marketing home page at `all-printable.com`,
and redirects the old URLs here.

The split exists so a dynamic version can grow under `app.` without disturbing
the static site — the two are separate deployments, and this one is free to
stop being buildless.

Every generated absolute URL comes from one constant, `tools/site.mjs`. Change
it and rerun the two generators and the canonicals, `og:url`, JSON-LD and
sitemap on all 33 generated pages follow. The seven makers and `/pro/` are
hand-maintained and do not: `tools/check-site-urls.mjs` is what catches them
falling behind. The credit printed on each sheet is *not* a URL and does not
follow either: it is the brand `all-printable.com` whatever host serves the
page.

> This repo was copied from `all-printable-www` with its full history, so
> commits before the split describe the combined site.

```
docs/        the site — open docs/index.html, or serve the folder
features/    product specs: what each printable does and why
functions/   Stripe checkout and webhook for Pro (deployed and live)
tools/       maintenance scripts (category and landing-page generation); output is committed
```

The site folder is named `docs/` because GitHub Pages can serve a project
straight from `main` → `/docs` with no workflow or build step.

## Run it

Any static server, or open the files directly:

```sh
cd docs && python3 -m http.server 8777
# → http://localhost:8777/
```

There is no build step, no package manager and no dependencies. `docs/` can
be deployed as-is to any static host.

## What's here

- **Calendar maker** (`docs/printables/calendar/`) — seven layouts, 18 paper
  sizes, holidays for 42 countries computed for any year, moon phases, custom
  events, 25 languages. See `features/calendar/README.md`.
- **Paper & grids** (`docs/printables/paper/`) — graph, dot grid, ruled,
  isometric, hexagon, music manuscript and handwriting sheets, drawn as vectors
  at measured millimetre scale. See `features/paper/README.md`.
- **Habit tracker** (`docs/printables/tracker/`) — habit trackers and chore
  charts: month, weeks, or a numbered challenge. See `features/tracker/README.md`.
- **Cards & labels** (`docs/printables/cards/`) — flashcards with correct
  duplex alignment, gift tags, bookmarks, tent place cards and Avery-matched
  address labels. See `features/cards/README.md`.
- **Puzzles** (`docs/printables/puzzles/`) — sudoku with a guaranteed unique
  solution, word searches, mazes and bingo, all seeded so a link reprints the
  same puzzles. See `features/puzzles/README.md`.
- **Forms & planners** (`docs/printables/forms/`) — budget sheets, packing
  lists, meal plans and day planners, on the shared table engine. See
  `features/forms/README.md`.
- **Maths worksheets** (`docs/printables/worksheets/`) — times tables and drill
  sheets with answer keys, plus the multiplication grid. See
  `features/worksheets/README.md`.
- **Catalogue** (`docs/index.html`) — driven by
  `docs/assets/js/registry.js`; add an entry and a card appears.

All seven run on the shared studio shell in `docs/assets/js/core/studio.js`,
which owns state, controls, preview, printing and export. Sheet geometry for
the small formats lives in `docs/assets/js/core/impose.js`, and rows-and-columns
sheets are built from `docs/assets/js/core/table.js`.

## Landing pages

Each printable has its own indexable page at `/<slug>/`, generated from the
registry and per-sheet copy:

```sh
cd docs && python3 -m http.server 8777 &
node tools/build-previews.mjs     # photographs a real sheet per printable
node tools/build-categories.mjs  # the six category pages
node tools/build-landing.mjs     # landing pages, and the sitemap
```

Previews come from the generators themselves via a `?preview=1` mode, so the
pictures cannot drift from what the site makes. The output is committed — the
site stays buildless to serve. See `features/landing.md`.

## Checking the hand-maintained pages

The generators cover 33 pages. The seven makers under `docs/printables/` and
`docs/pro/` are written by hand, so their canonicals are the only absolute URLs
on the site that do **not** follow `tools/site.mjs`. Change `SITE` and rerunning
the generators would move the sitemap to the new origin while these eight pages
silently kept the old one. This catches that:

```sh
node tools/check-site-urls.mjs   # run from the repo root
```

It exits non-zero and lists every offending file and URL when a page carries an
`all-printable.com` URL whose origin is not `SITE`'s; other hosts are left
alone. Run it whenever `SITE` changes, next to the generators. Nothing runs it
automatically — there is no CI here.

## Sheet credit

Every printed sheet carries a small `all-printable.com` in the corner, stamped
in one place (`core/brand.js`, applied from `core/studio.js`). Removing it is
meant to become a paid feature; the seam is a single predicate. See
`features/branding.md`.

## Analytics

Firebase / GA4, opt-in only: nothing loads and no cookie is set until a visitor
agrees, and only interface choices are recorded — never the content of any
field. See `features/analytics.md`.

## Printing

Choose **Print / Save PDF**, then in the browser dialog set scale to **100%**
and margins to **None**. The sheet already carries its exact media size, so the
browser must not rescale it.

## Adding a printable

See `features/README.md` and `features/platform.md`.
