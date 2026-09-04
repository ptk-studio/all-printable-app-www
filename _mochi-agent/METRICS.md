# Metrics

What this project is trying to move, stated publicly so it can be held to it.

Two primary metrics. Anything that does not plausibly serve one of them needs a reason of
its own.

Last reading: **2026-09-03**. Last reviewed: **2026-09-03**.

---

## Primary — Daily Active Users (DAU)

| | |
|---|---|
| **Definition** | GA4 **active users** for one day on `app.all-printable.com`, as reported by the Firebase console's Analytics card. Active users is engagement-based: a visit GA4 does not count as engaged is not an active user, so this is *not* "anyone who loaded a page". The day boundary is the **GA4 property's reporting timezone**, which is not confirmed to be UTC — see below. |
| **Why** | It is the honest test of a printables site: people came back and made something. Not pageviews, which reward a good search snippet and nothing after it. |
| **Where** | [Firebase console → Project overview](https://console.firebase.google.com/project/ptk-studio-allprintable/overview), Analytics card. |
| **Baseline** | **2** — 2026-09-01 |
| **Current** | **2** — 2026-09-02 |
| **Target** | **25** by 2026-12-01 |

### Read this number correctly

**Analytics is opt-in.** Nothing loads and no cookie is set until a visitor agrees, so DAU
counts *consenting* users — not visitors. It is a **floor**, not a headcount.

**The baseline of 2 was measured on a narrower site than today's.** Until 2026-09-02 only
the seven makers were instrumented: the 26 landing pages, 6 category pages, the catalogue
home and `/pro/` recorded nothing, so a visitor who arrived from search and read a landing
page was invisible unless they opened a maker. Every page now reports, which means:

- **DAU should step up once, on measurement alone.** That step is not growth and must not
  be reported as growth.
- The baseline of **2 on 2026-09-01** is kept as the historical marker. Take a fresh
  baseline once the new coverage has a full week behind it, and record it here as a second
  baseline rather than overwriting the first.

Page names are namespaced — `landing:<slug>`, `category:<slug>`, `home`, `pro`, and the
maker's own id — so arrivals can be separated from maker sessions rather than pooled.

Two consequences worth stating before anyone reads a chart:

- The true number is higher by an unknown factor, and that factor is not stable.
- A change in the consent rate moves DAU without a single extra visitor arriving. Any DAU
  movement should be checked against whether consent behaviour changed first.

We are not going to fix this by making analytics opt-out. The site's promise is that your
work stays on your machine, and quietly widening the tracking to make a number look better
would be exactly the wrong trade. A measured floor we can trust beats a total we cannot.

---

## Primary — Paid monthly subscriptions

| | |
|---|---|
| **Definition** | Distinct Stripe subscriptions in an entitling status — `active`, `trialing` or `past_due` — for the `all-printable` product. The same set `functions/entitlement.js` grants Pro on, so the metric and the entitlement cannot disagree. |
| **Why** | The only revenue the project has, and the only signal that the free product is worth paying to keep. DAU says people come; this says the exchange is fair. |
| **Where** | **Stripe dashboard is the authority.** The mirror is Firestore: `users` where `pro == true`. GA4 measures the *funnel*, not the count — see below. |
| **Baseline** | **0** — 2026-09-02. Checkout went live on 2026-09-02 (`5c2944f`); no purchase has been made. |
| **Current** | **0** — 2026-09-03 |
| **Target** | **5 paying subscribers** by 2026-12-01 |

Price is USD 5.00/month, read live from Stripe by `getPrice` — the page and the charge
cannot disagree.

### Where the number comes from, and where it does not

**Stripe holds the truth.** A subscription exists when Stripe says it does; Firestore mirrors
it because the webhook writes `pro`. GA4 cannot see either — a browser never learns that a
payment settled.

So GA4 is instrumented for the **funnel**, which is what tells you *why* the count is what it
is. As of this commit:

| Event | Fires when | Answers |
|---|---|---|
| `page_view` (`maker: pro`) | `/pro/` is opened | How many people even look |
| `pro_signin_start` | Sign-in clicked on `/pro/` | Is the account wall the drop-off? |
| `checkout_start` | Get Pro clicked | How many reach Stripe |
| `checkout_return` (`result`) | Back from Stripe | `done` vs `cancelled` — checkout's own conversion |
| `checkout_error` | Checkout failed before Stripe | Broken, not declined. Never counted as a cancellation |
| `pro_activated` | Client first sees `pro: true` since its cached flag was last false | **Not activations.** Re-fires on sign-out and back in, and after any failed profile read |
| `pro_pending` | Paid, webhook not landed yet | The grant path is slow or broken |
| `billing_portal` | The *click* that opens Stripe's portal | Intent to manage billing. **Not cancellations** — see below |
| `preset_locked` | A Pro preset was refused | Demand for Pro from inside the makers |

### Three rows that do not mean what their names suggest

A browser can only see what a browser can see. Each of these is the closest observable proxy
for something it cannot observe, and each is named here so a future reader does not quote it
as the thing itself.

- **`checkout_return: done` is not a subscription.** It means the payment page finished; the
  subscription exists only once the webhook has written it. Never report the GA4 number as
  the subscriber count.
- **`billing_portal` is not a cancellation.** It fires on the click that opens Stripe's
  portal, before the portal loads — so someone who opens it, looks and closes it counts
  identically to someone who cancels. It is *intent to manage billing*, the same shape as
  `print` firing "on intent, not on paper" further down this file. The real cancellation
  arrives as a Stripe webhook, and that is what moves the metric.
- **`pro_activated` is not an activation count.** It fires when the client first sees
  `pro: true` since its cached flag was last false, which also happens on signing out and
  back in, and after a profile read that failed — both `.catch` and the not-`exists` branch
  reset the flag, so the next successful read looks new. Counting once per subscriber would
  need a marker stored under the uid rather than a bare local flag; that is deliberately not
  done at this volume.

None of these is a defect to be fixed by tracking harder. They are what the browser can
honestly report, and the fix for wanting the real number is to read Stripe.

### Read this number correctly

At a baseline of 0 against a DAU of 2, **every ratio is noise**. Conversion rate is not a
meaningful number here and will not be quoted until the funnel has enough traffic to mean
something. The honest early metric is the raw count.

The funnel events are also subject to the same consent gate as everything else: a visitor
who declines is invisible in GA4 but perfectly able to subscribe. **Stripe will therefore
show purchases the funnel never recorded, and that is expected** — not a bug to be fixed by
tracking harder.

---

## Where the readings are logged

`Current` above is the latest reading and always carries its date. The **log** of past
readings — what was read, when, and what was or was not observable that day — lives with the
agent that takes them:

    agents/product1/metrics/<date>/metrics.md   (ptk-studio-agents)

Kept there rather than here so this file stays a *declaration* — what we are trying to move
and why — instead of growing a table that only gets longer. The declaration and the current
value stay public in this repo, which is what makes the target something to be held to.

> **Open question, 2026-09-03: which timezone bounds the day?** GA4 reports in the property's
> reporting timezone. If that is not UTC, the boundary in the definition above is not the
> boundary in the number — and at a value of 2, one visitor either side of midnight is half
> the metric. The property settings page could not be read: it is behind an email-preferences
> dialog whose only buttons change the account's settings, which an agent should not click.
> **One look by a human closes this.**

## Secondary — Day 1 retention


Reported alongside DAU in the same Firebase console card. **No data for the last 14 days** —
at this volume there is nothing to compute. It becomes meaningful somewhere on the way to the DAU
target; until then it is watched, not steered by.

---

## Deliberately not metrics

Stated so a future contributor does not cheerfully optimise the wrong thing.

| Not a metric | Why |
|---|---|
| **Session length / time on page** | A printable someone finds, configures and prints in ninety seconds is the product *working*. Optimising for dwell time would mean making it slower. |
| **Pageviews** | Rewards a good search snippet and says nothing about whether anyone printed anything. |
| **Sign-up count** | Sign-in exists for Pro and saved designs. Most visitors should never need an account, and pushing them toward one would damage the thing that makes the site usable. Sign-ins *on `/pro/`* are tracked, because there they are a funnel step rather than a goal. |
| **Checkout conversion rate** | Not until the funnel carries enough traffic for a ratio to mean anything. At single-digit DAU it is one person's afternoon. |
| **Sheets printed** | The right idea, but unmeasurable honestly: printing happens in the browser's own dialog, and we do not track what a sheet contains. The `print` event fires on intent, not on paper. |

---

## What moves it

Ordered by the leverage we think they have, not by how easy they are. Each is a hypothesis
until a reading says otherwise.

1. **Search reach.** 26 landing pages exist to be found. Coverage, indexing and the queries
   they actually rank for are the largest lever at this volume — DAU of 2 is a discovery
   problem far more than a product problem. As of 2026-09-02 those pages finally report, so
   this hypothesis is testable instead of merely plausible.
2. **Return visits.** A generator's state lives in its URL (`#c=…`), so a saved link
   reopens a design exactly. That is a returning-user mechanic that is built and barely
   surfaced.
3. **Breadth of the catalogue.** Six categories, 26 printables, seven makers. A new
   printable is a new set of queries it can answer.
4. **First-run clarity.** The makers open on a sensible sheet and every control is live.
   Someone who lands, prints, and leaves satisfied is the one who comes back.

For subscriptions, in the same spirit:

1. **Traffic.** Nobody subscribes to a site they have not found. At a DAU of 2, the
   subscription metric is mostly downstream of the DAU one.
2. **The account wall.** Pro requires signing in before it can be bought, and sessions do
   not carry over from `all-printable.com`. `pro_signin_start` against `checkout_start` will
   say how expensive that step is.
3. **Reaching the people who already want it.** `preset_locked` fires when someone is
   refused a Pro preset — that is demand, already inside a maker, and it is the warmest
   audience the site has.
4. **Not breaking the exchange.** Pro removes a credit; it does not take features away. The
   fastest way to lose this metric permanently is to start gating what is free today.

---

## How this file is kept

Read the number, then write it here with its date — **never a value nobody read**. If a
reading could not be taken this tick, leave the old value with its old date and say so;
a dated stale number is honest, an undated fresh-looking one is not.

Definitions change in their own commit, with the reason. Changing a definition to make a
result look better is the one thing that would make this file worthless.
