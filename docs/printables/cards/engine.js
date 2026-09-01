/* ==========================================================================
   Cards & labels engine.

   Flashcards, gift tags, bookmarks, place cards and address labels are all
   the same job: put N small pieces on a sheet, mark where to cut, and — for
   flashcards — get the reverse side to land on the back of the right piece.
   Geometry comes from core/impose.js; this file is content and styling.
   ========================================================================== */
window.AP = window.AP || {};
(function () {
  var el = AP.el;

  var TYPES = {
    flash:    { label: 'Flashcards',  hint: 'Two sided, duplex-aligned, from a term / definition list' },
    tag:      { label: 'Gift tags',   hint: 'Fold line and a punch-hole mark' },
    bookmark: { label: 'Bookmarks',   hint: 'Tall pieces, several to a sheet' },
    place:    { label: 'Place cards', hint: 'Tent fold — the top half prints upside down so it reads when folded' },
    label:    { label: 'Labels',      hint: 'Address sheets matched to Avery stock' }
  };

  /* ---- Content ------------------------------------------------------------ */
  /* One line per piece. `front | back` splits the two faces; `\` starts a new
     line within a face, so an address can be several lines on one input line. */
  function parseItems(text, fillTo) {
    var list = (text || '').split(/\r?\n/)
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l && l.charAt(0) !== '#'; })
      .map(function (line) {
        var parts = line.split('|');
        return {
          front: (parts[0] || '').trim().split('\\').map(trim),
          back: parts.length > 1 ? parts.slice(1).join('|').trim().split('\\').map(trim) : null
        };
      });
    if (!list.length) list = [{ front: [''], back: null }];
    if (fillTo && list.length < fillTo) {
      var out = [];
      for (var i = 0; i < fillTo; i++) out.push(list[i % list.length]);
      return out;
    }
    return list;
  }
  function trim(s) { return s.trim(); }

  /* Long text wants a smaller face. Cheap heuristic, but it stops a definition
     spilling out of a card that a fixed size would ruin. */
  function autoScale(lines) {
    var n = lines.join(' ').length;
    if (n > 160) return 0.55;
    if (n > 90) return 0.68;
    if (n > 45) return 0.82;
    if (n > 20) return 0.92;
    return 1;
  }

  /* ---- One piece ---------------------------------------------------------- */
  function faceEl(s, lines, index, isBack) {
    var body = el('div', { class: 'card-text align-' + s.align });
    (lines || ['']).forEach(function (line) {
      body.appendChild(el('div', { class: 'card-line', text: line }));
    });
    body.style.fontSize = (autoScale(lines || []) * s.fontScale).toFixed(3) + 'em';

    var kids = [];
    if (s.category && !isBack) kids.push(el('div', { class: 'card-cat', text: s.category }));
    kids.push(body);
    if (s.numbering) kids.push(el('div', { class: 'card-num', text: String(index + 1) }));
    return el('div', { class: 'card-inner' + (s.tent ? ' tent-half' : '') }, kids);
  }

  function ruledEl(s) {
    var box = el('div', { class: 'card-ruled' });
    for (var i = 0; i < s.backLines; i++) box.appendChild(el('div', { class: 'r-line' }));
    return box;
  }

  function pieceEl(s, slot, item, index, isBack) {
    var card = el('div', { class: 'imp-card' + (s.cardBorder ? ' bordered' : '') });
    card.style.left = mm(slot.x);
    card.style.top = mm(slot.y);
    card.style.width = mm(slot.w);
    card.style.height = mm(slot.h);
    card.style.borderRadius = s.corner + 'mm';
    card.style.fontSize = (slot.h / 9) + 'mm';

    var lines, showRuled = false;
    if (!isBack) lines = item.front;
    else if (s.backMode === 'text') lines = item.back || [''];
    else if (s.backMode === 'same') lines = item.front;
    else if (s.backMode === 'lines') { lines = ['']; showRuled = true; }
    else lines = [''];

    if (s.tent) {
      /* Top half prints rotated so it reads the right way up once folded. */
      card.appendChild(el('div', { class: 'tent-top' }, [faceEl(s, lines, index, isBack)]));
      card.appendChild(el('div', { class: 'tent-bottom' }, [faceEl(s, lines, index, isBack)]));
    } else {
      card.appendChild(faceEl(s, lines, index, isBack));
      if (showRuled) card.appendChild(ruledEl(s));
    }

    if (s.fold !== 'none') {
      card.appendChild(el('div', { class: 'card-fold ' + s.fold }));
    }
    if (s.hole) {
      var hole = el('div', { class: 'card-hole' });
      hole.style.top = mm(s.holeInset);
      card.appendChild(hole);
    }
    return card;
  }

  function mm(n) { return (Math.round(n * 1000) / 1000) + 'mm'; }

  /* ---- Sheet -------------------------------------------------------------- */
  function marksSvg(segments, sheet, s) {
    if (!segments.length) return null;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'imp-marks');
    svg.setAttribute('viewBox', '0 0 ' + sheet.w + ' ' + sheet.h);
    svg.setAttribute('width', sheet.w + 'mm');
    svg.setAttribute('height', sheet.h + 'mm');
    segments.forEach(function (seg) {
      var ln = document.createElementNS(ns, 'line');
      ln.setAttribute('x1', seg[0]); ln.setAttribute('y1', seg[1]);
      ln.setAttribute('x2', seg[2]); ln.setAttribute('y2', seg[3]);
      svg.appendChild(ln);
    });
    return svg;
  }

  function newSheet(s, sheet, label) {
    var page = el('div', { class: 'page theme-' + s.theme + (s.inkSaver ? ' ink-saver' : '') });
    page.dataset.layout = s.type;
    page.style.width = sheet.w + 'mm';
    page.style.height = sheet.h + 'mm';
    page.style.fontSize = (Math.min(sheet.w, sheet.h) / 58) + 'mm';
    page.style.setProperty('--accent', s.accent);
    page.style.setProperty('--rule', s.ruleColor);
    page.style.setProperty('--mark-w', s.markWeight);
    if (label) page.appendChild(el('div', { class: 'imp-slug', text: label }));
    return page;
  }

  /* ---- Public API --------------------------------------------------------- */
  AP.cards = {
    TYPES: TYPES,

    /* Grid for the current settings — the control panel shows its shape. */
    grid: function (s) {
      var sheet = AP.pageSize(paperFor(s), s.orientation);
      return AP.impose.layout(s, sheet);
    },

    render: function (s) {
      var sheet = AP.pageSize(paperFor(s), s.orientation);
      var grid = AP.impose.layout(s, sheet);
      var per = grid.perSheet;
      var items = parseItems(s.items, s.fillSheet ? per : 0);
      var sheets = AP.impose.sheetCount(items.length, per);
      var segs = AP.impose.marks(grid, sheet, s.marks, s.markLength);
      var backIdx = s.duplex !== 'none' ? AP.impose.backOrder(grid, s.duplex) : null;

      var pages = [];
      for (var n = 0; n < sheets; n++) {
        var slice = AP.impose.slice(items, n, per);

        var front = newSheet(s, sheet, s.slug ? sheetLabel(s, n, sheets, 'front') : '');
        var fm = marksSvg(segs, sheet, s);
        if (fm) front.appendChild(fm);
        slice.forEach(function (item, i) {
          front.appendChild(pieceEl(s, grid.slots[i], item, n * per + i, false));
        });
        pages.push(front);

        if (s.duplex !== 'none') {
          /* Same slots, cards reordered — see impose.backOrder. */
          var back = newSheet(s, sheet, s.slug ? sheetLabel(s, n, sheets, 'back') : '');
          var bm = marksSvg(segs, sheet, s);
          if (bm) back.appendChild(bm);
          grid.slots.forEach(function (slot, i) {
            var src = backIdx[i];
            if (src >= slice.length) return;
            back.appendChild(pieceEl(s, slot, slice[src], n * per + src, true));
          });
          pages.push(back);
        }
      }
      return pages;
    },

    pageRule: function (s) {
      var d = AP.pageSize(paperFor(s), s.orientation);
      return '@page { size: ' + d.w + 'mm ' + d.h + 'mm; margin: 0; }';
    },

    filename: function (s) {
      return ['cards', s.type, s.stock === 'auto' ? 'custom' : s.stock].join('-');
    }
  };

  /* Label stock dictates its own sheet size; everything else follows the picker. */
  function paperFor(s) {
    var stock = AP.impose.STOCK[s.stock];
    return stock && stock.paper ? stock.paper : s.paper;
  }
  AP.cards.paperFor = paperFor;

  function sheetLabel(s, n, total, side) {
    return (s.category ? s.category + ' · ' : '') +
      'sheet ' + (n + 1) + ' of ' + total + ' · ' + side;
  }
})();
