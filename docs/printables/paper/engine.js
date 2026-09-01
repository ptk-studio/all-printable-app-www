/* ==========================================================================
   Paper & grids engine.

   Every sheet is one SVG whose viewBox is the drawing area measured in
   millimetres, so 1 user unit == 1 mm and a 5 mm square is exactly 5 mm on
   paper. That is the whole point of the generator: the free alternatives
   hand you a PDF that prints at 96 % and ruins the scale.
   ========================================================================== */
window.AP = window.AP || {};
(function () {
  var el = AP.el;

  var TYPES = {
    grid:  { label: 'Graph',       hint: 'Square grid, any size in mm or inches' },
    dots:  { label: 'Dot grid',    hint: 'Bullet-journal dots at true spacing' },
    lines: { label: 'Ruled',       hint: 'Wide, college or narrow rule' },
    iso:   { label: 'Isometric',   hint: 'Triangle grid for 3D sketching' },
    hex:   { label: 'Hexagon',     hint: 'Hex grid for maps and games' },
    staff: { label: 'Manuscript',  hint: 'Music staves, tab, or both' },
    hand:  { label: 'Handwriting', hint: 'Guide lines, with words to trace' }
  };

  /* Rule spacings people actually ask for, in millimetres. */
  var RULES = {
    wide:    { label: 'Wide rule', mm: 8.7 },
    college: { label: 'College rule', mm: 7.1 },
    narrow:  { label: 'Narrow rule', mm: 6.4 },
    custom:  { label: 'Custom', mm: null }
  };

  var MM_PER_IN = 25.4;
  function toMm(value, unit) { return unit === 'in' ? value * MM_PER_IN : value; }

  /* ---- SVG helpers ------------------------------------------------------- */
  function svgEl(name, attrs) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function line(x1, y1, x2, y2, cls) {
    return svgEl('line', { x1: r(x1), y1: r(y1), x2: r(x2), y2: r(y2), class: cls || 'ln' });
  }
  function r(n) { return Math.round(n * 1000) / 1000; }

  /* Whole cells, centred in the drawing area, so edge margins match. */
  function fit(extent, step) {
    var n = Math.max(1, Math.floor(extent / step + 1e-9));
    return { n: n, off: (extent - n * step) / 2 };
  }

  /* ---- Generators -------------------------------------------------------- */
  var DRAW = {};

  DRAW.grid = function (g, s, w, h) {
    var step = toMm(s.size, s.unit);
    var fx = fit(w, step), fy = fit(h, step);
    for (var i = 0; i <= fx.n; i++) {
      var x = fx.off + i * step;
      g.appendChild(line(x, fy.off, x, fy.off + fy.n * step, major(s, i, fx.n)));
    }
    for (var j = 0; j <= fy.n; j++) {
      var y = fy.off + j * step;
      g.appendChild(line(fx.off, y, fx.off + fx.n * step, y, major(s, j, fy.n)));
    }
  };
  function major(s, i, n) {
    if (i === 0 || i === n) return 'ln edge';
    return (s.major > 1 && i % s.major === 0) ? 'ln maj' : 'ln';
  }

  DRAW.dots = function (g, s, w, h) {
    var step = toMm(s.size, s.unit);
    var fx = fit(w, step), fy = fit(h, step);
    var rad = s.dotSize / 2;
    for (var i = 0; i <= fx.n; i++) {
      for (var j = 0; j <= fy.n; j++) {
        var isMaj = s.major > 1 && i % s.major === 0 && j % s.major === 0;
        g.appendChild(svgEl('circle', {
          cx: r(fx.off + i * step), cy: r(fy.off + j * step),
          r: r(isMaj ? rad * 1.6 : rad), class: isMaj ? 'dot maj' : 'dot'
        }));
      }
    }
  };

  DRAW.lines = function (g, s, w, h) {
    var step = s.rulePreset === 'custom' ? toMm(s.size, s.unit) : RULES[s.rulePreset].mm;
    var top = s.headerRule ? step * 2 : 0;
    var fy = fit(h - top, step);
    var y0 = top + fy.off;
    for (var j = 0; j <= fy.n; j++) {
      g.appendChild(line(0, y0 + j * step, w, y0 + j * step, 'ln'));
    }
    if (s.marginLine !== 'none') {
      var mx = toMm(s.marginAt, s.unit);
      g.appendChild(line(mx, 0, mx, h, 'ln margin'));
      if (s.marginLine === 'both') g.appendChild(line(w - mx / 2, 0, w - mx / 2, h, 'ln margin'));
    }
    if (s.headerRule) g.appendChild(line(0, top - step / 2, w, top - step / 2, 'ln edge'));
  };

  /* Three line families — 30°, 150° and vertical — clipped to the sheet. */
  DRAW.iso = function (g, s, w, h) {
    var step = toMm(s.size, s.unit);
    var inner = svgEl('g');

    [30, 150].forEach(function (deg) {
      var a = deg * Math.PI / 180;
      var nx = -Math.sin(a), ny = Math.cos(a);          /* unit normal */
      var proj = [[0, 0], [w, 0], [0, h], [w, h]].map(function (p) { return p[0] * nx + p[1] * ny; });
      var lo = Math.floor(Math.min.apply(null, proj) / step);
      var hi = Math.ceil(Math.max.apply(null, proj) / step);
      var len = w + h;
      for (var k = lo; k <= hi; k++) {
        var cx = nx * k * step, cy = ny * k * step;
        inner.appendChild(line(cx - Math.cos(a) * len, cy - Math.sin(a) * len,
                               cx + Math.cos(a) * len, cy + Math.sin(a) * len));
      }
    });
    if (s.isoVertical) {
      var vstep = step * Math.sqrt(3);
      var fx = fit(w, vstep);
      for (var i = 0; i <= fx.n; i++) {
        inner.appendChild(line(fx.off + i * vstep, 0, fx.off + i * vstep, h));
      }
    }
    g.appendChild(inner);
    g.appendChild(svgEl('rect', { x: 0, y: 0, width: r(w), height: r(h), class: 'frame' }));
  };

  DRAW.hex = function (g, s, w, h) {
    var R = toMm(s.size, s.unit);                 /* circumradius */
    var pointy = s.hexOrient !== 'flat';
    var inner = svgEl('g');

    var hw = pointy ? Math.sqrt(3) * R : 2 * R;         /* full width  */
    var hh = pointy ? 2 * R : Math.sqrt(3) * R;         /* full height */
    var stepX = pointy ? hw : 1.5 * R;
    var stepY = pointy ? 1.5 * R : hh;

    for (var row = -1; row * stepY < h + hh; row++) {
      for (var col = -1; col * stepX < w + hw; col++) {
        var cx = col * stepX + (pointy && row % 2 ? hw / 2 : 0);
        var cy = row * stepY + (!pointy && col % 2 ? hh / 2 : 0);
        inner.appendChild(svgEl('polygon', { points: hexPoints(cx, cy, R, pointy), class: 'hexcell' }));
      }
    }
    g.appendChild(inner);
    g.appendChild(svgEl('rect', { x: 0, y: 0, width: r(w), height: r(h), class: 'frame' }));
  };
  function hexPoints(cx, cy, R, pointy) {
    var pts = [];
    for (var i = 0; i < 6; i++) {
      var a = (Math.PI / 180) * (pointy ? 60 * i - 90 : 60 * i);
      pts.push(r(cx + R * Math.cos(a)) + ',' + r(cy + R * Math.sin(a)));
    }
    return pts.join(' ');
  }

  DRAW.staff = function (g, s, w, h) {
    var gap = toMm(s.staffGap, s.unit);
    var systems = [];
    for (var i = 0; i < s.staves; i++) {
      systems.push(s.staffKind === 'both' ? (i % 2 ? 'tab' : 'staff') : s.staffKind);
    }
    var heights = systems.map(function (k) { return (k === 'tab' ? 5 : 4) * gap; });
    var used = heights.reduce(function (a, b) { return a + b; }, 0);
    var space = systems.length > 1 ? (h - used) / (systems.length - 1) : 0;
    if (space < gap) space = gap;                   /* never let staves touch */
    var y = Math.max(0, (h - (used + space * (systems.length - 1))) / 2);

    systems.forEach(function (kind, idx) {
      var lines = kind === 'tab' ? 6 : 5;
      for (var n = 0; n < lines; n++) {
        g.appendChild(line(0, y + n * gap, w, y + n * gap, 'ln'));
      }
      var bottom = y + (lines - 1) * gap;
      g.appendChild(line(0, y, 0, bottom, 'ln edge'));
      g.appendChild(line(w, y, w, bottom, 'ln edge'));
      if (s.staffBars > 1) {
        for (var b = 1; b < s.staffBars; b++) {
          var bx = w * b / s.staffBars;
          g.appendChild(line(bx, y, bx, bottom, 'ln bar'));
        }
      }
      y += heights[idx] + space;
    });
  };

  DRAW.hand = function (g, s, w, h) {
    var row = toMm(s.size, s.unit);           /* baseline to baseline */
    var body = row * 0.55;                    /* x-height band */
    var fy = fit(h, row);
    for (var i = 0; i < fy.n; i++) {
      var base = fy.off + (i + 1) * row - row * 0.2;
      var top = base - body;
      var mid = base - body / 2;
      g.appendChild(line(0, top, w, top, 'ln'));
      g.appendChild(line(0, base, w, base, 'ln edge'));
      if (s.hwMid !== 'none') g.appendChild(line(0, mid, w, mid, 'ln ' + s.hwMid));
      if (s.hwDescender) g.appendChild(line(0, base + body / 2, w, base + body / 2, 'ln dotted'));
      if (s.hwSlant) {
        var slant = Math.tan((90 - 75) * Math.PI / 180) * body;
        for (var x = 0; x < w + slant; x += body) {
          g.appendChild(line(x, base, x - slant, top, 'ln faint'));
        }
      }
      if (s.hwTrace) {
        var fs = body * 1.2;
        var t = svgEl('text', { x: 1, y: r(base), class: 'trace', 'font-size': r(fs) });
        t.textContent = repeatToWidth(s.hwTrace, w - 2, fs);
        g.appendChild(t);
      }
    }
  };
  /* Conservative advance-width estimate: better to stop short than to cut a
     word in half at the edge. */
  function repeatToWidth(text, w, fontSize) {
    var one = text + '   ';
    var approx = one.length * fontSize * 0.58;
    var times = Math.max(1, Math.floor(w / Math.max(approx, 1)));
    return new Array(times + 1).join(one).replace(/\s+$/, '');
  }

  /* ---- Page assembly ------------------------------------------------------ */
  var uidCounter = 0;

  function buildPage(s, dims, index) {
    var page = el('div', { class: 'page theme-' + s.theme + (s.inkSaver ? ' ink-saver' : '') });
    page.dataset.layout = s.type;
    page.style.width = dims.w + 'mm';
    page.style.height = dims.h + 'mm';
    page.style.fontSize = (Math.min(dims.w, dims.h) / 58) + 'mm';
    page.style.setProperty('--pad', s.margin + 'mm');
    page.style.setProperty('--accent', s.accent);
    page.style.setProperty('--rule', s.color);
    page.style.setProperty('--ln-w', s.weight);
    page.style.setProperty('--maj-w', s.majorWeight);

    var inner = el('div', { class: 'page-inner' });
    page.appendChild(inner);

    /* Header and footer take a known height in mm so the drawing area is exact. */
    var headH = 0, footH = 0;
    if (s.title || s.fields) {
      headH = (s.title ? 9 : 0) + (s.fields ? 9 : 0);
      var head = el('header', { class: 'paper-head' });
      head.style.height = headH + 'mm';
      if (s.title) head.appendChild(el('div', { class: 'sheet-title paper-title', text: s.title }));
      if (s.fields) {
        head.appendChild(el('div', { class: 'sheet-fields' }, s.fieldList.split(',').map(function (f) {
          return el('div', { class: 'fld' }, [el('span', { text: f.trim() }), el('i')]);
        })));
      }
      inner.appendChild(head);
    }
    if (s.footer || s.pageNumbers) {
      footH = 7;
      var foot = el('footer', { class: 'sheet-foot' });
      foot.style.height = footH + 'mm';
      if (s.footer) foot.appendChild(el('span', { text: s.footer }));
      if (s.pageNumbers) foot.appendChild(el('span', { class: 'f-right', text: String(index + 1) }));
      inner.appendChild(foot);
    }

    var gw = dims.w - s.margin * 2;
    var gh = dims.h - s.margin * 2 - headH - footH;

    /* The SVG is sized in millimetres, matching its viewBox exactly, so one
       user unit is one millimetre no matter how the flex box rounds. */
    var svg = svgEl('svg', {
      class: 'paper-svg', viewBox: '0 0 ' + r(gw) + ' ' + r(gh),
      width: r(gw) + 'mm', height: r(gh) + 'mm'
    });
    var defs = svgEl('defs');
    svg.appendChild(defs);

    /* Strokes are centred on their path, so a line drawn exactly on the edge
       would lose half its width to the viewBox. Inset the drawing by half the
       heaviest stroke and every edge line prints at full weight. */
    var pad = Math.max(s.weight, s.majorWeight) / 2;
    var dw = gw - pad * 2, dh = gh - pad * 2;
    var uid = ++uidCounter;
    var clip = svgEl('clipPath', { id: 'clip' + uid });
    clip.appendChild(svgEl('rect', { x: r(-pad), y: r(-pad), width: r(gw), height: r(gh) }));
    defs.appendChild(clip);
    var g = svgEl('g', {
      transform: 'translate(' + r(pad) + ',' + r(pad) + ')',
      'clip-path': 'url(#clip' + uid + ')'
    });
    svg.appendChild(g);
    (DRAW[s.type] || DRAW.grid)(g, s, dw, dh, defs, uid);
    if (s.border && s.type !== 'iso' && s.type !== 'hex') {
      g.appendChild(svgEl('rect', { x: 0, y: 0, width: r(dw), height: r(dh), class: 'frame' }));
    }

    var canvas = el('div', { class: 'paper-canvas' });
    canvas.appendChild(svg);
    inner.insertBefore(canvas, inner.querySelector('.sheet-foot'));
    return page;
  }

  /* ---- Public API --------------------------------------------------------- */
  AP.paper = {
    TYPES: TYPES,
    RULES: RULES,

    render: function (s) {
      var dims = AP.pageSize(s.paper, s.orientation);
      var out = [];
      for (var i = 0; i < AP.clamp(s.pages, 1, 40); i++) out.push(buildPage(s, dims, i));
      return out;
    },

    pageRule: function (s) {
      var d = AP.pageSize(s.paper, s.orientation);
      return '@page { size: ' + d.w + 'mm ' + d.h + 'mm; margin: 0; }';
    },

    /* The spacing actually drawn, for the read-out under the size slider. */
    effectiveStep: function (s) {
      if (s.type === 'lines' && s.rulePreset !== 'custom') {
        return RULES[s.rulePreset].mm.toFixed(1) + ' mm';
      }
      var mm = toMm(s.size, s.unit);
      return s.unit === 'in'
        ? s.size + ' in (' + mm.toFixed(1) + ' mm)'
        : mm + ' mm (' + (mm / MM_PER_IN).toFixed(2) + ' in)';
    },

    filename: function (s) {
      return ['paper', s.type, String(s.size).replace('.', '-') + s.unit, s.paper].join('-');
    }
  };
})();
