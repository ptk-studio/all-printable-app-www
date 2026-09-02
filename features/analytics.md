# Analytics

Status: **live** — `docs/assets/js/core/analytics.js`

Firebase / Google Analytics 4, behind consent.

- Firebase project: `ptk-studio-allprintable` (Spark, no billing)
- GA account: `ptk-studio`, measurement id `G-8KW8B8XRSJ`
- Web app: `all-printable.com`

## The constraint this had to satisfy

The site's pitch is that your work stays on your machine, and it said so in
several places. Analytics that quietly contradicted that would have made the
product dishonest, so the integration is built to keep the promise literally
true, and the copy was corrected where it had become imprecise.

- **Nothing loads until someone opts in.** Decline and the Firebase SDK is
  never fetched — no script, no cookie, no request. Verified: on a first visit
  the page makes *zero* external requests and sets zero cookies.
- **Do Not Track and Global Privacy Control are honoured as a no**, and the
  banner is not even shown.
- **The choice is reversible** from a control in every footer and sidebar.

## What is recorded

Interface choices only: which maker, which preset, which layout, paper size,
orientation, theme, page count. Events are `page_view`, `preset_applied`,
`print`, `download_html`, `copy_link`.

**Never the content.** Parameters are an allowlist, not a blocklist:

```
maker, preset, layout, type, paper, orientation, theme,
pages, action, stock, difficulty, countries
```

Anything else is dropped before it reaches the SDK. That covers every field
where someone types their own material — calendar events, habit and chore
names, addresses on labels, word-search lists, handwriting trace text, titles,
footers, and uploaded photos. A careless call site cannot leak them, because
the sanitiser does not pass unknown keys through.

## Changing the policy

`DEFAULT_ON` at the top of `analytics.js` flips the whole thing from opt-in to
opt-out. It is one constant in one place because it is a policy decision with
legal weight in the EU, not an implementation detail to be scattered around.

## The config is public

Firebase web config values — apiKey included — are not secrets. They ship in
client JavaScript by design and identify the project rather than authorise
anything. Committing them is correct. What protects a Firebase project is its
security rules and API-key restrictions, not hiding the config.

## Known limits

- Consent-gated analytics under-counts by design. People who decline are
  invisible, so treat the numbers as a sample rather than a census.
- Ad-blockers block the gstatic SDK. The load failure is caught and ignored;
  the site never depends on analytics being present.
