# all-printable — what it is

Static, dependency-free printable generators. Everything renders in the browser and prints at true paper size.

**This is the product's own record.** It is kept current by the agents that work this repo, and
it is theirs to read before changing anything. Everything here is a stable fact about the
product; the day's work is not here.

> Moved into `_mochi-agent/` on 2026-09-04, from the fleet's own repo, where it had lived as
> `data/teams/webapp-team1/projects/all-printable/PROJECT.md`. The sections below are that file's, verbatim —
> what the product *is* belongs with the product. What stayed behind is how one fleet works it:
> which team, which agents, priority, mode, proposal cap and the board.

## Repos

| Repo | Publishes | Holds |
|---|---|---|
| [`all-printable-app-www`](https://github.com/ptk-studio/all-printable-app-www) | **https://app.all-printable.com/** | the whole catalogue — makers, categories, landing pages, `/pro/`, `features/`, `tools/`, `functions/`, Firestore rules |
| [`all-printable-www`](https://github.com/ptk-studio/all-printable-www) | **https://all-printable.com/** | the one-page marketing home, plus ~40 redirect stubs for pre-split URLs |

Both are public, default branch `main`.

The split lets a dynamic version grow under `app.` without disturbing the static site.

## Metrics

Declared publicly in
[`documents/METRICS.md`](https://github.com/ptk-studio/all-printable-app-www/blob/main/documents/METRICS.md)
in the app repo. That file is the commitment; this is the pointer.

**Primary: DAU** — read from the
[Firebase console overview](https://console.firebase.google.com/project/ptk-studio-allprintable/overview).
Baseline **2** on 2026-09-01.

**Primary: paid monthly subscriptions** — **Stripe is the authority**; Firestore `users`
where `pro == true` mirrors it. Baseline **0** on 2026-09-02, target 5 by 2026-12-01. GA4
measures the *funnel* only: a browser never learns that a payment settled, so
`checkout_return: done` is not a subscription.

The number needs a browser session; an agent cannot fetch it from the shell. Read it with
browser automation when the session has it, or ask the human. Never write a value you did
not read.

**The measurement caveat that shapes everything:** analytics is opt-in, and nothing loads
until a visitor agrees. GA4 DAU therefore counts *consenting* users, not visitors. It is a
floor, not a headcount, and consent-rate changes move it independently of traffic.

## Deployment

GitHub Pages, **`main` → `/docs`**, no workflow and no build step.

> **A merge to `main` is a production deploy.** There is no staging. Never merge
> without asking.

## Stack

- Vanilla JS, no package manager, no dependencies, no bundler. `docs/` deploys as-is.
- Shared studio shell `docs/assets/js/core/studio.js` — state, controls, preview, print, export.
- `core/impose.js` sheet geometry for small formats; `core/table.js` rows-and-columns sheets.
- `core/brand.js` stamps the `all-printable.com` credit on every sheet (the paid-removal seam).
- Firebase: auth, Firestore, GA4 analytics (opt-in only — nothing loads before consent).
- `functions/` — Stripe checkout + webhook for Pro. **Deployed and live**, taking real money
  (USD 5.00/month, `livemode: true`) as of `5c2944f`, 2026-09-02, on the **Blaze** plan.
  Deployed is not proven: the webhook was verified against a synthetic signed event, but no
  real purchase has been through it yet.

## Run locally

```sh
cd <checkout>/docs && python3 -m http.server 8799   # → http://localhost:8799/
```

The repo READMEs say port 8777; on this machine 8777 is usually already taken by another
server, and Python's `http.server` fails with `Address already in use` while curl happily
returns 200 from *the other* server. Use 8799, and check the port is yours before trusting
a response.

No tests, no lint, no CI. Verification is: serve it, load a maker, confirm the sheet
renders and the console is clean, then print-preview at scale 100% / margins None.

## Generators (output is committed)

```sh
cd docs && python3 -m http.server 8799 &
ORIGIN=http://localhost:8799 node tools/build-previews.mjs   # a real sheet per printable
node tools/build-categories.mjs    # the six category pages
node tools/build-landing.mjs       # landing pages + sitemap
```

`build-previews.mjs` defaults to `http://localhost:8777` and reads `ORIGIN` to override —
pass it, or it will photograph whatever else is serving 8777.

Every absolute URL comes from one constant, `tools/site.mjs`. Change it and rerun the
generators — canonicals, `og:url`, JSON-LD and the sitemap all follow.

## Verification — three ways a check passes without having run

Learned the hard way. Each is a way to report something as verified when it never was.

- **An empty console is not evidence.** The browser extension only records from the moment
  `read_console_messages` is first called, so a page loaded before that reads as silent
  whether it is clean or not. Log a probe, read it back to prove capture is live, *then*
  reload and read the page's own output.
- **The print dialog cannot be driven.** It is native and blocks the session — never open it.
  Verify print correctness through the `@page` rule (`size: 215.9mm 279.4mm; margin: 0` for
  Letter) and the rendered sheet, and say in any verdict that the dialog itself was not opened.
- **Never touch the consent banner.** Clicking **Allow** registers a consenting session and
  moves **DAU**, whose baseline is 2 — a health check that inflates the metric it exists to
  observe. Leave it alone; `window.dataLayer` staying undefined is the proof it stayed clean.

Serve on **8799**. Port 8777 is usually another server on this machine and will answer 200
for pages a change never touched — a false green that looks exactly like a passing check.

## Things that bite

A reviewer reads this table every time rather than remembering it.

| Check | Why |
|---|---|
| `docs/assets/js/registry.js` copied to **both** repos | The catalogue's source of truth, duplicated; changing one leaves the home page's counts stale. |
| Generated output regenerated, not hand-edited | Previews, category pages, landing pages and `sitemap.xml` are committed build output. Hand edits are silently overwritten on the next run. |
| Absolute URLs come from `tools/site.mjs` | Canonicals, `og:url`, JSON-LD and the sitemap all follow that one constant. A literal URL in a template is a defect — `tools/check-site-urls.mjs` guards the hand-maintained files. |
| The sheet credit is the brand `all-printable.com`, not a URL | It deliberately does not follow `site.mjs`. |
| Redirect stubs in `all-printable-www` still present | They hold search rankings. Deleting one needs Search Console, and months. |
| `functions/`, `firestore.rules`, anything touching Stripe or auth | Live, on Blaze, taking real money. Treat any change here as high-risk and say so. |
| Anything under `docs/` | Deploys as-is on merge. There is no staging. |

- `docs/assets/js/registry.js` is the catalogue's source of truth and is **duplicated in
  both repos**. Add a printable in the app repo and the home page's counts go stale until
  it is copied across.
- **The seven maker pages under `docs/printables/<type>/` are hand-maintained, not
  generated.** `build-landing.mjs` and `build-categories.mjs` write the 26 landing pages and
  the category pages; nothing writes the makers. Their absolute URLs are therefore the only
  ones on the site that do **not** flow from `tools/site.mjs` — change the origin and the
  generators will update 33 pages and silently leave the seven makers pointing at the old
  host. Grep `docs/printables/*/index.html` by hand when `SITE` changes.
- The makers take their setup from a **`?preset=` query string, applied at runtime** by
  `core/studio.js`. The served HTML is identical for every preset, so each maker is one page
  reachable at many URLs — anything URL-shaped (canonicals, sitemap entries, analytics page
  names) has to account for that rather than assuming one URL per view.
- The redirect stubs in `all-printable-www` exist to hold search rankings. Do not delete
  them without checking Search Console; months, not weeks.
- `all-printable.com` must stay in Firebase authorized domains or the OAuth redirect
  breaks.
- The sheet credit is the brand `all-printable.com`, not a URL — it does not follow
  `site.mjs`.
- Print correctness means scale 100% / margins None; the sheet carries its own media size.

