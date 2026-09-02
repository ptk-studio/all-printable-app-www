# Accounts and the paid tier

Two features are reserved for Pro: printing without the `all-printable.com`
sheet credit, and keeping saved designs against an account rather than one
browser. Everything else — all 26 printables, every layout, every paper size,
every option — is free and stays free. See `branding.md` for the credit itself.

## The shape of it

- **Firebase Auth** for identity. Google sign-in, and passwordless email links.
  No passwords are handled by this site in either flow.
- **Firestore** for the entitlement and for saved designs.
- **No server of ours.** The site is still static files on GitHub Pages. The
  browser talks to Firebase directly.

## Nothing loads for people who do not use it

`core/account.js` does not fetch the Firebase SDK on page load. It imports the
SDK only when someone signs in, or when `ap.account.seen` in localStorage says
this browser has a session to restore. A visitor who never signs in makes zero
requests to Google, which is the same bargain `analytics.js` makes.

## Where sign-in lives

The control sits in the top right of every page's header. `core/account.js`
mounts it itself into `.site-header`, so the home page, the 26 landing pages,
`/pro/` and the seven makers all get it with no per-page markup to drift. The
maker sidebar keeps only what is about that maker — saving and reopening its
designs — and points at the header for identity.

Two things the header made necessary. The popover is placed in viewport
coordinates by JavaScript, not anchored to the trigger, because below 760px the
header wraps and the trigger can land anywhere on a second row; right-anchoring
pushed the popover off the left edge of the screen. And the signed-in address
collapses to just the avatar below 900px, because the maker header already
carries three action buttons and the account control was the sixth item.

Its messages appear inside the popover rather than through `AP.toast`, because
landing pages load `account.js` without `util.js`.

This is the one place landing pages gained JavaScript. They previously shipped
none. `account.js` is small and fetches nothing until someone clicks, so the
cost is one cached request; the benefit is that the header means the same thing
everywhere.

## Where entitlement lives, and why

`pro` is a field on `users/{uid}` in Firestore. The browser reads it; the
browser may never write it. `core/account.js` caches the last known value in
localStorage so the sheet credit does not flash on load, and that cache is
explicitly *not* the authority — `readProfile()` overwrites it from the
database on every sign-in.

This matters because the alternative does not work. If the browser decided its
own entitlement, "paid tier" would mean nothing: anyone could open devtools and
set a flag. So `firestore.rules` refuses client writes to four fields:

    pro, proSince, proSource, stripeCustomerId

They are refused on `create` (a new profile may not arrive carrying `pro`) and
on `update` (an existing profile may not gain, lose, or change it). Entitlement
can therefore only be set by something holding admin credentials — a Cloud
Function, or a human in the console.

The profile document is created by `syncProfile()`, which hangs off the auth
state change rather than off a particular button — there is more than one way
to arrive signed in, and an earlier version created the profile only in the
Google button's click handler, so email-link sign-ups got no profile row at
all. It writes only `email` and `created`, which is what lets a new profile
pass the `create` rule, and it writes `created` once rather than on every
sign-in.

Two tabs signing in at once can both decide the document is missing and both
write it. The loser's write would drop `pro` from an entitled profile — so the
rules refuse that too, and there is a test for exactly that shape.

## Verifying the rule that the money rests on

`tools/test-rules.py` runs 19 cases against the Security Rules test API. It
needs `firebase login` and writes nothing to the database.

    python3 tools/test-rules.py              # test firestore.rules
    python3 tools/test-rules.py --deployed   # test what is actually live
    python3 tools/test-rules.py --mutate     # prove the suite has teeth

Three habits are deliberate here, each of them fixing a way this check could
have quietly passed while proving nothing:

1. **Half the cases expect ALLOW.** A suite of nothing but DENY assertions
   passes perfectly against a rule that denies everything. The Firebase
   console's own Rules Playground did exactly this to us: it cannot populate
   `request.resource.data` for a `create`, so *every* simulation failed with
   "Property data is undefined" — and the attack case looked like it was being
   correctly refused. It was not being evaluated at all.
2. **`--deployed` tests the live ruleset, not the file.** The console holds the
   rules on one line; the repo holds them formatted with commentary. Passing
   locally says nothing about production, so `--deployed` fetches the released
   ruleset, runs the same suite against it, and reports drift from
   `firestore.rules` (comparing with comments and whitespace normalised, so
   reformatting does not read as a change).
3. **`--mutate` removes the guard and expects failure.** If deleting
   `hasAny(locked())` does not break the suite, the suite is decorative. It
   currently flips exactly the six escalation cases and nothing else.

## Not yet built

Checkout. Cloud Functions and the Stripe extension both require the Blaze
plan, which requires billing details — the account owner's action, not
something to be automated. Until that exists there is no way to become Pro
except by editing the field in the console, and `docs/pro/` says so plainly
rather than collecting interest in a product that cannot be bought.

Also waiting on Blaze: scheduled Firestore backups.
