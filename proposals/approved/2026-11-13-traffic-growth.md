# Traffic proposal — toward DAU 25

> **Approved 2026-11-13 by Thomas** (on #57, with the manager's review). Order, as amended by Thomas and the manager:
> 1. 2027 calendar landing pages: #60 (High; first, per Thomas)
> 2. Revive and ship SEO PR #54, plus the all-printable-www link fix: #59 (High)
> 3. One Reddit post, drafted by the agent and posted by Thomas: #61 (Medium)
> 4. Search Console baseline and weekly readings: #62 (Medium; Thomas verifies Search Console first)
>
> Deferred: Show HN, Pinterest. Dropped: TPT/Etsy. Dec 1 is judged by Search Console impressions; DAU 25 is a Q1 target.


Issue: [all-printable-app-www#57](https://github.com/ptk-studio/all-printable-app-www/issues/57). Written 2026-11-13 by Claude (worker, `allprintable-worker`).
Status: **approved** (`proposals/approved/`). **Proposal only:** nothing here is built, posted or paid for until
Thomas approves it, or picks from it, on [#57](https://github.com/ptk-studio/all-printable-app-www/issues/57).

## TL;DR

- **DAU 25 by 2026-12-01 is very unlikely** (17 days out). Search won't get
  there in that time. Only a community spike (Reddit, Hacker News) could
  touch 25, and only for a day or two.
- The site **is indexed by Google but gets no clicks**, and **nobody can
  see why**: there is no Search Console property for all-printable.com.
- Top 3, in order:
  1. **Search Console + sitemap** (Thomas, ~5 min).
  2. **Revive and merge PR [#54](https://github.com/ptk-studio/all-printable-app-www/pull/54)** (Thomas decides; the agent does the rest).
  3. **Agent-drafted community posts** (Reddit, Show HN) that Thomas
     publishes, one at a time.

## 1. Baseline (read 2026-11-13, not estimated)

| Reading | Value | Source |
|---|---|---|
| GA4 active users, 30 days (Oct 16 – Nov 12) | **2** | Firebase console → Analytics Dashboard |
| GA4 active users, 7 days | **1** | same |
| GA4 active users, 1 day (Nov 12) | **0** | same |
| DAU card, Nov 7–13 | 0 every day, except **1** on ~Nov 8 | Firebase Project Overview |
| Google index | **Indexed.** `site:app.all-printable.com` returns 2 pages of results (home, sudoku, budget, calendar, bingo, bookmarks, /learning/, /printables/puzzles/ …) | google.com, read-only |
| Search Console | **Not set up.** Thomas's Google account has no property for all-printable.com (only an unrelated domain). Impressions, clicks and queries are unknown. | search.google.com/search-console |
| Checkout | Works: Get Pro opens a live Stripe Checkout at $5.00/month ([#55](https://github.com/ptk-studio/all-printable-app-www/issues/55)). Webhook registration not yet confirmed. | [#55](https://github.com/ptk-studio/all-printable-app-www/issues/55) |

How to read these numbers:

- **Analytics is opt-in** ([`_mochi-agent/METRICS.md`](https://github.com/ptk-studio/all-printable-app-www/blob/main/_mochi-agent/METRICS.md)), so DAU is a floor.
  At 0–2 users, though, the floor and the truth are both "nobody".
- **The 2 users in 30 days are probably us.** One is likely an agent or
  Thomas checking the site. The 1 realtime user during this reading was the
  [#55](https://github.com/ptk-studio/all-printable-app-www/issues/55) browser check.
- **Indexed but invisible.** Google knows the pages, so crawling is not the
  problem. The pages rank too low to be clicked, for queries that static
  PDF sites have held for years. That takes weeks to months to change,
  not days.

## 2. Audit: [#53](https://github.com/ptk-studio/all-printable-app-www/issues/53) and PR [#54](https://github.com/ptk-studio/all-printable-app-www/pull/54)

- **[#53](https://github.com/ptk-studio/all-printable-app-www/issues/53)'s findings still hold**, with two corrections already found in
  PR [#54](https://github.com/ptk-studio/all-printable-app-www/pull/54) (the "orphaned" pages had ~125 links, all pointing at the
  non-canonical `…/index.html` shape; the duplicate H1s were category pages
  against makers).
- **PR [#54](https://github.com/ptk-studio/all-printable-app-www/pull/54) is still right and still current.** `main` hasn't moved since
  2026-09-05, so the PR sits directly on it and merges cleanly. On its
  branch, `node tools/check-site-urls.mjs` passes all 6 checks
  (re-run 2026-11-13).
- **What merging it changes:**
  - All 41 sitemap URLs get internal links in their canonical shape.
  - No duplicate H1s, 0 titles over 60 characters, 0 descriptions over 160.
  - 93 FAQ answers become `FAQPage` structured data.
  - A merge is a production deploy (Pages serves `main` → `/docs`). The
    sheets and the consent banner are untouched.
- **Expected effect:** a better snippet and better crawl signals. It is
  not a traffic source on its own. Judge it in Search Console after 4–8
  weeks, which is why Search Console comes first.
- **Leftover from PR [#54](https://github.com/ptk-studio/all-printable-app-www/pull/54):** the sibling `all-printable-www` repo has four
  links to `app.all-printable.com/printables/{calendar,paper}/index.html`
  (the site's only known inbound links), plus a stale `registry.js`. That
  needs a small second PR.

## 3. Channels

DAU impact = my estimate of the extra *daily* active users by 2026-12-01,
given that analytics is opt-in. Everything costs **$0** unless stated.

| Channel | DAU impact by Dec 1 | Effort / who | Risk | Needs Thomas |
|---|---|---|---|---|
| **Search Console + sitemap** | 0 directly. It is what makes every SEO move measurable. | 5 min, Thomas (DNS TXT record or HTML-file verify). The agent can prepare the file and a PR if he picks HTML-file verification. | None | Verify ownership (his Google account) |
| **PR [#54](https://github.com/ptk-studio/all-printable-app-www/pull/54) (SEO fix)** | 0–2 by Dec 1; the main long-term lever | Done. Merge after review, plus a small PR in `all-printable-www` (agent) | Low. It is a deploy; checks pass. | The revive-or-close decision |
| **Reddit / communities** (r/Teachers, r/homeschool, r/bulletjournal, r/sudoku, r/printables, teacher Facebook groups) | Spike: 0–50 users on the day of a good post, back to ~0–3 within a week | Agent drafts each post around one *useful* sheet (e.g. a true-scale graph paper, a multiplication drill with answer keys), with a UTM link. Thomas posts from his own account. | Medium: self-promotion rules, bans, a bad first impression. Read each sub's rules first. One sub at a time. | Posting (outside the repo), from his account |
| **Show HN** | Spike: 0–300 on the day if it lands, 0 if it doesn't. A dev audience, few printers. | Agent drafts. Angle: buildless, dependency-free, true-scale printing, honest client-side Pro gate. | Low–medium (one shot per project) | Posting, from his HN account |
| **Pinterest** (printables' strongest channel) | 0–5 by Dec 1. Pins take 1–3 months to ramp. Strong after that. | Agent renders 1–3 pin images per printable (26 × 1000×1500 PNGs from the existing preview pipeline) plus titles, descriptions and UTM links in the repo. Thomas creates the business account and claims the domain. Posting is his, or the agent's later with explicit go-ahead. | Low | A new account; posting |
| **Use-case landing pages / blog** (e.g. "2027 printable calendar with UK bank holidays", "true-scale 5 mm graph paper A4") | 0 by Dec 1; real at 2–4 months | Agent writes them in the repo; each goes through a normal PR. Seasonal 2027 calendar pages are urgent *now*, since Dec–Jan is calendar peak. | Low; thin pages could hurt quality | PR approval (a merge is a deploy) |
| **Backlinks / resource lists** (teacher resource roundups, homeschool link lists, "free printable" directories, awesome-lists) | 0–1 | Agent finds candidates and drafts outreach. Thomas sends it. | Low | Contacting people outside the repo |
| **TPT / Etsy listings linking back** | ~0 by Dec 1 | High: new seller accounts, listing assets, possibly fees | Medium (TPT/Etsy rules on off-site links) | New accounts, possibly money |

## 4. Ranked shortlist (impact for effort)

1. **Set up Search Console and submit the sitemap.** Thomas, 5 minutes.
   Without it every other SEO move is a guess. It also shows within days
   which queries the site already appears for, which picks the pages to
   push.
2. **Revive PR [#54](https://github.com/ptk-studio/all-printable-app-www/pull/54) and merge it after manager review**, plus the small
   `all-printable-www` link PR. The work is already done and verified; it
   only needs the decision. Agent alone, after Thomas says revive.
3. **Community posts, drafted by the agent and published by Thomas.**
   Start with 1 Reddit post and 1 Show HN draft. This is the only move
   with a chance of touching DAU 25 before Dec 1, as a spike. Agent: drafts,
   UTM links, timing, each sub's rules. Thomas: reads, edits and posts.

Next after these: **seasonal 2027 calendar landing pages** (agent alone,
normal PR, ships before the December peak) and **Pinterest** (needs an
account from Thomas). Both are better bets for January than for Dec 1.

**Agent alone:** PR [#54](https://github.com/ptk-studio/all-printable-app-www/pull/54) follow-ups, the sibling-repo PR, landing pages,
pin images, all drafts.
**Needs Thomas:** Search Console verification, the PR [#54](https://github.com/ptk-studio/all-printable-app-www/pull/54) decision,
anything posted, any new account.

## 5. Measurement

| Move | Shows up in | Judge it at |
|---|---|---|
| Search Console | Impressions, clicks, indexed-page count, top queries | First data in 2–3 days; first baseline after 7 days |
| PR [#54](https://github.com/ptk-studio/all-printable-app-www/pull/54) | Search Console impressions and average position for the 41 URLs; GA4 `landing:*` page views | 4 and 8 weeks after merge |
| Reddit / HN | GA4 session source (`utm_source=reddit` / `hn`), `landing:*` and maker page views, DAU on the day and over the next 7 days | 48 hours, then 7 days (did anyone return?) |
| Pinterest | GA4 source `pinterest`; Pinterest analytics (impressions, outbound clicks) | 4 and 8 weeks |
| Landing pages | Search Console impressions for the new URLs | 4–8 weeks |

Caveat for every row: DAU counts consenting users only. A change in
consent rate moves DAU without one extra visitor, so check consent before
calling any movement growth (see [`_mochi-agent/METRICS.md`](https://github.com/ptk-studio/all-printable-app-www/blob/main/_mochi-agent/METRICS.md)).

## 6. Asks for Thomas

1. **Search Console:** verify all-printable.com (Domain property via DNS
   TXT, recommended) and add the sitemap
   `https://app.all-printable.com/sitemap.xml`. Or say "HTML file" and the
   agent will open the PR for that method.
2. **PR [#54](https://github.com/ptk-studio/all-printable-app-www/pull/54):** revive or close? It is still current and its checks pass.
3. **Community posting:** OK for the agent to draft 1 Reddit post and 1
   Show HN post for you to review and publish?
4. **Optional, later:** a Pinterest business account; go-ahead for the
   2027 calendar landing pages.
