/* Puzzles generator — sudoku, word search, mazes and bingo. */
(function () {
  var el = AP.el, $ = AP.$;

  var DEFAULTS = {
    type: 'sudoku',
    seed: 1,
    count: 4, perPage: 2, solutions: 'end',
    numbering: true, showMeta: false,

    difficulty: 'medium',

    words: 'calendar\nprinter\nmargin\ngrid\npaper\nruler\nstaple\nink\nfold\ntrim',
    gridSize: 14, diagonals: true, backwards: true, showWords: true,

    mazeW: 20, mazeH: 20, braid: 0,

    bingoSize: 5, bingoMax: 75, freeSquare: true, bingoMode: 'numbers', bingoHeader: 'BINGO',

    paper: 'letter', orientation: 'portrait', margin: 12,
    theme: 'modern', accent: '#b4472e', ruleColor: '#c9c3b5',
    accentTitle: false, inkSaver: false, headerAlign: 'left',
    title: '', subtitle: '', footer: ''
  };

  var PRESETS = [
    { name: 'Sudoku pack', s: { type: 'sudoku', difficulty: 'medium', count: 8, perPage: 2,
        solutions: 'end', paper: 'letter', orientation: 'portrait' } },
    { name: 'Sudoku one up', s: { type: 'sudoku', difficulty: 'hard', count: 4, perPage: 1,
        solutions: 'end', showMeta: true, paper: 'a4' } },
    { name: 'Evil sudoku', s: { type: 'sudoku', difficulty: 'evil', count: 6, perPage: 2,
        solutions: 'end', showMeta: true } },
    { name: 'Word search', s: { type: 'search', count: 2, perPage: 1, gridSize: 15,
        diagonals: true, backwards: true, showWords: true, solutions: 'end' } },
    { name: 'Easy word search', s: { type: 'search', count: 4, perPage: 1, gridSize: 10,
        diagonals: false, backwards: false, showWords: true, solutions: 'end' } },
    { name: 'Maze pack', s: { type: 'maze', mazeW: 20, mazeH: 26, count: 6, perPage: 1,
        braid: 0, solutions: 'end', paper: 'letter' } },
    { name: 'Big maze', s: { type: 'maze', mazeW: 34, mazeH: 44, count: 2, perPage: 1,
        braid: 0.15, solutions: 'end', paper: 'a4' } },
    { name: 'Toddler maze', s: { type: 'maze', mazeW: 8, mazeH: 10, count: 4, perPage: 2,
        braid: 0, solutions: 'none' } },
    { name: 'Bingo numbers', s: { type: 'bingo', bingoMode: 'numbers', bingoSize: 5,
        bingoMax: 75, freeSquare: true, count: 12, perPage: 2, solutions: 'none',
        numbering: true, bingoHeader: 'BINGO' } },
    { name: 'Bingo words', s: { type: 'bingo', bingoMode: 'words', bingoSize: 4,
        freeSquare: false, count: 8, perPage: 2, solutions: 'none', bingoHeader: '',
        words: 'cat\ndog\nhouse\ntree\nboat\nsun\nmoon\nstar\nfish\nbird\ncar\nbook\nshoe\nhat\ncup\nball\nkey\nleaf\nrock\ncloud' } },
    /* ---- Pro ---- */
    { name: 'Expert sudoku pack', pro: true, note: 'Twelve expert grids, two to a page, answers at the back.', s: { type: 'sudoku', difficulty: 'expert',
        count: 12, perPage: 2, solutions: 'end', paper: 'letter', theme: 'minimal' } }
  ];

  var TYPE_ART = {
    sudoku: '<rect class="stroke" x="8" y="2" width="28" height="28"/><path class="stroke" d="M17.3 2v28M26.6 2v28M8 11.3h28M8 20.6h28"/><path class="stroke" stroke-width=".5" d="M11.1 2v28M14.2 2v28M8 5.1h28M8 8.2h28"/>',
    search: '<rect class="stroke" x="4" y="4" width="40" height="24"/><path class="stroke" d="M11 4v24M18 4v24M25 4v24M32 4v24M39 4v24M4 10h40M4 16h40M4 22h40"/><path class="stroke" stroke-width="1.6" d="M7 13l22 8"/>',
    maze:   '<rect class="stroke" x="4" y="3" width="40" height="26"/><path class="stroke" d="M4 10h26M12 10v13M12 23h26M30 3v13M20 16h18M20 16v7M36 23v6"/>',
    bingo:  '<rect class="stroke" x="8" y="3" width="32" height="26"/><path class="stroke" d="M8 9h32M14.4 3v26M20.8 3v26M27.2 3v26M33.6 3v26M8 14h32M8 19h32M8 24h32"/><circle class="fill" cx="24" cy="21.5" r="2"/>'
  };

  var ACCENTS = ['#b4472e', '#1f6f5c', '#2f4858', '#7a4b8f', '#0f766e',
                 '#a3541f', '#c2185b', '#3b5bdb', '#166534', '#111111'];

  function buildControls() {
    var tiles = $('#type-tiles');
    Object.keys(AP.puzzles.TYPES).forEach(function (id) {
      var def = AP.puzzles.TYPES[id];
      tiles.appendChild(el('label', { class: 'tile', title: def.hint }, [
        el('input', { type: 'radio', name: 'type', 'data-bind': 'type', value: id }),
        el('span', { class: 'tile-art', html: AP.svg('0 0 48 32', TYPE_ART[id]) }),
        el('span', { text: def.label })
      ]));
    });
    AP.fillPaperSizes($('#sel-paper'));
    AP.fillSwatches($('#accent-swatches'), 'accent', ACCENTS);
    AP.fillPresets($('#presets'), PRESETS);

    /* Puzzles are generated from the seed, so a fresh set is a new seed —
       and the same link always reproduces the same puzzles. */
    $('#btn-reroll').addEventListener('click', function () {
      studio.set('seed', Math.floor(Math.random() * 100000) + 1);
      AP.toast('New puzzles dealt');
    });
  }

  var studio = AP.studio({
    key: 'puzzles',
    defaults: DEFAULTS,
    presets: PRESETS,
    keepOnPreset: ['seed', 'title', 'subtitle', 'footer'],
    css: ['../../assets/css/sheet.css', 'print.css'],
    buildControls: buildControls,
    render: function (s) { return AP.puzzles.render(s); },
    pageSize: function (s) { return AP.pageSize(s.paper, s.orientation); },
    pageRule: function (s) { return AP.puzzles.pageRule(s); },
    filename: function (s) { return AP.puzzles.filename(s); },
    saveName: function (s) { return AP.puzzles.TYPES[s.type].label + ' pack'; },
    outputs: {
      margin: function (v) { return v + ' mm'; },
      braid: function (v) { return v === 0 ? 'none' : Math.round(v * 100) + '%'; },
      gridSize: function (v) { return v + ' × ' + v; },
      seed: function (v) { return '#' + v; }
    },
    onState: function (s) {
      $('#type-hint').textContent = AP.puzzles.TYPES[s.type].hint;
      var sheets = Math.ceil(s.count / AP.clamp(s.perPage, 1, 4));
      $('#sheet-readout').textContent = s.count + ' puzzles over ' + sheets +
        (sheets === 1 ? ' sheet' : ' sheets') +
        (s.solutions === 'end' ? ', plus the same again for answers' : ', no answer key');
    }
  });
})();
