/* Maths worksheets generator. */
(function () {
  var el = AP.el, $ = AP.$;

  var DEFAULTS = {
    type: 'drill', seed: 1, sheets: 2, answers: true,
    operations: ['mul'],
    aMin: 2, aMax: 12, bMin: 1, bMax: 12,
    allowNegative: false,
    count: 30, columns: 3, format: 'horizontal', numbering: true,

    chartMax: 12, chartBlank: false,

    paper: 'letter', orientation: 'portrait', margin: 14, textScale: 1,
    theme: 'modern', accent: '#b4472e', ruleColor: '#c9c3b5', shadeColor: '#f4f1e8',
    accentTitle: false, inkSaver: false, headerAlign: 'left',
    title: '', subtitle: '', fields: true, fieldList: 'Name, Date, Score', footer: ''
  };

  var PRESETS = [
    { name: 'Times tables', s: { type: 'drill', operations: ['mul'], aMin: 2, aMax: 12,
        bMin: 1, bMax: 12, count: 30, columns: 3, format: 'horizontal', sheets: 2,
        answers: true, title: 'Times tables' } },
    { name: 'Times table grid', s: { type: 'chart', chartMax: 12, chartBlank: false,
        sheets: 1, answers: false, title: 'Times table', fields: false } },
    { name: 'Blank grid', s: { type: 'chart', chartMax: 12, chartBlank: true, sheets: 1,
        answers: true, title: 'Times table', fields: true } },
    { name: 'Addition to 20', s: { type: 'drill', operations: ['add'], aMin: 1, aMax: 10,
        bMin: 1, bMax: 10, count: 36, columns: 4, format: 'horizontal', title: 'Addition' } },
    { name: 'Column addition', s: { type: 'drill', operations: ['add'], aMin: 100, aMax: 999,
        bMin: 100, bMax: 999, count: 12, columns: 4, format: 'vertical',
        title: 'Column addition' } },
    { name: 'Subtraction', s: { type: 'drill', operations: ['sub'], aMin: 1, aMax: 20,
        bMin: 1, bMax: 20, count: 30, columns: 3, title: 'Subtraction' } },
    { name: 'Division facts', s: { type: 'drill', operations: ['div'], aMin: 1, aMax: 12,
        bMin: 2, bMax: 12, count: 30, columns: 3, title: 'Division' } },
    { name: 'Mixed practice', s: { type: 'drill', operations: ['mul', 'add', 'sub', 'div'],
        aMin: 1, aMax: 12, bMin: 1, bMax: 12, count: 30, columns: 3, title: 'Mixed practice' } },
    /* ---- Pro ---- */
    { name: 'Mixed operations set', pro: true, note: 'Four sheets of forty mixed +, -, x and division, answers included.', s: { type: 'drill',
        operations: ['add', 'sub', 'mul', 'div'], count: 40, columns: 4,
        sheets: 4, answers: true, format: 'horizontal', paper: 'letter' } }
  ];

  var TYPE_ART = {
    drill: '<path class="stroke" d="M6 8h12M9 6v6M26 8h12M6 22h12M26 20h12M26 24h12"/><path class="stroke" d="M30 18l6 8M36 18l-6 8" transform="translate(0,-12)"/>',
    chart: '<rect class="stroke" x="5" y="4" width="38" height="24"/><path class="stroke" d="M5 10h38M12 4v24M19 4v24M26 4v24M33 4v24M5 16h38M5 22h38"/>'
  };

  var ACCENTS = ['#b4472e', '#1f6f5c', '#2f4858', '#7a4b8f', '#0f766e',
                 '#a3541f', '#c2185b', '#3b5bdb', '#166534', '#111111'];

  function buildControls() {
    var tiles = $('#type-tiles');
    Object.keys(AP.worksheets.TYPES).forEach(function (id) {
      var def = AP.worksheets.TYPES[id];
      tiles.appendChild(el('label', { class: 'tile', title: def.hint }, [
        el('input', { type: 'radio', name: 'type', 'data-bind': 'type', value: id }),
        el('span', { class: 'tile-art', html: AP.svg('0 0 48 32', TYPE_ART[id]) }),
        el('span', { text: def.label })
      ]));
    });
    var ops = $('#op-list');
    Object.keys(AP.worksheets.OPS).forEach(function (id) {
      ops.appendChild(el('label', { class: 'check' }, [
        el('input', { type: 'checkbox', 'data-list': 'operations:' + id }),
        el('span', { text: AP.worksheets.OPS[id].label + '  ' + AP.worksheets.OPS[id].sign })
      ]));
    });
    AP.fillPaperSizes($('#sel-paper'));
    AP.fillSwatches($('#accent-swatches'), 'accent', ACCENTS);
    AP.fillPresets($('#presets'), PRESETS);

    $('#btn-reroll').addEventListener('click', function () {
      studio.set('seed', Math.floor(Math.random() * 100000) + 1);
      AP.toast('New problems');
    });
  }

  var studio = AP.studio({
    key: 'worksheets',
    defaults: DEFAULTS,
    presets: PRESETS,
    keepOnPreset: ['seed', 'subtitle', 'footer', 'fieldList'],
    css: ['../../assets/css/sheet.css', 'print.css'],
    buildControls: buildControls,
    render: function (s) { return AP.worksheets.render(s); },
    pageSize: function (s) { return AP.pageSize(s.paper, s.orientation); },
    pageRule: function (s) { return AP.worksheets.pageRule(s); },
    filename: function (s) { return AP.worksheets.filename(s); },
    saveName: function (s) { return AP.worksheets.TYPES[s.type].label; },
    outputs: {
      margin: function (v) { return v + ' mm'; },
      textScale: function (v) { return Math.round(v * 100) + '%'; },
      seed: function (v) { return '#' + v; }
    },
    onState: function (s) {
      $('#type-hint').textContent = AP.worksheets.TYPES[s.type].hint;
      var n = s.type === 'chart'
        ? s.chartMax + ' × ' + s.chartMax + ' grid'
        : s.count + ' problems × ' + s.sheets + (s.sheets === 1 ? ' sheet' : ' sheets');
      $('#count-readout').textContent = n + (s.answers ? ', answer key included' : ', no answer key');
    }
  });
})();
