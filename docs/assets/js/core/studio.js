/* ==========================================================================
   Studio — the generator shell every printable shares.

   It owns state, control binding, the page preview, printing and export.
   A printable supplies only what is specific to it:

     AP.studio({
       key:        'paper',                    storage namespace
       defaults:   {...},                      base state
       init:       function (state) {},        fill dynamic defaults
       presets:    [{ name, s }],              one-click starting points
       css:        ['../../assets/css/sheet.css', 'paper.css'],
       buildControls: function () {},          populate dynamic controls
       render:     function (state) { ... },   -> array of .page elements
       pageSize:   function (state) { ... },   -> { w, h } in mm
       pageRule:   function (state) { ... },   -> '@page { ... }'
       filename:   function (state) { ... },
       outputs:    { margin: function (v) { ... } },   range read-outs
       onState:    function (state) {}         optional hook
     })

   Control conventions in the markup:
     data-bind="a.b"          scalar value
     data-list="a.b:value"    checkbox toggling membership of an array
     data-swatch="a.b:value"  button that sets a value, shows aria-pressed
     data-preset="0"          applies presets[0]
     data-when="a.b=value"    show only when it matches (!= also works)
     data-out="a.b"           text read-out, formatted via `outputs`
   ========================================================================== */
window.AP = window.AP || {};

