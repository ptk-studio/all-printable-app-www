# Buying Pro

Status: **live in Stripe test mode.** All three functions are deployed on
Node 22 in us-central1, the webhook is verifying against a real signing secret,
and `useFunctions` is `true`, so `/pro/` offers checkout to signed-in visitors.

The Stripe key in Secret Manager is `sk_test_…`. Nothing here can move real
money until that is swapped for a live key — and doing that means redoing the
product, price and webhook in live mode, because test and live share nothing.

    createCheckoutSession   https://createcheckoutsession-4hpnnniyeq-uc.a.run.app
    createPortalSession     https://createportalsession-4hpnnniyeq-uc.a.run.app
    stripeWebhook           https://us-central1-ptk-studio-allprintable.cloudfunctions.net/stripeWebhook

Verified against the deployed endpoints, not locally:

- an unsigned POST forging `customer.subscription.created` for a real uid is
  refused with 400, and the user's document was checked afterwards — still no
  `pro` field
- a bogus `Stripe-Signature` header and an empty body are refused the same way
- both callables answer 401 `UNAUTHENTICATED` without a signed-in user

**Still unproven:** a real purchase. Nothing has yet run through
`createCheckoutSession`, and no genuine Stripe event has reached the webhook.
See "First real test" below.

## First real test

In Stripe test mode, on app.all-printable.com:

1. Sign in, go to `/pro/`, press **Get Pro**.
2. Card `4242 4242 4242 4242`, any future expiry, any CVC.
3. Back on `/pro/`, the sheet credit should vanish within seconds — the webhook
   writes `pro: true` and the page re-reads the profile.
4. Check `users/<uid>` in Firestore: `pro`, `proSince`, `proStatus: active`,
   `stripeCustomerId`, `stripeSubscriptionId`.
5. In Stripe, cancel the subscription immediately. `pro` should go false and
   the credit should come back on the next load.

If step 3 does not happen, Stripe → Developers → Webhooks → the endpoint shows
every delivery and its response. A 400 there means the signing secret does not
match; a 200 saying `no user` means the subscription had no `uid` metadata.

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

## Where the three values come from

Everything below is in the Stripe dashboard. **Do it all in Test mode first** —
the toggle is top right, and test URLs contain `/test/`.

Test and live are two separate worlds. Keys, products, prices, webhooks and
customers created in one do not exist in the other. A `price_…` made in test
mode will fail against a live key with "No such price", which is the single
most common way this goes wrong. Going live later means redoing the product,
the price and the webhook, and swapping all three secrets.

### STRIPE_SECRET_KEY

Developers → API keys. Two keys are listed: the **publishable** key
(`pk_test_…`, safe in a browser, not used here) and the **secret** key
(`sk_test_…`). Click *Reveal test key* and copy that one.

It is the key that can move money and read every customer. It goes into Secret
Manager and nowhere else — not this repo, not `account.js`, not a chat window.

### STRIPE_PRICE_ID

There is nothing to copy until a product exists.

1. Products → **Add product**.
2. Name it (`All Printable Pro`).
3. Pricing: **Recurring**, billing period **Monthly**, set the amount and
   currency. The code sends `mode: 'subscription'`, so a one-off price will be
   rejected at checkout.
4. Save, open the product, find the price row, copy its ID.

It starts with **`price_`**. The product ID above it starts with `prod_` and is
the wrong one — checkout fails with "No such price" if you take that.

### STRIPE_WEBHOOK_SECRET

This one cannot be fetched first: the signing secret belongs to a webhook
endpoint, and the endpoint needs a URL that only exists after the functions
deploy. Hence the order in the next section — placeholder, deploy, real value,
redeploy.

Once deployed: Developers → Webhooks → **Add endpoint**.

- **URL**: what the deploy printed. It will be
  `https://us-central1-ptk-studio-allprintable.cloudfunctions.net/stripeWebhook`
  (gen-2 functions also answer on a `*.run.app` address; either works).
- **Events**: exactly these three, and nothing else —

      customer.subscription.created
      customer.subscription.updated
      customer.subscription.deleted

  Anything else is answered 200 and ignored, so subscribing to more just makes
  noise in the Stripe logs.

Then open the endpoint and reveal the **Signing secret**: `whsec_…`.

This is what proves a request really came from Stripe. Without it anyone who
finds the URL can POST a fake "subscription created" and grant themselves Pro,
which is why `stripeWebhook` rejects an unverified body before reading a single
field.

## Mode 2 — Cloud Functions, once Blaze is on

1. Enable Blaze on the Firebase project. **Done** — billing is live, and the
   cloudfunctions, run, cloudbuild, secretmanager, artifactregistry and
   eventarc APIs are enabled.
2. Set the three secrets. They never enter this repo:

       firebase functions:secrets:set STRIPE_SECRET_KEY
       firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
       firebase functions:secrets:set STRIPE_PRICE_ID

   For `STRIPE_WEBHOOK_SECRET` there is nothing real to set yet — put
   `whsec_placeholder` in, deploy, then come back with the real one. The deploy
   refuses to run while any of the three is unset.
3. `firebase deploy --only functions`
4. Stripe → Developers → Webhooks → add the `stripeWebhook` URL the deploy
   prints. Subscribe to exactly:

       customer.subscription.created
       customer.subscription.updated
       customer.subscription.deleted

   The signing secret it shows you is `STRIPE_WEBHOOK_SECRET`; set it and
   redeploy.
5. Set `useFunctions: true` in `account.js`, commit, push. **Not before**:
   until the real signing secret is in, every Stripe event fails verification,
   so a purchase would take the money and grant nothing.
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
