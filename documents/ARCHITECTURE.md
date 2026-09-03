# Architecture

How `all-printable-app-www` is put together, and why. The README says what the site is;
this says how it works and which decisions are load-bearing.
[`METRICS.md`](METRICS.md) says what it is trying to move.

Written 2026-09-02 against `5c2944f`.

---

## 1. The shape of it

A buildless static site with one optional server component.

```
Browser                                   GitHub Pages          Firebase
-------                                   ------------          --------
docs/printables/<maker>/                  main -> /docs         Auth (Google)
  index.html  controls, as markup                               Firestore
  app.js      config for this printable                           users/{uid}
  engine.js   drawing                                             users/{uid}/designs
      |                                                         Cloud Functions
      v                                                           createCheckoutSession
docs/assets/js/core/studio.js  the shell                           createPortalSession
  state -> render -> preview -> print                              getPrice
      |                                                            stripeWebhook  <- Stripe
      v
paper / impose / table / brand    shared drawing primitives
```

Nothing is compiled, bundled or transpiled. `docs/` is served exactly as committed, which
is why the directory is named `docs/` — GitHub Pages publishes `main` → `/docs` with no
workflow. **A merge to `main` is a deploy.**

The one exception to "no build" is the *maintenance* generators in `tools/`. They produce
committed HTML; they are never part of serving. See §6.

### Why buildless

Every generator has to work from `file://` as well as over HTTP, because a downloaded
sheet is a plain HTML file someone opens later. That rules out ES modules for the site's
own code and rules out a bundler. The site scripts are therefore classic `<script>` tags
hanging things off one global, `window.AP`. Dynamic `import()` appears in exactly two
places — `account.js` and `analytics.js` — and both are lazy by design (§5, §7).

---

## 2. `window.AP` — the namespace

There is no module system, so every file contributes to one global object. Load order is
declared per page in the maker's `index.html`, and it matters:

```html
<script src="../../assets/js/core/util.js"></script>       <!-- el, $, dates, store, codec -->
<script src="../../assets/js/core/analytics.js"></script>  <!-- consent gate -->
<script src="../../assets/js/core/paper.js"></script>      <!-- AP.PAPER sizes -->
<script src="../../assets/js/core/brand.js"></script>      <!-- sheet credit -->
<script src="../../assets/js/core/account.js"></script>    <!-- auth, entitlement -->
<script src="../../assets/js/core/studio.js"></script>     <!-- the shell -->
<script src="engine.js"></script>                          <!-- this printable's drawing -->
<script src="app.js"></script>                             <!-- this printable's config -->
```

Each file opens with `window.AP = window.AP || {}` so the order is forgiving about
*existence*, but `app.js` calls `AP.studio(...)` and must come last.

| Module | Owns |
|---|---|
| `core/util.js` | `AP.el` DOM builder, `AP.$`/`$$`, date maths, locale formatting, `AP.store` (localStorage), `AP.encodeState`/`decodeState` |
| `core/paper.js` | `AP.PAPER` — 18 paper sizes in millimetres, portrait-normalised, plus planner/binder inserts |
| `core/impose.js` | Placing many small pieces on one sheet; Avery die-cut geometry; duplex mirroring |
| `core/table.js` | Declarative rows-and-columns blocks — the shape behind budgets, packing lists, meal plans, planners |
| `core/brand.js` | The printed credit, and the single predicate that hides it |
| `core/account.js` | Firebase auth, entitlement mirror, saved designs, Stripe checkout entry points |
| `core/analytics.js` | GA4 behind consent |
| `core/studio.js` | The shell: state, controls, preview, print, export |
| `registry.js` | The catalogue — 6 categories, 26 printables |
| `art.js` | Line-art thumbnails, read at build time |

---

## 3. The studio shell

`core/studio.js` (~540 lines) is the substance of the application. Each of the seven makers
is configuration handed to `AP.studio({...})`:

```js
AP.studio({
  key:      'paper',              // localStorage namespace
  defaults: {...},                // base state
  presets:  [{ name, s }],        // one-click starting points
  render:   function (state) {},  // -> array of .page elements
  pageSize: function (state) {},  // -> { w, h } in mm
  pageRule: function (state) {},  // -> '@page { ... }'
  filename: function (state) {}
});
```

The shell owns everything else. **A maker contributes drawing and defaults; it does not
own state, printing, sharing, persistence or the sheet credit.** That is why there are
seven makers and 26 printables — most of the catalogue is presets over an existing maker,
not new code.

### Controls are markup, not JavaScript

