/* ==========================================================================
   Calendar renderer. Turns a plain state object into an array of <div.page>
   elements. Every layout shares the same annotation pipeline (holidays,
   moon phases, custom events) so options behave consistently everywhere.
   ========================================================================== */
window.AP = window.AP || {};
(function () {
  var el = AP.el;

  /* ---- Layout catalogue -------------------------------------------------- */
  var LAYOUTS = {
    month:    { label: 'Month per page',  unit: 'months', hint: 'One big month with room to write' },
    multi:    { label: 'Multi-month',     unit: 'months', hint: '2, 3, 4 or 6 months on a sheet' },
    year:     { label: 'Year on a page',  unit: 'years',  hint: 'All twelve months at a glance' },
    yeargrid: { label: 'Year grid',       unit: 'years',  hint: 'Days down, months across — plan a whole year' },
    agenda:   { label: 'List / agenda',   unit: 'months', hint: 'One line per day, vertical' },
    week:     { label: 'Week per page',   unit: 'weeks',  hint: 'Weekly planner, blank or hourly' },
    photo:    { label: 'Photo calendar',  unit: 'months', hint: 'Image on top, month below' }
  };
  var UNIT_LABEL = { months: 'Months', years: 'Years', weeks: 'Weeks' };

  /* ---- Event parsing ------------------------------------------------------ */
  /*   2026-03-04 Trip to Osaka   → one specific date
       12-25 Christmas            → every year
       *-15 Payday                → every month                              */
  function parseEvents(text) {
    var out = { dated: {}, annual: {}, monthly: {} };
    if (!text) return out;
    text.split(/\r?\n/).forEach(function (raw) {
      var line = raw.trim();
      if (!line || line.charAt(0) === '#') return;
      var m;
      if ((m = line.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(.+)$/))) {
        push(out.dated, m[1] + '-' + AP.pad(+m[2]) + '-' + AP.pad(+m[3]), m[4]);
      } else if ((m = line.match(/^(\d{1,2})[-/](\d{1,2})\s+(.+)$/))) {
        push(out.annual, AP.pad(+m[1]) + '-' + AP.pad(+m[2]), m[3]);
      } else if ((m = line.match(/^\*[-/](\d{1,2})\s+(.+)$/))) {
        push(out.monthly, AP.pad(+m[1]), m[2]);
      }
    });
    function push(bag, k, v) { (bag[k] = bag[k] || []).push(v.trim()); }
    return out;
  }
  AP.parseEvents = parseEvents;

  /* ---- Annotation lookup -------------------------------------------------- */
  function makeAnnotator(state, years) {
    var hol = state.holiday.countries.length || state.holiday.observances ||
              state.holiday.lunarNewYear || state.holiday.seasons
      ? AP.holidays.forYears(years, {
          countries: state.holiday.countries,
          observances: state.holiday.observances,
          lunarNewYear: state.holiday.lunarNewYear,
          seasons: state.holiday.seasons,
          substitute: state.holiday.substitute
        })
      : {};
    var moon = state.moon ? AP.moonPhasesForYears(years) : {};
    var ev = parseEvents(state.events);
    var today = AP.today();

    return function (dt) {
      var k = AP.key(dt);
      var mmdd = k.slice(5);
      var items = [];
      (hol[k] || []).forEach(function (h) {
        if (h.observed && !state.holiday.showObserved) return;
        items.push({ text: h.name, cls: h.type === 'season' ? 'season' : 'hol' });
      });
      (ev.dated[k] || []).forEach(function (t) { items.push({ text: t, cls: 'evt' }); });
      (ev.annual[mmdd] || []).forEach(function (t) { items.push({ text: t, cls: 'evt' }); });
      (ev.monthly[k.slice(8)] || []).forEach(function (t) { items.push({ text: t, cls: 'evt' }); });
      return {
        items: items,
        isHoliday: !!(hol[k] && hol[k].some(function (h) {
          return h.type === 'public' && (state.holiday.showObserved || !h.observed);
        })),
        moon: moon[k],
        isToday: state.markToday && AP.sameDay(dt, today)
      };
    };
  }

  /* ---- Small parts -------------------------------------------------------- */
  function isWeekend(dt, weekendDays) { return weekendDays.indexOf(dt.getDay()) !== -1; }

  function altLabel(dt, mode, weekStart) {
    if (mode === 'doy') return String(AP.dayOfYear(dt));
    if (mode === 'left') {
      var end = AP.date(dt.getFullYear(), 11, 31);
      return String(Math.round((end - dt) / 86400000));
    }
    if (mode === 'week') return 'W' + AP.isoWeek(dt);
    return '';
  }

  function weekNo(dt, mode, weekStart) {
    return mode === 'us' ? AP.usWeek(dt, weekStart) : AP.isoWeek(dt);
  }

  /* Miniature month used in headers and year pages. */
  function miniMonth(y, m, state, annotate, opts) {
    opts = opts || {};
    var order = AP.weekOrder(state.weekStart);
    var kids = [];
    order.forEach(function (wd) {
      kids.push(el('div', {
        class: 'dow' + (isWeekend(AP.date(2024, 0, 7 + wd), state.weekendDays) ? ' we' : ''),
        text: AP.dayName(wd, state.locale, 'narrow')
      }));
    });
    var g = AP.monthGrid(y, m, state.weekStart, false);
    g.cells.forEach(function (c) {
      var cls = 'd';
      if (!c.inMonth) cls += ' out';
      else {
        var a = annotate(c.date);
        if (isWeekend(c.date, state.weekendDays)) cls += ' we';
        if (a.isHoliday && opts.holidays !== false) cls += ' hol';
        if (a.isToday) cls += ' today';
      }
      kids.push(el('div', { class: cls, text: String(c.date.getDate()) }));
    });
    return el('div', { class: 'mini' }, [
      el('div', { class: 'mini-name', text: AP.monthName(y, m, state.locale, opts.short ? 'short' : 'long') }),
      el('div', { class: 'mini-grid' }, kids)
    ]);
  }

  /* Full month grid. `scale` shrinks day numbers for dense layouts. */
  function monthGridEl(y, m, state, annotate, opts) {
    opts = opts || {};
    var order = AP.weekOrder(state.weekStart);
    var showWk = state.weekNumbers !== 'none' && opts.weekNumbers !== false;
    var g = AP.monthGrid(y, m, state.weekStart, state.sixWeeks);
    var cls = 'cal-grid pos-' + state.numberPos;
    if (state.rules === 'none') cls += ' no-rules';
    if (state.rules === 'outer') cls += ' rules-outer';

    var grid = el('div', { class: cls });
    grid.style.setProperty('--weeks', g.weeks);
    grid.style.gridTemplateColumns = (showWk ? 'minmax(1.4em, auto) ' : '') + 'repeat(7, 1fr)';

    if (showWk) grid.appendChild(el('div', { class: 'dow wk-col', text: state.weekNumbers === 'us' ? '#' : 'WK' }));
    order.forEach(function (wd) {
      var we = isWeekend(AP.date(2024, 0, 7 + wd), state.weekendDays);
      grid.appendChild(el('div', {
        class: 'dow' + (we && state.weekendStyle === 'accent' ? ' we' : ''),
        text: AP.dayName(wd, state.locale, opts.dowStyle || state.dowStyle)
      }));
    });

    for (var w = 0; w < g.weeks; w++) {
      if (showWk) {
        grid.appendChild(el('div', {
          class: 'cell wk-col',
          text: String(weekNo(g.cells[w * 7].date, state.weekNumbers, state.weekStart))
        }));
      }
      for (var i = 0; i < 7; i++) {
        grid.appendChild(dayCell(g.cells[w * 7 + i], state, annotate, opts));
      }
    }
    return grid;
  }

  function dayCell(c, state, annotate, opts) {
    var dt = c.date, a = annotate(dt);
    var cls = 'cell';
    var we = isWeekend(dt, state.weekendDays);
    if (we && state.weekendStyle !== 'none' && (c.inMonth || state.adjacent === 'show')) cls += ' we';
    if (!c.inMonth) cls += state.adjacent === 'hide' ? ' hidden-out' : ' out';
    if (c.inMonth && a.isHoliday && state.holiday.style !== 'none') cls += ' hol';
    if (c.inMonth && a.isToday) cls += ' today';

    var top = [el('span', { class: 'dnum', text: String(dt.getDate()) })];
    if (state.altLabel !== 'none' && c.inMonth) {
      var t = altLabel(dt, state.altLabel, state.weekStart);
      if (t) top.push(el('span', { class: 'dnum-alt', text: t }));
    }
    if (a.moon !== undefined && c.inMonth) {
      top.push(el('span', { class: 'moon', html: AP.moonGlyph(a.moon, 10) }));
    }

    var kids = [el('div', { class: 'cell-top' }, top)];

    if (c.inMonth && (state.holiday.style === 'name' || state.holiday.style === 'both' || a.items.some(function (i) { return i.cls === 'evt'; }))) {
      var shown = a.items.filter(function (it) {
        if (it.cls === 'evt') return true;
        return state.holiday.style === 'name' || state.holiday.style === 'both';
      }).slice(0, opts.maxItems || 3);
      if (shown.length) {
        kids.push(el('div', { class: 'cell-items' }, shown.map(function (it) {
          return el('span', { class: 'it ' + it.cls, text: it.text });
        })));
      }
    }
    if (opts.fill && c.inMonth) kids.push(el('div', { class: 'cell-lines ' + opts.fill }));

    var cell = el('div', { class: cls }, kids);
    if (c.inMonth && a.isHoliday && (state.holiday.style === 'dot' || state.holiday.style === 'both')) {
      cell.appendChild(el('div', { class: 'hol-dot' }));
    }
    return cell;
  }

  function headerEl(y, m, state, annotate, opts) {
    opts = opts || {};
    var titleKids = [];
    var monthText = opts.titleText !== undefined
      ? opts.titleText
      : AP.monthName(y, m, state.locale, 'long');
    titleKids.push(el('span', { class: 'cal-month', text: monthText }));
    if (opts.year !== false) titleKids.push(el('span', { class: 'cal-year', text: String(y) }));

    var titles = el('div', { class: 'cal-titles' }, [
      el('div', { class: 'cal-title' + (state.accentTitle ? ' accent' : '') }, titleKids),
      state.subtitle ? el('div', { class: 'cal-sub', text: state.subtitle }) : null
    ]);

    var head = el('header', { class: 'cal-head' + (state.headerAlign === 'center' ? ' center' : '') }, [titles]);

    if (state.miniMonths && opts.minis !== false) {
      var prev = AP.addMonths(y, m, -1), next = AP.addMonths(y, m, 1);
      head.appendChild(el('div', { class: 'cal-minis' }, [
        miniMonth(prev.y, prev.m, state, annotate, { short: true, holidays: false }),
        miniMonth(next.y, next.m, state, annotate, { short: true, holidays: false })
      ]));
    }
    return head;
  }

  function notesEl(state) {
    if (state.notes === 'none') return null;
    var pos = state.notesPos === 'side' ? 'side' : 'below';
    var node = el('aside', { class: 'cal-notes ' + pos + (state.rules === 'none' ? ' plain' : '') }, [
      state.notesTitle ? el('div', { class: 'notes-title', text: state.notesTitle }) : null,
      el('div', { class: 'notes-fill ' + state.notes })
    ]);
    if (state.notesPos === 'side') node.style.width = state.notesSize + '%';
    else node.style.height = state.notesSize + '%';
    return node;
  }

  function footerEl(state, extra) {
    if (!state.footer && !extra) return null;
    return el('footer', { class: 'cal-foot' }, [
      state.footer ? el('span', { text: state.footer }) : null,
      extra ? el('span', { class: 'f-right', text: extra }) : null
    ]);
  }

  function legendEl(state, years, monthFilter) {
    if (!state.holiday.legend || !state.holiday.countries.length) return null;
    var map = AP.holidays.forYears(years, {
      countries: state.holiday.countries,
      observances: state.holiday.observances,
      lunarNewYear: state.holiday.lunarNewYear,
      seasons: state.holiday.seasons,
      substitute: state.holiday.substitute
    });
    var rows = [];
    Object.keys(map).sort().forEach(function (k) {
      var parts = k.split('-'), y = +parts[0], m = +parts[1] - 1, d = +parts[2];
      if (monthFilter && !monthFilter(y, m)) return;
      map[k].forEach(function (h) {
        if (h.observed && !state.holiday.showObserved) return;
        rows.push(el('span', { class: 'lg' }, [
          el('b', { text: AP.monthName(y, m, state.locale, 'short') + ' ' + d }),
          document.createTextNode(h.name)
        ]));
      });
    });
    if (!rows.length) return null;
    return el('div', { class: 'legend' }, rows);
  }

  /* ---- Page shell --------------------------------------------------------- */
  function newPage(state, dims, layoutName) {
    var page = el('div', { class: 'page theme-' + state.theme + (state.inkSaver ? ' ink-saver' : '') });
    page.dataset.layout = layoutName;
    page.style.width = dims.w + 'mm';
    page.style.height = dims.h + 'mm';
    page.style.fontSize = dims.base + 'mm';
    page.style.setProperty('--pad', state.margin + 'mm');
    page.style.setProperty('--accent', state.accent);
    page.style.setProperty('--rule', state.ruleColor);
    page.style.setProperty('--shade', state.weekendStyle === 'tint' ? state.shadeColor : '#fff');
    page.style.setProperty('--numscale', state.numberScale);
    page.style.setProperty('--dow-align', state.dowAlign);
    var inner = el('div', { class: 'page-inner' });
    page.appendChild(inner);
    return { page: page, inner: inner };
  }

  /* ---- Layout implementations -------------------------------------------- */
  var RENDER = {};

  RENDER.month = function (state, dims, cursor, annotate) {
    var p = newPage(state, dims, 'month');
    p.inner.appendChild(headerEl(cursor.y, cursor.m, state, annotate));
    var body = el('div', { class: 'cal-body' + (state.notesPos === 'below' ? ' stacked' : '') });
    body.appendChild(monthGridEl(cursor.y, cursor.m, state, annotate, {
      fill: state.cellFill === 'none' ? null : state.cellFill,
      maxItems: 3
    }));
    var n = notesEl(state);
    if (n) body.appendChild(n);
    p.inner.appendChild(body);
    var lg = legendEl(state, [cursor.y], function (y, m) { return y === cursor.y && m === cursor.m; });
    if (lg) p.inner.appendChild(lg);
    var f = footerEl(state);
    if (f) p.inner.appendChild(f);
    return p.page;
  };

  RENDER.photo = function (state, dims, cursor, annotate) {
    var p = newPage(state, dims, 'photo');
    var frame = el('div', { class: 'photo-frame' });
    frame.style.height = state.photoSize + '%';
    if (state.photoData) frame.appendChild(el('img', { src: state.photoData, alt: '' }));
    else frame.appendChild(el('div', { class: 'ph-hint', text: 'Photo' }));
    p.inner.appendChild(frame);
    p.inner.appendChild(headerEl(cursor.y, cursor.m, state, annotate, { minis: false }));
    var body = el('div', { class: 'cal-body' });
    body.appendChild(monthGridEl(cursor.y, cursor.m, state, annotate, { maxItems: 1 }));
    p.inner.appendChild(body);
    var f = footerEl(state);
    if (f) p.inner.appendChild(f);
    return p.page;
  };

  RENDER.multi = function (state, dims, cursor, annotate) {
    var per = state.perPage;
    var p = newPage(state, dims, 'multi');
    var first = cursor, last = AP.addMonths(cursor.y, cursor.m, per - 1);
    var titleText = AP.monthName(first.y, first.m, state.locale, 'long') +
      (first.y !== last.y ? ' ' + first.y : '') + ' – ' +
      AP.monthName(last.y, last.m, state.locale, 'long');
    if (state.showRangeTitle) {
      p.inner.appendChild(headerEl(last.y, last.m, state, annotate, { titleText: titleText }));
    }
    var cols = state.multiCols || defaultCols(per, dims);
    var wrap = el('div', { class: 'multi-wrap' });
    wrap.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    wrap.style.gridTemplateRows = 'repeat(' + Math.ceil(per / cols) + ', 1fr)';
    for (var i = 0; i < per; i++) {
      var c = AP.addMonths(cursor.y, cursor.m, i);
      var cell = el('div', { class: 'multi-cell' }, [
        el('div', { class: 'cal-title' + (state.accentTitle ? ' accent' : '') }, [
          el('span', { class: 'cal-month', text: AP.monthName(c.y, c.m, state.locale, 'long') }),
          el('span', { class: 'cal-year', text: String(c.y) })
        ])
      ]);
      cell.appendChild(monthGridEl(c.y, c.m, state, annotate, {
        weekNumbers: per <= 2, maxItems: per <= 2 ? 2 : 1, dowStyle: per > 2 ? 'narrow' : state.dowStyle
      }));
      wrap.appendChild(cell);
    }
    p.inner.appendChild(wrap);
    var f = footerEl(state);
    if (f) p.inner.appendChild(f);
    return p.page;
  };

  function defaultCols(per, dims) {
    var wide = dims.w > dims.h;
    if (per === 2) return wide ? 2 : 1;
    if (per === 3) return wide ? 3 : 1;
    if (per === 4) return 2;
    if (per === 6) return wide ? 3 : 2;
    return 2;
  }

  RENDER.year = function (state, dims, cursor, annotate) {
    var p = newPage(state, dims, 'year');
    p.inner.appendChild(headerEl(cursor.y, 0, state, annotate, {
      titleText: String(cursor.y), year: false, minis: false
    }));
    var cols = state.yearCols || (dims.w > dims.h ? 4 : 3);
    var wrap = el('div', { class: 'year-wrap' });
    wrap.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    wrap.style.gridTemplateRows = 'repeat(' + Math.ceil(12 / cols) + ', 1fr)';
    for (var m = 0; m < 12; m++) {
      wrap.appendChild(miniMonth(cursor.y, m, state, annotate, { short: state.dowStyle === 'narrow' }));
    }
    p.inner.appendChild(wrap);
    var lg = legendEl(state, [cursor.y]);
    if (lg) p.inner.appendChild(lg);
    var f = footerEl(state);
    if (f) p.inner.appendChild(f);
    return p.page;
  };

  RENDER.yeargrid = function (state, dims, cursor, annotate) {
    var p = newPage(state, dims, 'yeargrid');
    p.inner.appendChild(headerEl(cursor.y, 0, state, annotate, {
      titleText: String(cursor.y), year: false, minis: false
    }));
    var down = state.ygridOrient === 'down'; /* months down the page */
    var grid = el('div', { class: 'ygrid' });
    var labels = state.ygridLabels;

    if (!down) {
      grid.style.gridTemplateColumns = 'minmax(1.6em, auto) repeat(12, 1fr)';
      grid.style.gridTemplateRows = 'auto repeat(31, 1fr)';
      grid.appendChild(el('div', { class: 'yg-head' }));
      for (var m = 0; m < 12; m++) {
        grid.appendChild(el('div', { class: 'yg-head', text: AP.monthName(cursor.y, m, state.locale, 'short') }));
      }
      for (var d = 1; d <= 31; d++) {
        grid.appendChild(el('div', { class: 'yg-dnum', text: String(d) }));
        for (var mm = 0; mm < 12; mm++) grid.appendChild(ygCell(cursor.y, mm, d, state, annotate, labels));
      }
    } else {
      grid.style.gridTemplateColumns = 'minmax(2.4em, auto) repeat(31, 1fr)';
      grid.style.gridTemplateRows = 'auto repeat(12, 1fr)';
      grid.appendChild(el('div', { class: 'yg-head' }));
      for (var dd = 1; dd <= 31; dd++) grid.appendChild(el('div', { class: 'yg-head', text: String(dd) }));
      for (var m2 = 0; m2 < 12; m2++) {
        grid.appendChild(el('div', { class: 'yg-head', text: AP.monthName(cursor.y, m2, state.locale, 'short') }));
        for (var d2 = 1; d2 <= 31; d2++) grid.appendChild(ygCell(cursor.y, m2, d2, state, annotate, false));
      }
    }
    p.inner.appendChild(grid);
    var f = footerEl(state);
    if (f) p.inner.appendChild(f);
    return p.page;
  };

  function ygCell(y, m, d, state, annotate, labels) {
    if (d > AP.daysInMonth(y, m)) return el('div', { class: 'yg-cell blank' });
    var dt = AP.date(y, m, d), a = annotate(dt);
    var cls = 'yg-cell';
    if (isWeekend(dt, state.weekendDays) && state.weekendStyle !== 'none') cls += ' we';
    if (a.isHoliday && state.holiday.style !== 'none') cls += ' hol';
    var kids = [el('span', { class: 'wd', text: AP.dayName(dt.getDay(), state.locale, 'narrow') })];
    if (labels && a.items.length) {
      kids.push(el('span', { class: 'yg-label', text: a.items[0].text }));
    }
    return el('div', { class: cls }, kids);
  }

  RENDER.agenda = function (state, dims, cursor, annotate) {
    var p = newPage(state, dims, 'agenda');
    p.inner.appendChild(headerEl(cursor.y, cursor.m, state, annotate, { minis: false }));
    var n = AP.daysInMonth(cursor.y, cursor.m);
    var twoCol = state.agendaCols === 2;
    var list = el('div', { class: 'agenda' + (twoCol ? ' two-col' : '') });
    list.style.gridTemplateRows = 'repeat(' + Math.ceil(n / (twoCol ? 2 : 1)) + ', 1fr)';
    list.style.gridAutoFlow = twoCol ? 'column' : 'row';
    for (var d = 1; d <= n; d++) {
      var dt = AP.date(cursor.y, cursor.m, d), a = annotate(dt);
      var cls = 'arow';
      if (isWeekend(dt, state.weekendDays) && state.weekendStyle !== 'none') cls += ' we';
      var meta = a.items.map(function (i) { return i.text; }).join(' · ');
      list.appendChild(el('div', { class: cls }, [
        el('div', { class: 'a-date' }, [
          el('span', { class: 'a-num', text: String(d) }),
          el('span', { class: 'a-dow', text: AP.dayName(dt.getDay(), state.locale, 'short') })
        ]),
        el('div', { class: 'a-body' }, [
          meta ? el('span', { class: 'a-meta', text: meta }) : null,
          a.moon !== undefined ? el('span', { class: 'moon', html: AP.moonGlyph(a.moon, 9) }) : null
        ])
      ]));
    }
    p.inner.appendChild(list);
    var f = footerEl(state);
    if (f) p.inner.appendChild(f);
    return p.page;
  };

  RENDER.week = function (state, dims, cursor, annotate) {
    var p = newPage(state, dims, 'week');
    var start = cursor.date;
    var end = AP.addDays(start, 6);
    /* formatRange gets the locale's own range idiom right ("1–7 March",
       "3月1日～7日"); fall back to a plain join where it is unavailable. */
    var rangeFmt = AP.fmt(state.locale, { month: 'long', day: 'numeric' });
    var title = rangeFmt.formatRange
      ? rangeFmt.formatRange(start, end)
      : rangeFmt.format(start) + ' – ' + rangeFmt.format(end);
    p.inner.appendChild(headerEl(start.getFullYear(), start.getMonth(), state, annotate, {
      titleText: title, minis: false
    }));

    var slots = state.weekNotes ? 8 : 7;
    var wide = dims.w > dims.h;
    var wrap = el('div', { class: 'weekwrap' });
    if (state.weekShape === 'columns') {
      wrap.style.gridTemplateColumns = 'repeat(' + slots + ', 1fr)';
    } else if (state.weekShape === 'grid') {
      wrap.style.gridTemplateColumns = 'repeat(' + (wide ? 4 : 2) + ', 1fr)';
      wrap.style.gridTemplateRows = 'repeat(' + Math.ceil(slots / (wide ? 4 : 2)) + ', 1fr)';
    } else {
      wrap.style.gridTemplateRows = 'repeat(' + slots + ', 1fr)';
    }

    for (var i = 0; i < 7; i++) {
      var dt = AP.addDays(start, i), a = annotate(dt);
      var cls = 'wday';
      if (isWeekend(dt, state.weekendDays) && state.weekendStyle !== 'none') cls += ' we';
      var holText = a.items.map(function (it) { return it.text; }).slice(0, 2).join(' · ');
      var body;
      if (state.weekHours) {
        var hours = el('div', { class: 'hours' });
        for (var h = state.hourStart; h <= state.hourEnd; h++) {
          hours.appendChild(el('div', { class: 'hr' }, [
            el('span', { class: 'hr-l', text: formatHour(h, state.locale) })
          ]));
        }
        body = hours;
      } else {
        body = el('div', { class: 'wday-body ' + (state.weekFill === 'none' ? '' : state.weekFill) });
      }
      wrap.appendChild(el('div', { class: cls }, [
        el('div', { class: 'wday-head' }, [
          el('span', { class: 'wd-name', text: AP.dayName(dt.getDay(), state.locale, 'long') }),
          holText ? el('span', { class: 'wd-hol', text: holText }) : null,
          el('span', { class: 'wd-num', text: AP.fmt(state.locale, { month: 'short', day: 'numeric' }).format(dt) })
        ]),
        body
      ]));
    }
    if (state.weekNotes) {
      wrap.appendChild(el('div', { class: 'wday' }, [
        el('div', { class: 'wday-head' }, [el('span', { class: 'wd-name', text: state.notesTitle || 'Notes' })]),
        el('div', { class: 'wday-body ' + (state.weekFill === 'none' ? '' : state.weekFill) })
      ]));
    }
    p.inner.appendChild(wrap);
    var f = footerEl(state, state.weekNumbers !== 'none'
      ? 'Week ' + weekNo(start, state.weekNumbers, state.weekStart) : null);
    if (f) p.inner.appendChild(f);
    return p.page;
  };

  function formatHour(h, locale) {
    var use24 = !/^en-US|^en-PH|^en-CA/.test(locale);
    if (use24) return AP.pad(h) + ':00';
    var ampm = h < 12 ? 'am' : 'pm';
    var hh = h % 12 === 0 ? 12 : h % 12;
    return hh + ampm;
  }

  /* ---- Page sequencing ---------------------------------------------------- */
  function sequence(state) {
    var out = [];
    var unit = LAYOUTS[state.layout].unit;
    var n = AP.clamp(state.count, 1, 60);
    if (unit === 'years') {
      for (var i = 0; i < n; i++) out.push({ y: state.startYear + i, m: 0 });
    } else if (unit === 'weeks') {
      var first = AP.date(state.startYear, state.startMonth, state.startDay || 1);
      var back = (first.getDay() - state.weekStart + 7) % 7;
      var wk = AP.addDays(first, -back);
      for (var w = 0; w < n; w++) out.push({ date: AP.addDays(wk, w * 7), y: 0, m: 0 });
    } else {
      var step = state.layout === 'multi' ? state.perPage : 1;
      var pages = Math.ceil(n / step);
      for (var k = 0; k < pages; k++) {
        var c = AP.addMonths(state.startYear, state.startMonth, k * step);
        out.push(c);
      }
    }
    return out;
  }

  /* Years touched, so annotations are computed once. */
  function touchedYears(state, seq) {
    var set = {};
    seq.forEach(function (c) {
      if (c.date) {
        set[c.date.getFullYear()] = 1;
        set[AP.addDays(c.date, 6).getFullYear()] = 1;
      } else if (LAYOUTS[state.layout].unit === 'years') {
        set[c.y] = 1;
      } else {
        var span = state.layout === 'multi' ? state.perPage : 1;
        for (var i = -1; i <= span; i++) {
          var t = AP.addMonths(c.y, c.m, i);
          set[t.y] = 1;
        }
      }
    });
    return Object.keys(set).map(Number).sort();
  }

  /* ---- Public API ---------------------------------------------------------- */
  AP.calendar = {
    LAYOUTS: LAYOUTS,
    UNIT_LABEL: UNIT_LABEL,

    render: function (state) {
      var dims = AP.pageSize(state.paper, state.orientation);
      dims.base = Math.min(dims.w, dims.h) / 58 * state.textScale;
      var seq = sequence(state);
      var years = touchedYears(state, seq);
      var annotate = makeAnnotator(state, years);
      var fn = RENDER[state.layout] || RENDER.month;
      return seq.map(function (cursor) { return fn(state, dims, cursor, annotate); });
    },

    /* Page-size CSS that must be injected for printing at true scale. */
    pageRule: function (state) {
      var d = AP.pageSize(state.paper, state.orientation);
      return '@page { size: ' + d.w + 'mm ' + d.h + 'mm; margin: 0; }';
    },

    filename: function (state) {
      var bits = ['calendar', state.layout];
      if (LAYOUTS[state.layout].unit === 'years') bits.push(String(state.startYear));
      else bits.push(state.startYear + '-' + AP.pad(state.startMonth + 1));
      bits.push(state.paper);
      return bits.join('-');
    }
  };
})();
