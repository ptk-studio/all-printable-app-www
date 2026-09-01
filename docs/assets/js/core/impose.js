/* ==========================================================================
   Imposition — placing many small pieces on one sheet.

   Shared by flashcards, gift tags, bookmarks, place cards and label sheets.
   Everything is in millimetres, measured from the top-left of the sheet, so a
   slot's rectangle is the finished trim size of the piece.

   The duplex case is the reason this is a module rather than a loop. When a
   sheet is flipped on its long edge, the physical left-hand column becomes the
   right-hand one; backs must be laid out mirrored or nothing lines up. Getting
   that wrong is why most free flashcard sheets are unusable.
   ========================================================================== */
window.AP = window.AP || {};
(function () {

  /* ---- Label stock -------------------------------------------------------- */
  /* Offsets are from the sheet edge; pitch is centre-to-centre spacing.
     Users can still nudge the whole block, because printers disagree. */
  var IN = 25.4;
  var STOCK = {
    auto:      { label: 'Custom size', paper: null },

    avery5160: { label: 'Avery 5160 / 8160 · 30 up', paper: 'letter',
                 w: 2.625 * IN, h: 1 * IN, cols: 3, rows: 10,
                 left: 0.1875 * IN, top: 0.5 * IN, pitchX: 2.75 * IN, pitchY: 1 * IN },
    avery5161: { label: 'Avery 5161 · 20 up', paper: 'letter',
                 w: 4 * IN, h: 1 * IN, cols: 2, rows: 10,
                 left: 0.15625 * IN, top: 0.5 * IN, pitchX: 4.1875 * IN, pitchY: 1 * IN },
    avery5162: { label: 'Avery 5162 · 14 up', paper: 'letter',
                 w: 4 * IN, h: 1.33 * IN, cols: 2, rows: 7,
                 left: 0.15625 * IN, top: 0.83 * IN, pitchX: 4.1875 * IN, pitchY: 1.33 * IN },
    avery5163: { label: 'Avery 5163 · 10 up', paper: 'letter',
                 w: 4 * IN, h: 2 * IN, cols: 2, rows: 5,
                 left: 0.15625 * IN, top: 0.5 * IN, pitchX: 4.1875 * IN, pitchY: 2 * IN },
    avery5164: { label: 'Avery 5164 · 6 up', paper: 'letter',
                 w: 4 * IN, h: 3.33 * IN, cols: 2, rows: 3,
                 left: 0.15625 * IN, top: 0.5 * IN, pitchX: 4.1875 * IN, pitchY: 3.33 * IN },

    l7160:     { label: 'Avery L7160 (A4) · 21 up', paper: 'a4',
                 w: 63.5, h: 38.1, cols: 3, rows: 7,
                 left: 7.25, top: 15.15, pitchX: 66, pitchY: 38.1 },
    l7163:     { label: 'Avery L7163 (A4) · 14 up', paper: 'a4',
                 w: 99.1, h: 38.1, cols: 2, rows: 7,
                 left: 5.5, top: 15.15, pitchX: 101.6, pitchY: 38.1 },
    l7651:     { label: 'Avery L7651 (A4) · 65 up', paper: 'a4',
                 w: 38.1, h: 21.2, cols: 5, rows: 13,
                 left: 4.75, top: 10.7, pitchX: 40.6, pitchY: 21.2 }
  };

  /* ---- Common finished sizes ---------------------------------------------- */
  var SIZES = {
    flash35:   { label: 'Flashcard 3 × 5 in', w: 5 * IN, h: 3 * IN },
    flash46:   { label: 'Flashcard 4 × 6 in', w: 6 * IN, h: 4 * IN },
    business:  { label: 'Business card 3.5 × 2 in', w: 3.5 * IN, h: 2 * IN },
    business85:{ label: 'Business card 85 × 55 mm', w: 85, h: 55 },
    poker:     { label: 'Playing card 63 × 88 mm', w: 63.5, h: 88.9 },
    a7:        { label: 'A7 74 × 105 mm', w: 74, h: 105 },
    a8:        { label: 'A8 52 × 74 mm', w: 52, h: 74 },
    bookmark:  { label: 'Bookmark 2 × 6 in', w: 2 * IN, h: 6 * IN },
    bookmarkS: { label: 'Bookmark 50 × 180 mm', w: 50, h: 180 },
    tag:       { label: 'Gift tag 2 × 3.5 in', w: 2 * IN, h: 3.5 * IN },
    place:     { label: 'Place card 3.5 × 2 in', w: 3.5 * IN, h: 2 * IN },
    square:    { label: 'Square 70 mm', w: 70, h: 70 }
  };

  /* ---- Layout ------------------------------------------------------------- */
  /* Returns { cols, rows, perSheet, slots:[{x,y,w,h,col,row}], w, h }.
     `slots` are in sheet coordinates, already nudged. */
  function layout(s, sheet) {
    var stock = STOCK[s.stock] || STOCK.auto;
    var cw, ch, cols, rows, left, top, pitchX, pitchY;

    if (stock.paper) {
      cw = stock.w; ch = stock.h;
      cols = stock.cols; rows = stock.rows;
      left = stock.left; top = stock.top;
      pitchX = stock.pitchX; pitchY = stock.pitchY;
    } else {
      cw = s.cardW; ch = s.cardH;
      pitchX = cw + s.gapX; pitchY = ch + s.gapY;
      cols = Math.max(1, Math.floor((sheet.w - 2 * s.margin + s.gapX) / pitchX));
      rows = Math.max(1, Math.floor((sheet.h - 2 * s.margin + s.gapY) / pitchY));
      if (s.cols) cols = Math.min(cols, s.cols);
      if (s.rows) rows = Math.min(rows, s.rows);
      /* Centre the block on the sheet — the usual expectation when trimming. */
      left = (sheet.w - (cols * pitchX - s.gapX)) / 2;
      top = (sheet.h - (rows * pitchY - s.gapY)) / 2;
    }

    var slots = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        slots.push({
          col: c, row: r,
          x: left + c * pitchX + s.nudgeX,
          y: top + r * pitchY + s.nudgeY,
          w: cw, h: ch
        });
      }
    }
    return { cols: cols, rows: rows, perSheet: slots.length, slots: slots, w: cw, h: ch,
             left: left, top: top, pitchX: pitchX, pitchY: pitchY };
  }

  /* Which front-side card belongs in each back-side slot.

     The back sheet reuses the *same* slots as the front — that matters for
     die-cut label stock, whose margins are not symmetric, so moving the slots
     would put ink off the labels. Alignment comes purely from card order.

     Long-edge flip (the usual default) spins the sheet about its vertical
     axis, so back slot (r, c) ends up where front slot (r, cols-1-c) was.
     Short-edge flip spins it about the horizontal axis, reversing rows. */
  function backOrder(grid, mode) {
    var order = [];
    for (var r = 0; r < grid.rows; r++) {
      for (var c = 0; c < grid.cols; c++) {
        var sr = mode === 'short' ? grid.rows - 1 - r : r;
        var sc = mode === 'short' ? c : grid.cols - 1 - c;
        order.push(sr * grid.cols + sc);
      }
    }
    return order;
  }

  /* ---- Marks -------------------------------------------------------------- */
  /* Crop ticks sit outside each piece; cut lines run the width of the sheet.
     Returned as plain line segments so the caller can draw them in SVG. */
  function marks(grid, sheet, kind, tick) {
    var out = [];
    if (kind === 'none' || !kind) return out;
    tick = tick || 3;

    if (kind === 'cut') {
      var xs = {}, ys = {};
      grid.slots.forEach(function (s) {
        xs[round(s.x)] = 1; xs[round(s.x + s.w)] = 1;
        ys[round(s.y)] = 1; ys[round(s.y + s.h)] = 1;
      });
      Object.keys(xs).forEach(function (x) { out.push([+x, 0, +x, sheet.h]); });
      Object.keys(ys).forEach(function (y) { out.push([0, +y, sheet.w, +y]); });
      return out;
    }

    /* crop: four corner pairs per piece, drawn just outside the trim box */
    grid.slots.forEach(function (s) {
      var x0 = s.x, y0 = s.y, x1 = s.x + s.w, y1 = s.y + s.h;
      out.push([x0 - tick, y0, x0 - 0.6, y0], [x0, y0 - tick, x0, y0 - 0.6]);
      out.push([x1 + 0.6, y0, x1 + tick, y0], [x1, y0 - tick, x1, y0 - 0.6]);
      out.push([x0 - tick, y1, x0 - 0.6, y1], [x0, y1 + 0.6, x0, y1 + tick]);
      out.push([x1 + 0.6, y1, x1 + tick, y1], [x1, y1 + 0.6, x1, y1 + tick]);
    });
    return out;
  }

  function round(n) { return Math.round(n * 100) / 100; }

  AP.impose = {
    STOCK: STOCK,
    SIZES: SIZES,
    layout: layout,
    backOrder: backOrder,
    marks: marks,

    /* Sheets needed for n pieces, and the slice belonging to sheet i. */
    sheetCount: function (n, perSheet) { return Math.max(1, Math.ceil(n / perSheet)); },
    slice: function (list, sheetIndex, perSheet) {
      return list.slice(sheetIndex * perSheet, (sheetIndex + 1) * perSheet);
    }
  };
})();