Controls are declared with data attributes and bound generically:

| Attribute | Meaning |
|---|---|
| `data-bind="a.b"` | Scalar value at that state path |
| `data-list="a.b:value"` | Checkbox toggling membership of an array |
| `data-swatch="a.b:value"` | Button setting a value, reflected in `aria-pressed` |
| `data-preset="0"` | Applies `presets[0]` |
| `data-when="a.b=value"` | Show only while it matches (`!=` also works) |
| `data-out="a.b"` | Text read-out, formatted through `config.outputs` |

Paths are dotted and resolved by `getPath`/`setPath`, so nested state needs no wiring. Add
an input to the HTML with a `data-bind` and it works — there is no registration step.

### The state cycle

```
control event -> writeControl -> state -> changed()
                                            |-- syncUI()        every [data-*] re-read
                                            |-- AP.store.set    localStorage
                                            |-- history.replaceState('#c=' + encodeState)
                                            `-- render()        debounced 90ms
```

State lives in **three** places, in priority order on load:

1. `#c=<encoded>` in the URL — this is what makes a link restore a whole design
2. `?preset=<name>` — how the catalogue deep-links into a setup
3. `ap.<key>.last` in localStorage — the last thing you had open

Everything is merged onto `freshState()`, so a saved state missing a newly-added field
still opens.

### Why the preview is scaled rather than reflowed

The sheet is built at true size — `MM_PX = 96 / 25.4` — and CSS-scaled to fit the canvas.
Nothing reflows at different zooms, so what is on screen is geometrically what prints.
Printing temporarily forces "all pages" view, calls `window.print()`, then restores.

---

## 4. Print correctness

This is the product. The failure mode of every free alternative is a PDF that prints at
96% and ruins the scale, so several decisions exist only to prevent that:

- **Geometry in millimetres, always.** `core/paper.js` holds sizes in mm; the paper engine
  draws one SVG whose `viewBox` *is* the drawing area in mm, so 1 user unit = 1 mm and a
  5 mm square measures 5 mm on paper.
- **The sheet carries its own media size** via a generated `@page` rule (`config.pageRule`),
  injected into a `<style id="page-rule">`. The browser must not rescale: **scale 100%,
  margins None**.
- **Duplex mirroring is a module, not a loop.** `core/impose.js` exists because when a sheet
  is flipped on its long edge the physical left column becomes the right one; backs must be
  laid out mirrored or flashcards do not line up.
- **Avery stock is exact die-cut geometry** — offsets from the sheet edge, centre-to-centre
  pitch — plus a nudge control, because printers disagree with each other.

---

## 5. The sheet credit, and Pro

Every printed sheet carries a small `all-printable.com` in the corner. Removing it is the
paid feature. The design keeps that honest and hard to bypass:

- **Stamped on one path.** `buildPages()` calls `AP.brand.stampAll()` on the way to *both*
  the preview and the HTML export, so no route to paper can miss it.
- **Positioned absolutely, in the margin.** It must not take space from anything — the paper
  engine computes its drawing area in exact millimetres, and a flex child added after the
  fact would silently shrink the grid.
- **One predicate.** `AP.brand.hidden()` reads `AP.entitlements.removeBranding`, and there
  is deliberately **no URL or UI override** — a switch anyone could find would make the paid
  feature free.
- **A Pro subscriber may print their own footer** in that corner instead (name, class code),
  bounded to 64 characters.

Pro presets are **refused, not hidden**: the engine that draws them ships to everyone, and
the chip says where to get it. The same honest exchange as the credit.

### Entitlement is never decided by the browser

`pro` lives on the Firestore user document. The cached copy in localStorage exists only so
the credit does not flash on load — **it is not the authority**. `firestore.rules` refuses
any client write to the locked fields:

```
pro, proSince, proSource, proStatus, proUpdatedAt,
stripeCustomerId, stripeSubscriptionId, stripeLivemode
```

Refused on *create* and on *update*, so entitlement can only arrive from the Admin SDK — the
Stripe webhook, or a human in the console. `functions/test-entitlement.js` asserts the same
list from the other side, so adding a webhook field without adding it to the rules fails a
test rather than quietly opening a hole.

---

## 6. The catalogue and the generated pages

`docs/assets/js/registry.js` is the source of truth. **As of 2026-09-03:** 6 categories,
26 printables, all `status: 'live'`, mapping onto **7 makers** (`calendar`, `paper`,
`tracker`, `cards`, `forms`, `puzzles`, `worksheets`), with 25 of the 26 entries a maker
plus `?preset=`. Counts date themselves here because adding a printable is the ordinary
way this document goes stale — read them as of that date, not as a claim about today.

