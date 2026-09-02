# Accounts and the paid tier

Three things are reserved for Pro:

1. **The sheet footer** — print without the `all-printable.com` credit, or put
   your own name there instead. See `branding.md`.
2. **Designs saved to the account**, rather than to one browser.
3. **Pro presets** — six so far, marked `pro: true` in each maker's `PRESETS`
   array, shown to everyone and refused to non-subscribers.

Everything that is free stays free: all 26 printables, every layout, every
paper size, every option, and all 65 existing presets. Adding a Pro preset must
never mean moving a free one — `/pro/` promises exactly that, so the promise
and the code have to agree.

Pro presets are shown rather than hidden. A chip nobody can see sells nothing,
and a locked one is how someone learns Pro exists. `AP.fillPresets` marks them,
`studio.js` refuses the click, and `AP.studioRefresh` re-renders the chips when
entitlement changes so a fresh subscriber is not left looking at padlocks.

All of it is gated in the browser, and the engine that draws a Pro preset ships
to everyone — this is the same honest exchange as the sheet credit, and `/pro/`
says so plainly under "Honest limits".

## The shape of it

- **Firebase Auth** for identity. **Google is the only provider**, and it is
  the only one *enabled* — email/password and the email-link flow are turned
  off in the project, so a hidden button is not the only thing stopping them.
  `accounts:signUp` and `accounts:sendOobCode` both return
  `OPERATION_NOT_ALLOWED`. This site never handles a password.
- **Firestore** for the entitlement and for saved designs.
- **No server of ours.** The site is still static files on GitHub Pages. The
  browser talks to Firebase directly.

## Nothing loads for people who do not use it

`core/account.js` does not fetch the Firebase SDK on page load. It imports the
SDK only when someone signs in, or when `ap.account.seen` in localStorage says
this browser has a session to restore. A visitor who never signs in makes zero
requests to Google, which is the same bargain `analytics.js` makes.

## Where sign-in lives

The control sits in the top right of the header on the pages where an account
means something: the seven makers, the home page, and `/pro/`. `core/account.js`
mounts it itself into `.site-header`, so those pages need no per-page markup
that could drift. The maker sidebar keeps only what is about that maker —
saving and reopening its designs — and points at the header for identity.

Two things the header made necessary. The popover is placed in viewport
coordinates by JavaScript, not anchored to the trigger, because below 760px the
header wraps and the trigger can land anywhere on a second row; right-anchoring
pushed the popover off the left edge of the screen. And the signed-in address
collapses to just the avatar below 900px, because the maker header already
carries three action buttons and the account control was the sixth item.

Its messages appear inside the popover rather than through `AP.toast`, because
`/pro/` loads `account.js` without `util.js` — the toast helper is not there to
call.

The 26 landing pages deliberately do **not** load it. They ship no JavaScript
at all, and that is worth more than a sign-in button on a page whose job is to
answer a search and hand the visitor to a maker. Their headers carry the same
"Open the maker" call to action they always did. If you add a script to a
landing page, this is the property you are spending.

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
Google button's click handler. That was a bug when the email-link flow still
existed — those sign-ups got no profile row at all — and it would come back
the moment a second provider is added. It writes only `email` and `created`, which is what lets a new profile
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

## Buying it

Built, not live — see `pro-checkout.md`. Pro is a monthly Stripe subscription;
the webhook in `functions/` is the only thing that grants it, and it is the
only thing that can, because the rules refuse those fields to browsers.

Until the Blaze plan is enabled the functions cannot deploy, so there is a
payment-link mode that takes money today and leaves activation to a human.

Also waiting on Blaze: scheduled Firestore backups.

## Why only Google

Two providers meant two code paths into the same profile-creation step, and the
one that was not wired to a button is exactly the one that broke (see above).
Google alone removes that class of bug, and removes the email-sending surface —
`sendOobCode` is an unauthenticated endpoint that will mail anyone on request,
which is a spam vector nobody was watching.

The provider is disabled in Firebase rather than merely hidden in the popover.
Hiding a button stops the honest path only; the REST endpoint stays open to
anyone reading the public API key out of `account.js`, which is public by
design.

Turning it off was safe because no account had ever used it: the only user at
the time was a `google.com` account. If email sign-in ever comes back, the
thing to check first is that profile creation still hangs off the auth state
change and not off a button.
