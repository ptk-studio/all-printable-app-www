# Paper & grids

Status: **live** — `docs/printables/paper/`

Seven kinds of ruled and gridded paper from one engine: graph, dot grid,
ruled, isometric, hexagon, music manuscript, handwriting practice.

## Why it exists

Every free graph-paper site has the same defect: the PDF prints at whatever
scale the browser picks, so the 5 mm squares come out at 4.8 mm and the sheet
is useless for anything measured. This one is drawn as vectors in a coordinate
system where **one user unit is one millimetre**, on a page carrying its exact
media size.

Two things had to be right, and both are verified by measurement rather than
assumed (see *Verification* below):

- **Pitch.** The spacing you ask for is the spacing on paper.
- **Weight.** A 0.3 mm rule is 0.3 mm, not the ~1.1 mm you get if a CSS length
  is fed to `stroke-width` inside a viewBox.

## Types and their options

| Type | What it draws | Its own options |
|---|---|---|
| Graph | Square grid | Heavier line every 2–10 squares |
| Dot grid | Dots at each intersection | Dot size, larger dot every N |
| Ruled | Horizontal lines | Wide / college / narrow / custom rule, margin line (left or both) and its position, header band |
| Isometric | 30°, 150° and vertical families | Vertical lines on or off |
| Hexagon | Hex lattice | Pointy or flat top |
| Manuscript | Music staves | Systems, line gap, staff / tab / alternating, bar lines |
| Handwriting | Three- or four-line guides | Dashed or dotted midline, descender guide, slant guides, words to trace |

Shared: spacing in millimetres or inches, line and accent colour, line weight
and heavy-line weight, border, ink saver, six type themes, paper size and
orientation, margin, sheet count, title, name/date blanks, footer, page numbers.

## Geometry

- Whole cells are centred in the drawing area, so the two edge margins match
  rather than leaving a ragged partial column on one side.
- The drawing is inset by half the heaviest stroke, so a line on the boundary
  prints at full width instead of losing half of itself to the edge.
- One clip path at the sheet boundary trims the isometric and hex families,
  which are deliberately generated past the edge.

## Verification

`--force-device-scale-factor=4` render of a 10 mm graph sheet on A4, measured
from the pixels:

- mean pitch 37.63 px against an expected 37.795 px at 96 dpi — **−0.05 %**,
  which is pixel quantisation, not scale error;
- stroke ink coverage 4.537 device px at 15.118 px/mm — **0.300 mm** for a
  0.300 mm request.

## Known limits

- The trace text on handwriting sheets is laid out from an estimated advance
  width, deliberately conservative: it stops short of the right edge rather
  than risking a word cut in half.
- Hex cells share edges, so those strokes are drawn twice. They overlap
  exactly, so it is invisible at any sane line weight.
