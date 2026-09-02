/* ==========================================================================
   Form sheets — budget, packing list, meal plan, day planner.

   All four are compositions of the shared table primitives in core/table.js,
   which is the point: adding the next one is a layout function, not a
   rendering engine.
   ========================================================================== */
window.AP = window.AP || {};
(function () {
  var el = AP.el, T = AP.table;

  var TYPES = {
    budget:  { label: 'Budget',       hint: 'Money in and out, with totals to fill in' },
    packing: { label: 'Packing list', hint: 'Checklists by category, sized to the trip' },
    meal:    { label: 'Meal plan',    hint: 'A week of meals beside a shopping list' },
    daily:   { label: 'Day planner',  hint: 'Time-blocked hours, priorities and notes' }
  };

  function list(text, limit) {
    return (text || '').split(/\r?\n/)
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l && l.charAt(0) !== '#'; })
      .slice(0, limit || 200);
  }

  /* Sections are "Heading: a, b, c" per line — one input for the whole sheet. */
  function sections(text) {
    var out = [];
    list(text).forEach(function (line) {
      var i = line.indexOf(':');
      if (i === -1) { out.push({ title: line, items: [] }); return; }
      out.push({
        title: line.slice(0, i).trim(),
        items: line.slice(i + 1).split(',').map(function (x) { return x.trim(); }).filter(Boolean)
      });
    });
    return out;
  }

  /* ---- Layouts ------------------------------------------------------------ */
  var BUILD = {};

  BUILD.budget = function (s, inner) {
    var money = s.currency ? ' (' + s.currency + ')' : '';
    var groups = sections(s.groups);
    if (!groups.length) groups = [{ title: 'Income', items: [] }, { title: 'Costs', items: [] }];

    var cols = [{ label: 'Item', flex: 3 }, { label: 'Planned' + money, flex: 1, kind: 'num' }];
    if (s.showActual) cols.push({ label: 'Actual' + money, flex: 1, kind: 'num' });
    if (s.showDiff) cols.push({ label: 'Difference', flex: 1, kind: 'num' });

    var blocks = groups.map(function (g) {
      return T.block({
        title: g.title,
        columns: cols,
        rows: Math.max(s.rowsPerGroup, g.items.length),
        data: g.items.map(function (i) { return [i]; }),
        total: s.totals ? { label: 'Total', from: 1 } : null,
        grow: true, zebra: s.zebra
      }, s);
    });

    var perRow = AP.clamp(s.columns, 1, 3);
    for (var i = 0; i < blocks.length; i += perRow) {
      inner.appendChild(T.row(blocks.slice(i, i + perRow), { grow: true }));
    }
    if (s.notesRows > 0) inner.appendChild(T.lines({ title: s.notesTitle, rows: s.notesRows }));
  };

  BUILD.packing = function (s, inner) {
    var groups = sections(s.groups);
    if (!groups.length) groups = [{ title: 'Clothes', items: [] }];
    var blocks = groups.map(function (g) {
      return T.checklist({
        title: g.title,
        note: s.showCounts && s.nights ? perTrip(g.title, s.nights) : '',
        items: g.items,
        blanks: s.blankRows,
        columns: 1,
        grow: true
      }, s);
    });
    var perRow = AP.clamp(s.columns, 1, 4);
    for (var i = 0; i < blocks.length; i += perRow) {
      inner.appendChild(T.row(blocks.slice(i, i + perRow), { grow: true }));
    }
    if (s.notesRows > 0) inner.appendChild(T.lines({ title: s.notesTitle, rows: s.notesRows }));
  };

  /* A gentle hint rather than a rule — how many of a thing a trip usually needs. */
  function perTrip(title, nights) {
    var t = title.toLowerCase();
    if (/cloth|wear|top|shirt|sock|underw/.test(t)) return '× ' + (nights + 1);
    if (/toilet|wash|bath/.test(t)) return 'travel sizes';
    if (/doc|paper|admin/.test(t)) return 'check expiry';
    return nights + ' nights';
  }

  BUILD.meal = function (s, inner) {
    var meals = list(s.meals, 6);
    if (!meals.length) meals = ['Breakfast', 'Lunch', 'Dinner'];
    var start = AP.date(s.year, s.month, s.startDay || 1);
    var back = (start.getDay() - s.weekStart + 7) % 7;
    var from = AP.addDays(start, -back);

    var cols = [{ label: '', flex: 1, width: 'minmax(4.5em, .8fr)' }];
    meals.forEach(function (m) { cols.push({ label: m, flex: 2 }); });

    var rows = [];
    for (var d = 0; d < 7; d++) {
      var dt = AP.addDays(from, d);
      var label = AP.dayName(dt.getDay(), s.locale, 'short') +
        (s.showDates ? ' ' + dt.getDate() : '');
      rows.push([label]);
    }

    /* The week is the sheet; the panels below share what is left. */
    inner.appendChild(T.block({
      columns: cols, rows: 7, data: rows, grow: true, weight: 2, zebra: s.zebra
    }, s));

    var side = [];
    if (s.shoppingList) {
      side.push(T.checklist({
        title: s.shoppingTitle, blanks: s.shoppingRows, columns: s.shoppingCols, grow: true
      }, s));
    }
    if (s.notesRows > 0) side.push(T.lines({ title: s.notesTitle, grow: true }));
    if (side.length) inner.appendChild(T.row(side, { grow: true, weight: 1 }));
  };

  BUILD.daily = function (s, inner) {
    var hours = [];
    for (var h = s.hourStart; h <= s.hourEnd; h++) {
      hours.push([formatHour(h, s.locale, s.hour24)]);
      if (s.halfHours) hours.push(['']);
    }
    var schedule = T.block({
      title: s.scheduleTitle,
      columns: [{ label: '', width: 'minmax(3.4em, auto)' }, { label: '', flex: 1 }],
      rows: hours.length, data: hours, grow: true, compact: s.halfHours
    }, s);

    var side = [];
    if (s.priorities > 0) {
      side.push(T.checklist({
        title: s.prioritiesTitle, blanks: s.priorities, columns: 1
      }, s));
    }
    if (s.todos > 0) {
      side.push(T.checklist({ title: s.todosTitle, blanks: s.todos, columns: 1 }, s));
    }
    if (s.notesRows > 0) {
      /* No row count: the notes block rules itself to fill whatever is left,
         rather than stretching a few lines across the whole column. */
      side.push(T.lines({ title: s.notesTitle, grow: true }));
    }
    inner.appendChild(T.row([schedule, el('div', { class: 'tb-block grow' }, side)],
      { template: s.sideWidth + '% ' + (100 - s.sideWidth) + '%', grow: true }));
  };

  function formatHour(h, locale, force24) {
    if (force24) return AP.pad(h) + ':00';
    var ampm = h < 12 ? 'am' : 'pm';
    var hh = h % 12 === 0 ? 12 : h % 12;
    return hh + ampm;
  }

  /* ---- Page --------------------------------------------------------------- */
  function pageEl(s, dims, index) {
    var page = el('div', { class: 'page theme-' + s.theme + (s.inkSaver ? ' ink-saver' : '') });
    page.dataset.layout = s.type;
    page.style.width = dims.w + 'mm';
    page.style.height = dims.h + 'mm';
    page.style.fontSize = (Math.min(dims.w, dims.h) / 58 * s.textScale) + 'mm';
    page.style.setProperty('--pad', s.margin + 'mm');
    page.style.setProperty('--accent', s.accent);
    page.style.setProperty('--rule', s.ruleColor);
    page.style.setProperty('--shade', s.shadeColor);

    var inner = el('div', { class: 'page-inner' });
    page.appendChild(inner);

    inner.appendChild(el('header', {
      class: 'sheet-head' + (s.headerAlign === 'center' ? ' center' : '')
    }, [
      el('div', { class: 'sheet-titles' }, [
        el('div', { class: 'sheet-title' + (s.accentTitle ? ' accent' : '') }, [
          el('span', { class: 'lead', text: s.title || TYPES[s.type].label }),
          periodLabel(s, index) ? el('span', { class: 'muted', text: periodLabel(s, index) }) : null
        ]),
        s.subtitle ? el('div', { class: 'sheet-sub', text: s.subtitle }) : null
      ])
    ]));

    if (s.fields) {
      inner.appendChild(el('div', { class: 'sheet-fields' }, s.fieldList.split(',').map(function (f) {
        return el('div', { class: 'fld' }, [el('span', { text: f.trim() }), el('i')]);
      })));
    }

    var body = el('div', { class: 'form-body' });
    inner.appendChild(body);
    (BUILD[s.type] || BUILD.budget)(s, body);

    if (s.footer) inner.appendChild(el('footer', { class: 'sheet-foot' }, [el('span', { text: s.footer })]));
    return page;
  }

  function periodLabel(s, index) {
    if (!s.showPeriod) return '';
    if (s.type === 'budget') return AP.monthName(s.year, s.month, s.locale, 'long') + ' ' + s.year;
    if (s.type === 'meal' || s.type === 'daily') {
      var d = AP.date(s.year, s.month, (s.startDay || 1) + (s.type === 'daily' ? index : index * 7));
      return AP.fmt(s.locale, { month: 'long', day: 'numeric' }).format(d);
    }
    return '';
  }

  AP.forms = {
    TYPES: TYPES,

    render: function (s) {
      var dims = AP.pageSize(s.paper, s.orientation);
      var out = [];
      var n = AP.clamp(s.sheets, 1, 40);
      for (var i = 0; i < n; i++) {
        var copy = JSON.parse(JSON.stringify(s));
        if (s.type === 'budget') {
          var m = AP.addMonths(s.year, s.month, i);
          copy.year = m.y; copy.month = m.m;
        }
        out.push(pageEl(copy, dims, i));
      }
      return out;
    },

    pageRule: function (s) {
      var d = AP.pageSize(s.paper, s.orientation);
      return '@page { size: ' + d.w + 'mm ' + d.h + 'mm; margin: 0; }';
    },

    filename: function (s) { return ['form', s.type, s.paper].join('-'); }
  };
})();
