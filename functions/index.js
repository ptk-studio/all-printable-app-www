/* Stripe checkout for the Pro tier.
 *
 * Four functions:
 *   createCheckoutSession  callable — starts a subscription checkout
 *   getPrice               callable — the live price, so /pro/ cannot misquote it
 *   createPortalSession    callable — opens Stripe's billing portal to cancel
 *   stripeWebhook          https    — the only thing that may grant Pro
 *
 * DEPLOYED AND LIVE. The project is on Blaze, these functions are deployed to
 * us-central1, and checkout is switched on in core/account.js. getPrice reports
 * USD 5.00 monthly with livemode true: this is real money, not test mode.
 *
 * What that does not mean is that every path has been exercised. As of the
 * deploy (5c2944f) the webhook was verified against a synthetic signed event —
 * answered 200 on the current signing secret and 400 on the previous one — but
 * no real purchase has been through it yet. Until one has, treat the happy
 * path as deployed-and-plausible rather than proven, and change it with the
 * care you would give code that is already taking someone's money.
 *
 * The decisions live in entitlement.js, which is pure and separately tested;
 * see test-entitlement.js.
 *
 * Secrets are set with the CLI and never live in this repo:
 *   firebase functions:secrets:set STRIPE_SECRET_KEY
 *   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
 *   firebase functions:secrets:set STRIPE_PRICE_ID
 */
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
/* The modular imports, not `require('firebase-admin')` — firebase-admin v14
   dropped the namespaced admin.firestore(), and the old form fails at module
   load, which the deploy's analyse step catches before anything ships. */
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const E = require('./entitlement.js');

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const STRIPE_PRICE_ID = defineSecret('STRIPE_PRICE_ID');

const SITE = 'https://app.all-printable.com';
const REGION = 'us-central1';

initializeApp();
const db = getFirestore();

function stripe() {
  return require('stripe')(STRIPE_SECRET_KEY.value());
}

/* ---- checkout ----------------------------------------------------------- */

exports.createCheckoutSession = onCall(
  { region: REGION, secrets: [STRIPE_SECRET_KEY, STRIPE_PRICE_ID], cors: true },
  async (req) => {
    const uid = req.auth && req.auth.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');
    const email = (req.auth.token && req.auth.token.email) || undefined;

    const snap = await db.doc(`users/${uid}`).get();
    const data = snap.exists ? snap.data() : {};
    if (data.pro === true) {
      throw new HttpsError('failed-precondition', 'You already have Pro.');
    }

    /* Reuse the customer we made before, so a second subscription does not
       create a second Stripe customer for the same person — but only if it
       belongs to the Stripe world this key opens. Test and live share no
       objects, so handing a test customer id to a live checkout fails the
       session outright with "No such customer". Anyone who subscribed while
       the project was in test mode has exactly such an id on their profile,
       and would otherwise be unable to buy on the first day of live mode. */
    const liveKey = STRIPE_SECRET_KEY.value().startsWith('sk_live_');
    const sameWorld = data.stripeCustomerId && (!!data.stripeLivemode === liveKey);
    const customer = sameWorld ? data.stripeCustomerId : undefined;
    if (data.stripeCustomerId && !sameWorld) {
      logger.info('ignoring a stripe customer from the other mode', {
        uid, storedLivemode: !!data.stripeLivemode, keyIsLive: liveKey });
    }

    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRICE_ID.value(), quantity: 1 }],
      customer,
      customer_email: customer ? undefined : email,
      client_reference_id: uid,
      /* The webhook reads uid from the *subscription*, so it has to be set
         here — a session's metadata does not carry over to the subscription. */
      subscription_data: { metadata: { uid } },
      metadata: { uid },
      allow_promotion_codes: true,
      success_url: `${SITE}/pro/?checkout=done`,
      cancel_url: `${SITE}/pro/?checkout=cancelled`
    });

    return { url: session.url };
  }
);

/* What Pro costs, read from Stripe rather than written into the page.
 *
 * A price typed into the site is a price that can disagree with the one being
 * charged, and the first person to notice is a customer who has just been
 * charged something else. This cannot drift.
 *
 * No auth: the price is public, and the point is to show it to someone who has
 * not signed in yet. The client caches it for a day so this is not invoked on
 * every page view. */
