/* ==========================================================================
   Sheet credit — the small "all-printable.com" that prints on every sheet.

   Two things matter here.

   1. It must not disturb any layout. The paper generator computes its drawing
      area in exact millimetres from the page size, margins and header/footer
      heights; adding a flex child after the fact would silently shrink the
      canvas and clip the grid. So the credit is positioned absolutely, in the
      margin, where it can never take space from anything.

   2. Removing it is meant to become a paid feature. That decision lives in
      one predicate, `AP.brand.hidden()`, so switching it on later is a flag,
      not a refactor. It deliberately has no URL or UI override: a credit that
      anyone can turn off for free is not a paid feature.
   ========================================================================== */
window.AP = window.AP || {};
(function () {
  var TEXT = 'all-printable.com';

  /* The single place entitlement is read. core/account.js mirrors the `pro`
     field from Firestore onto AP.entitlements.removeBranding; if nobody is
     signed in, AP.entitlements is absent and this is false. There is
     deliberately no URL or UI override — a switch here would make the paid
     feature free to anyone who found it. */
  function hidden() {
    return !!(AP.entitlements && AP.entitlements.removeBranding);
  }

  /* What a Pro subscriber puts in the corner instead of our credit — their
     own name, a class code, a studio. Empty means print nothing there, which
     is what Pro meant before this existed. */
  var MAX = 64;
  function custom() {
    var t = (AP.entitlements && AP.entitlements.sheetFooter) || '';
    return String(t).replace(/\s+/g, ' ').trim().slice(0, MAX);
  }

  /* The text this sheet should carry, or '' for none. */
  function footerText() {
    return hidden() ? custom() : TEXT;
  }

  /* Stamp one .page element. Safe to call twice — it replaces its own mark. */
  function stamp(page) {
    if (!page || !page.classList || !page.classList.contains('page')) return page;
    var existing = page.querySelector(':scope > .brand-credit');
    if (existing) existing.remove();

    var text = footerText();
    if (!text) return page;

    var mark = document.createElement('span');
    mark.className = 'brand-credit';
    /* A subscriber's own footer is theirs, not a credit for us — mark it so
       the stylesheet can treat it differently if it ever needs to. */
    if (text !== TEXT) mark.className += ' brand-custom';
    mark.textContent = text;
    page.appendChild(mark);
    return page;
  }

  AP.brand = {
    TEXT: TEXT,
    MAX: MAX,
    hidden: hidden,
    footerText: footerText,
    stamp: stamp,
    stampAll: function (pages) {
      (pages || []).forEach(stamp);
      return pages;
    }
  };
})();
