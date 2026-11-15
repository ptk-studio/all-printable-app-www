# Release checks: all-printable

Pre-release and post-release validation for this project (ptk-studio handbook, `mochi-factory/project-groups/AGENTS.md`
→ "Release validation"; task #71). Project type: **web**. The worker (web-worker1) runs every check unless a row says
the Owner. Every release PR lists the pre-release results (the scorecard: one row per step, pass/fail, evidence,
date); every release gets a post-release report on its issue.

This file brings together the checks the repo already has (`tools/smoke-live.mjs` from #64,
`tools/check-site-urls.mjs` from #45/#47/#50, `tools/test-query-start.mjs` from #60, `functions/test-entitlement.js`,
`tools/test-rules.py`) and adds `tools/release-check.sh`, which runs them in order.

## What counts as a release here

| Kind | Release event | Rollback |
|---|---|---|
| **S. Site** (https://app.all-printable.com, GitHub Pages from `main` → `/docs`) | a merge to `main` | revert PR, cleared by the manager |
| **F. Functions** (Stripe checkout and webhook for Pro, Firebase project in `.firebaserc`) | `firebase deploy --only functions` | redeploy the previous commit's functions |
| **R. Firestore rules** (`firestore.rules`; they protect the Pro fields) | `firebase deploy --only firestore:rules` | redeploy the previous rules |
| **P. Price or plan** (Stripe product/price) | a change in the Stripe dashboard | restore the previous price (Stripe keeps old prices) |

F, R and P touch money and sign-ins, so the deploy itself is done by the Owner (or by the worker only with the Owner's
yes typed in the session for that exact deploy).

---

## S. Site

### Pre-release (on the PR branch, everything committed)

| # | Step | Expected result |
|---|---|---|
| S1 | `tools/release-check.sh pre` | all `PASS`: the generated pages and sitemap match their generators (re-running `build-categories` and `build-landing` leaves no diff); `check-site-urls` (one origin, descriptions, sitemap coverage, no `index.html` links, every landing page linked); `test-query-start`; `test-entitlement`; no secret-like strings (Stripe live or webhook keys, service-account keys) |
| S2 | A maker changed: `node tools/build-previews.mjs` (needs a local server and a browser) and commit the new preview images | previews regenerated; the landing pages show what the maker makes |
| S3 | **Critical flows** in a browser on a local copy or the PR's preview: each changed maker renders; **Print** opens the print dialog with the right sheet; **Download** produces the file; sign-in opens and returns (no real sign-in by the worker); the `/pro/` page shows the price | each works; **screenshots in the PR** (desktop and 390 px) |
| S4 | SEO-relevant change: titles, one H1, canonical and description on the changed pages (S1 covers the hand-written pages) | pass |

### Post-release (right after the Pages build, then again within 24h)

| # | Step | Expected result |
|---|---|---|
| S5 | `tools/release-check.sh post` | the Pages build is `built` on the merged commit; `smoke-live` 6/6: robots names the sitemap; every sitemap URL 200; key pages have their title, one H1 and canonical; the 7 makers and their assets 200; an unknown path 404; `getPrice` returns the live price |
| S6 | `node tools/smoke-live.mjs --browser` where Playwright is installed | tests 7–8 pass (the makers render in a real browser) |
| S7 | The HEALTH-CHECK.md checks | pass |
| S8 | Re-run S5 within 24h | pass |

**Rollback:** if S5–S8 fail, open a revert PR at once and say so on the issue.

---

## F. Functions (Stripe checkout and webhook)

| # | When | Step | Expected result |
|---|---|---|---|
| F1 | pre | `(cd functions && node --test test-entitlement.js)` (S1 runs it too) | pass |
| F2 | pre | **Stripe test mode end to end** against the functions in the emulator or a test deploy: checkout with a Stripe test card, the webhook marks the profile Pro, cancel removes it | each step as expected; screenshots or logs on the issue |
| F3 | pre | No live keys in the repo or the diff; the functions read their secrets from the Firebase config (key names only in the PR) | pass |
| F4 | release | The Owner deploys (or gives the worker the yes for that deploy) | deploy succeeded |
| F5 | post | `tools/smoke-live.mjs` test 6 (`getPrice` returns the live price); Firebase console → Functions → no errors for 60 min | pass |
| F6 | post, within 24h | Stripe dashboard → Webhooks: recent deliveries succeeded (2xx); no failed events | pass (read-only; the Owner if the worker can't sign in) |

## R. Firestore rules

| # | When | Step | Expected result |
|---|---|---|---|
| R1 | pre | `python3 tools/test-rules.py` and `--mutate` (prove the suite fails when a rule is weakened). It calls the Security Rules API with the Firebase CLI's credentials, so it runs in a signed-in session | all pass; the mutation runs fail |
| R2 | release | The Owner deploys the rules (or gives the worker the yes) | deployed |
| R3 | post | `python3 tools/test-rules.py --deployed` | the live rules pass and show **no drift** from `firestore.rules` |

## P. Price or plan

| # | When | Step | Expected result |
|---|---|---|---|
| P1 | pre | The Owner's decision recorded on the issue (the price, the currency, what Pro includes) | recorded |
| P2 | post | `smoke-live` test 6 shows the new price; `/pro/` shows the same price | match |

---

## Who runs what

- **The worker:** S1–S8, F1–F3, F5, R1 and R3 when a signed-in CLI session is available, P2.
- **The Owner:** deploys F and R (or says yes to the worker doing it), Stripe dashboard changes (P), and reads Stripe
  webhooks (F6) if the worker can't.
- **The manager:** reviews the scorecard and clears the merge.

## Tools

- `tools/release-check.sh pre|post`: runs the checks above in order; read-only.
- `tools/smoke-live.mjs [--browser]`: the live smoke test (#64).
- `tools/check-site-urls.mjs`, `tools/test-query-start.mjs`, `functions/test-entitlement.js`, `tools/test-rules.py`:
  the individual checks.
