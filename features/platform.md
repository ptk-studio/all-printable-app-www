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

## The studio shell

`assets/js/core/studio.js` owns everything a generator has in common: state,
control binding, the page preview, zoom and paging, printing, standalone HTML
export, shareable links and saved setups. A printable supplies a `render`, a
`pageSize`, a `pageRule`, its defaults and its presets — nothing else.

Controls are declared in markup, not wired in code:

| Attribute | Effect |
|---|---|
| `data-bind="a.b"` | scalar value at that path |
| `data-list="a.b:5"` | checkbox toggling membership of an array |
| `data-swatch="a.b:#fff"` | button that sets a value, with `aria-pressed` |
| `data-preset="0"` | applies `presets[0]` |
| `data-when="a.b=x"` | show only while it matches (`!=` also works) |
| `data-out="a.b"` | read-out, formatted by the generator's `outputs` map |

`?preset=<slug>` on the URL applies a named preset, which is how the catalogue
deep-links to "College ruled" or "Chore chart".

## Drawing to scale

Sheets built from HTML boxes (calendar, tracker) size everything in `em` off a
page font-size in millimetres. Sheets that are pure geometry (paper) use an SVG
whose viewBox maps **one user unit to one millimetre**.

Inside such an SVG, a CSS length is converted to px and *then* read as user
units. `stroke-width: 0.2mm` therefore draws 0.756 mm — nearly four times too
thick. Stroke widths and dash arrays in that context must be unitless numbers.
This is the single easiest way to ship a graph paper generator that is wrong.

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
