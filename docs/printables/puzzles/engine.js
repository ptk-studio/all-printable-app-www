/* ==========================================================================
   Puzzle engine — sudoku, word search, mazes and bingo, with answer keys.

   Everything is generated from a seed held in state. That is not a detail:
   the whole site round-trips its settings through the URL, so a shared link
   has to reproduce the *same* puzzles, and nudging an unrelated slider must
   not silently deal a new grid.
   ========================================================================== */
window.AP = window.AP || {};
(function () {
  var el = AP.el;

  var TYPES = {
    sudoku: { label: 'Sudoku',      hint: 'Classic 9 × 9, five difficulties, every puzzle uniquely solvable' },
    search: { label: 'Word search', hint: 'Your own word list, any grid size' },
    maze:   { label: 'Maze',        hint: 'Generated fresh, easy to fiendish' },
    bingo:  { label: 'Bingo',       hint: 'Unique cards in one pass — numbers or your own words' }
  };

  /* ---- Deterministic randomness ------------------------------------------- */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rand) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function pick(arr, rand) { return arr[Math.floor(rand() * arr.length)]; }

  /* ---- Sudoku ------------------------------------------------------------- */
  var PEERS = (function () {
    var p = [];
    for (var i = 0; i < 81; i++) {
      var r = Math.floor(i / 9), c = i % 9, set = {};
      for (var k = 0; k < 9; k++) { set[r * 9 + k] = 1; set[k * 9 + c] = 1; }
      var br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
      for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) set[(br + a) * 9 + bc + b] = 1;
      delete set[i];
      p.push(Object.keys(set).map(Number));
    }
    return p;
  })();

  function candidates(board, i) {
    var used = 0;
    for (var k = 0; k < PEERS[i].length; k++) {
      var v = board[PEERS[i][k]];
      if (v) used |= 1 << v;
    }
    var out = [];
    for (var d = 1; d <= 9; d++) if (!(used & (1 << d))) out.push(d);
    return out;
  }

  /* Counts solutions, stopping at `limit`. Picks the most constrained cell
     first, which keeps the uniqueness check fast enough to run per dig. */
  function countSolutions(board, limit, rand) {
    var best = -1, bestCands = null;
    for (var i = 0; i < 81; i++) {
      if (board[i]) continue;
      var c = candidates(board, i);
      if (!c.length) return 0;
      if (!bestCands || c.length < bestCands.length) { best = i; bestCands = c; }
      if (c.length === 1) break;
    }
    if (best === -1) return 1;
    if (rand) shuffle(bestCands, rand);
    var total = 0;
    for (var k = 0; k < bestCands.length; k++) {
      board[best] = bestCands[k];
      total += countSolutions(board, limit - total, rand);
      board[best] = 0;
      if (total >= limit) break;
    }
    return total;
  }

  function fullGrid(rand) {
    var board = new Array(81).fill(0);
    (function fill(i) {
      if (i === 81) return true;
      var cands = shuffle(candidates(board, i), rand);
      for (var k = 0; k < cands.length; k++) {
        board[i] = cands[k];
        if (fill(i + 1)) return true;
      }
      board[i] = 0;
      return false;
    })(0);
    return board;
  }

  var SUDOKU_CLUES = { easy: 44, medium: 36, hard: 31, expert: 27, evil: 24 };

  function makeSudoku(rand, difficulty) {
    var full = fullGrid(rand);
    var puzzle = full.slice();
    var target = SUDOKU_CLUES[difficulty] || 36;
    var clues = 81;

    function indexes() {
      return shuffle(Array.from({ length: 81 }, function (_, i) { return i; }), rand);
    }

    /* Pass one removes rotationally symmetric pairs — the convention, and it
       keeps the grid looking like a published puzzle. */
    var order = indexes();
    for (var k = 0; k < order.length && clues > target; k++) {
      var i = order[k], j = 80 - i;
      if (!puzzle[i]) continue;
      var a = puzzle[i], b = puzzle[j];
      puzzle[i] = 0; puzzle[j] = 0;
      if (countSolutions(puzzle.slice(), 2) !== 1) { puzzle[i] = a; puzzle[j] = b; }
      else clues -= (i === j ? 1 : 2);
    }

    /* Pairs bottom out around 28 clues, because a pair only comes out if the
       grid stays unique without BOTH cells. The hardest levels need to go
       lower, so fall back to removing single cells. */
    if (clues > target) {
      var single = indexes();
      for (var m = 0; m < single.length && clues > target; m++) {
        var p = single[m];
        if (!puzzle[p]) continue;
        var keep = puzzle[p];
        puzzle[p] = 0;
        if (countSolutions(puzzle.slice(), 2) !== 1) puzzle[p] = keep;
        else clues--;
      }
    }
    return { puzzle: puzzle, solution: full, clues: clues };
  }

  /* ---- Word search -------------------------------------------------------- */
  var DIRS = [[1, 0], [0, 1], [1, 1], [1, -1], [-1, 0], [0, -1], [-1, -1], [-1, 1]];
  var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function makeSearch(rand, words, size, opts) {
    var grid = [], used = [];
    for (var i = 0; i < size * size; i++) { grid.push(''); used.push(false); }

    var dirs = DIRS.slice(0, opts.diagonals ? 4 : 2);
    if (opts.backwards) dirs = dirs.concat(DIRS.slice(4, opts.diagonals ? 8 : 6));

    var placed = [];
    words.forEach(function (raw) {
      var word = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!word || word.length > size) return;
      for (var attempt = 0; attempt < 240; attempt++) {
        var d = pick(dirs, rand);
        var maxR = size - (d[1] > 0 ? word.length : 1) - (d[1] < 0 ? 0 : 0);
        var r = Math.floor(rand() * size), c = Math.floor(rand() * size);
        var endR = r + d[1] * (word.length - 1), endC = c + d[0] * (word.length - 1);
        if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue;
        var ok = true, cells = [];
        for (var k = 0; k < word.length; k++) {
          var idx = (r + d[1] * k) * size + (c + d[0] * k);
          if (grid[idx] && grid[idx] !== word[k]) { ok = false; break; }
          cells.push(idx);
        }
        if (!ok) continue;
        cells.forEach(function (idx, k) { grid[idx] = word[k]; used[idx] = true; });
        placed.push({ word: word, cells: cells });
        break;
      }
    });

    for (var j = 0; j < grid.length; j++) {
      if (!grid[j]) grid[j] = ALPHABET[Math.floor(rand() * 26)];
    }
    return { grid: grid, size: size, placed: placed, solved: used };
  }

  /* ---- Maze --------------------------------------------------------------- */
  /* Recursive backtracker (iterative), then a depth-first walk for the key. */
  function makeMaze(rand, w, h, braid) {
    var cells = [];
    for (var i = 0; i < w * h; i++) cells.push({ n: true, e: true, s: true, w: true, seen: false });
    var stack = [0];
    cells[0].seen = true;
    var visited = 1;
    while (visited < w * h) {
      var cur = stack[stack.length - 1];
      var cr = Math.floor(cur / w), cc = cur % w;
      var options = [];
      if (cr > 0 && !cells[cur - w].seen) options.push(['n', cur - w, 's']);
      if (cr < h - 1 && !cells[cur + w].seen) options.push(['s', cur + w, 'n']);
      if (cc > 0 && !cells[cur - 1].seen) options.push(['w', cur - 1, 'e']);
      if (cc < w - 1 && !cells[cur + 1].seen) options.push(['e', cur + 1, 'w']);
      if (!options.length) { stack.pop(); continue; }
      var mv = pick(options, rand);
      cells[cur][mv[0]] = false;
      cells[mv[1]][mv[2]] = false;
      cells[mv[1]].seen = true;
      stack.push(mv[1]);
      visited++;
    }

    /* Braiding removes dead ends, which makes a maze harder, not easier. */
    if (braid > 0) {
      for (var c2 = 0; c2 < w * h; c2++) {
        var walls = ['n', 'e', 's', 'w'].filter(function (d) { return cells[c2][d]; });
        if (walls.length !== 3 || rand() > braid) continue;
        var r2 = Math.floor(c2 / w), col2 = c2 % w;
        var cand = [];
        if (cells[c2].n && r2 > 0) cand.push(['n', c2 - w, 's']);
        if (cells[c2].s && r2 < h - 1) cand.push(['s', c2 + w, 'n']);
        if (cells[c2].w && col2 > 0) cand.push(['w', c2 - 1, 'e']);
        if (cells[c2].e && col2 < w - 1) cand.push(['e', c2 + 1, 'w']);
        if (!cand.length) continue;
        var open = pick(cand, rand);
        cells[c2][open[0]] = false;
        cells[open[1]][open[2]] = false;
      }
    }

    var path = solveMaze(cells, w, h);
    return { cells: cells, w: w, h: h, path: path };
  }

  function solveMaze(cells, w, h) {
    var start = 0, goal = w * h - 1;
    var prev = new Array(w * h).fill(-1), seen = new Array(w * h).fill(false);
    var queue = [start]; seen[start] = true;
    while (queue.length) {
      var cur = queue.shift();
      if (cur === goal) break;
      var r = Math.floor(cur / w), c = cur % w;
      var nexts = [];
      if (!cells[cur].n && r > 0) nexts.push(cur - w);
      if (!cells[cur].s && r < h - 1) nexts.push(cur + w);
      if (!cells[cur].w && c > 0) nexts.push(cur - 1);
      if (!cells[cur].e && c < w - 1) nexts.push(cur + 1);
      for (var k = 0; k < nexts.length; k++) {
        if (seen[nexts[k]]) continue;
        seen[nexts[k]] = true; prev[nexts[k]] = cur; queue.push(nexts[k]);
      }
    }
    var path = [], node = goal;
    while (node !== -1) { path.unshift(node); node = prev[node]; }
    return path[0] === start ? path : [];
  }

  /* ---- Bingo -------------------------------------------------------------- */
  function makeBingo(rand, opts, words) {
    var cols = [], size = opts.size;
    if (opts.mode === 'words' && words.length >= size * size) {
      var pool = shuffle(words.slice(), rand);
      var grid = pool.slice(0, size * size);
      if (opts.free) grid[Math.floor(size * size / 2)] = null;
      return { grid: grid, size: size };
    }
    /* Numbers: each column draws from its own range, as B-I-N-G-O does. */
    var per = Math.ceil(opts.max / size);
    for (var c = 0; c < size; c++) {
      var range = [];
      for (var n = c * per + 1; n <= Math.min((c + 1) * per, opts.max); n++) range.push(n);
      cols.push(shuffle(range, rand).slice(0, size));
    }
    var out = [];
    for (var r = 0; r < size; r++) for (var c2 = 0; c2 < size; c2++) out.push(cols[c2][r]);
    if (opts.free && size % 2) out[Math.floor(size * size / 2)] = null;
    return { grid: out, size: size };
  }

  /* ---- Rendering ---------------------------------------------------------- */
  /* Square grids live inside a size container so they can be exactly
     min(width, height) of the space they are given. */
  function gridBox(child) { return el('div', { class: 'pz-gridbox' }, [child]); }

  function sudokuEl(data, showSolution) {
    var g = el('div', { class: 'pz-sudoku' });
    var src = showSolution ? data.solution : data.puzzle;
    for (var i = 0; i < 81; i++) {
      var cls = 'sq';
      if (i % 9 === 2 || i % 9 === 5) cls += ' bx-r';
      if (Math.floor(i / 9) === 2 || Math.floor(i / 9) === 5) cls += ' bx-b';
      if (showSolution && !data.puzzle[i]) cls += ' filled';
      g.appendChild(el('div', { class: cls, text: src[i] ? String(src[i]) : '' }));
    }
    return gridBox(g);
  }

  function searchEl(data, showSolution, s) {
    var wrap = el('div', { class: 'pz-search' });
    var g = el('div', { class: 'pz-grid' });
    g.style.gridTemplateColumns = 'repeat(' + data.size + ', 1fr)';
    g.style.fontSize = 'calc(100cqmin / ' + (data.size + 3) + ')';
    for (var i = 0; i < data.grid.length; i++) {
      g.appendChild(el('div', {
        class: 'sq' + (showSolution && data.solved[i] ? ' hit' : ''),
        text: data.grid[i]
      }));
    }
    wrap.appendChild(gridBox(g));
    if (s.showWords) {
      var list = el('div', { class: 'pz-words' });
      list.style.columnCount = Math.min(4, Math.max(2, Math.ceil(data.placed.length / 8)));
      data.placed.forEach(function (p) { list.appendChild(el('span', { text: p.word })); });
      wrap.appendChild(list);
    }
    return wrap;
  }

  function mazeEl(data, showSolution) {
    var ns = 'http://www.w3.org/2000/svg';
    var cell = 10, pad = 1;
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'pz-maze');
    svg.setAttribute('viewBox', (-pad) + ' ' + (-pad) + ' ' +
      (data.w * cell + pad * 2) + ' ' + (data.h * cell + pad * 2));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    var d = [];
    for (var i = 0; i < data.cells.length; i++) {
      var r = Math.floor(i / data.w), c = i % data.w;
      var x = c * cell, y = r * cell;
      var k = data.cells[i];
      /* Openings at the two corners are the way in and out. */
      if (k.n && !(i === 0)) d.push('M' + x + ' ' + y + 'h' + cell);
      if (k.w && !(i === 0)) d.push('M' + x + ' ' + y + 'v' + cell);
      if (c === data.w - 1 && !(i === data.cells.length - 1)) d.push('M' + (x + cell) + ' ' + y + 'v' + cell);
      if (r === data.h - 1 && !(i === data.cells.length - 1)) d.push('M' + x + ' ' + (y + cell) + 'h' + cell);
    }
    var walls = document.createElementNS(ns, 'path');
    walls.setAttribute('class', 'wall');
    walls.setAttribute('d', d.join(''));
    svg.appendChild(walls);

    if (showSolution && data.path.length) {
      var pts = data.path.map(function (idx) {
        var r2 = Math.floor(idx / data.w), c2 = idx % data.w;
        return (c2 * cell + cell / 2) + ' ' + (r2 * cell + cell / 2);
      });
      var line = document.createElementNS(ns, 'path');
      line.setAttribute('class', 'solution');
      line.setAttribute('d', 'M' + pts.join('L'));
      svg.appendChild(line);
    }
    return svg;
  }

  function bingoEl(data, header) {
    var card = el('div', { class: 'bingo-card' });
    if (header) {
      var head = el('div', { class: 'bingo-head' });
      head.style.gridTemplateColumns = 'repeat(' + data.size + ', 1fr)';
      head.style.fontSize = 'calc(100cqmin / ' + (data.size + 2) + ')';
      header.slice(0, data.size).split('').forEach(function (ch) {
        head.appendChild(el('div', { class: 'sq', text: ch }));
      });
      card.appendChild(head);
    }
    var g = el('div', { class: 'pz-grid bingo' });
    g.style.gridTemplateColumns = 'repeat(' + data.size + ', 1fr)';
    g.style.fontSize = 'calc(100cqmin / ' + (data.size + 2.5) + ')';
    data.grid.forEach(function (v) {
      g.appendChild(el('div', { class: 'sq' + (v === null ? ' free' : ''),
        text: v === null ? 'FREE' : String(v) }));
    });
    card.appendChild(g);
    return el('div', { class: 'pz-gridbox bingo-box' }, [card]);
  }

  /* ---- Page assembly ------------------------------------------------------ */
  function build(s, index, showSolution) {
    var seed = (s.seed * 2654435761 + index * 40503) >>> 0;
    var rand = rng(seed);
    var body, meta = '';
    if (s.type === 'sudoku') {
      var sd = makeSudoku(rand, s.difficulty);
      body = sudokuEl(sd, showSolution);
      meta = sd.clues + ' clues · ' + s.difficulty;
    } else if (s.type === 'search') {
      var words = (s.words || '').split(/[\n,]+/).map(function (w) { return w.trim(); }).filter(Boolean);
      var ws = makeSearch(rand, words, s.gridSize, { diagonals: s.diagonals, backwards: s.backwards });
      body = searchEl(ws, showSolution, s);
      meta = ws.placed.length + ' of ' + words.length + ' words placed';
    } else if (s.type === 'maze') {
      var mz = makeMaze(rand, s.mazeW, s.mazeH, s.braid);
      body = mazeEl(mz, showSolution);
      meta = s.mazeW + ' × ' + s.mazeH;
    } else {
      var bWords = (s.words || '').split(/[\n,]+/).map(function (w) { return w.trim(); }).filter(Boolean);
      body = bingoEl(makeBingo(rand, { size: s.bingoSize, max: s.bingoMax,
        free: s.freeSquare, mode: s.bingoMode }, bWords),
        s.bingoHeader ? s.bingoHeader.toUpperCase() : '');
      meta = s.bingoMode === 'words' ? 'word card' : '1–' + s.bingoMax;
    }
    return { body: body, meta: meta };
  }

  function pageEl(s, dims) {
    var page = el('div', { class: 'page theme-' + s.theme + (s.inkSaver ? ' ink-saver' : '') });
    page.dataset.layout = s.type;
    page.style.width = dims.w + 'mm';
    page.style.height = dims.h + 'mm';
    page.style.fontSize = (Math.min(dims.w, dims.h) / 58) + 'mm';
    page.style.setProperty('--pad', s.margin + 'mm');
    page.style.setProperty('--accent', s.accent);
    page.style.setProperty('--rule', s.ruleColor);
    var inner = el('div', { class: 'page-inner' });
    page.appendChild(inner);
    return { page: page, inner: inner };
  }

  AP.puzzles = {
    TYPES: TYPES,

    render: function (s) {
      var dims = AP.pageSize(s.paper, s.orientation);
      var per = AP.clamp(s.perPage, 1, 4);
      var total = AP.clamp(s.count, 1, 40);
      var pages = [];

      function sheet(from, solution) {
        var p = pageEl(s, dims);
        p.inner.appendChild(el('header', { class: 'sheet-head' + (s.headerAlign === 'center' ? ' center' : '') }, [
          el('div', { class: 'sheet-titles' }, [
            el('div', { class: 'sheet-title' + (s.accentTitle ? ' accent' : '') }, [
              el('span', { class: 'lead', text: s.title || TYPES[s.type].label }),
              solution ? el('span', { class: 'muted', text: 'answers' }) : null
            ]),
            s.subtitle ? el('div', { class: 'sheet-sub', text: s.subtitle }) : null
          ])
        ]));
        var wrap = el('div', { class: 'pz-wrap per-' + per + (dims.w > dims.h ? ' wide' : '') });
        for (var k = 0; k < per && from + k < total; k++) {
          var made = build(s, from + k, solution);
          wrap.appendChild(el('section', { class: 'pz-item' }, [
            s.numbering ? el('div', { class: 'pz-num' }, [
              el('span', { text: '#' + (from + k + 1) }),
              s.showMeta ? el('em', { text: made.meta }) : null
            ]) : null,
            el('div', { class: 'pz-body' }, [made.body])
          ]));
        }
        p.inner.appendChild(wrap);
        if (s.footer) p.inner.appendChild(el('footer', { class: 'sheet-foot' }, [el('span', { text: s.footer })]));
        return p.page;
      }

      for (var i = 0; i < total; i += per) pages.push(sheet(i, false));
      if (s.solutions === 'end') {
        for (var j = 0; j < total; j += per) pages.push(sheet(j, true));
      }
      return pages;
    },

    pageRule: function (s) {
      var d = AP.pageSize(s.paper, s.orientation);
      return '@page { size: ' + d.w + 'mm ' + d.h + 'mm; margin: 0; }';
    },

    filename: function (s) { return ['puzzles', s.type, 'seed' + s.seed].join('-'); },

    /* Exposed so the generators can be exercised without a DOM. */
    _gen: { rng: rng, makeSudoku: makeSudoku, makeSearch: makeSearch,
            makeMaze: makeMaze, makeBingo: makeBingo, countSolutions: countSolutions }
  };
})();
