# Cards & labels

Status: **live** — `docs/printables/cards/`, geometry in
`docs/assets/js/core/impose.js`

Flashcards, gift tags, bookmarks, tent place cards and address labels. All the
same job: put N small pieces on a sheet, mark where to cut, and — for
flashcards — make the reverse side land on the back of the right piece.

## The duplex problem

This is the part free flashcard sites get wrong, and the reason imposition is
its own module.

When a sheet is flipped on its **long edge**, it spins about its vertical axis:
the physical left-hand column becomes the right-hand one. So the back of the
card printed top-left must be printed **top-right** on the second sheet. A
**short-edge** flip spins about the horizontal axis instead, reversing rows.

There are two ways to express that, and they are equivalent only when the grid
is symmetric about the sheet centre:

1. mirror the slot *positions* and keep the card order;
2. keep the slot positions and reorder the *cards*.

We use (2). Die-cut label stock has asymmetric margins, so moving the slots
would put ink off the labels. Keeping the same grid on both sides and changing
only which card goes where is correct in every case.

Getting this wrong is silent — the sheet looks fine and only fails after
printing — so `AP.impose.backOrder` is asserted directly: for each back slot,
the position it lands on after the physical flip must equal the front position
of the card it holds. Checked across six paper/orientation/grid combinations
for both flip directions.

An early draft applied both mechanisms at once. They cancel, and the assertion
caught it.

## Label stock

Exact die-cut geometry for Avery 5160/8160, 5161, 5162, 5163, 5164 and A4
L7160, L7163, L7651. Selecting stock fixes the sheet size, piece size, count
and offsets.

Printers disagree about where the page starts, so there is an **X/Y nudge** in
0.25 mm steps that shifts the whole block. Print one sheet, measure the drift,
nudge. That control matters more than any template's nominal accuracy.

## Options

Content is one line per piece; `front | back` splits the faces and `\` starts a
new line within a face, so an address is a single input line. `#` comments out
a line. "Repeat to fill" tiles a short list across every slot — the usual case
for return-address labels.

Beyond that: custom or named finished sizes, gaps, sheet margin, crop ticks or
full cut lines with adjustable length and weight, piece outlines with a corner
radius, fold lines across or down, tent mode, punch-hole marks, alignment,
automatic type shrinking for long entries with a manual scale on top, six
themes, and a corner slug naming the sheet and side.

## Known limits

- Type shrinking is a length heuristic, not measurement. It stops a definition
  overflowing a card; it does not guarantee a perfect fit at every size.
- Bleed is not supported. Pieces are trimmed to their finished size, which is
  right for home printing and wrong for commercial print.
