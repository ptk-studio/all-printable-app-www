/* ==========================================================================
   Table — rows and columns with headings and writing space.

   Half of what a printable site needs is this shape: a budget, a packing
   list, a meal plan, a day's schedule. Building it once means those sheets
   are configuration rather than code.

   A block is declared, not drawn:

     AP.table.block({
       title: 'Fixed costs',
       columns: [
         { label: 'Item',    flex: 3 },
         { label: 'Planned', flex: 1, kind: 'num' },
         { label: 'Actual',  flex: 1, kind: 'num' }
       ],
       rows: 8,
       total: { label: 'Total', from: 1 }
     }, state)
   ========================================================================== */
window.AP = window.AP || {};
(function () {
  var el = AP.el;

  /* Cell kinds decide what is printed in an empty cell, not how it is laid
     out — layout comes from the column's flex. */
  var KINDS = {
    text:  function () { return null; },                              /* blank writing space */
    num:   function () { return null; },                              /* same, right aligned  */
    check: function (s) { return el('span', { class: 'tb-check ' + (s.checkShape || 'square') }); },
    dot:   function () { return el('span', { class: 'tb-dot' }); },
    rule:  function () { return el('span', { class: 'tb-rule' }); }   /* a short signature rule */
  };

  function columnsTemplate(columns) {
    return columns.map(function (c) {
      if (c.width) return c.width;
      return (c.flex || 1) + 'fr';
    }).join(' ');
  }

  function cell(col, s, content, extra) {
    var cls = 'tb-cell';
    if (col.align || col.kind === 'num') cls += ' align-' + (col.align || 'right');
    if (col.kind === 'check' || col.kind === 'dot') cls += ' align-center';
    if (extra) cls += ' ' + extra;
    var kids = [];
    if (content !== undefined && content !== null && content !== '') {
      kids.push(el('span', { class: 'tb-fixed', text: String(content) }));
    } else if (KINDS[col.kind]) {
      var k = KINDS[col.kind](s);
      if (k) kids.push(k);
    }
    return el('div', { class: cls }, kids);
  }

  /* One table block: optional title, header row, body rows, optional total. */
  function block(spec, s) {
    s = s || {};
    var cols = spec.columns || [{ label: '', flex: 1 }];
    var wrap = el('section', { class: 'tb-block' + (spec.grow ? ' grow' : '') });
    if (spec.weight) wrap.style.flexGrow = spec.weight;

    if (spec.title) {
      wrap.appendChild(el('h3', { class: 'tb-title' }, [
        el('span', { text: spec.title }),
        spec.note ? el('em', { text: spec.note }) : null
      ]));
    }

    var grid = el('div', { class: 'tb-grid' + (spec.zebra || s.zebra ? ' zebra' : '') +
      (spec.compact ? ' compact' : '') });
    grid.style.gridTemplateColumns = columnsTemplate(cols);

    var showHead = cols.some(function (c) { return c.label; });
    if (showHead) {
      cols.forEach(function (c) {
        grid.appendChild(el('div', {
          class: 'tb-head' + (c.align || c.kind === 'num' ? ' align-' + (c.align || 'right') : '') +
            (c.kind === 'check' || c.kind === 'dot' ? ' align-center' : ''),
          text: c.label || ''
        }));
      });
    }

    var data = spec.data || [];
    var count = Math.max(spec.rows || 0, data.length);
    for (var r = 0; r < count; r++) {
      var row = data[r] || [];
      for (var c = 0; c < cols.length; c++) {
        grid.appendChild(cell(cols[c], s, row[c], r % 2 ? 'alt' : ''));
      }
    }

    if (spec.total) {
      var from = spec.total.from === undefined ? cols.length - 1 : spec.total.from;
      for (var t = 0; t < cols.length; t++) {
        grid.appendChild(cell(cols[t], s,
          t === from - 1 || (from === 0 && t === 0) ? spec.total.label : '', 'total'));
      }
    }

    wrap.appendChild(grid);
    return wrap;
  }

  /* A run of ruled lines — the "just give me space" block. */
  function lines(spec) {
    var wrap = el('section', { class: 'tb-block' + (spec.grow ? ' grow' : '') });
    if (spec.weight) wrap.style.flexGrow = spec.weight;
    if (spec.title) wrap.appendChild(el('h3', { class: 'tb-title' }, [el('span', { text: spec.title })]));
    var box = el('div', { class: 'tb-lines ' + (spec.fill || 'lines') });
    if (spec.rows) {
      for (var i = 0; i < spec.rows; i++) box.appendChild(el('div', { class: 'tb-line' }));
    } else {
      box.classList.add('fill');
    }
    wrap.appendChild(box);
    return wrap;
  }

  /* A checklist: items down, optionally in several columns. */
  function checklist(spec, s) {
    var wrap = el('section', { class: 'tb-block' + (spec.grow ? ' grow' : '') });
    if (spec.weight) wrap.style.flexGrow = spec.weight;
    if (spec.title) {
      wrap.appendChild(el('h3', { class: 'tb-title' }, [
        el('span', { text: spec.title }),
        spec.note ? el('em', { text: spec.note }) : null
      ]));
    }
    var list = el('div', { class: 'tb-checklist' });
    list.style.columnCount = spec.columns || 1;
    var items = spec.items || [];
    var blanks = spec.blanks || 0;
    items.concat(new Array(blanks).fill('')).forEach(function (item) {
      list.appendChild(el('div', { class: 'tb-item' }, [
        el('span', { class: 'tb-check ' + (s && s.checkShape ? s.checkShape : 'square') }),
        el('span', { class: 'tb-item-text', text: item }),
        item ? null : el('span', { class: 'tb-item-rule' })
      ]));
    });
    wrap.appendChild(list);
    return wrap;
  }

  /* Lay several blocks out in columns. */
  function row(blocks, opts) {
    var r = el('div', { class: 'tb-row' + (opts && opts.grow ? ' grow' : '') });
    if (opts && opts.weight) r.style.flexGrow = opts.weight;
    if (opts && opts.template) r.style.gridTemplateColumns = opts.template;
    else r.style.gridTemplateColumns = 'repeat(' + blocks.length + ', 1fr)';
    blocks.forEach(function (b) { if (b) r.appendChild(b); });
    return r;
  }

  AP.table = { block: block, lines: lines, checklist: checklist, row: row };
})();
