/* ==========================================================================
   Analytics — Firebase / Google Analytics, behind consent.

   The site's promise to visitors is that their work stays on their machine,
   and that promise has to keep being true. So:

   - Nothing loads and no cookie is set until someone opts in. Decline, and
     the Firebase SDK is never even fetched.
   - Only interface choices are recorded: which maker, which layout, which
     paper size. Never the content — no event text, habit names, addresses,
     word lists or photos. Parameters are whitelisted, not filtered.
   - The choice is remembered locally and can be changed from the footer.

   Set DEFAULT_ON to true to make analytics opt-OUT instead. That is a policy
   decision with legal weight in the EU, so it is deliberately one constant in
   one place rather than something scattered through the code.
   ========================================================================== */
window.AP = window.AP || {};
(function () {
  var DEFAULT_ON = false;
  var CHOICE_KEY = 'ap.analytics.consent';
  var SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';

  var CONFIG = {
    apiKey: 'AIzaSyDqgs48WXHijg0D0e14fjifzcyZ_cooOf4',
    authDomain: 'ptk-studio-allprintable.firebaseapp.com',
    projectId: 'ptk-studio-allprintable',
    storageBucket: 'ptk-studio-allprintable.firebasestorage.app',
    messagingSenderId: '503847557525',
    appId: '1:503847557525:web:48c7d3f9cc08d3188cbe9c',
    measurementId: 'G-8KW8B8XRSJ'
  };

  /* Event parameters that may be sent. Anything else is dropped — a
     whitelist, so a careless call site cannot leak a user's own text. */
  var ALLOWED = [
    'maker', 'preset', 'layout', 'type', 'paper', 'orientation', 'theme',
    'pages', 'action', 'stock', 'difficulty', 'countries',
    /* Subscription funnel. Every one of these is a fixed word chosen in code
       — 'done', 'cancelled', 'functions' — never anything a user typed, and
       never an amount, an email or a Stripe id. */
    'result', 'mode'
  ];

  var queue = [], ready = false, logEventFn = null, analyticsRef = null;

  function stored() {
    try { return localStorage.getItem(CHOICE_KEY); } catch (e) { return null; }
  }
  function remember(value) {
    try { localStorage.setItem(CHOICE_KEY, value); } catch (e) {}
  }

  function granted() {
    var choice = stored();
    if (choice === 'yes') return true;
    if (choice === 'no') return false;
    return DEFAULT_ON;
  }

  /* Do Not Track and Global Privacy Control are respected as a "no", and we
     do not even ask. */
  function refused() {
    return navigator.doNotTrack === '1' || window.doNotTrack === '1' ||
           navigator.globalPrivacyControl === true;
  }

  function clean(params) {
    var out = {};
    Object.keys(params || {}).forEach(function (k) {
      if (ALLOWED.indexOf(k) === -1) return;
      var v = params[k];
      if (typeof v === 'string') v = v.slice(0, 64);
      out[k] = v;
    });
    return out;
  }

  function load() {
    if (ready || logEventFn) return;
    logEventFn = true;   /* guard against a second load while importing */
    Promise.all([
      import(SDK + 'firebase-app.js'),
      import(SDK + 'firebase-analytics.js')
    ]).then(function (mods) {
      var app = mods[0].initializeApp(CONFIG);
      analyticsRef = mods[1].getAnalytics(app);
      logEventFn = mods[1].logEvent;
      ready = true;
      queue.splice(0).forEach(function (item) {
        logEventFn(analyticsRef, item[0], item[1]);
      });
    }).catch(function () {
      /* Blocked by an extension, offline, or CDN unreachable. The site does
         not depend on analytics, so this is not worth surfacing. */
      logEventFn = null;
    });
  }

  AP.analytics = {
    /* Call once per page with the maker's name. */
    init: function (maker) {
      AP.analytics.maker = maker || 'site';
      if (refused()) { remember('no'); return; }
      if (granted()) load();
      AP.analytics.track('page_view', { maker: AP.analytics.maker });
      renderBanner();
    },

    track: function (name, params) {
      if (!granted() || refused()) return;
      var payload = clean(params);
      if (AP.analytics.maker && !payload.maker) payload.maker = AP.analytics.maker;
      if (ready) logEventFn(analyticsRef, name, payload);
      else { queue.push([name, payload]); load(); }
    },

    setConsent: function (yes) {
      remember(yes ? 'yes' : 'no');
      if (yes) { load(); AP.analytics.track('page_view', { maker: AP.analytics.maker }); }
      var bar = document.getElementById('consent-bar');
      if (bar) bar.remove();
      var link = document.getElementById('privacy-link');
      if (link) link.textContent = privacyLabel();
    },

    isOn: granted
  };

  function privacyLabel() {
    return granted() ? 'Usage stats: on' : 'Usage stats: off';
  }

  /* ---- The ask ------------------------------------------------------------ */
  function renderBanner() {
    if (refused() || stored()) return;          /* already decided */
    if (document.getElementById('consent-bar')) return;

    var bar = document.createElement('div');
    bar.id = 'consent-bar';
    bar.className = 'consent-bar no-print';
    bar.innerHTML =
      '<p>Nothing you make here leaves your device. May we count anonymous page ' +
      'and feature usage, so we know which printables to build next? ' +
      'Never your content.</p>' +
      '<div class="consent-actions">' +
        '<button class="btn btn-sm" data-consent="no">No thanks</button>' +
        '<button class="btn btn-sm btn-primary" data-consent="yes">Allow</button>' +
      '</div>';
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (b) AP.analytics.setConsent(b.dataset.consent === 'yes');
    });
    document.body.appendChild(bar);
  }

  /* A permanent way to change the answer, dropped into any .site-footer or
     the sidebar foot. */
  AP.analytics.consentLink = function () {
    var a = document.createElement('button');
    a.id = 'privacy-link';
    a.className = 'linkish';
    a.type = 'button';
    a.textContent = privacyLabel();
    a.addEventListener('click', function () {
      AP.analytics.setConsent(!granted());
      a.textContent = privacyLabel();
      AP.toast(granted() ? 'Usage stats on — thank you' : 'Usage stats off');
    });
    return a;
  };
})();
