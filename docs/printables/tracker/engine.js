/* ==========================================================================
   Tracker engine — habit trackers and chore charts.

   Both are the same shape: a list of things down the side, a run of days
   across the top, and a box at every crossing. The difference is wording and
   box style, so one engine covers both.
   ========================================================================== */
window.AP = window.AP || {};
(function () {
  var el = AP.el;

  var LAYOUTS = {
    month: { label: 'Month',     hint: 'Every day of a month across the page' },
    week:  { label: 'Weeks',     hint: 'Seven columns, one block per week' },
    goal:  { label: 'Challenge', hint: 'A run of numbered boxes — 30 days, 100 days' }
  };

  function items(s) {
    return (s.items || '').split(/\r?\n/)
      .map(function (l) { return l.trim(); })
      .filter(Boolean)
      .slice(0, 40);
  }

  function box(s, cls) {
    return el('div', { class: 'tk-cell ' + (cls || '') }, [
      s.shape === 'none' ? null : el('span', { class: 'mark mark-' + s.shape })
    ]);
  }

  /* Column headers: day number over weekday initial. */
  function dayHead(s, dt, cls) {
    return el('div', { class: 'tk-head ' + (cls || '') }, [
      el('span', { class: 'd-num', text: String(dt.getDate()) }),
      s.showWeekday
        ? el('span', { class: 'd-dow', text: AP.dayName(dt.getDay(), s.locale, 'narrow') })
        : null
    ]);
  }

  function isWeekend(s, dt) { return s.weekendDays.indexOf(dt.getDay()) !== -1; }

  function gridTemplate(s, cols, extra) {
    return s.labelWidth + '% repeat(' + cols + ', 1fr)' +
      (extra ? ' ' + (s.goalWidth || 10) + '%' : '');
  }

  /* ---- Layouts ------------------------------------------------------------ */
  var BUILD = {};

  BUILD.month = function (s, list) {
    var n = AP.daysInMonth(s.year, s.month);
    var grid = el('div', { class: 'tk-grid' + (s.rowFill === 'compact' ? ' compact' : '') });
    grid.style.gridTemplateColumns = gridTemplate(s, n, s.goalColumn);
    grid.style.setProperty('--rows', list.length);

    grid.appendChild(el('div', { class: 'tk-head tk-corner', text: s.listHeading || '' }));
    for (var d = 1; d <= n; d++) {
      var dt = AP.date(s.year, s.month, d);
      grid.appendChild(dayHead(s, dt, isWeekend(s, dt) && s.weekendShade ? 'we' : ''));
    }
    if (s.goalColumn) grid.appendChild(el('div', { class: 'tk-head', text: s.goalHeading }));

    list.forEach(function (name, r) {
      grid.appendChild(el('div', { class: 'tk-label' + (r % 2 && s.zebra ? ' alt' : ''), text: name }));
      for (var d = 1; d <= n; d++) {
        var dt = AP.date(s.year, s.month, d);
        var cls = (isWeekend(s, dt) && s.weekendShade ? 'we ' : '') + (r % 2 && s.zebra ? 'alt' : '');
        grid.appendChild(box(s, cls));
      }
      if (s.goalColumn) grid.appendChild(el('div', { class: 'tk-cell goal' + (r % 2 && s.zebra ? ' alt' : '') }));
    });
    return grid;
  };

  BUILD.week = function (s, list) {
    var wrap = el('div', { class: 'tk-weeks' + (s.rowFill === 'compact' ? ' compact' : '') });
    var first = AP.date(s.year, s.month, s.startDay || 1);
    var back = (first.getDay() - s.weekStart + 7) % 7;
    var start = AP.addDays(first, -back);

    for (var w = 0; w < AP.clamp(s.weeks, 1, 8); w++) {
      var weekStart = AP.addDays(start, w * 7);
      var block = el('section', { class: 'tk-week' });
      block.appendChild(el('h3', { class: 'tk-week-title', text: weekLabel(s, weekStart) }));

      var grid = el('div', { class: 'tk-grid' + (s.rowFill === 'compact' ? ' compact' : '') });
      grid.style.gridTemplateColumns = gridTemplate(s, 7, s.goalColumn);
      grid.style.setProperty('--rows', list.length);

      grid.appendChild(el('div', { class: 'tk-head tk-corner', text: s.listHeading || '' }));
      for (var i = 0; i < 7; i++) {
        var dt = AP.addDays(weekStart, i);
        grid.appendChild(el('div', {
          class: 'tk-head wide' + (isWeekend(s, dt) && s.weekendShade ? ' we' : '')
        }, [
          el('span', { class: 'd-dow', text: AP.dayName(dt.getDay(), s.locale, 'short') }),
          el('span', { class: 'd-num', text: String(dt.getDate()) })
        ]));
      }
      if (s.goalColumn) grid.appendChild(el('div', { class: 'tk-head', text: s.goalHeading }));

      list.forEach(function (name, r) {
        grid.appendChild(el('div', { class: 'tk-label' + (r % 2 && s.zebra ? ' alt' : ''), text: name }));
        for (var i = 0; i < 7; i++) {
          var dt = AP.addDays(weekStart, i);
          grid.appendChild(box(s, (isWeekend(s, dt) && s.weekendShade ? 'we ' : '') +
            (r % 2 && s.zebra ? 'alt' : '')));
        }
        if (s.goalColumn) grid.appendChild(el('div', { class: 'tk-cell goal' + (r % 2 && s.zebra ? ' alt' : '') }));
      });
      block.appendChild(grid);
      wrap.appendChild(block);
    }
    return wrap;
  };

  function weekLabel(s, start) {
    var end = AP.addDays(start, 6);
    var f = AP.fmt(s.locale, { month: 'short', day: 'numeric' });
    return f.formatRange ? f.formatRange(start, end) : f.format(start) + ' – ' + f.format(end);
  }

  BUILD.goal = function (s, list) {
    var wrap = el('div', { class: 'tk-goals' });
    list.forEach(function (name) {
      var block = el('section', { class: 'tk-goal' });
      block.appendChild(el('h3', { class: 'tk-goal-title', text: name }));
      var strip = el('div', { class: 'tk-strip' });
      strip.style.gridTemplateColumns = 'repeat(' + s.goalCols + ', 1fr)';
      for (var i = 1; i <= AP.clamp(s.goalDays, 1, 200); i++) {
        strip.appendChild(el('div', { class: 'tk-cell numbered' }, [
          s.numberBoxes ? el('span', { class: 'n', text: String(i) }) : null,
          s.shape === 'none' ? null : el('span', { class: 'mark mark-' + s.shape })
        ]));
      }
      block.appendChild(strip);
      wrap.appendChild(block);
    });
    return wrap;
  };

  /* ---- Page assembly ------------------------------------------------------ */
  function buildPage(s) {
    var dims = AP.pageSize(s.paper, s.orientation);
    var page = el('div', { class: 'page theme-' + s.theme + (s.inkSaver ? ' ink-saver' : '') });
    page.dataset.layout = s.layout;
    page.style.width = dims.w + 'mm';
    page.style.height = dims.h + 'mm';
    page.style.fontSize = (Math.min(dims.w, dims.h) / 58 * s.textScale) + 'mm';
    page.style.setProperty('--pad', s.margin + 'mm');
    page.style.setProperty('--accent', s.accent);
    page.style.setProperty('--rule', s.ruleColor);
    page.style.setProperty('--shade', s.shadeColor);

    var inner = el('div', { class: 'page-inner' });
    page.appendChild(inner);

    var title = s.title || defaultTitle(s);
    inner.appendChild(el('header', { class: 'sheet-head' + (s.headerAlign === 'center' ? ' center' : '') }, [
      el('div', { class: 'sheet-titles' }, [
        el('div', { class: 'sheet-title' + (s.accentTitle ? ' accent' : '') }, [
          el('span', { class: 'lead', text: title }),
          s.layout !== 'goal' && s.showPeriod
            ? el('span', { class: 'muted', text: AP.monthName(s.year, s.month, s.locale, 'long') + ' ' + s.year })
            : null
        ]),
        s.subtitle ? el('div', { class: 'sheet-sub', text: s.subtitle }) : null
      ])
    ]));

    if (s.fields) {
      inner.appendChild(el('div', { class: 'sheet-fields' }, s.fieldList.split(',').map(function (f) {
        return el('div', { class: 'fld' }, [el('span', { text: f.trim() }), el('i')]);
      })));
    }

    var list = items(s);
    if (!list.length) list = ['—'];
    var body = el('div', { class: 'tk-body' });
    body.appendChild((BUILD[s.layout] || BUILD.month)(s, list));
    inner.appendChild(body);

    if (s.notesRows > 0) {
      var notes = el('div', { class: 'tk-notes' });
      notes.appendChild(el('div', { class: 'notes-title', text: s.notesTitle || 'Notes' }));
      for (var i = 0; i < s.notesRows; i++) notes.appendChild(el('div', { class: 'note-line' }));
      inner.appendChild(notes);
    }

    if (s.footer) inner.appendChild(el('footer', { class: 'sheet-foot' }, [el('span', { text: s.footer })]));
    return page;
  }

  function defaultTitle(s) {
    return s.layout === 'goal' ? 'Challenge' : 'Habit tracker';
  }

  /* ---- Public API --------------------------------------------------------- */
  AP.tracker = {
    LAYOUTS: LAYOUTS,

    render: function (s) {
      var out = [];
      var count = s.layout === 'month' ? AP.clamp(s.months, 1, 24) : 1;
      for (var i = 0; i < count; i++) {
        var cur = AP.addMonths(s.year, s.month, i);
        var page = JSON.parse(JSON.stringify(s));
        page.year = cur.y; page.month = cur.m;
        out.push(buildPage(page));
      }
      return out;
    },

    pageRule: function (s) {
      var d = AP.pageSize(s.paper, s.orientation);
      return '@page { size: ' + d.w + 'mm ' + d.h + 'mm; margin: 0; }';
    },

    filename: function (s) {
      return ['tracker', s.layout, s.year + '-' + AP.pad(s.month + 1), s.paper].join('-');
    }
  };
})();
