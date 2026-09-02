# Maths worksheets

Status: **live** — `docs/printables/worksheets/`

Drill sheets and times-table grids, with answer keys.

## Drills

Multiplication, addition, subtraction and division, alone or mixed, with
independent ranges for each operand. Laid out in a row (`7 × 8 = ___`) or as
column sums. Answer keys print as matching sheets at the end.

Two decisions that make the sheets usable rather than merely generated:

- **Division is built from the answer upwards.** Picking two numbers at random
  and dividing gives remainders nobody asked for, so a divisor and a quotient
  are chosen and multiplied to get the dividend. Every division is exact.
- **Subtraction stays in the whole numbers** unless negatives are asked for.
  A child meeting −3 by accident has a worse sheet, not a harder one.

Verified over 400 mixed problems: every stated answer is correct, no negative
subtractions when they are disabled, and no division remainders.

## Times-table grid

The classic square, any size to 20 × 20, with the diagonal squares shaded.
Blank mode leaves the body empty to fill in and prints a completed grid as the
answer key.

## Seeding

Same as the puzzles, and for the same reason: the answer key someone printed
has to keep matching the sheet, so a link must reproduce exactly the same
problems. `AP.rng` in `core/util.js` is now shared by both generators rather
than duplicated — the algorithm is identical, so existing seeds still produce
the puzzles they always did (checked: maze seed 99 still solves in 43 steps).
