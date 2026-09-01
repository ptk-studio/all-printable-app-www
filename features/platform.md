# Platform conventions

Shared rules that every printable generator follows. Breaking one of these is
what makes a free printable site feel cheap.

## The print contract

A printable page is a `<div class="page">` whose width and height are set in
millimetres, matched by an injected `@page { size: Wmm Hmm; margin: 0 }` rule.
That pair is the whole trick: Chrome, Safari and Firefox all honour it, and the
PDF comes out at exactly the requested media size (verified: A4 landscape
prints a 841.92 × 594.96 pt MediaBox, i.e. 297 × 210 mm).

Consequences:

- Page margins are drawn *inside* the sheet by `.page-inner`, never by the
  browser. The browser margin is always zero.
- Screen preview scales the page with `transform: scale()`; the print
  stylesheet resets the transform so printing is unscaled.
- `break-after: page` on every `.page` but the last.
- `print-color-adjust: exact` so weekend tints and highlights survive.
- The only instruction a user needs is: **scale 100%, margins none**.

## Units

Each `.page` gets `font-size: <base>mm`, where `base` is derived from the
short edge of the sheet. Everything inside is expressed in `em`. One layout
therefore renders correctly from an 81 × 120 mm pocket insert to a 24 × 36 in
poster with no per-size special-casing.

## Paper sizes

`assets/js/core/paper.js` is the single source of truth. Dimensions are stored
in millimetres, portrait, and flipped for landscape by `AP.pageSize()`. Four
groups: US, ISO, Planner (disc/ring inserts) and Special (squares, posters).

## State

A generator keeps one plain object. Rules:

- Controls bind by path with `data-bind="holiday.style"`; there is no
  per-control wiring code.
- Conditional sections use `data-when="layout=multi"` or `data-when="notes!=none"`.
- The state is base64url-encoded into `location.hash` on every change, mirrored
  to `localStorage` for the next visit, and named setups can be saved.
- Never put anything in state that cannot survive a round trip through JSON.

## Code style

- Plain classic scripts on a single `AP` namespace — no build step, no
  modules, so every page also works opened straight from disk.
- No dependencies. Dates use local-noon `Date` objects so daylight saving can
  never shift a calendar day.
- Locale strings come from `Intl`, never from a hardcoded month array.

## Design tokens

`assets/css/base.css` carries the screen design system (colours, controls,
panels, buttons) and adapts to `prefers-color-scheme`. Paper styling is
separate — `printables/<name>/print.css` — and is deliberately theme-neutral
so a sheet never inherits the app's dark mode.
