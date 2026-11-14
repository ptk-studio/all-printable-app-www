# all-printable — journal

What has been done to this product and what was learned. **Newest first.** Append at the top;
never rewrite an entry that has been pushed.

One entry per session that changed something. Trim entries older than about 30 days — the
record that has to survive is the code, the issues and [`METRICS.md`](METRICS.md), not this.

---

## 2026-10-16 · SEO audit #53 — the makers were dead ends in both directions

**The finding that was worth the most was the one the audit got wrong.** It reported the seven
`/printables/*` pages as having *zero internal links*. They have about 125 — every one written
`printables/paper/index.html?preset=graph-5-mm`, while the page's own canonical says
`/printables/paper/`. So the count was right about the canonical URLs and wrong about the
pages, and the real fault was a URL *shape*, not a missing link. The home page had it worse:
126 links, all `../index.html`, against a canonical of `/`. **Every URL in the sitemap had an
inbound-link count of zero**, including the one with priority 1.0.

It was survivable — `rel=canonical` consolidates the signals — which is exactly why it had
survived. That is a thing to rely on, not a thing to arrange. Fixed at the source: registry
hrefs, both generator templates, the eight hand-written pages. All 41 sitemap URLs now receive
internal links; nothing on the site links to an `index.html` URL any more.

**The duplicate-H1 pairs were category pages against makers, not landing pages against
makers.** `/paper-and-grids/` and `/printables/paper/` both said "Paper &amp; grids" in their
one H1. The owner's call was to differentiate rather than demote, so nothing gave up a title
keyword: category H1s became "Printable paper &amp; grids — 7 free generators", maker H1s
became "Paper &amp; grid maker". No duplicate H1 anywhere on the site now.

**`DESC_MAX` went 200 → 160** and 23 descriptions were rewritten to fit — rewritten, not cut,
which is the rule #31 set. The 200 was argued for in `site.mjs` and the argument was sound as
far as it went: 200 keeps the string a complete sentence, Google truncates nearer 155–160. The
conclusion was still wrong. 23 of 41 sat between 161 and 199 — complete sentences no search
result ever showed the end of.

**Learned: a limit chosen for the writer can quietly stop being a limit for the reader.** The
comment explaining 200 was good enough that nobody re-asked the question for four issues. The
reasoning stays in `site.mjs` with the new number, so the next reader meets the argument and
its outcome together rather than only the argument.

**The FAQ answers were already on the landing pages with nothing saying they were questions.**
They are `FAQPage` structured data now, and expanded from one-or-two to three-or-four each —
93 questions over 26 pages, every one also present in the visible HTML, which Google requires
and which falls out of both being rendered from the same `landing-copy.js`. The bar on those
answers went up with the markup: a wrong one is now wrong in a search result.

**Two checks added, and #50 closed on the way past.** `check-site-urls.mjs` now fails on an
`index.html` link in a hand-written page, and on a maker that does not link out to a sheet the
registry says it makes — the second derives its expectation from the registry, so a printable
added to the catalogue is covered the day it is added. Both were tested by breaking them.
The tool had been running four checks while its header and the README said three (#50); it
runs six and both say six.

**Left for the owner:** `/calendar/` and `/printables/calendar/` are the one near-pair left
("Printable calendar" against "Calendar maker") — distinct, but closer than the other six.
And the sibling repo `all-printable-www` needs the same change, which is a second repo and a
second PR: its copy of `docs/assets/js/registry.js` still carries all 26 `index.html` hrefs,
and **four links in its marketing `docs/index.html` point at
`https://app.all-printable.com/printables/{calendar,paper}/index.html`** (lines 35, 48, 49,
135). Those four are the only inbound links this site has from anywhere, and they land on the
non-canonical URL. Its redirect stubs are already correct — they canonical and refresh to the
clean `/printables/<maker>/` form — so it is the home page and the registry copy, not the
stubs.

---

## 2026-09-04 · framework session — this directory was created

`_mochi-agent/` now carries this product's own record: what it is, how it deploys, how a change
is verified, and what it is trying to move. `documents/METRICS.md` moved here unchanged.

**Learned:** the split that decides what belongs here is one question — *would this still be
true if a different set of agents worked this product?* The deploy model and the metric targets
survive any particular fleet; who is assigned and what is claimed today do not, and those stay
in the fleet's own repo.

**Entries before today are not here.** This product's history up to 2026-09-04 is in the
fleet's repo at `data/teams/webapp-team1/projects/all-printable/JOURNAL.md`, and was left there rather than
copied — moving it would have rewritten a record that is signed and dated where it stands.
This journal starts now.
