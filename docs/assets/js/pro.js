/* The buy area on /pro/.
 *
 * Rendered rather than hard-coded because what it should say depends on three
 * things the HTML cannot know: whether checkout is configured at all, whether
 * you are signed in, and whether you already have Pro. The static markup in
 * the page is the no-JavaScript answer — "not on sale here yet" — which is
 * also the honest answer when nothing is configured.
 */
(function () {
  function h(tag, props, kids) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === 'class') n.className = props[k];
      else if (k === 'text') n.textContent = props[k];
      else if (k === 'html') n.innerHTML = props[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), props[k]);
      else n.setAttribute(k, props[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  var box = null;

  function say(msg, kind) {
    var slot = box && box.querySelector('.pro-say');
    if (slot) { slot.textContent = msg; slot.className = 'pro-say' + (kind ? ' pro-say-' + kind : ''); }
  }

  function render() {
    if (!box || !window.AP || !AP.account) return;
    box.innerHTML = '';
    var mode = AP.account.checkoutMode();
    var user = AP.account.user();
    var pro  = AP.account.isPro();

    if (mode === 'none') {
      box.appendChild(h('p', { text:
        'Checkout is not connected yet, so Pro cannot be bought at the moment. ' +
        'When it opens, this is where it will happen.' }));
      return;
    }

    if (pro) {
      box.appendChild(h('p', { text: 'You have Pro. Your sheets print without the credit.' }));
      if (mode === 'functions') {
        box.appendChild(h('button', { class: 'btn', type: 'button', text: 'Manage billing',
          onclick: function () {
            say('Opening Stripe…');
            AP.account.manageBilling().catch(function (e) { say(e.message, 'warn'); });
          } }));
      } else {
        box.appendChild(h('p', { class: 'lp-free', text:
          'To cancel, reply to your receipt and we will sort it out.' }));
      }
      box.appendChild(h('p', { class: 'pro-say' }));
      return;
    }

    /* Signed out. Pointing at the header button is worse than being one: the
       first person to hit this read "sign in first" and reported that Get Pro
       was missing. Sessions are per-origin, so arriving from
       all-printable.com signed in there counts for nothing here. */
    if (!user) {
      /* Show the price before asking anyone to sign in for it.

         The element is put in place now and filled when the price arrives,
         rather than inserted relative to a sibling later: render() runs more
         than once (directly, and again from onChange), so a node captured by
         an async callback can be detached by the time it resolves — and
         insertBefore against a detached sibling throws. Setting textContent on
         a stale node is merely invisible, which is the failure worth having. */
      var priceEl = h('p', { class: 'pro-price' });
      box.appendChild(priceEl);
      box.appendChild(h('p', { text:
        'Pro is tied to your account, so sign in first. Signing in on ' +
        'all-printable.com does not carry over — this is a different site.' }));
      AP.account.price().then(function (p) {
        priceEl.textContent = AP.account.formatPrice(p) || '';
      });
      box.appendChild(h('p', { class: 'lp-cta' }, [
        h('button', { class: 'btn btn-primary', type: 'button',
          text: 'Sign in with Google', onclick: function () {
            say('Opening Google…');
            AP.account.signInGoogle().then(function () { say(''); },
              function (e) { say((e && e.code) || e.message, 'warn'); });
          } })
      ]));
      box.appendChild(h('p', { class: 'pro-say' }));
      return;
    }

    /* The price comes from Stripe, so what is shown here and what gets charged
       cannot disagree. Until it arrives the line says the shape of the deal
       without inventing a number. */
    var priceLine = h('span', { class: 'lp-free', text: 'Cancel any time.' });
    box.appendChild(h('p', { class: 'lp-cta' }, [
      h('button', { class: 'btn btn-primary', type: 'button', text: 'Get Pro',
        onclick: function () {
          say('Opening Stripe…');
          AP.account.startCheckout().catch(function (e) { say(e.message, 'warn'); });
        } }),
      priceLine
    ]));
    AP.account.price().then(function (p) {
      var t = AP.account.formatPrice(p);
      if (t) priceLine.textContent = t + ', cancel any time.';
    });

    /* Say plainly that a person has to flip the switch, rather than letting
       someone pay and wonder why nothing happened. */
    if (mode === 'link') {
      box.appendChild(h('p', { class: 'lp-free', text:
        'Activation is manual while we finish the automatic version, so Pro ' +
        'appears on your account within a day of paying — not instantly.' }));
    }
    box.appendChild(h('p', { class: 'pro-say' }));
  }

  /* Coming back from Stripe. The webhook may not have landed yet, so re-read
     the profile rather than trusting the cached flag. */
  function afterCheckout() {
    var m = /[?&]checkout=(done|cancelled)/.exec(location.search);
    if (!m) return;
    history.replaceState(null, '', location.pathname);
    if (m[1] === 'cancelled') { say('Checkout cancelled — nothing was charged.'); return; }
    say('Thanks. Checking your account…');
    if (AP.account.refresh) {
      AP.account.refresh().then(function () {
        render();
        if (!AP.account.isPro()) {
          say('Payment received. Pro will appear here shortly — reload in a moment.', 'ok');
        }
      });
    }
  }

  function init() {
    box = document.getElementById('pro-cta');
    if (!box || !window.AP || !AP.account) return;
    AP.account.onChange(render);
    render();
    afterCheckout();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
