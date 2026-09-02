/* Tests for the entitlement rules. Pure functions, no Stripe, no Firebase:
 *
 *   node functions/test-entitlement.js
 *
 * These are the only part of the checkout that can be verified before the
 * project moves off the Spark plan, so they carry more weight than usual.
 */
const assert = require('node:assert');
const E = require('./entitlement.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ok   ' + name); }
  catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}

console.log('\nWhich statuses grant Pro');
t('active grants',              () => assert.equal(E.isEntitling('active'), true));
t('trialing grants',            () => assert.equal(E.isEntitling('trialing'), true));
t('past_due still grants (Stripe is still retrying the card)',
                                () => assert.equal(E.isEntitling('past_due'), true));
t('canceled does not',          () => assert.equal(E.isEntitling('canceled'), false));
t('unpaid does not',            () => assert.equal(E.isEntitling('unpaid'), false));
t('incomplete does not',        () => assert.equal(E.isEntitling('incomplete'), false));
t('incomplete_expired does not',() => assert.equal(E.isEntitling('incomplete_expired'), false));
t('paused does not',            () => assert.equal(E.isEntitling('paused'), false));
t('an unknown future status does not grant',
                                () => assert.equal(E.isEntitling('quantum_superposition'), false));
t('undefined does not grant',   () => assert.equal(E.isEntitling(undefined), false));
t('every status is classified exactly once', () => {
  const both = [...E.ENTITLING].filter((s) => E.NOT_ENTITLING.has(s));
  assert.deepEqual(both, [], 'a status is in both sets: ' + both);
});

console.log('\nThe update written to Firestore');
const sub = { status: 'active', customerId: 'cus_1', subscriptionId: 'sub_1' };
t('granting sets pro and the stripe ids', () => {
  const u = E.entitlementUpdate(sub, 1000);
  assert.equal(u.pro, true);
  assert.equal(u.proSource, 'stripe');
  assert.equal(u.stripeCustomerId, 'cus_1');
  assert.equal(u.stripeSubscriptionId, 'sub_1');
  assert.equal(u.proSince, 1000);
});
t('revoking sets pro false and does NOT set proSince', () => {
  const u = E.entitlementUpdate({ ...sub, status: 'canceled' }, 2000);
  assert.equal(u.pro, false);
  assert.equal('proSince' in u, false, 'a revoke must not stamp proSince');
});
t('the update never contains a field the rules do not lock', () => {
  /* If this fails, firestore.rules must lock the new field too, or a browser
     could write it. */
  const locked = ['pro','proSince','proSource','proStatus','proUpdatedAt',
                  'stripeCustomerId','stripeSubscriptionId'];
  for (const k of Object.keys(E.entitlementUpdate(sub, 1))) {
    assert.ok(locked.includes(k), 'unlocked field in update: ' + k);
  }
});

console.log('\nOut-of-order and replayed webhooks');
t('first event applies',                () => assert.equal(E.shouldApply(500, null), true));
t('newer event applies',                () => assert.equal(E.shouldApply(900, 500), true));
t('older event is ignored',             () => assert.equal(E.shouldApply(400, 500), false));
t('same-timestamp retry still applies', () => assert.equal(E.shouldApply(500, 500), true));
t('a cancel then a stale activate leaves the user un-Pro', () => {
  const cancelAt = 2000, staleActivateAt = 1000;
  assert.equal(E.shouldApply(cancelAt, 1500), true);
  assert.equal(E.shouldApply(staleActivateAt, cancelAt), false,
    'the stale activate must not resurrect Pro');
});

console.log('\nFinding the user');
t('metadata.uid wins', () => {
  const r = E.uidFromSubscription({ metadata: { uid: 'u1' }, customerId: 'cus_1' });
  assert.equal(r.uid, 'u1'); assert.equal(r.via, 'metadata');
});
t('falls back to the customer id', () => {
  const r = E.uidFromSubscription({ metadata: {}, customerId: 'cus_9' });
  assert.equal(r.uid, null); assert.equal(r.via, 'customer'); assert.equal(r.customerId, 'cus_9');
});
t('no metadata and no customer is not resolvable', () => {
  assert.equal(E.uidFromSubscription({}).via, 'none');
});

console.log('\nWhich events we act on');
t('subscription created / updated / deleted are handled', () => {
  for (const e of ['customer.subscription.created','customer.subscription.updated',
                   'customer.subscription.deleted']) assert.ok(E.isHandled(e));
});
t('checkout.session.completed is NOT acted on', () => {
  /* Deliberate: the subscription events carry the status, arrive for renewals
     and cancellations too, and make one code path instead of two. */
  assert.equal(E.isHandled('checkout.session.completed'), false);
});
t('unrelated events are ignored', () => {
  assert.equal(E.isHandled('invoice.created'), false);
  assert.equal(E.isHandled('charge.refunded'), false);
});

console.log('\n%d passed, %d failed\n', pass, fail);
process.exit(fail ? 1 : 0);
