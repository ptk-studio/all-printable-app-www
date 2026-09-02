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
  var EMAIL_KEY = 'ap.account.email';   /* for completing an email link        */

  var CONFIG = {
    apiKey: 'AIzaSyDqgs48WXHijg0D0e14fjifzcyZ_cooOf4',
    authDomain: 'ptk-studio-allprintable.firebaseapp.com',
    projectId: 'ptk-studio-allprintable',
    storageBucket: 'ptk-studio-allprintable.firebasestorage.app',
    messagingSenderId: '503847557525',
    appId: '1:503847557525:web:48c7d3f9cc08d3188cbe9c',
    measurementId: 'G-8KW8B8XRSJ'
  };

  var mods = null, app = null, auth = null, db = null;
  var current = null, listeners = [], loading = null;

  function local(k, fallback) {
    try { var v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  }
  function setLocal(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function delLocal(k) { try { localStorage.removeItem(k); } catch (e) {} }

  function emit() {
    listeners.forEach(function (fn) { try { fn(current); } catch (e) {} });
  }

  /* Entitlement is mirrored onto AP.entitlements, which core/brand.js reads. */
  function applyPro(isPro) {
    AP.entitlements = AP.entitlements || {};
    AP.entitlements.removeBranding = !!isPro;
    setLocal(PRO_KEY, !!isPro);
  }
  applyPro(local(PRO_KEY, false) && local(SEEN_KEY, false));

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
        applyPro(data.pro === true);
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

  AP.account = {
    /* Restore a session only for browsers that have signed in before. */
    init: function () {
      if (local(SEEN_KEY, false)) load();
      if (AP.account.pendingEmailLink()) AP.account.completeEmailLink();
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

    /* Passwordless: we send a link and never handle a password. */
    sendEmailLink: function (email) {
      return load().then(function (m) {
        setLocal(EMAIL_KEY, email);
        return m.auth.sendSignInLinkToEmail(auth, email, {
          url: location.origin + location.pathname,
          handleCodeInApp: true
        });
      });
    },

    pendingEmailLink: function () {
      return /[?&](apiKey|oobCode)=/.test(location.search);
    },

    completeEmailLink: function () {
      return load().then(function (m) {
        if (!m.auth.isSignInWithEmailLink(auth, location.href)) return null;
        var email = local(EMAIL_KEY, '') ||
          window.prompt('Confirm the email address you used:');
        if (!email) return null;
        return m.auth.signInWithEmailLink(auth, email, location.href).then(function (res) {
          delLocal(EMAIL_KEY);
          history.replaceState(null, '', location.pathname + location.hash);
          return res;
        });
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
})();
