/* ==========================================================================
   Maths worksheets — drill sheets and times-table grids, with answer keys.

   Seeded like the puzzles, and for the same reason: the answer key someone
   printed has to keep matching the sheet, so a link must reproduce exactly
   the same problems.
   ========================================================================== */
window.AP = window.AP || {};
(function () {
  var el = AP.el;

  var TYPES = {
    drill: { label: 'Drill sheet', hint: 'Rows of problems, with a separate answer key' },
    chart: { label: 'Times table', hint: 'The classic grid — filled in, or blank to complete' }
  };

  var OPS = {
    mul: { sign: '×', label: 'Multiplication' },
    add: { sign: '+', label: 'Addition' },
    sub: { sign: '−', label: 'Subtraction' },
    div: { sign: '÷', label: 'Division' }
  };

  /* ---- Problems ----------------------------------------------------------- */
  function makeProblem(op, s, rand) {
    var a, b;
    var aMin = s.aMin, aMax = s.aMax, bMin = s.bMin, bMax = s.bMax;
    function pickIn(lo, hi) { return lo + Math.floor(rand() * (hi - lo + 1)); }

    if (op === 'mul') {
      a = pickIn(aMin, aMax); b = pickIn(bMin, bMax);
      return { a: a, b: b, op: op, answer: a * b };
    }
    if (op === 'add') {
      a = pickIn(aMin, aMax); b = pickIn(bMin, bMax);
      return { a: a, b: b, op: op, answer: a + b };
    }
    if (op === 'sub') {
      a = pickIn(aMin, aMax); b = pickIn(bMin, bMax);
      /* Keep it in the whole numbers unless negatives are wanted — a child
         meeting −3 by accident is a worse sheet, not a harder one. */
      if (!s.allowNegative && b > a) { var t = a; a = b; b = t; }
      return { a: a, b: b, op: op, answer: a - b };
    }
    /* Division is generated backwards from the quotient so it always divides
       exactly; picking a and b at random gives remainders nobody asked for. */
    b = Math.max(1, pickIn(Math.max(1, bMin), Math.max(1, bMax)));
    var q = pickIn(Math.max(0, aMin), Math.max(1, aMax));
    return { a: b * q, b: b, op: 'div', answer: q };
  }

  function problems(s, rand) {
    var ops = s.operations && s.operations.length ? s.operations : ['mul'];
    var out = [];
    for (var i = 0; i < AP.clamp(s.count, 1, 200); i++) {
      out.push(makeProblem(AP.pick(ops, rand), s, rand));
    }
    return out;
  }

  /* ---- Rendering ---------------------------------------------------------- */
  function horizontal(p, index, showAnswer, s) {
    return el('div', { class: 'ws-problem horiz' }, [
      s.numbering ? el('span', { class: 'ws-n', text: (index + 1) + '.' }) : null,
      el('span', { class: 'ws-sum' }, [
        el('b', { text: String(p.a) }),
        el('i', { text: OPS[p.op].sign }),
        el('b', { text: String(p.b) }),
        el('i', { text: '=' }),
        showAnswer
          ? el('b', { class: 'ws-answer', text: String(p.answer) })
          : el('span', { class: 'ws-blank' })
      ])
    ]);
  }

  function vertical(p, index, showAnswer, s) {
    return el('div', { class: 'ws-problem vert' }, [
      s.numbering ? el('span', { class: 'ws-n', text: (index + 1) + '.' }) : null,
      el('div', { class: 'ws-stack' }, [
        el('div', { class: 'ws-top', text: String(p.a) }),
        el('div', { class: 'ws-bottom' }, [
          el('i', { text: OPS[p.op].sign }),
          el('b', { text: String(p.b) })
        ]),
        el('div', { class: 'ws-line' }),
        el('div', { class: 'ws-result' + (showAnswer ? ' filled' : '') },
          showAnswer ? [el('b', { text: String(p.answer) })] : [])
      ])
    ]);
  }

  function drillEl(s, list, showAnswers) {
    var grid = el('div', { class: 'ws-grid ' + s.format });
    grid.style.gridTemplateColumns = 'repeat(' + AP.clamp(s.columns, 1, 8) + ', 1fr)';
    list.forEach(function (p, i) {
      grid.appendChild((s.format === 'vertical' ? vertical : horizontal)(p, i, showAnswers, s));
    });
    return grid;
  }

  /* The classic 12 × 12 grid. Blank mode leaves the body empty to fill in. */
  function chartEl(s, showAnswers) {
    var cols = AP.clamp(s.chartMax, 2, 20), rows = cols;
    var grid = el('div', { class: 'ws-chart' });
    grid.style.gridTemplateColumns = 'repeat(' + (cols + 1) + ', 1fr)';
    grid.appendChild(el('div', { class: 'ws-c corner', text: OPS.mul.sign }));
    for (var c = 1; c <= cols; c++) grid.appendChild(el('div', { class: 'ws-c head', text: String(c) }));
    for (var r = 1; r <= rows; r++) {
      grid.appendChild(el('div', { class: 'ws-c head', text: String(r) }));
      for (var c2 = 1; c2 <= cols; c2++) {
        var fill = s.chartBlank && !showAnswers ? '' : String(r * c2);
        grid.appendChild(el('div', {
          class: 'ws-c' + (r === c2 ? ' diag' : ''), text: fill
        }));
      }
    }
    return grid;
  }

  /* ---- Page --------------------------------------------------------------- */
  function pageEl(s, dims, body, isAnswers) {
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
          isAnswers ? el('span', { class: 'muted', text: 'answers' }) : null
        ]),
        s.subtitle ? el('div', { class: 'sheet-sub', text: s.subtitle }) : null
      ])
    ]));
    if (s.fields && !isAnswers) {
      inner.appendChild(el('div', { class: 'sheet-fields' }, s.fieldList.split(',').map(function (f) {
        return el('div', { class: 'fld' }, [el('span', { text: f.trim() }), el('i')]);
      })));
    }
    inner.appendChild(el('div', { class: 'ws-body' }, [body]));
    if (s.footer) inner.appendChild(el('footer', { class: 'sheet-foot' }, [el('span', { text: s.footer })]));
    return page;
  }

  AP.worksheets = {
    TYPES: TYPES,
    OPS: OPS,

    render: function (s) {
      var dims = AP.pageSize(s.paper, s.orientation);
      var pages = [];

      if (s.type === 'chart') {
        for (var c = 0; c < AP.clamp(s.sheets, 1, 20); c++) {
          pages.push(pageEl(s, dims, chartEl(s, false), false));
        }
        if (s.chartBlank && s.answers) pages.push(pageEl(s, dims, chartEl(s, true), true));
        return pages;
      }

      var sheets = AP.clamp(s.sheets, 1, 20);
      var sets = [];
      for (var i = 0; i < sheets; i++) {
        sets.push(problems(s, AP.rng((s.seed * 2654435761 + i * 40503) >>> 0)));
      }
      sets.forEach(function (set) { pages.push(pageEl(s, dims, drillEl(s, set, false), false)); });
      if (s.answers) {
        sets.forEach(function (set) { pages.push(pageEl(s, dims, drillEl(s, set, true), true)); });
      }
      return pages;
    },

    pageRule: function (s) {
      var d = AP.pageSize(s.paper, s.orientation);
      return '@page { size: ' + d.w + 'mm ' + d.h + 'mm; margin: 0; }';
    },

    filename: function (s) { return ['maths', s.type, 'seed' + s.seed].join('-'); }
  };
})();
