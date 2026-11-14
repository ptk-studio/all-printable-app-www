# Health check: all-printable

The project's health-check list (ptk-studio handbook, `projects/AGENTS.md` → "Health checks"; type
definitions in `projects/PROJECT-TYPES.md`). Agents read the checks from **this file**. It lives at the
repo root, outside `docs/`, so it is never published.

Values checked against the live site on 2026-11-13 (all passed). Change this file by PR, like any other
repo change.

## Properties (type `web`)

- **Main repo:** `ptk-studio/all-printable-app-www`. **Deploy:** GitHub Pages serves `main` → `/docs` at
  https://app.all-printable.com. A merge to `main` is a production deploy. The marketing home
  https://all-printable.com is a separate repo (`all-printable-www`).
- **Traffic source:**
  - Google Analytics 4 (Firebase project `ptk-studio-allprintable`, web measurement ID `G-8KW8B8XRSJ`);
  - Google Search Console, Domain property `all-printable.com` (verified 2026-11-13; sitemap submitted).
- **Smoke test:** `tools/smoke-live.mjs` (#64; not merged yet). Once it exists, it runs after every
  deploying merge.

## Sign-in-free checks (manager, every sweep)

It passes when every row returns the expected status **and** the body contains the text. Read-only: one
request per URL.

### Pages

| URL | Expected status | Must contain |
|---|---|---|
| https://app.all-printable.com/ | 200 | `<title>All printables` |
| https://app.all-printable.com/pro/ | 200 | `<title>Pro` |
| https://app.all-printable.com/printables/calendar/ | 200 | `<title>Printable Calendar Maker` |
| https://app.all-printable.com/sitemap.xml | 200 | `<urlset` |
| https://all-printable.com/ | 200 | `<title>All Printable` |

### API (the page that makes money depends on it)

| Call | Expected status | Must contain |
|---|---|---|
| `POST https://us-central1-ptk-studio-allprintable.cloudfunctions.net/getPrice`, body `{"data":{}}` | 200 | `"interval":"month"` |

`getPrice` is the read-only price lookup `/pro/` makes. It answers with the live Stripe price (2026-11-13:
`amount 500`, `usd`, `month`, `livemode true`). It creates no checkout session and charges nothing.

### How to run it

Pages, one URL at a time:

```sh
curl -sL --max-time 15 -o /tmp/body -w '%{http_code}' <url>; grep -c '<must contain>' /tmp/body
```

API:

```sh
curl -s --max-time 15 -X POST -H 'content-type: application/json' -d '{"data":{}}' \
  https://us-central1-ptk-studio-allprintable.cloudfunctions.net/getPrice | grep -c '"interval":"month"'
```

A status other than the expected one, or a count of `0`, is a failure. Report it at once, with the URL and
what came back.

## Signed-in checks (worker, at most once a day, read-only)

Record each reading with its date in the hub's `projects/all-printable/STATUS.md`:

- **GA4:** active users, last 1 and 30 days (Firebase console → `ptk-studio-allprintable` → Analytics).
- **Search Console:** impressions and clicks, last 7 and 28 days (property `all-printable.com`). Readings
  start about 2026-11-20, 7 days after verification (#62).
- **Checkout:** signed in, `/pro/` shows **Get Pro** and the price, not "Checkout is not connected"
  (#55). **Never press Subscribe or complete a purchase.**