Three generators in `tools/` read it and write committed HTML:

| Tool | Writes |
|---|---|
| `build-previews.mjs` | `docs/assets/previews/<slug>.png` |
| `build-categories.mjs` | `docs/index.html` + the six category pages |
| `build-landing.mjs` | one landing page per printable, and `sitemap.xml` |

```sh
cd docs && python3 -m http.server 8799 &
ORIGIN=http://localhost:8799 node tools/build-previews.mjs
node tools/build-categories.mjs
node tools/build-landing.mjs
```

Three things are worth knowing about this pipeline:

- **Previews are photographs of the real generator.** Each maker supports `?preview=1`,
  which renders one sheet with no chrome, scaled so its long edge is exactly 1000px, and
  writes the pixel size onto `<body data-sheet>`. The tool reads that, then screenshots a
  window of exactly that size. The pictures therefore cannot drift from what the site makes.
  (`build-previews.mjs` defaults to `ORIGIN=http://localhost:8777`; pass `ORIGIN` if you
  serve elsewhere, or it photographs whatever else holds that port.)
- **The registry is evaluated, not parsed.** It is a browser script, so the Node tools run
  it against a `{ window, AP }` shim via `new Function`.
- **One origin constant, with one exception.** `tools/site.mjs` exports `SITE`, and every
  absolute URL on a *generated* page derives from it — canonicals, `og:url`, JSON-LD `url`,
  every `sitemap.xml` entry. The exception is the files no generator writes: the seven
  maker pages under `docs/printables/{maker}/index.html`, `docs/pro/index.html`, and the
  `Sitemap:` line in `docs/robots.txt`. Those carry the origin as a literal string — nine
  URLs in all — so changing `SITE` means changing them too, and rerunning the generators
  will not do it for you. (`docs/CNAME` holds a bare host, not a URL, and has to change with
  the origin for the same reason.) **`node tools/check-site-urls.mjs` is the guard**: it
  imports the same `SITE` and exits non-zero listing every hand-maintained URL that
  disagrees with it. Run it after changing the origin — it *catches* the divergence, it does
  not repair it. Not to be confused with the *printed* credit, which is the brand string and
  does not follow `SITE`.

`registry.js` is **duplicated in `all-printable-www`**, which draws the marketing home
page's category cards in the browser. Adding a printable here leaves that copy stale until
it is copied across; nothing detects the drift automatically.

---

## 7. Firebase

One project, `ptk-studio-allprintable`. Three uses, all lazy:

**Auth** — Google is the only provider. The SDK is fetched from `gstatic` only when someone
signs in, or when a returning visitor is already known to have a session (`ap.account.seen`).
Everyone else downloads nothing.

**Firestore** — `users/{uid}` for the profile and entitlement, `users/{uid}/designs/{id}`
for saved designs (a Pro feature). Rules in §5.

**Analytics** — GA4, and *nothing loads until someone opts in*: decline and the SDK is never
fetched, no cookie is set. Do Not Track and Global Privacy Control count as a "no", and the
banner is not even shown.

What is recorded, **as of 2026-09-03**, is three kinds of thing:

| | Events | Where |
|---|---|---|
| **Arrivals** | `page_view` | `AP.analytics.init` runs on **41 pages**: 7 makers, 26 landing, 6 category, home, `/pro/`. That is every served page but one — see below |
| **Interface choices** | `preset_applied`, `preset_locked`, `print`, `copy_link`, `download_html` | `core/studio.js` |
| **The subscription funnel** | `checkout_start`, `checkout_return`, `checkout_error`, `pro_signin_start`, `pro_pending`, `billing_portal`, `pro_activated` | `pro.js`, `account.js` |

**Never field contents** — no event text, habit names, addresses, word lists or photos.
That holds across all three: parameters are **whitelisted, not filtered** (`ALLOWED` in
`core/analytics.js`), so a careless call site cannot leak a user's own text. The two the
funnel added are closed sets, not free strings: `mode` is `functions`, `link` or `none`
from `AP.account.checkoutMode()`, and `result` is read off the return URL but through a
`(done|cancelled)` regex, so nothing else can reach it. No amount, no email, no Stripe id.

**`docs/404.html` is the one served page with no analytics on it** — it loads no script at
all, so a visitor arriving on a URL we no longer serve produces no event, not even an
arrival, and is never offered the consent choice. That is the state today, not a considered
policy; it is recorded here so the next reader does not assume 404s are counted.