AP.studio = function (config) {
  var el = AP.el, $ = AP.$, $$ = AP.$$;
  var MM_PX = 96 / 25.4;
  var LAST_KEY = 'ap.' + config.key + '.last';
  var SAVE_KEY = 'ap.' + config.key + '.presets';

  var state, pages = [], pageIndex = 0, zoom = null, viewAll = false;

  /* ---- paths ------------------------------------------------------------- */
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  function setPath(obj, path, val) {
    var keys = path.split('.'), last = keys.pop();
    keys.reduce(function (o, k) { return (o[k] = o[k] || {}); }, obj)[last] = val;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function merge(base, over) {
    Object.keys(over).forEach(function (k) {
      if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k]) merge(base[k], over[k]);
      else base[k] = over[k];
    });
    return base;
  }
  function coerce(v) {
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(v)) return +v;
    return v;
  }

  /* ---- state ------------------------------------------------------------- */
  function freshState() {
    var s = clone(config.defaults);
    if (config.init) config.init(s);
    return s;
  }
  function loadState() {
    var hash = location.hash.replace(/^#c=/, '');
    if (hash) {
      var decoded = AP.decodeState(hash);
      if (decoded) return merge(freshState(), decoded);
    }
    /* ?preset=<name> lets the catalogue deep-link straight into a setup. */
    var want = (location.search.match(/[?&]preset=([^&]+)/) || [])[1];
    if (want) {
      var slug = decodeURIComponent(want).toLowerCase();
      var found = (config.presets || []).filter(function (p) {
        return p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug ||
               p.name.toLowerCase() === slug;
      })[0];
      if (found) return merge(freshState(), clone(found.s));
    }
    var last = AP.store.get(LAST_KEY, null);
    return last ? merge(freshState(), last) : freshState();
  }

  /* ---- binding ----------------------------------------------------------- */
  function bind() {
    $$('[data-bind]').forEach(function (input) {
      var path = input.dataset.bind;
      var ev = (input.tagName === 'TEXTAREA' || input.type === 'text') ? 'input' : 'change';
      input.addEventListener(ev, function () { writeControl(input, path); changed(); });
      if (input.type === 'range' || input.type === 'color') {
        input.addEventListener('input', function () { writeControl(input, path); changed(); });
      }
    });

    $$('[data-list]').forEach(function (cb) {
      var parts = splitRef(cb.dataset.list);
      cb.addEventListener('change', function () {
        var list = (getPath(state, parts.path) || []).filter(function (x) { return String(x) !== String(parts.value); });
        if (cb.checked) list.push(coerce(parts.value));
        list.sort();
        setPath(state, parts.path, list);
        changed();
      });
    });

    $$('[data-swatch]').forEach(function (b) {
      var parts = splitRef(b.dataset.swatch);
      b.addEventListener('click', function () { setPath(state, parts.path, parts.value); changed(); });
    });

    $$('[data-preset]').forEach(function (b) {
      b.addEventListener('click', function () {
        var preset = config.presets[+b.dataset.preset];
        var next = freshState();
        (config.keepOnPreset || []).forEach(function (p) { setPath(next, p, getPath(state, p)); });
        merge(next, clone(preset.s));
        state = next; zoom = null; pageIndex = 0;
        changed();
        track('preset_applied', { preset: preset.name });
        AP.toast(preset.name + ' applied');
      });
    });
  }

  /* "a.b:value" — the value may itself contain colons (a colour, say). */
  function splitRef(ref) {
    var i = ref.indexOf(':');
    return { path: ref.slice(0, i), value: ref.slice(i + 1) };
  }

  function writeControl(input, path) {
    var v;
    if (input.type === 'checkbox') v = input.checked;
    else if (input.type === 'radio') { if (!input.checked) return; v = coerce(input.value); }
    else if (input.type === 'number' || input.type === 'range') v = parseFloat(input.value);
    else v = input.value;
    if (input.tagName === 'SELECT' && /^-?\d+$/.test(v)) v = +v;
    setPath(state, path, v);
  }

  /* ---- syncing the UI back from state ------------------------------------ */
  function syncUI() {
    $$('[data-bind]').forEach(function (input) {
      var v = getPath(state, input.dataset.bind);
      if (input.type === 'checkbox') input.checked = !!v;
      else if (input.type === 'radio') input.checked = String(v) === input.value;
      else if (document.activeElement !== input) input.value = v == null ? '' : v;
    });
    $$('[data-list]').forEach(function (cb) {
      var p = splitRef(cb.dataset.list);
      var list = getPath(state, p.path) || [];
      cb.checked = list.map(String).indexOf(p.value) !== -1;
    });
    $$('[data-swatch]').forEach(function (b) {
      var p = splitRef(b.dataset.swatch);
      b.setAttribute('aria-pressed',
        String(getPath(state, p.path)).toLowerCase() === p.value.toLowerCase());
    });
    $$('[data-when]').forEach(function (node) {
      var cond = node.dataset.when;
      var neg = cond.indexOf('!=') !== -1;
      var parts = cond.split(neg ? '!=' : '=');
      var actual = String(getPath(state, parts[0].trim()));
      var want = parts[1].trim();
      node.classList.toggle('hide', neg ? actual === want : actual !== want);
    });
    $$('[data-out]').forEach(function (node) {
      var path = node.dataset.out;
      var v = getPath(state, path);
      var fmt = config.outputs && config.outputs[path];
      node.textContent = fmt ? fmt(v, state) : String(v);
    });
    if (config.onState) config.onState(state);
  }

  /* ---- preview ----------------------------------------------------------- */
  /* Every route to paper goes through here, so the sheet credit is stamped
     once and cannot be missed by the export path. */
  function buildPages() {
    var built = config.render(state);
    if (AP.brand) AP.brand.stampAll(built);
    return built;
  }

  var render = AP.debounce(function () {
    var canvas = $('#canvas');
    canvas.innerHTML = '';
    try {
      pages = buildPages();
    } catch (err) {
      canvas.appendChild(el('p', { class: 'empty', text: 'Could not render: ' + err.message }));
      if (window.console) console.error(err);
      return;
    }
    if (!pages.length) {
      canvas.appendChild(el('p', { class: 'empty', text: 'Nothing to show.' }));
      return;
    }
    pageIndex = AP.clamp(pageIndex, 0, pages.length - 1);
    canvas.classList.toggle('grid-view', viewAll);

    var dims = config.pageSize(state);
    var z = zoom || fitZoom(dims);
    var show = viewAll ? pages : [pages[pageIndex]];

    show.forEach(function (p, i) {
      var num = viewAll ? i + 1 : pageIndex + 1;
      var s = viewAll ? Math.min(z, fitZoom(dims) * 0.42) : z;
      var shell = el('div', { class: 'page-shell', 'data-num': 'Page ' + num + ' of ' + pages.length });
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

    var tag = document.getElementById('page-rule');
    if (!tag) { tag = el('style', { id: 'page-rule' }); document.head.appendChild(tag); }
    tag.textContent = config.pageRule(state);
  }, 90);

  function fitZoom(dims) {
    var canvas = $('#canvas');
    var availW = canvas.clientWidth - 60, availH = canvas.clientHeight - 60;
    if (availW <= 0 || availH <= 0) return 0.5;
    return Math.min(availW / (dims.w * MM_PX), availH / (dims.h * MM_PX), 2);
  }

  function changed() {
    syncUI();
    AP.store.set(LAST_KEY, state);
    try { history.replaceState(null, '', '#c=' + AP.encodeState(state)); }
    catch (e) { /* very long inputs can overflow the URL; local save still holds */ }
    render();
  }

  /* ---- analytics --------------------------------------------------------- */
  /* Only the shape of what was made — never the contents of any text field. */
  function track(name, params) {
    if (AP.analytics) AP.analytics.track(name, params);
  }
  function sheetFacts() {
    return {
      layout: String(state.layout || state.type || ''),
      paper: String(state.paper || state.stock || ''),
      orientation: String(state.orientation || ''),
      theme: String(state.theme || ''),
      pages: pages.length
    };
  }

  /* ---- toolbar ----------------------------------------------------------- */
  function wireToolbar() {
    $('#prev-page').addEventListener('click', function () { pageIndex--; render(); });
    $('#next-page').addEventListener('click', function () { pageIndex++; render(); });
    $('#view-single').addEventListener('change', function () { viewAll = false; render(); });
    $('#view-all').addEventListener('change', function () { viewAll = true; render(); });
    $('#zoom-in').addEventListener('click', function () {
      zoom = AP.clamp((zoom || fitZoom(config.pageSize(state))) * 1.25, .1, 4); render();
    });
    $('#zoom-out').addEventListener('click', function () {
      zoom = AP.clamp((zoom || fitZoom(config.pageSize(state))) / 1.25, .1, 4); render();
    });
    $('#zoom-fit').addEventListener('click', function () { zoom = null; render(); });

    $('#btn-print').addEventListener('click', function () {
      track('print', sheetFacts());
      var wasAll = viewAll;
      viewAll = true; render();
      setTimeout(function () { window.print(); viewAll = wasAll; render(); }, 260);
    });

    $('#btn-share').addEventListener('click', function () {
      track('copy_link', sheetFacts());
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(location.href).then(
          function () { AP.toast('Link copied — it restores every setting'); },
          function () { AP.toast('Copy failed; the address bar holds the link'); });
      } else AP.toast('The address bar holds your shareable link');
    });

    $('#btn-html').addEventListener('click', function () {
      track('download_html', sheetFacts());
      exportHtml();
    });

    $('#btn-reset').addEventListener('click', function () {
      state = freshState(); zoom = null; pageIndex = 0; changed(); AP.toast('Reset');
    });
    $('#btn-save').addEventListener('click', function () {
      var name = prompt('Name this setup:', config.saveName ? config.saveName(state) : '');
      if (!name) return;
      var saves = AP.store.get(SAVE_KEY, []).filter(function (s) { return s.name !== name; });
      saves.push({ name: name, state: state });
      AP.store.set(SAVE_KEY, saves);
      renderSaves(); AP.toast('Saved');
    });

    window.addEventListener('resize', AP.debounce(function () { if (!zoom) render(); }, 200));
    document.addEventListener('keydown', function (e) {
      if (/input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === 'ArrowLeft' && pageIndex > 0) { pageIndex--; render(); }
      if (e.key === 'ArrowRight' && pageIndex < pages.length - 1) { pageIndex++; render(); }
    });
  }

  function renderSaves() {
    var box = $('#saved-list');
    if (!box) return;
    var saves = AP.store.get(SAVE_KEY, []);
    box.innerHTML = '';
    if (!saves.length) {
      box.appendChild(el('span', { class: 'field-hint', text: 'Nothing saved yet.' }));
      return;
    }
    saves.forEach(function (s, i) {
      box.appendChild(el('div', { class: 'row', style: { marginBottom: '6px' } }, [
        el('button', { class: 'btn btn-sm', style: { flex: '1 1 auto', justifyContent: 'flex-start' },
          text: s.name,
          onclick: function () { state = merge(freshState(), s.state); zoom = null; changed(); } }),
        el('button', { class: 'btn btn-sm btn-ghost', text: '✕', title: 'Delete',
          onclick: function () {
            var all = AP.store.get(SAVE_KEY, []); all.splice(i, 1);
            AP.store.set(SAVE_KEY, all); renderSaves();
          } })
      ]));
    });
  }

  /* ---- standalone HTML export -------------------------------------------- */
  function collectCss() {
    var out = [], ok = true;
    var wanted = (config.css || []).map(function (h) { return h.split('/').pop(); });
    Array.prototype.forEach.call(document.styleSheets, function (sheet) {
      var href = sheet.href || '';
      if (href && wanted.indexOf(href.split('?')[0].split('/').pop()) === -1) return;
      if (!href) return;
      try { Array.prototype.forEach.call(sheet.cssRules, function (r) { out.push(r.cssText); }); }
      catch (e) { ok = false; }
    });
    return ok && out.length ? out.join('\n') : null;
  }

  function exportHtml() {
    function finish(cssText) {
      var wasAll = viewAll, prevZoom = zoom;
      viewAll = true; zoom = 1;
      var body = buildPages().map(function (p) { return p.outerHTML; }).join('\n');
      viewAll = wasAll; zoom = prevZoom; render();

      var name = config.filename(state);
      var doc = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
        '<title>' + AP.escapeHtml(name) + '</title>\n<style>\n' +
        config.pageRule(state) + '\n' +
        'html,body{margin:0;padding:0;background:#fff}\n' +
        '.page{break-after:page;page-break-after:always}\n' +
        '.page:last-child{break-after:auto;page-break-after:auto}\n' +
        '*{-webkit-print-color-adjust:exact;print-color-adjust:exact}\n' +
        cssText + '\n</style>\n</head>\n<body>\n' + body + '\n</body>\n</html>';
      AP.download(name + '.html', doc, 'text/html;charset=utf-8');
      AP.toast('Downloaded — open it and print to PDF');
    }

    var css = collectCss();
    if (css) return finish(css);
    /* Stylesheet rules are unreadable when a page is opened from file://.
       Fetch the sources directly instead. */
    Promise.all((config.css || []).map(function (h) {
      return fetch(h).then(function (r) { return r.text(); });
    })).then(function (parts) { finish(parts.join('\n')); })
      .catch(function () {
        AP.toast('Export needs the site served over http — use Print / Save PDF instead');
      });
  }

  /* ---- boot -------------------------------------------------------------- */
  function init() {
    var bar = $('#toolbar');
    if (bar && !bar.children.length) bar.innerHTML = AP.toolbarHtml();
    if (config.buildControls) config.buildControls();
    state = loadState();
    bind();
    wireToolbar();
    renderSaves();
    changed();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return {
    get state() { return state; },
    set: function (path, v) { setPath(state, path, v); changed(); },
    refresh: changed
  };
};
