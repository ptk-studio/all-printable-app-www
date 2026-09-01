/* ==========================================================================
   Calendar generator UI. Binds a plain state object to the sidebar controls,
   re-renders on change, and handles print / export / share.
   ========================================================================== */
(function () {
  var el = AP.el, $ = AP.$, $$ = AP.$$;
  var MM_PX = 96 / 25.4;
  var STORE_KEY = 'ap.calendar.presets';
  var LAST_KEY = 'ap.calendar.last';

  var DEFAULTS = {
    layout: 'month',
    perPage: 4, yearCols: 3, ygridOrient: 'across', ygridLabels: false, agendaCols: 1,
    weekShape: 'rows', weekHours: false, hourStart: 7, hourEnd: 21, weekNotes: true, weekFill: 'lines',
    photoSize: 45, photoData: '', showRangeTitle: false,

    startMonth: null, startYear: null, startDay: 1, count: 12,
    weekStart: 0, weekendDays: [0, 6], locale: 'en-US',

    paper: 'letter', orientation: 'portrait', margin: 10, textScale: 1,

    theme: 'classic', accent: '#b4472e', ruleColor: '#cfc9bb', shadeColor: '#f4f1e8',
    rules: 'all', weekendStyle: 'tint', numberPos: 'tl', numberScale: 1,
    dowStyle: 'short', dowAlign: 'left', headerAlign: 'left',
    accentTitle: false, inkSaver: false,

    weekNumbers: 'none', altLabel: 'none', adjacent: 'grey', sixWeeks: false,
    markToday: false, miniMonths: false, moon: false,
    cellFill: 'none', notes: 'none', notesPos: 'below', notesSize: 22, notesTitle: 'Notes',

    holiday: {
      countries: [], style: 'name', showObserved: false,
      observances: false, lunarNewYear: false, seasons: false,
      legend: false, substitute: true
    },
    events: '',
    subtitle: '', footer: ''
  };

  var PRESETS = [
    { name: 'Family wall', s: { layout: 'month', paper: 'letter', orientation: 'portrait',
        notes: 'none', cellFill: 'none', sixWeeks: true, miniMonths: true, numberScale: 1.3,
        theme: 'classic', weekendStyle: 'tint', holiday: { countries: ['US'], style: 'name' } } },
    { name: 'Desk month', s: { layout: 'month', paper: 'a5', orientation: 'landscape',
        theme: 'modern', numberScale: 1.1, dowStyle: 'short', margin: 8, weekendStyle: 'tint' } },
    { name: 'Year planner', s: { layout: 'yeargrid', paper: 'a3', orientation: 'landscape',
        ygridOrient: 'across', theme: 'modern', margin: 8, count: 1 } },
    { name: 'Year at a glance', s: { layout: 'year', paper: 'letter', orientation: 'portrait',
        yearCols: 3, theme: 'classic', count: 1 } },
    { name: 'Weekly planner', s: { layout: 'week', paper: 'a5', orientation: 'portrait',
        weekShape: 'rows', weekHours: false, weekFill: 'lines', weekNotes: true, count: 12, margin: 9 } },
    { name: 'Hourly week', s: { layout: 'week', paper: 'letter', orientation: 'landscape',
        weekShape: 'columns', weekHours: true, hourStart: 7, hourEnd: 20, weekNotes: true, count: 12 } },
    { name: 'Six months', s: { layout: 'multi', perPage: 6, paper: 'letter', orientation: 'landscape',
        theme: 'modern', count: 12, showRangeTitle: true } },
    { name: 'Minimal poster', s: { layout: 'year', paper: 'poster1824', orientation: 'portrait',
        theme: 'minimal', yearCols: 3, rules: 'none', weekendStyle: 'none', margin: 25, count: 1 } },
    { name: 'Bullet journal', s: { layout: 'agenda', paper: 'a5', orientation: 'portrait',
        theme: 'mono', agendaCols: 1, margin: 8, weekendStyle: 'tint' } },
    { name: 'Photo calendar', s: { layout: 'photo', paper: 'letter', orientation: 'portrait',
        photoSize: 48, theme: 'editorial', headerAlign: 'center', numberScale: .9 } }
  ];

  var ACCENTS = ['#b4472e', '#1f6f5c', '#2f4858', '#7a4b8f', '#0f766e', '#a3541f',
                 '#c2185b', '#3b5bdb', '#166534', '#111111'];

  var state, pages = [], pageIndex = 0, zoom = null, viewAll = false;

  /* ---- path helpers ------------------------------------------------------- */
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  function setPath(obj, path, val) {
    var keys = path.split('.'), last = keys.pop();
    var t = keys.reduce(function (o, k) { return (o[k] = o[k] || {}); }, obj);
    t[last] = val;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function merge(base, over) {
    Object.keys(over).forEach(function (k) {
      if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k]) {
        merge(base[k], over[k]);
      } else base[k] = over[k];
    });
    return base;
  }

  /* ---- initial state ------------------------------------------------------ */
  function freshState() {
    var s = clone(DEFAULTS);
    var now = AP.today();
    s.startMonth = now.getMonth();
    s.startYear = now.getFullYear();
    return s;
  }

  function loadState() {
    var hash = location.hash.replace(/^#c=/, '');
    if (hash) {
      var decoded = AP.decodeState(hash);
      if (decoded) return merge(freshState(), decoded);
    }
    var last = AP.store.get(LAST_KEY, null);
    if (last) return merge(freshState(), last);
    return freshState();
  }

  /* ---- dynamic control construction --------------------------------------- */
  var LAYOUT_ART = {
    month:    '<rect class="stroke" x="2" y="2" width="44" height="26"/><line class="stroke" x1="2" y1="9" x2="46" y2="9"/><line class="stroke" x1="15" y1="9" x2="15" y2="28"/><line class="stroke" x1="28" y1="9" x2="28" y2="28"/><line class="stroke" x1="2" y1="16" x2="46" y2="16"/><line class="stroke" x1="2" y1="22" x2="46" y2="22"/>',
    multi:    '<rect class="stroke" x="2" y="2" width="20" height="12"/><rect class="stroke" x="26" y="2" width="20" height="12"/><rect class="stroke" x="2" y="17" width="20" height="12"/><rect class="stroke" x="26" y="17" width="20" height="12"/>',
    year:     '<rect class="stroke" x="2" y="2" width="12" height="8"/><rect class="stroke" x="18" y="2" width="12" height="8"/><rect class="stroke" x="34" y="2" width="12" height="8"/><rect class="stroke" x="2" y="13" width="12" height="8"/><rect class="stroke" x="18" y="13" width="12" height="8"/><rect class="stroke" x="34" y="13" width="12" height="8"/><rect class="stroke" x="2" y="24" width="12" height="6"/><rect class="stroke" x="18" y="24" width="12" height="6"/><rect class="stroke" x="34" y="24" width="12" height="6"/>',
    yeargrid: '<rect class="stroke" x="2" y="2" width="44" height="28"/><line class="stroke" x1="2" y1="8" x2="46" y2="8"/><line class="stroke" x1="9" y1="2" x2="9" y2="30"/><line class="stroke" x1="17" y1="2" x2="17" y2="30"/><line class="stroke" x1="25" y1="2" x2="25" y2="30"/><line class="stroke" x1="33" y1="2" x2="33" y2="30"/><line class="stroke" x1="40" y1="2" x2="40" y2="30"/>',
    agenda:   '<line class="stroke" x1="4" y1="5" x2="44" y2="5"/><line class="stroke" x1="4" y1="11" x2="44" y2="11"/><line class="stroke" x1="4" y1="17" x2="44" y2="17"/><line class="stroke" x1="4" y1="23" x2="44" y2="23"/><line class="stroke" x1="4" y1="29" x2="44" y2="29"/><line class="stroke" x1="12" y1="2" x2="12" y2="30"/>',
    week:     '<rect class="stroke" x="2" y="2" width="44" height="6"/><rect class="stroke" x="2" y="10" width="44" height="6"/><rect class="stroke" x="2" y="18" width="44" height="6"/><rect class="stroke" x="2" y="26" width="44" height="5"/>',
    photo:    '<rect class="fill" x="2" y="2" width="44" height="14"/><rect class="stroke" x="2" y="2" width="44" height="14"/><rect class="stroke" x="2" y="19" width="44" height="11"/><line class="stroke" x1="16" y1="19" x2="16" y2="30"/><line class="stroke" x1="31" y1="19" x2="31" y2="30"/>'
  };

  function buildControls() {
    /* Layout tiles */
    var tiles = $('#layout-tiles');
    Object.keys(AP.calendar.LAYOUTS).forEach(function (id) {
      var def = AP.calendar.LAYOUTS[id];
      var label = el('label', { class: 'tile', title: def.hint }, [
        el('input', { type: 'radio', name: 'layout', 'data-bind': 'layout', value: id }),
        el('span', { class: 'tile-art', html: AP.svg('0 0 48 32', LAYOUT_ART[id]) }),
        el('span', { text: def.label })
      ]);
      tiles.appendChild(label);
    });

    /* Month + weekday selects */
    var sm = $('#sel-startMonth');
    for (var m = 0; m < 12; m++) sm.appendChild(el('option', { value: m, text: AP.monthName(2025, m, 'en-US', 'long') }));
    var ws = $('#sel-weekStart');
    [0, 1, 6].forEach(function (d) {
      ws.appendChild(el('option', { value: d, text: AP.dayName(d, 'en-US', 'long') }));
    });

    /* Weekend day checkboxes */
    var wd = $('#weekend-days');
    for (var d = 0; d < 7; d++) {
      (function (day) {
        wd.appendChild(el('label', { class: 'check' }, [
          el('input', { type: 'checkbox', 'data-weekend': day }),
          el('span', { text: AP.dayName(day, 'en-US', 'short') })
        ]));
      })(d);
    }

    /* Locales */
    var loc = $('#sel-locale');
    AP.LOCALES.forEach(function (l) { loc.appendChild(el('option', { value: l.id, text: l.label })); });

    /* Paper sizes, grouped */
    var paper = $('#sel-paper');
    var groups = AP.paperGroups();
    ['US', 'ISO', 'Planner', 'Special'].forEach(function (g) {
      if (!groups[g]) return;
      var og = el('optgroup', { label: g === 'US' ? 'US sizes' : g === 'ISO' ? 'ISO / A sizes' : g });
      groups[g].forEach(function (id) {
        var p = AP.PAPER[id];
        og.appendChild(el('option', { value: id, text: p.label + ' · ' + p.sub }));
      });
      paper.appendChild(og);
    });

    /* Countries */
    var cl = $('#country-list');
    AP.holidays.countryList().forEach(function (c) {
      cl.appendChild(el('label', { class: 'check', title: c.note || '' }, [
        el('input', { type: 'checkbox', 'data-country': c.id }),
        el('span', { text: c.label })
      ]));
    });

    /* Accent swatches */
    var sw = $('#accent-swatches');
    ACCENTS.forEach(function (c) {
      sw.appendChild(el('button', {
        class: 'swatch', type: 'button', 'data-accent': c, title: c,
        style: { background: c }, 'aria-label': 'Accent ' + c
      }));
    });

    /* Presets */
    var pr = $('#presets');
    PRESETS.forEach(function (p, i) {
      pr.appendChild(el('button', { class: 'preset-chip', type: 'button', 'data-preset': i, text: p.name }));
    });
  }

  /* ---- binding ------------------------------------------------------------ */
  function bind() {
    $$('[data-bind]').forEach(function (input) {
      var path = input.dataset.bind;
      input.addEventListener(input.type === 'text' || input.tagName === 'TEXTAREA' ? 'input' : 'change', function () {
        writeFromControl(input, path);
        onStateChange();
      });
      if (input.type === 'range' || input.type === 'color') {
        input.addEventListener('input', function () { writeFromControl(input, path); onStateChange(); });
      }
    });

    $$('[data-weekend]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var d = +cb.dataset.weekend;
        var list = state.weekendDays.filter(function (x) { return x !== d; });
        if (cb.checked) list.push(d);
        state.weekendDays = list.sort();
        onStateChange();
      });
    });

    $$('[data-country]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var id = cb.dataset.country;
        var list = state.holiday.countries.filter(function (x) { return x !== id; });
        if (cb.checked) list.push(id);
        state.holiday.countries = list;
        onStateChange();
      });
    });

    $$('[data-accent]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.accent = b.dataset.accent;
        onStateChange();
      });
    });

    $$('[data-preset]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = PRESETS[+b.dataset.preset];
        var next = freshState();
        next.startMonth = state.startMonth;
        next.startYear = state.startYear;
        next.events = state.events;
        next.subtitle = state.subtitle;
        next.footer = state.footer;
        merge(next, clone(p.s));
        state = next;
        zoom = null;
        onStateChange();
        AP.toast(p.name + ' applied');
      });
    });
  }

  function writeFromControl(input, path) {
    var v;
    if (input.type === 'checkbox') v = input.checked;
    else if (input.type === 'radio') { if (!input.checked) return; v = coerce(input.value); }
    else if (input.type === 'number' || input.type === 'range') v = parseFloat(input.value);
    else v = input.value;
    if (input.tagName === 'SELECT' && /^-?\d+$/.test(v)) v = +v;
    setPath(state, path, v);
  }
  function coerce(v) {
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(v)) return +v;
    return v;
  }

  /* ---- UI sync ------------------------------------------------------------ */
  function syncUI() {
    $$('[data-bind]').forEach(function (input) {
      var v = getPath(state, input.dataset.bind);
      if (input.type === 'checkbox') input.checked = !!v;
      else if (input.type === 'radio') input.checked = String(v) === input.value;
      else if (document.activeElement !== input) input.value = v == null ? '' : v;
    });
    $$('[data-weekend]').forEach(function (cb) {
      cb.checked = state.weekendDays.indexOf(+cb.dataset.weekend) !== -1;
    });
    $$('[data-country]').forEach(function (cb) {
      cb.checked = state.holiday.countries.indexOf(cb.dataset.country) !== -1;
    });
    $$('[data-accent]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.accent.toLowerCase() === String(state.accent).toLowerCase());
    });

    /* Conditional blocks */
    $$('[data-when]').forEach(function (node) {
      var cond = node.dataset.when;
      var neg = cond.indexOf('!=') !== -1;
      var parts = cond.split(neg ? '!=' : '=');
      var actual = String(getPath(state, parts[0].trim()));
      var want = parts[1].trim();
      node.classList.toggle('hide', neg ? actual === want : actual !== want);
    });

    var lay = AP.calendar.LAYOUTS[state.layout];
    $('#layout-hint').textContent = lay.hint;
    $('#count-label').textContent = AP.calendar.UNIT_LABEL[lay.unit];

    setOut('margin-out', state.margin + ' mm');
    setOut('textScale-out', Math.round(state.textScale * 100) + '%');
    setOut('numberScale-out', Math.round(state.numberScale * 100) + '%');
    setOut('notesSize-out', state.notesSize + '%');
    setOut('photoSize-out', state.photoSize + '%');
  }
  function setOut(id, text) { var n = document.getElementById(id); if (n) n.textContent = text; }

  /* ---- rendering ---------------------------------------------------------- */
  var render = AP.debounce(function () {
    var canvas = $('#canvas');
    canvas.innerHTML = '';
    try {
      pages = AP.calendar.render(state);
    } catch (err) {
      canvas.appendChild(el('p', { class: 'empty', text: 'Could not render: ' + err.message }));
      return;
    }
    if (!pages.length) {
      canvas.appendChild(el('p', { class: 'empty', text: 'Nothing to show.' }));
      return;
    }
    pageIndex = AP.clamp(pageIndex, 0, pages.length - 1);
    canvas.classList.toggle('grid-view', viewAll);

    var dims = AP.pageSize(state.paper, state.orientation);
    var z = zoom || fitZoom(dims);

    var show = viewAll ? pages : [pages[pageIndex]];
    show.forEach(function (p, i) {
      var num = viewAll ? i + 1 : pageIndex + 1;
      var shell = el('div', { class: 'page-shell', 'data-num': 'Page ' + num + ' of ' + pages.length });
      var s = viewAll ? Math.min(z, fitZoom(dims) * 0.42) : z;
      shell.style.width = (dims.w * MM_PX * s) + 'px';
      shell.style.height = (dims.h * MM_PX * s) + 'px';
      p.style.transform = 'scale(' + s + ')';
      shell.appendChild(p);
      canvas.appendChild(shell);
    });

    $('#page-count').textContent = (pageIndex + 1) + ' / ' + pages.length;
    $('#zoom-val').textContent = zoom ? Math.round(zoom * 100) + '%' : 'Fit';
    $('#prev-page').disabled = viewAll || pageIndex === 0;
    $('#next-page').disabled = viewAll || pageIndex >= pages.length - 1;
    updatePageRule();
  }, 90);

  function fitZoom(dims) {
    var canvas = $('#canvas');
    var availW = canvas.clientWidth - 60;
    var availH = canvas.clientHeight - 60;
    if (availW <= 0 || availH <= 0) return 0.5;
    return Math.min(availW / (dims.w * MM_PX), availH / (dims.h * MM_PX), 2);
  }

  function updatePageRule() {
    var tag = document.getElementById('page-rule');
    if (!tag) { tag = el('style', { id: 'page-rule' }); document.head.appendChild(tag); }
    tag.textContent = AP.calendar.pageRule(state);
  }

  function onStateChange() {
    syncUI();
    AP.store.set(LAST_KEY, state);
    try {
      history.replaceState(null, '', '#c=' + AP.encodeState(state));
    } catch (e) { /* very long event lists can overflow; ignore */ }
    render();
  }

  /* ---- toolbar ------------------------------------------------------------ */
  function wireToolbar() {
    $('#prev-page').addEventListener('click', function () { pageIndex--; render(); });
    $('#next-page').addEventListener('click', function () { pageIndex++; render(); });
    $('#view-single').addEventListener('change', function () { viewAll = false; render(); });
    $('#view-all').addEventListener('change', function () { viewAll = true; render(); });
    $('#zoom-in').addEventListener('click', function () {
      zoom = AP.clamp((zoom || fitZoom(AP.pageSize(state.paper, state.orientation))) * 1.25, .1, 4); render();
    });
    $('#zoom-out').addEventListener('click', function () {
      zoom = AP.clamp((zoom || fitZoom(AP.pageSize(state.paper, state.orientation))) / 1.25, .1, 4); render();
    });
    $('#zoom-fit').addEventListener('click', function () { zoom = null; render(); });

    $('#btn-print').addEventListener('click', function () {
      var wasAll = viewAll;
      viewAll = true; render();
      setTimeout(function () {
        window.print();
        viewAll = wasAll; render();
      }, 260);
    });

    $('#btn-share').addEventListener('click', function () {
      var url = location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          function () { AP.toast('Link copied — it restores every setting'); },
          function () { AP.toast('Copy failed; the address bar holds the link'); }
        );
      } else AP.toast('The address bar holds your shareable link');
    });

    $('#btn-html').addEventListener('click', exportHtml);

    $('#btn-events-csv').addEventListener('click', function () { $('#events-file').click(); });
    $('#events-file').addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        var lines = String(r.result).split(/\r?\n/).map(function (l) {
          return l.replace(/^"|"$/g, '').replace(/^([^,]+),\s*/, '$1 ');
        });
        state.events = (state.events ? state.events + '\n' : '') + lines.join('\n').trim();
        onStateChange();
        AP.toast('Events imported');
      };
      r.readAsText(f);
      e.target.value = '';
    });

    var pf = $('#photo-file');
    if (pf) pf.addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () { state.photoData = r.result; onStateChange(); };
      r.readAsDataURL(f);
    });

    $('#btn-reset').addEventListener('click', function () {
      state = freshState(); zoom = null; pageIndex = 0; onStateChange(); AP.toast('Reset');
    });
    $('#btn-save').addEventListener('click', function () {
      var name = prompt('Name this setup:', AP.calendar.LAYOUTS[state.layout].label + ' ' + state.startYear);
      if (!name) return;
      var saves = AP.store.get(STORE_KEY, []);
      saves = saves.filter(function (s) { return s.name !== name; });
      saves.push({ name: name, state: state });
      AP.store.set(STORE_KEY, saves);
      renderSaves();
      AP.toast('Saved');
    });

    window.addEventListener('resize', AP.debounce(function () { if (!zoom) render(); }, 200));
    document.addEventListener('keydown', function (e) {
      if (/input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === 'ArrowLeft' && pageIndex > 0) { pageIndex--; render(); }
      if (e.key === 'ArrowRight' && pageIndex < pages.length - 1) { pageIndex++; render(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') { /* let the browser print */ }
    });
  }

  function renderSaves() {
    var box = $('#saved-list');
    var saves = AP.store.get(STORE_KEY, []);
    box.innerHTML = '';
    if (!saves.length) {
      box.appendChild(el('span', { class: 'field-hint', text: 'Nothing saved yet.' }));
      return;
    }
    saves.forEach(function (s, i) {
      box.appendChild(el('div', { class: 'row', style: { marginBottom: '6px' } }, [
        el('button', { class: 'btn btn-sm', style: { flex: '1 1 auto', justifyContent: 'flex-start' }, text: s.name,
          onclick: function () { state = merge(freshState(), s.state); zoom = null; onStateChange(); } }),
        el('button', { class: 'btn btn-sm btn-ghost', text: '✕', title: 'Delete',
          onclick: function () {
            var all = AP.store.get(STORE_KEY, []); all.splice(i, 1);
            AP.store.set(STORE_KEY, all); renderSaves();
          } })
      ]));
    });
  }

  /* ---- standalone HTML export --------------------------------------------- */
  function collectCss() {
    var out = [];
    var ok = true;
    Array.prototype.forEach.call(document.styleSheets, function (sheet) {
      var href = sheet.href || '';
      if (href && href.indexOf('print.css') === -1) return;
      try {
        Array.prototype.forEach.call(sheet.cssRules, function (r) { out.push(r.cssText); });
      } catch (e) { ok = false; }
    });
    return ok && out.length ? out.join('\n') : null;
  }

  function exportHtml() {
    var css = collectCss();
    var finish = function (cssText) {
      var wasAll = viewAll, prevZoom = zoom;
      viewAll = true; zoom = 1;
      pages = AP.calendar.render(state);
      var body = pages.map(function (p) { return p.outerHTML; }).join('\n');
      viewAll = wasAll; zoom = prevZoom; render();

      var doc = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
        '<title>' + AP.escapeHtml(AP.calendar.filename(state)) + '</title>\n<style>\n' +
        AP.calendar.pageRule(state) + '\n' +
        'html,body{margin:0;padding:0;background:#fff}\n' +
        '.page{break-after:page;page-break-after:always}\n' +
        '.page:last-child{break-after:auto;page-break-after:auto}\n' +
        '*{-webkit-print-color-adjust:exact;print-color-adjust:exact}\n' +
        cssText + '\n</style>\n</head>\n<body>\n' + body + '\n</body>\n</html>';
      AP.download(AP.calendar.filename(state) + '.html', doc, 'text/html;charset=utf-8');
      AP.toast('Downloaded — open it and print to PDF');
    };

    if (css) { finish(css); return; }
    /* Stylesheet rules are unreadable when the page is opened from file://.
       Fetch the file directly instead. */
    fetch('print.css').then(function (r) { return r.text(); }).then(finish).catch(function () {
      AP.toast('Export needs the site served over http — use Print / Save PDF instead');
    });
  }

  /* ---- boot --------------------------------------------------------------- */
  function init() {
    buildControls();
    state = loadState();
    bind();
    wireToolbar();
    renderSaves();
    onStateChange();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