`DEFAULT_ON` is one constant in one place because opt-in vs opt-out carries legal weight in
the EU. The mechanism worth knowing before reading any of these numbers: `track()` **drops**
rather than queues when consent has not been given, so a visitor who never answers the
banner sends nothing at all — not even the `page_view`. What that does to the numbers is
[`METRICS.md`](METRICS.md)'s to say, not this document's.

Sign-in deliberately lives on `app.all-printable.com` only: a Firebase auth session belongs
to one origin, so signing in on the marketing site would leave you signed out here.

---

## 8. Stripe / Pro checkout — `functions/`

Four Cloud Functions v2 in `us-central1`:

| Function | Kind | Job |
|---|---|---|
| `createCheckoutSession` | callable | Start a subscription checkout |
| `getPrice` | callable | Report the live price to `/pro/` |
| `createPortalSession` | callable | Open Stripe's billing portal to cancel |
| `stripeWebhook` | https | **The only thing that may grant Pro** |

Secrets — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` — are set with
`firebase functions:secrets:set` and never live in this repo.

`account.js` has a `CHECKOUT` switch with two modes: a Stripe Payment Link (manual grant in
the Firestore console) or `useFunctions: true`. It is currently **`useFunctions: true`**.

### Deployment state

**Deployed and live, taking real money — USD 5.00/month, `livemode: true`, as of
`5c2944f` (2026-09-02).** The project is on the **Blaze** plan.

The webhook was verified against a synthetic signed event at deploy time — 200 on the
current signing secret, 400 on the previous one, naming a customer that does not exist so
no entitlement was touched. **No real purchase has been through it yet**, so the happy path
is deployed-and-plausible rather than proven. Nothing here is a sandbox.

Two decisions in the entitlement logic are worth carrying forward:

- **Entitlement follows subscription *status*, nothing else.** Not "a payment succeeded",
  not "a checkout completed" — those are moments, and a moment cannot express "they
  cancelled last week". `active`, `trialing` and `past_due` entitle; `past_due` deliberately
  does, because Stripe is still retrying the card and yanking Pro mid-dunning is worse.
  An unknown status never entitles.
- **`entitlement.js` is pure and separately tested.** It holds the decisions and touches
  neither Stripe nor Firebase, so `test-entitlement.js` runs without deploying. A bug there
  either gives Pro away or takes it from someone who paid.

Webhook handling: the signature is verified over `req.rawBody` (reserialising breaks it);
unhandled event types get `200 ignored` so Stripe does not retry for days; an event naming
no resolvable user gets `200 no user` with an error log, because retrying cannot conjure a
uid and a stuck endpoint gets disabled; writes run in a transaction and stale events are
dropped by comparing `event.created` against `proUpdatedAt`.

---

## 9. Layout

```
docs/                     the published site — GitHub Pages serves this, exactly as committed
  index.html              catalogue (generated)
  assets/
    css/                  base, studio, sheet, home
    js/core/              the shared shell and primitives
    js/registry.js        the catalogue's source of truth
    js/art.js             build-time line art
    previews/             generated sheet photographs
  printables/<maker>/     index.html + app.js + engine.js + print.css   (7 makers)
  <slug>/                 generated landing and category pages
  pro/                    the Pro page
features/                 product specs — what each printable does and why
functions/                Cloud Functions (deployed)
tools/                    maintenance generators; output is committed
documents/                repo documentation, including this file
firestore.rules           readable source of truth for the security rules
```

`documents/` sits outside `docs/`, so nothing here is published.

---

## 10. What to be careful about

- **A merge to `main` deploys.** There is no staging on either repo.
- **`registry.js` is duplicated** in `all-printable-www` and drifts silently.
- **`functions/` is live.** It is not a sandbox, and no automated test covers `index.js`.
- **The sheet credit must not take layout space.** Absolute positioning in the margin is
  load-bearing, not a style choice.
- **Never add a URL or UI override to `AP.brand.hidden()`.**
- **Adding a webhook field means adding it to `locked()` in `firestore.rules`**, or the
  entitlement test fails — which is the intended alarm.
- **Preview mode is a contract.** `?preview=1` and `<body data-sheet>` are consumed by
  `build-previews.mjs`; changing either breaks the landing-page images.
- **Verification is manual**: no tests beyond `functions/test-entitlement.js`, no lint, no
  CI. Serve `docs/`, load a maker, check the console, print-preview at 100% / margins None.
