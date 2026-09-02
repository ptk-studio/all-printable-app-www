/* Stripe checkout for the Pro tier.
 *
 * Three functions:
 *   createCheckoutSession  callable — starts a subscription checkout
 *   createPortalSession    callable — opens Stripe's billing portal to cancel
 *   stripeWebhook          https    — the only thing that may grant Pro
 *
 * NOT YET DEPLOYED. Cloud Functions need the Blaze plan and this project is on
 * Spark, so none of this has run against real Stripe. What is tested is
 * entitlement.js, which holds the decisions; see test-entitlement.js. Treat
 * the plumbing here as unverified until the first webhook arrives, and use
 * Stripe's test mode for that.
 *
 * Secrets are set with the CLI and never live in this repo:
 *   firebase functions:secrets:set STRIPE_SECRET_KEY
 *   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
 *   firebase functions:secrets:set STRIPE_PRICE_ID
 */
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const E = require('./entitlement.js');

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const STRIPE_PRICE_ID = defineSecret('STRIPE_PRICE_ID');

const SITE = 'https://app.all-printable.com';
const REGION = 'us-central1';

admin.initializeApp();
const db = admin.firestore();

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

    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRICE_ID.value(), quantity: 1 }],
      /* Reuse the customer if we have made one, so a second subscription does
         not create a second Stripe customer for the same person. */
      customer: data.stripeCustomerId || undefined,
      customer_email: data.stripeCustomerId ? undefined : email,
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

exports.createPortalSession = onCall(
  { region: REGION, secrets: [STRIPE_SECRET_KEY], cors: true },
  async (req) => {
    const uid = req.auth && req.auth.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');

    const snap = await db.doc(`users/${uid}`).get();
    const customer = snap.exists && snap.data().stripeCustomerId;
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
      metadata: s.metadata || {}
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
