# Buying Pro

Status: **built, not live.** The code is here and tested as far as it can be.
Nothing is on sale until you do the steps below, and `/pro/` says so.

Pro is a **monthly subscription**. Entitlement follows the Stripe
subscription's status and nothing else — see `functions/entitlement.js`.

## Why there are two modes

Automatic activation needs a webhook, which needs Cloud Functions, which needs
the **Blaze plan**. This project is on Spark: billing is not enabled and the
Cloud Functions, Run, Build and Secret Manager APIs are all disabled. Enabling
Blaze means entering payment details, which is the account owner's job.

So `core/account.js` has two modes, both switched by a config block at the top
of the file. Neither value is a secret.

| | `paymentLink` set | `useFunctions: true` |
|---|---|---|
| Needs Blaze | no | **yes** |
| Taking money | works | works |
| Granting Pro | you, by hand | the webhook, in seconds |
| Cancellation | you, by hand | Stripe's billing portal |

## Mode 1 — a payment link, today

1. In Stripe: create a product and a **recurring monthly** price.
2. Create a **Payment Link** for that price.
3. Paste the URL into `CHECKOUT.paymentLink` in
   `docs/assets/js/core/account.js`, commit, push.

`/pro/` then shows a **Get Pro** button to signed-in visitors, and says
activation is manual — because it is, and someone who pays and sees nothing
happen will email you rather than wait.

The button appends `client_reference_id=<uid>`, so **the payment carries the
account it belongs to**. Without it a payment is an email address and a guess.

### Activating someone by hand

1. Stripe → Payments → the payment → `client_reference_id` is the Firebase uid.
2. Firebase console → Firestore → `users/<uid>`.
3. Set `pro` (boolean) `true`. Optionally `proSince` (number, ms) and
   `proSource` (string) `"stripe-manual"`.

Only the console can do this. The security rules refuse those fields to
browsers, which is the point — see `accounts.md`.

**This mode does not revoke.** If someone cancels in Stripe, Pro stays until
you set `pro: false` yourself. Watch Stripe's cancellation emails, or move to
mode 2.

## Mode 2 — Cloud Functions, once Blaze is on

1. Enable Blaze on the Firebase project.
2. Set the three secrets. They never enter this repo:

       firebase functions:secrets:set STRIPE_SECRET_KEY
       firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
       firebase functions:secrets:set STRIPE_PRICE_ID

   `STRIPE_PRICE_ID` is the `price_…` of the monthly price. Use Stripe **test
   mode** keys first.
3. `firebase deploy --only functions`
4. Stripe → Developers → Webhooks → add the `stripeWebhook` URL the deploy
   prints. Subscribe to exactly:

       customer.subscription.created
       customer.subscription.updated
       customer.subscription.deleted

   The signing secret it shows you is `STRIPE_WEBHOOK_SECRET`; set it and
   redeploy.
5. Set `useFunctions: true` in `account.js`, commit, push.
6. Test the whole path in Stripe test mode with card `4242 4242 4242 4242`,
   then cancel the subscription and check `pro` goes false.
7. Deactivate the payment link so nobody takes the unmonitored path.

## The decisions in entitlement.js

`checkout.session.completed` is deliberately **not** handled. It is a moment,
and a moment cannot say "they cancelled last week". The subscription events
carry a status, arrive for renewals and cancellations too, and make one code
path instead of two.

`past_due` **keeps** Pro. Stripe is still retrying the card and the customer
has not cancelled; pulling Pro mid-dunning over a temporary decline is worse
than carrying someone for a few days. `unpaid` is where Stripe gives up, and
that revokes. An unrecognised status never grants — Stripe has added statuses
before.

Webhooks retry and arrive out of order, so every write compares the Stripe
event's timestamp against `proUpdatedAt` and drops anything older. Without
that, a delayed "created" event can land after a "deleted" one and resurrect a
cancelled subscription.

A webhook that cannot be matched to a user returns **200**, not 500. Retrying
will not conjure a uid, and Stripe disables endpoints that keep failing. The
log line is the alert.

## Tests

    node functions/test-entitlement.js     # 25 cases, no Stripe, no Firebase
    python3 tools/test-rules.py --deployed # 23 cases against the live rules

The two are linked on purpose: the entitlement test asserts that every field
the webhook writes is one the rules lock. Add a field to the webhook without
adding it to `locked()` in `firestore.rules` and the test fails rather than a
hole opening quietly.

**What is not tested:** everything in `functions/index.js`. It has never run —
it cannot be deployed on Spark, and the Firestore emulator needs a JDK this
machine does not have. Stripe test mode is the first real exercise it gets.
