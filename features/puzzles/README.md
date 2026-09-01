# Puzzles

Status: **live** — `docs/printables/puzzles/`

Sudoku, word search, mazes and bingo, with answer keys.

## Everything comes from a seed

The site round-trips its settings through the URL. For a generator that deals
random content, that has two consequences, and both are requirements rather
than nice-to-haves:

- a shared link must reproduce the **same** puzzles, or the answer key someone
  printed no longer matches;
- nudging an unrelated slider must not silently deal a new grid.

So a seed lives in state and every puzzle derives from `seed × index`. "Deal new
puzzles" is simply a new seed. A `mulberry32` PRNG gives identical output in
every browser, which a `Math.random` fallback would not.

## Sudoku

A full grid is built by shuffled backtracking, then clues are dug out while a
solver confirms the puzzle still has exactly one solution. The solver picks the
most constrained cell first and stops counting at two solutions, which is what
makes a per-dig uniqueness check affordable — 25 puzzles in about 60 ms.

Digging happens in two passes. The first removes **rotationally symmetric
pairs**, the published convention. That bottoms out around 28 clues, because a
pair only comes out if the grid stays unique without *both* cells — which made
"expert" and "evil" produce identical puzzles in the first version. A second
pass removes single cells to reach the harder targets.

Measured clue counts: easy 43, medium 36, hard 30, expert 27, evil 25. Five
levels that are actually different.

## Word search

Words are placed in random positions and directions, retrying up to 240 times
each, then the gaps are filled with random letters. Diagonals and backwards are
optional, so an easy sheet for a small child is two directions and a 10 × 10
grid. The readout says how many words fitted, because a long word in a small
grid simply cannot be placed and silently dropping it would be worse.

The answer key highlights the placed cells; each placed word is verified to
read back correctly from the grid.

## Maze

Recursive backtracker, iterative so a 60 × 80 grid cannot blow the stack.
Entrance top-left, exit bottom-right, solution found by breadth-first search
and drawn as a single path.

The **loops** control braids the maze by opening dead ends. That makes a maze
*harder*, not easier: dead ends are what let you rule a branch out.

## Bingo

Columns draw from their own range the way B-I-N-G-O does, so a 5 × 5 card on
1–75 puts 1–15 under B and 61–75 under O. Optional free centre square and
header letters. Word mode fills squares from your own list instead, and falls
back to numbers when there are fewer words than squares.

## Layout note

Square grids sit inside a size container and are sized `100cqmin`, so they are
exactly the smaller of the width and height they are given. The first version
let the grid size itself from its content, which collapsed the cells into an
unreadable smudge.
