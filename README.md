# All Printable

Static, dependency-free printable generators. Everything renders in the
browser and prints at true paper size.

```
docs/        the site — open docs/index.html, or serve the folder
features/    product specs: what each printable does and why
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
  sizes, holidays for 30 countries computed for any year, moon phases, custom
  events, 25 languages. See `features/calendar/README.md`.
- **Paper & grids** (`docs/printables/paper/`) — graph, dot grid, ruled,
  isometric, hexagon, music manuscript and handwriting sheets, drawn as vectors
  at measured millimetre scale. See `features/paper/README.md`.
- **Habit tracker** (`docs/printables/tracker/`) — habit trackers and chore
  charts: month, weeks, or a numbered challenge. See `features/tracker/README.md`.
- **Catalogue** (`docs/index.html`) — driven by
  `docs/assets/js/registry.js`; add an entry and a card appears.

All three run on the shared studio shell in `docs/assets/js/core/studio.js`,
which owns state, controls, preview, printing and export.

## Printing

Choose **Print / Save PDF**, then in the browser dialog set scale to **100%**
and margins to **None**. The sheet already carries its exact media size, so the
browser must not rescale it.

## Adding a printable

See `features/README.md` and `features/platform.md`.
