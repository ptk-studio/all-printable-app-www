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

/* ---------- Seeded randomness -------------------------------------------- */
/* mulberry32. Generators that deal content need identical output in every
   browser and across reloads, because the whole design round-trips through
   the URL: a shared link must reproduce exactly what the sender saw. */
AP.rng = function (seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
AP.shuffle = function (arr, rand) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(rand() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
};
AP.pick = function (arr, rand) { return arr[Math.floor(rand() * arr.length)]; };

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

/* ---------- Shared control builders -------------------------------------- */
/* Populate controls that every generator needs, so their markup stays short. */

AP.fillLocales = function (select) {
  AP.LOCALES.forEach(function (l) {
    select.appendChild(AP.el('option', { value: l.id, text: l.label }));
  });
};

AP.fillPaperSizes = function (select) {
  var groups = AP.paperGroups();
  var titles = { US: 'US sizes', ISO: 'ISO / A sizes', Planner: 'Planner inserts', Special: 'Special' };
  ['US', 'ISO', 'Planner', 'Special'].forEach(function (g) {
    if (!groups[g]) return;
    var og = AP.el('optgroup', { label: titles[g] || g });
    groups[g].forEach(function (id) {
      var p = AP.PAPER[id];
      og.appendChild(AP.el('option', { value: id, text: p.label + ' · ' + p.sub }));
    });
    select.appendChild(og);
  });
};

AP.fillSwatches = function (box, path, colours) {
  colours.forEach(function (c) {
    box.appendChild(AP.el('button', {
      class: 'swatch', type: 'button', 'data-swatch': path + ':' + c,
      title: c, style: { background: c }, 'aria-label': 'Colour ' + c
    }));
  });
};

AP.fillPresets = function (box, presets) {
  presets.forEach(function (p, i) {
    box.appendChild(AP.el('button', {
      class: 'preset-chip', type: 'button', 'data-preset': i, text: p.name
    }));
  });
};

/* The toolbar and export buttons are identical everywhere; render them once. */
AP.toolbarHtml = function () {
  return '' +
    '<div class="pager">' +
      '<button class="btn btn-sm btn-icon" id="prev-page" title="Previous page" aria-label="Previous page">‹</button>' +
      '<span class="count" id="page-count">1 / 1</span>' +
      '<button class="btn btn-sm btn-icon" id="next-page" title="Next page" aria-label="Next page">›</button>' +
    '</div>' +
    '<div class="seg" style="width:auto">' +
      '<label><input type="radio" name="view" id="view-single" checked>Single</label>' +
      '<label><input type="radio" name="view" id="view-all">All pages</label>' +
    '</div>' +
    '<span class="spacer"></span>' +
    '<div class="zoomer">' +
      '<button class="btn btn-sm btn-icon" id="zoom-out" aria-label="Zoom out">−</button>' +
      '<span class="zoom-val" id="zoom-val">Fit</span>' +
      '<button class="btn btn-sm btn-icon" id="zoom-in" aria-label="Zoom in">+</button>' +
      '<button class="btn btn-sm" id="zoom-fit">Fit</button>' +
    '</div>';
};
