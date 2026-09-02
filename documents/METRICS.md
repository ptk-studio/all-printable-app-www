# Metrics

What this project is trying to move, stated publicly so it can be held to it.

One primary metric. Anything that does not plausibly serve it needs a reason of its own.

Last reading: **2026-09-01**. Last reviewed: **2026-09-02**.

---

## Primary — Daily Active Users (DAU)

| | |
|---|---|
| **Definition** | Distinct users with at least one Firebase Analytics session in a UTC day, on `app.all-printable.com`. |
| **Why** | It is the honest test of a printables site: people came back and made something. Not pageviews, which reward a good search snippet and nothing after it. |
| **Where** | [Firebase console → Project overview](https://console.firebase.google.com/project/ptk-studio-allprintable/overview), Analytics card. |
| **Baseline** | **2** — 2026-09-01 |
| **Current** | **2** — 2026-09-01 |
| **Target** | **25** by 2026-12-01 |

### Read this number correctly

**Analytics is opt-in.** Nothing loads and no cookie is set until a visitor agrees, so DAU
counts *consenting* users — not visitors. It is a **floor**, not a headcount.

Two consequences worth stating before anyone reads a chart:

- The true number is higher by an unknown factor, and that factor is not stable.
- A change in the consent rate moves DAU without a single extra visitor arriving. Any DAU
  movement should be checked against whether consent behaviour changed first.

We are not going to fix this by making analytics opt-out. The site's promise is that your
work stays on your machine, and quietly widening the tracking to make a number look better
would be exactly the wrong trade. A measured floor we can trust beats a total we cannot.

### Day 1 retention

Reported alongside DAU in the same console card. **No data for the last 14 days** — at this
volume there is nothing to compute. It becomes meaningful somewhere on the way to the DAU
target; until then it is watched, not steered by.

---

## Deliberately not metrics

Stated so a future contributor does not cheerfully optimise the wrong thing.

| Not a metric | Why |
|---|---|
| **Session length / time on page** | A printable someone finds, configures and prints in ninety seconds is the product *working*. Optimising for dwell time would mean making it slower. |
| **Pageviews** | Rewards a good search snippet and says nothing about whether anyone printed anything. |
| **Sign-up count** | Sign-in exists for Pro and saved designs. Most visitors should never need an account, and pushing them toward one would damage the thing that makes the site usable. |
| **Sheets printed** | The right idea, but unmeasurable honestly: printing happens in the browser's own dialog, and we do not track what a sheet contains. The `print` event fires on intent, not on paper. |

---

## What moves it

Ordered by the leverage we think they have, not by how easy they are. Each is a hypothesis
until a reading says otherwise.

1. **Search reach.** 26 landing pages exist to be found. Coverage, indexing and the queries
   they actually rank for are the largest lever at this volume — DAU of 2 is a discovery
   problem far more than a product problem.
2. **Return visits.** A generator's state lives in its URL (`#c=…`), so a saved link
   reopens a design exactly. That is a returning-user mechanic that is built and barely
   surfaced.
3. **Breadth of the catalogue.** Six categories, 26 printables, seven makers. A new
   printable is a new set of queries it can answer.
4. **First-run clarity.** The makers open on a sensible sheet and every control is live.
   Someone who lands, prints, and leaves satisfied is the one who comes back.

---

## How this file is kept

Read the number, then write it here with its date — **never a value nobody read**. If a
reading could not be taken this tick, leave the old value with its old date and say so;
a dated stale number is honest, an undated fresh-looking one is not.

Definitions change in their own commit, with the reason. Changing a definition to make a
result look better is the one thing that would make this file worthless.
