/* Deciding what a Stripe event means for a user's Pro flag.
 *
 * Kept pure and separate from index.js so it can be tested without Stripe,
 * without Firebase, and without deploying — which matters here, because this
 * project is on the Spark plan and the functions cannot be deployed yet. A
 * bug in this file either gives Pro away or takes it from someone who paid.
 *
 * The rule: entitlement follows the subscription's status, nothing else. Not
 * "a payment succeeded", not "a checkout completed" — those are moments, and
 * a moment cannot express "they cancelled last week". Stripe already tracks
 * the state machine; this reads it.
 */

/* Statuses Stripe considers a live subscription. `past_due` is deliberately
   included: Stripe is still retrying the card, the customer has not cancelled,
   and yanking Pro mid-dunning over a temporary decline is worse than carrying
   someone for a few days. `unpaid` is where Stripe gives up, so that is out. */
const ENTITLING = new Set(['active', 'trialing', 'past_due']);

const NOT_ENTITLING = new Set(['canceled', 'unpaid', 'incomplete',
                               'incomplete_expired', 'paused']);

function isEntitling(status) {
  if (ENTITLING.has(status)) return true;
  if (NOT_ENTITLING.has(status)) return false;
  /* An unknown status is not a licence to grant. Stripe has added statuses
     before and will again. */
  return false;
}

/* The fields a webhook may write. Everything here is refused to browsers by
   firestore.rules; only the Admin SDK can set them. */
function entitlementUpdate(sub, nowMs) {
  const pro = isEntitling(sub.status);
  const update = {
    pro,
    proSource: 'stripe',
    proStatus: sub.status,
    proUpdatedAt: nowMs,
    stripeCustomerId: sub.customerId,
    stripeSubscriptionId: sub.subscriptionId
  };
  /* proSince marks when Pro *began*, so it is written on the grant and left
     alone afterwards; the caller drops it if the doc already has one. */
  if (pro) update.proSince = nowMs;
  return update;
}

/* Webhooks arrive out of order and are retried. Applying an older event over a
   newer one would resurrect a cancelled subscription, so compare Stripe's own
   event timestamp against what we last wrote. Equal timestamps are allowed
   through: two events can share a second, and a retry writing the same state
   is harmless. */
function shouldApply(eventCreatedMs, lastAppliedMs) {
  if (!lastAppliedMs) return true;
  return eventCreatedMs >= lastAppliedMs;
}

/* Which uid does this subscription belong to?
 *
 * metadata.uid is set at checkout and is the authority. The customer lookup is
 * the fallback for subscriptions created outside our checkout — from the
 * Stripe dashboard, say — and the caller resolves it against Firestore. */
function uidFromSubscription(sub) {
  const meta = (sub.metadata && sub.metadata.uid) || null;
  if (meta) return { uid: meta, via: 'metadata' };
  if (sub.customerId) return { uid: null, via: 'customer', customerId: sub.customerId };
  return { uid: null, via: 'none' };
}

/* Events worth acting on. Anything else is acknowledged and ignored: replying
   200 to events we do not handle stops Stripe retrying them forever. */
const HANDLED = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted'
]);

function isHandled(type) { return HANDLED.has(type); }

module.exports = {
  ENTITLING, NOT_ENTITLING, isEntitling, entitlementUpdate,
  shouldApply, uidFromSubscription, isHandled, HANDLED
};