exports.getPrice = onCall(
  { region: REGION, secrets: [STRIPE_SECRET_KEY, STRIPE_PRICE_ID], cors: true },
  async () => {
    const price = await stripe().prices.retrieve(STRIPE_PRICE_ID.value());
    return {
      amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring ? price.recurring.interval : null,
      intervalCount: price.recurring ? price.recurring.interval_count : 1,
      livemode: price.livemode
    };
  }
);

exports.createPortalSession = onCall(
  { region: REGION, secrets: [STRIPE_SECRET_KEY], cors: true },
  async (req) => {
    const uid = req.auth && req.auth.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');

    const snap = await db.doc(`users/${uid}`).get();
    const d = snap.exists ? snap.data() : {};
    const liveKey = STRIPE_SECRET_KEY.value().startsWith('sk_live_');
    const customer = (d.stripeCustomerId && !!d.stripeLivemode === liveKey)
      ? d.stripeCustomerId : null;
    if (!customer) throw new HttpsError('failed-precondition', 'No subscription to manage.');

    const session = await stripe().billingPortal.sessions.create({
      customer, return_url: `${SITE}/pro/`
    });
    return { url: session.url };
  }
);

/* ---- webhook ------------------------------------------------------------ */

/* Resolve the subscription to a uid. metadata.uid is the authority; the
   customer lookup covers subscriptions started outside our checkout. */
async function resolveUid(sub) {
  const found = E.uidFromSubscription(sub);
  if (found.uid) return found.uid;
  if (found.via !== 'customer') return null;
  const q = await db.collection('users')
    .where('stripeCustomerId', '==', found.customerId).limit(2).get();
  if (q.size === 1) return q.docs[0].id;
  /* Two users sharing a Stripe customer is a data problem, not something to
     guess at — granting the wrong person Pro is worse than granting nobody. */
  if (q.size > 1) logger.error('ambiguous stripe customer', { customerId: found.customerId });
  return null;
}

exports.stripeWebhook = onRequest(
  { region: REGION, secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    let event;
    try {
      /* rawBody, not req.body: the signature is over the exact bytes Stripe
         sent, and any reserialisation breaks it. */
      event = stripe().webhooks.constructEvent(
        req.rawBody, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET.value());
    } catch (err) {
      logger.warn('bad webhook signature', { message: err.message });
      return res.status(400).send('signature verification failed');
    }

    /* Acknowledge anything we do not act on, or Stripe retries it for days. */
    if (!E.isHandled(event.type)) return res.status(200).send('ignored');

    const s = event.data.object;
    const sub = {
      status: s.status,
      customerId: typeof s.customer === 'string' ? s.customer : (s.customer && s.customer.id),
      subscriptionId: s.id,
      metadata: s.metadata || {},
      livemode: !!event.livemode
    };

    const uid = await resolveUid(sub);
    if (!uid) {
      /* 200, not 500: retrying will not conjure a uid, and a stuck webhook
         endpoint gets disabled by Stripe. The log is the alert. */
      logger.error('webhook with no resolvable user', {
        type: event.type, customerId: sub.customerId, subscriptionId: sub.subscriptionId });
      return res.status(200).send('no user');
    }

    const ref = db.doc(`users/${uid}`);
    const eventMs = event.created * 1000;

    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const cur = snap.exists ? snap.data() : {};
        if (!E.shouldApply(eventMs, cur.proUpdatedAt)) {
          logger.info('stale event ignored', { uid, type: event.type, eventMs,
            lastApplied: cur.proUpdatedAt });
          return;
        }
        const update = E.entitlementUpdate(sub, eventMs);
        /* proSince records when Pro began, so keep the first one. */
        if (update.proSince && cur.proSince) delete update.proSince;
        tx.set(ref, update, { merge: true });
      });
    } catch (err) {
      /* A real failure: let Stripe retry this one. */
      logger.error('failed to apply entitlement', { uid, message: err.message });
      return res.status(500).send('write failed');
    }

    logger.info('entitlement applied', { uid, type: event.type, status: sub.status });
    return res.status(200).send('ok');
  }
);
