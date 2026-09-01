/* Small shared helpers: DOM building, date maths, formatting, storage.
   Deliberately dependency-free so every page works from file:// too. */
window.AP = window.AP || {};

/* ---------- DOM ---------------------------------------------------------- */
AP.el = function (tag, attrs, children) {
  var node = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    });
  }
  (children || []).forEach(function (c) {
    if (c === null || c === undefined || c === false) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
};

AP.$  = function (sel, root) { return (root || document).querySelector(sel); };
AP.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

AP.svg = function (viewBox, inner, attrs) {
  return '<svg viewBox="' + viewBox + '" xmlns="http://www.w3.org/2000/svg" ' +
    (attrs || '') + '>' + inner + '</svg>';
};

/* ---------- Dates -------------------------------------------------------- */
/* Everything uses local-noon Date objects so DST never shifts a calendar day. */
AP.date = function (y, m, d) { return new Date(y, m, d, 12, 0, 0, 0); };
AP.today = function () { var n = new Date(); return AP.date(n.getFullYear(), n.getMonth(), n.getDate()); };
AP.daysInMonth = function (y, m) { return new Date(y, m + 1, 0).getDate(); };
AP.addDays = function (dt, n) { return AP.date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n); };
AP.addMonths = function (y, m, n) {
  var t = y * 12 + m + n;
  return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
};
AP.sameDay = function (a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};
AP.key = function (dt) {
  return dt.getFullYear() + '-' + AP.pad(dt.getMonth() + 1) + '-' + AP.pad(dt.getDate());
};
AP.pad = function (n) { return n < 10 ? '0' + n : String(n); };

/* ISO-8601 week number (weeks start Monday, week 1 contains the first Thursday). */
AP.isoWeek = function (dt) {
  var d = AP.date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  var week1 = AP.date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

/* Simple sequential week number counted from Jan 1 (US convention). */
AP.usWeek = function (dt, weekStart) {
  var jan1 = AP.date(dt.getFullYear(), 0, 1);
  var offset = (jan1.getDay() - weekStart + 7) % 7;
  return Math.floor((AP.dayOfYear(dt) + offset - 1) / 7) + 1;
};

AP.dayOfYear = function (dt) {
  return Math.round((dt - AP.date(dt.getFullYear(), 0, 1)) / 86400000) + 1;
};

/* Ordered weekday indexes for a grid, given the first day of the week. */
AP.weekOrder = function (weekStart) {
  var out = [];
  for (var i = 0; i < 7; i++) out.push((weekStart + i) % 7);
  return out;
};

/* All cells for a month grid, padded to whole weeks. */
AP.monthGrid = function (y, m, weekStart, forceSixWeeks) {
  var first = AP.date(y, m, 1);
  var lead = (first.getDay() - weekStart + 7) % 7;
  var total = lead + AP.daysInMonth(y, m);
  var weeks = Math.ceil(total / 7);
  if (forceSixWeeks) weeks = 6;
  var cells = [];
  for (var i = 0; i < weeks * 7; i++) {
    var dt = AP.addDays(first, i - lead);
    cells.push({ date: dt, inMonth: dt.getMonth() === m && dt.getFullYear() === y });
  }
  return { cells: cells, weeks: weeks };
};

/* ---------- Locale formatting -------------------------------------------- */
AP.LOCALES = [
  { id: 'en-US', label: 'English (US)' },
  { id: 'en-GB', label: 'English (UK)' },
  { id: 'es-ES', label: 'Español' },
  { id: 'fr-FR', label: 'Français' },
  { id: 'de-DE', label: 'Deutsch' },
  { id: 'it-IT', label: 'Italiano' },
  { id: 'pt-BR', label: 'Português' },
  { id: 'nl-NL', label: 'Nederlands' },
  { id: 'sv-SE', label: 'Svenska' },
  { id: 'nb-NO', label: 'Norsk' },
  { id: 'da-DK', label: 'Dansk' },
  { id: 'fi-FI', label: 'Suomi' },
  { id: 'pl-PL', label: 'Polski' },
  { id: 'cs-CZ', label: 'Čeština' },
  { id: 'tr-TR', label: 'Türkçe' },
  { id: 'ru-RU', label: 'Русский' },
  { id: 'uk-UA', label: 'Українська' },
  { id: 'id-ID', label: 'Bahasa Indonesia' },
  { id: 'vi-VN', label: 'Tiếng Việt' },
  { id: 'ja-JP', label: '日本語' },
  { id: 'ko-KR', label: '한국어' },
  { id: 'zh-CN', label: '简体中文' },
  { id: 'zh-TW', label: '繁體中文' },
  { id: 'hi-IN', label: 'हिन्दी' },
  { id: 'ar-EG', label: 'العربية' }
];

AP._fmtCache = {};
AP.fmt = function (locale, opts) {
  var k = locale + JSON.stringify(opts);
  if (!AP._fmtCache[k]) {
    try { AP._fmtCache[k] = new Intl.DateTimeFormat(locale, opts); }
    catch (e) { AP._fmtCache[k] = new Intl.DateTimeFormat('en-US', opts); }
  }
  return AP._fmtCache[k];
};
AP.monthName = function (y, m, locale, style) {
  return AP.fmt(locale, { month: style || 'long' }).format(AP.date(y, m, 1));
};
AP.dayName = function (weekdayIndex, locale, style) {
  /* 2024-01-07 is a Sunday, so +index lands on the wanted weekday. */
  return AP.fmt(locale, { weekday: style || 'long' }).format(AP.date(2024, 0, 7 + weekdayIndex));
};

/* ---------- Storage ------------------------------------------------------ */
AP.store = {
  get: function (k, fallback) {
    try { var v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  },
  set: function (k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  },
  del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
};

/* ---------- URL state ---------------------------------------------------- */
AP.encodeState = function (obj) {
  try {
    var json = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) { return ''; }
};
AP.decodeState = function (str) {
  try {
    var b = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    return JSON.parse(decodeURIComponent(escape(atob(b))));
  } catch (e) { return null; }
};

/* ---------- Misc --------------------------------------------------------- */
AP.clamp = function (n, lo, hi) { return Math.min(hi, Math.max(lo, n)); };
AP.escapeHtml = function (s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
};
AP.download = function (filename, content, mime) {
  var blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = AP.el('a', { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
};
AP.toast = function (msg) {
  var t = AP.$('#toast');
  if (!t) { t = AP.el('div', { class: 'toast', id: 'toast' }); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(AP._toastTimer);
  AP._toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
};
AP.debounce = function (fn, ms) {
  var t;
  return function () {
    var args = arguments, self = this;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(self, args); }, ms || 120);
  };
};
