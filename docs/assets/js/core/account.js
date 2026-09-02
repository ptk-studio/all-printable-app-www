/* ==========================================================================
   Accounts — sign in, entitlement, and designs saved to the account.

   Three things shape this file.

   1. Nothing loads for people who do not use it. The Firebase SDK is fetched
      only when someone signs in, or when a returning visitor is known to have
      a session. Everyone else pays nothing, which is the same bargain the
      analytics module makes.

   2. Entitlement is never decided by the browser. `pro` lives in Firestore
      and the security rules refuse any client write to it. The cached copy
      here is a convenience so the sheet credit does not flash on load — it is
      not the authority.

   3. Signing in changes what the site can honestly promise. Work stays on the
      device until someone saves a design to their account; the copy says so.
   ========================================================================== */
window.AP = window.AP || {};
(function () {
  var SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  var SEEN_KEY = 'ap.account.seen';     /* "this browser has signed in before" */
  var PRO_KEY  = 'ap.account.pro';      /* cached entitlement, not authority   */
  var FOOTER_KEY = 'ap.account.footer'; /* cached custom sheet footer          */
  var PRICE_KEY  = 'ap.account.price';  /* cached price, refreshed daily       */

  var CONFIG = {
    apiKey: 'AIzaSyDqgs48WXHijg0D0e14fjifzcyZ_cooOf4',
    authDomain: 'ptk-studio-allprintable.firebaseapp.com',
    projectId: 'ptk-studio-allprintable',
    storageBucket: 'ptk-studio-allprintable.firebasestorage.app',
    messagingSenderId: '503847557525',
    appId: '1:503847557525:web:48c7d3f9cc08d3188cbe9c',
    measurementId: 'G-8KW8B8XRSJ'
  };

  /* ---- how Pro is bought --------------------------------------------------
     Neither value is a secret. A Stripe Payment Link URL is public by design,
     and this file is public anyway.

     Two modes. `useFunctions` is the live one and has been since 2026-09-02;
     `paymentLink` is kept as the fallback for a project without deployed
     functions, and as the way back if they ever have to come down.

     useFunctions  IN USE. Checkout runs through createCheckoutSession and the
                   webhook grants Pro on its own. Needs the functions deployed,
                   which they are.

     paymentLink   A Stripe Payment Link. People can pay, and their uid rides
                   along as client_reference_id so you can see who paid — but
                   nothing grants Pro automatically. You set `pro: true` on
                   their user document in the Firestore console. Manual, and
                   only worth it when the functions are unavailable.

     With both blank/false, /pro/ says Pro is not on sale, which is the truth
     rather than a form that goes nowhere. */
  var CHECKOUT = {
    paymentLink: '',
    useFunctions: true
  };

  var mods = null, app = null, auth = null, db = null;
  var current = null, listeners = [], loading = null, booted = false;

  function local(k, fallback) {
    try { var v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  }
  function setLocal(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function delLocal(k) { try { localStorage.removeItem(k); } catch (e) {} }

  function emit() {
    listeners.forEach(function (fn) { try { fn(current); } catch (e) {} });
  }

  /* Analytics is not loaded on every page that loads this file, and it is
     absent entirely for anyone who declined. Both are normal. */
  function track(name, params) {
    if (AP.analytics && AP.analytics.track) AP.analytics.track(name, params);
  }

  /* Entitlement is mirrored onto AP.entitlements, which core/brand.js reads. */
  function applyPro(isPro) {
    AP.entitlements = AP.entitlements || {};
    AP.entitlements.removeBranding = !!isPro;
    setLocal(PRO_KEY, !!isPro);
    if (!isPro) AP.entitlements.sheetFooter = '';
  }

  /* The subscriber's own sheet footer. Cached like the entitlement so it does
     not flash on load; the profile read is the authority. Only meaningful
     while pro is true — brand.js ignores it otherwise. */
  function applyFooter(text) {
    AP.entitlements = AP.entitlements || {};
    AP.entitlements.sheetFooter = text || '';
    setLocal(FOOTER_KEY, text || '');
  }
  applyPro(local(PRO_KEY, false) && local(SEEN_KEY, false));
  if (AP.entitlements.removeBranding) applyFooter(local(FOOTER_KEY, ''));

  function load() {
    if (loading) return loading;
    loading = Promise.all([
      import(SDK + 'firebase-app.js'),
      import(SDK + 'firebase-auth.js'),
      import(SDK + 'firebase-firestore.js')
    ]).then(function (m) {
      mods = { app: m[0], auth: m[1], db: m[2] };
      app = mods.app.initializeApp(CONFIG, 'account');
      auth = mods.auth.getAuth(app);
      db = mods.db.getFirestore(app);
      mods.auth.onAuthStateChanged(auth, function (u) {
        current = u || null;
        if (u) { setLocal(SEEN_KEY, true); syncProfile(); }
        else { applyPro(false); delLocal(SEEN_KEY); }
        emit();
        if (AP.brand && AP.studio) redrawSheets();
      });
      return mods;
    });
    return loading;
  }

  /* The sheet credit is stamped at render time, so entitlement changes need a
     re-render rather than a DOM tweak. */
  function redrawSheets() {
    if (typeof AP.studioRefresh === 'function') AP.studioRefresh();
  }

  /* Read the profile, creating it if this is the first sign-in.

     This hangs off the auth state change rather than off a particular button,
     because there is more than one way to arrive signed in: the Google popup,
     an email link, or a restored session. Hanging it off the Google button
     meant email-link sign-ups never got a profile row at all.

     The write never includes `pro` — the rules refuse it, and entitlement is
     not the browser's to assert. `created` is written once, on creation, so
     signing in again does not reset the sign-up date. */
  function syncProfile() {
    if (!current) return Promise.resolve(null);
    var ref = mods.db.doc(db, 'users', current.uid);
    return mods.db.getDoc(ref).then(function (snap) {
      if (snap.exists()) {
        var data = snap.data();
        /* The one place the client learns it has become Pro. Fired on the
           transition only, from the server's answer rather than the cached
           flag, so it counts activations and not page loads by a subscriber.
           This is the closest the browser gets to "a subscription started" —
           Stripe is still the authority for how many exist. */
        var was = local(PRO_KEY, false);
        applyPro(data.pro === true);
        if (data.pro === true && !was) track('pro_activated');
        if (data.pro === true) applyFooter(data.sheetFooter || '');
        return data;
      }
      applyPro(false);
      return mods.db.setDoc(ref, {
        email: current.email || '', created: Date.now()
      }).then(function () { return null; });
    }).catch(function () {
      applyPro(false);
      return null;
    }).then(function (data) {
      emit();
      redrawSheets();
      return data;
    });
  }

  /* ---- the header control -------------------------------------------------
     Sign-in belongs to the site, not to one maker's sidebar, so it sits in the
     top-right of the header on the pages where an account means something: the
     makers, the home page and /pro/. This mounts itself, so any page that
     loads account.js and has a .site-header gets it with no per-page markup to
     keep in sync. The 26 landing pages deliberately do not load this file —
     they ship no JavaScript at all.

     Messages appear inside the popover rather than through AP.toast, because
     /pro/ loads this file as its only script — there is no toast helper to
     call there. ------------------------------------------------------------ */

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

  var host = null, pop = null, trigger = null;

  function closePop() {
    if (!pop) return;
    pop.hidden = true;
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  /* Place the popover in viewport coordinates rather than anchoring it to the
     trigger's right edge. Below 760px the header wraps, so the trigger can sit
     anywhere on a second row — right-anchoring pushed the popover off the left
     edge of the screen. Clamping to the viewport handles wrapping, narrow
     phones and long addresses with one rule. */
  function placePop() {
    var t = trigger.getBoundingClientRect();
    var w = pop.offsetWidth || 288;
    var gap = 8;
    var left = Math.min(Math.max(gap, t.right - w), window.innerWidth - w - gap);
    pop.style.left = Math.max(gap, left) + 'px';
    pop.style.top = (t.bottom + gap) + 'px';
  }

  function openPop() {
    if (!pop) return;
    pop.hidden = false;
    placePop();
    trigger.setAttribute('aria-expanded', 'true');
    var first = pop.querySelector('input, button');
    if (first) first.focus();
  }

  function say(msg, kind) {
    var slot = pop && pop.querySelector('.acct-say');
    if (slot) {
      slot.textContent = msg;
      slot.className = 'acct-say' + (kind ? ' acct-say-' + kind : '');
    }
  }

  /* Errors from Firebase are codes like "auth/popup-closed-by-user". Say the
     handful people actually hit in words, and show the code for the rest. */
  function readable(e) {
    var code = (e && e.code) || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request')
      return 'Sign-in window closed.';
    if (code === 'auth/popup-blocked')
      return 'Your browser blocked the sign-in window. Allow popups and try again.';
    if (code === 'auth/network-request-failed')
      return 'Network problem — check your connection and try again.';
    if (code === 'auth/invalid-email') return 'That does not look like an email address.';
    if (code === 'auth/too-many-requests') return 'Too many attempts. Try again shortly.';
    return code || (e && e.message) || 'Something went wrong.';
  }

  /* Google is the only way in. There is no email or password field here, and
     no email-link fallback: the provider is disabled in Firebase too, so this
     is the only sign-in the project accepts rather than merely the only one
     shown. */
  function signedOutPop() {
    return [
      h('p', { class: 'acct-pop-title', text: 'Sign in to All Printable' }),
      h('p', { class: 'acct-pop-note', text:
        'Free, and it takes a moment. Your saved designs follow you to any ' +
        'device instead of living in one browser.' }),
      h('button', { class: 'btn btn-sm btn-primary acct-wide', type: 'button',
        text: 'Continue with Google', onclick: function () {
          say('Opening Google…');
          AP.account.signInGoogle().then(function () { say(''); },
            function (e) { say(readable(e), 'warn'); });
        } }),
      h('p', { class: 'acct-say' }),
      h('p', { class: 'acct-pop-fine', html:
        'We never see a password. <a href="' + proHref() + '">What Pro includes</a>' })
    ];
  }

  function signedInPop(user, pro) {
    return [
      h('div', { class: 'acct-pop-id' }, [
        h('span', { class: 'acct-avatar acct-avatar-lg', text: initial(user) }),
        h('span', { class: 'acct-pop-mail', text: user.email || 'Signed in' })
      ]),
      h('p', { class: 'acct-pop-plan' }, [
        h('span', { class: 'badge' + (pro ? '' : ' badge-soon'), text: pro ? 'Pro' : 'Free' }),
        h('span', { class: 'acct-pop-note', text: pro
          ? 'Sheets print without the site credit.'
          : 'Sheets carry a small all-printable.com credit.' })
      ]),
      h('a', { class: 'btn btn-sm acct-wide', href: proHref(),
        text: pro ? 'What Pro includes' : 'See what Pro changes' }),
      h('p', { class: 'acct-say' }),
      h('button', { class: 'btn btn-sm btn-ghost acct-wide', type: 'button',
        text: 'Sign out', onclick: function () {
          say('Signing out…');
          AP.account.signOut().then(function () { closePop(); },
            function (e) { say(readable(e), 'warn'); });
        } })
    ];
  }

  /* Root-relative, because this control appears at three directory depths.
     Firebase auth needs a real origin anyway, so file:// is already out. */
  function proHref() { return '/pro/'; }

  function initial(user) {
    return ((user.email || '?').trim().charAt(0) || '?').toUpperCase();
  }

  function renderHeader() {
    if (!host) return;
    host.innerHTML = '';
    var user = current;
    var pro = !!(AP.entitlements && AP.entitlements.removeBranding);

    trigger = h('button', {
      class: 'btn btn-sm acct-trigger' + (user ? ' acct-trigger-in' : ''),
      type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false',
      'aria-label': user ? 'Account menu' : 'Sign in',
      onclick: function (ev) {
        ev.stopPropagation();
        if (pop.hidden) openPop(); else closePop();
      }
    }, user
      ? [h('span', { class: 'acct-avatar', text: initial(user) }),
         h('span', { class: 'acct-who', text: user.email || 'Account' }),
         pro ? h('span', { class: 'badge acct-badge', text: 'Pro' }) : null]
      : [h('span', { text: 'Sign in' })]);

    pop = h('div', { class: 'acct-pop', role: 'dialog', 'aria-label': 'Account' },
      user ? signedInPop(user, pro) : signedOutPop());
    pop.hidden = true;

    host.appendChild(trigger);
    host.appendChild(pop);
  }

  function mountHeader() {
    var header = document.querySelector('.site-header');
    if (!header || header.querySelector('.acct')) return;
    host = h('div', { class: 'acct' });
    header.appendChild(host);
    document.addEventListener('click', function (ev) {
      if (host && !host.contains(ev.target)) closePop();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closePop();
    });
    ['resize', 'scroll'].forEach(function (ev) {
      window.addEventListener(ev, function () {
        if (pop && !pop.hidden) placePop();
      }, { passive: true });
    });
    renderHeader();
  }

  AP.account = {
    /* Restore a session only for browsers that have signed in before.
       Safe to call twice: account.js boots itself, and studio.js calls it too. */
    init: function () {
      if (booted) return;
      booted = true;
      if (local(SEEN_KEY, false)) load();
    },

    onChange: function (fn) { listeners.push(fn); fn(current); },
    user: function () { return current; },
    isPro: function () { return !!(AP.entitlements && AP.entitlements.removeBranding); },
    ready: function () { return load(); },

    signInGoogle: function () {
      return load().then(function (m) {
        var provider = new m.auth.GoogleAuthProvider();
        return m.auth.signInWithPopup(auth, provider);
      });
    },

    /* The footer a subscriber prints instead of our credit. Stored on the
       profile rather than in this browser, so it follows them to a phone.
       `sheetFooter` is deliberately NOT a locked field: it is the user's own
       text, and the rules cap its length rather than forbidding it. */
    sheetFooter: function () {
      return (AP.entitlements && AP.entitlements.sheetFooter) || '';
    },

    setSheetFooter: function (text) {
      if (!current) return Promise.reject(new Error('not signed in'));
      if (!AP.account.isPro()) return Promise.reject(new Error('Pro only'));
      var clean = String(text || '').replace(/\s+/g, ' ').trim()
        .slice(0, (AP.brand && AP.brand.MAX) || 64);
      applyFooter(clean);
      if (typeof AP.studioRefresh === 'function') AP.studioRefresh();
      return mods.db.setDoc(mods.db.doc(db, 'users', current.uid),
        { sheetFooter: clean }, { merge: true });
    },

    /* ---- buying Pro ------------------------------------------------------ */

    /* What the page should offer: 'functions', 'link', or 'none'. */
    checkoutMode: function () {
      if (CHECKOUT.useFunctions) return 'functions';
      if (CHECKOUT.paymentLink) return 'link';
      return 'none';
    },

    /* What Pro costs, from Stripe. Cached for a day: the price changes about
       never, and this is otherwise a function call on every /pro/ view. */
    price: function () {
      var cached = local(PRICE_KEY, null);
      if (cached && cached.at && (Date.now() - cached.at) < 864e5) {
        return Promise.resolve(cached.v);
      }
      if (!CHECKOUT.useFunctions) return Promise.resolve(null);
      return load().then(function () {
        return import(SDK + 'firebase-functions.js');
      }).then(function (fns) {
        return fns.httpsCallable(fns.getFunctions(app, 'us-central1'), 'getPrice')({});
      }).then(function (res) {
        var v = res && res.data;
        if (v) setLocal(PRICE_KEY, { at: Date.now(), v: v });
        return v || null;
      }).catch(function () { return null; });
    },

    /* "$4.00 a month", from whatever Stripe actually charges. */
    formatPrice: function (p) {
      if (!p || typeof p.amount !== 'number' || !p.currency) return '';
      var money;
      try {
        money = new Intl.NumberFormat(undefined, {
          style: 'currency', currency: p.currency.toUpperCase(),
          minimumFractionDigits: p.amount % 100 === 0 ? 0 : 2
        }).format(p.amount / 100);
      } catch (e) { money = (p.amount / 100) + ' ' + p.currency.toUpperCase(); }
      if (!p.interval) return money;
      var every = p.intervalCount > 1 ? (' every ' + p.intervalCount + ' ' + p.interval + 's')
                                      : (' a ' + p.interval);
      return money + every;
    },

    /* Sends the browser to Stripe. Resolves only if something went wrong —
       on success the page has already navigated away. */
    startCheckout: function () {
      if (!current) return Promise.reject(new Error('not signed in'));
      var mode = AP.account.checkoutMode();

      if (mode === 'link') {
        /* client_reference_id is how a payment is tied back to an account.
           Without it a payment is an email address and a guess. */
        var url = CHECKOUT.paymentLink +
          (CHECKOUT.paymentLink.indexOf('?') === -1 ? '?' : '&') +
          'client_reference_id=' + encodeURIComponent(current.uid) +
          (current.email ? '&prefilled_email=' + encodeURIComponent(current.email) : '');
        location.assign(url);
        return Promise.resolve();
      }

      if (mode !== 'functions') return Promise.reject(new Error('checkout not configured'));

      return load().then(function () {
        return import(SDK + 'firebase-functions.js');
      }).then(function (fns) {
        var call = fns.httpsCallable(fns.getFunctions(app, 'us-central1'),
                                     'createCheckoutSession');
        return call({});
      }).then(function (res) {
        if (!res || !res.data || !res.data.url) throw new Error('no checkout url');
        location.assign(res.data.url);
      });
    },

    /* Stripe's billing portal — where someone cancels without emailing you.
       Only exists once the functions are deployed. */
    manageBilling: function () {
      if (!current) return Promise.reject(new Error('not signed in'));
      if (!CHECKOUT.useFunctions) return Promise.reject(new Error('portal needs the functions'));
      return load().then(function () {
        return import(SDK + 'firebase-functions.js');
      }).then(function (fns) {
        var call = fns.httpsCallable(fns.getFunctions(app, 'us-central1'),
                                     'createPortalSession');
        return call({});
      }).then(function (res) {
        if (!res || !res.data || !res.data.url) throw new Error('no portal url');
        location.assign(res.data.url);
      });
    },

    signOut: function () {
      return load().then(function (m) { return m.auth.signOut(auth); });
    },

    /* ---- Designs saved to the account ----------------------------------- */
    listDesigns: function (maker) {
      if (!current) return Promise.resolve([]);
      var col = mods.db.collection(db, 'users', current.uid, 'designs');
      return mods.db.getDocs(mods.db.query(col, mods.db.where('maker', '==', maker)))
        .then(function (snap) {
          var out = [];
          snap.forEach(function (d) { out.push(Object.assign({ id: d.id }, d.data())); });
          return out.sort(function (a, b) { return (b.saved || 0) - (a.saved || 0); });
        });
    },

    saveDesign: function (maker, name, state) {
      if (!current) return Promise.reject(new Error('not signed in'));
      var col = mods.db.collection(db, 'users', current.uid, 'designs');
      return mods.db.addDoc(col, {
        maker: maker, name: name, state: JSON.stringify(state), saved: Date.now()
      });
    },

    deleteDesign: function (id) {
      if (!current) return Promise.reject(new Error('not signed in'));
      return mods.db.deleteDoc(mods.db.doc(db, 'users', current.uid, 'designs', id));
    },

    /* The profile is created automatically on the first sign-in, whichever
       route it came in by — see syncProfile(). This stays as a way to force
       that check, and is safe to call more than once. */
    ensureProfile: function () {
      return current ? syncProfile() : Promise.resolve(null);
    },

    /* Re-read entitlement from the database, e.g. after a purchase lands. */
    refresh: function () {
      return current ? syncProfile() : Promise.resolve(null);
    }
  };

  /* Mount the header control on every page that loads this file, then restore
     any existing session. Runs itself so landing pages and the home page need
     no extra wiring. */
  function boot() {
    mountHeader();
    AP.account.init();
    AP.account.onChange(renderHeader);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else boot();
})();
