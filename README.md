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
docs/        the site — serve the folder (see Run it)
features/    product specs: what each printable does and why
functions/   Stripe checkout and webhook for Pro (deployed and live)
tools/       maintenance scripts (category and landing-page generation); output is committed
```

The site folder is named `docs/` because GitHub Pages can serve a project
straight from `main` → `/docs` with no workflow or build step.

## Run it

Any static server:

```sh
cd docs && python3 -m http.server 8777
# → http://localhost:8777/
```

There is no build step, no package manager and no dependencies. `docs/` can
be deployed as-is to any static host.

**It has to be served, not opened from disk.** Every internal link is now the
directory form the page's own canonical uses — `../calendar/`, `./`, `../../` —
rather than `../calendar/index.html`, because until #53 not one link on the
site pointed at a URL the sitemap actually lists. A `file://` URL will not
resolve a directory to its `index.html`, so opening the files directly gets you
one page and no navigation. The generated pages had already been part-way there
for much longer; this finished the job in the other direction.

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

**The three or four questions on each landing page are also `FAQPage`
structured data.** They had been in the HTML since the pages existed with
nothing telling a search engine they were questions, which is the long-tail
half of these pages given away for nothing (#53). The block is emitted after
the `WebApplication` one, not merged into an `@graph`, because
`check-site-urls.mjs` reads the *first* `ld+json` block on a page for its
description — it only inspects the hand-written eight, but the order is worth
keeping the same across the site.

Structured data has to match what the page shows, so the questions are written
once in `tools/landing-copy.js` and rendered into both. **Every answer there is
checkable against the maker it describes.** A wrong answer is now a wrong answer
in a search result, which is a different standard from a wrong answer in body
copy.

**The title template carries no brand suffix.** `· All Printable` cost 16 of the
~60 characters a result shows; `og:site_name` carries the brand for the share
cards, and nobody is searching it.

## Checking the hand-maintained pages

The generators cover 33 pages and `docs/sitemap.xml`. The seven makers under
`docs/printables/`, `docs/pro/` and `docs/robots.txt` are written by hand, so
their URLs are the only absolute ones on the site that do **not** follow
`tools/site.mjs`. Change `SITE` and rerunning the generators would move the
sitemap to the new origin while these kept the old one — and `robots.txt` would
go on pointing every crawler at a sitemap that is no longer there. This catches
that:

```sh
node tools/check-site-urls.mjs   # run from the repo root
```

It exits non-zero and lists every offending file and URL when a hand-maintained
file carries an `all-printable.com` URL whose origin is not `SITE`'s; other
hosts are left alone. `docs/404.html` is scanned too — it carries no absolute
URL today, and is in the list so it is covered the day it gains one.

It also fails when a hand-written page under `docs/` is **missing from
`docs/sitemap.xml`**, which is a different fault and the one that actually bit
us: `/pro/` carried a perfectly correct canonical and was simply not in the
sitemap, from the day the page was created until 2026-09-03. Nothing outside
the site links to `/pro/`, so the sitemap was the only route a crawler had to
the one page that asks for money.

The reason is worth keeping in mind when you add a page. The categories and
landing pages in the sitemap are derived from JSON, so they cannot be
forgotten; the hand-written ones are typed into a list in
`tools/build-landing.mjs`, and a page added on its own is easy to type into
`docs/` and not into that list. **Run this after adding a hand-written page,
not only after changing `SITE`.**

Two more absences fail it, and both used to pass silently: **a hand-maintained
file that carries no URL of ours at all** (a dropped canonical stops the file
being compared, so every other check here walks past it), and **`docs/sitemap.xml`
itself being missing** (which means every page on the site is unlisted — the
worst case, and it used to produce no output at all). `docs/404.html` is exempt
from the first, because it genuinely carries none today.

**Six checks run and a clean run reports six.** Worth stating because the
number has been wrong twice. It was two for a while: the carries-no-URL check
had no success line at all, and the gap was easy to miss because the first line
looks like it covers the same ground. Then the description check arrived and
made it four while this paragraph and the tool's own header both went on saying
three — which is #50, and is fixed here along with the two checks #53 adds. The
count is the only thing you can hold the output against, so it belongs in both
places or neither.

The first line does not cover the second's ground, which is why the second has
one at all. *"46 URL(s) across 10 hand-maintained file(s)"* counts the files
**scanned**, so it reads exactly the same whether or not one of those ten
has silently lost its canonical — which is the failure the second check exists
to catch. Its own line therefore counts the files **required** to carry a URL of
ours, and names the exempt ones separately:

```
check-site-urls: 46 URL(s) across 10 hand-maintained file(s) agree with SITE (https://app.all-printable.com).
check-site-urls: each of the 9 hand-maintained file(s) required to carry a URL of ours does, and the 1 exempt file(s) — docs/404.html — are not asked to.
check-site-urls: all 8 hand-written page(s) appear in docs/sitemap.xml.
check-site-urls: each of the 8 hand-written page(s) states one description in all 4 places, within 160 characters — the longest is 146 on docs/pro/index.html, 14 to spare.
check-site-urls: no internal link in the 8 hand-written page(s) points at an index.html URL.
check-site-urls: all 26 landing page(s) are linked from the maker that makes them.
```

10 scanned, 9 required, 1 exempt — the difference between the first line and the
second is the assertion.

**Every fault is collected and printed before the script exits**, so one run
tells you everything that is wrong rather than the first thing it tripped over.
There is no exception: a `SITE` disagreement is collected like the rest and
printed first. What it does still suppress is the count of URLs that *agree* —
that number means nothing while an origin is wrong. The faults printed under it
do not consult `SITE` at all, so they are reported normally, and the run where
someone changed `SITE`, fixed the makers by hand and forgot to rerun the
generator now says both things at once.

**Nothing is printed until the run knows its outcome**, and that decides which
stream it goes to. A clean run writes its success lines to **stdout**; a failing
run writes everything to **stderr** — the faults *and* the checks that passed —
and leaves stdout empty. The success lines used to go out as each check passed,
so a failing run had already announced its passes and `2>/dev/null` returned a
green line above an exit of `1`. In a terminal the two streams interleave and
the output was correct, which is exactly why it went unnoticed. A partial
reading can now be incomplete, but not wrong.

| Exit | Meaning |
|---|---|
| `0` | nothing wrong |
| `1` | one or more faults, all of them listed |
| `2` | no hand-maintained files found — you ran it from the wrong directory. Kept distinct from `1` on purpose: a missing sitemap in a tree that *does* have makers is a real fault, not a bad `cwd`. |

**It also guards the eight hand-written pages' own descriptions**, which is the
one thing on this site the generators cannot look after. `build-landing.mjs`
fails the build when a *generated* description passes `DESC_MAX`; the seven
makers and `/pro/` are typed by hand and had no such guard, which is the wrong
way round — a generated description cannot drift without somebody editing JSON,
and a hand-written one is edited by hand, one page at a time, by whoever is
doing something else. `docs/printables/calendar/` reached **232** characters
that way and stayed there long enough to need two issues; once it was fixed the
next longest was **196**, four characters clear. All seven makers were rewritten
again for #53 when the limit came down to 160; the longest description on the
site is now **156**.

Each of those pages states its description **four times** — `meta`,
`og:description`, `twitter:description` and the JSON-LD — so the check reports
three separable things, and the second matters more than the first:

- a copy that is **missing** (or a JSON-LD block that does not parse),
- the four copies **disagreeing**, which makes a page correct in a search result
  and wrong in a share card with nothing anywhere noticing,
- a description **over `DESC_MAX`**.

A clean run says which page is closest to the limit, so the headroom is visible
before it is spent rather than after:

```
check-site-urls: each of the 8 hand-written page(s) states one description in all 4 places, within 160 characters — the longest is 146 on docs/pro/index.html, 14 to spare.
```

**`DESC_MAX` lives in `tools/site.mjs`**, next to `SITE` and for the same
reason: this check and `build-landing.mjs` both enforce it, and two copies of a
number that must agree eventually will not.

It is **160**, and was **200** until #53. The old reasoning was that 200 keeps
the string a complete sentence while Google truncates nearer 155–160 — sound as
far as it went, and still the wrong conclusion: 23 of the 41 descriptions sat
between 161 and 199, which is to say they were complete sentences no search
result ever showed the end of. The limit is now the visible one, and all 23 were
rewritten to fit it rather than cut to it. Shorten the description; do not raise
the constant.

**It also guards the two halves of the orphaned-maker fault**, which is what
#53 was mostly about. The seven makers carry the richest keyword titles on the
site and were dead ends in both directions.

*Nothing pointed at them.* Every internal link to a maker was written
`printables/paper/index.html?preset=graph-5-mm` while the page's canonical said
`/printables/paper/` — so every URL in the sitemap had an inbound-link count of
zero, including `/` itself, linked 126 times as `../index.html`. The pages were
reachable and `rel=canonical` was consolidating the signals, which is a thing to
rely on rather than a thing to arrange. The generated pages take those hrefs
from one template each and cannot drift back alone; these eight are typed by
hand, and `index.html` is what a person types when copying a link out of the
address bar. So an internal `index.html` link in a hand-written page is a fault.

*Nothing pointed out of them.* The only way out of a maker was the brand link
and an ad-hoc set of sibling-maker links that three of the seven did not have.
Each maker's sidebar now ends in a `.maker-links` block naming the landing page
of every sheet that maker makes, plus its categories. Which sheets those are is
derived — a registry entry's `href` names its maker — so the check knows the
answer without a second list, a printable added to the registry is covered the
moment it is added, and a maker that stops naming one of its own sheets fails.
That derivation is the point: the block is typed, so something has to compare it
against the thing it was typed from.

**`docs/CNAME` is not covered and still has to change with the origin.** It
holds a bare host (`app.all-printable.com`), not a URL, so there is nothing for
this check to compare — but the site is served from whatever it says.

Run the check whenever `SITE` changes, next to the generators. Nothing runs it
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
