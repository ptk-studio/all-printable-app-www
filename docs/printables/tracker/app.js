/* Habit tracker / chore chart generator. */
(function () {
  var el = AP.el, $ = AP.$;

  var DEFAULTS = {
    layout: 'month',
    items: 'Read 20 minutes\nWalk\nStretch\nNo screens after 9\nWater',
    listHeading: 'Habit',
    month: null, year: null, months: 1,
    weeks: 4, weekStart: 1, startDay: 1,
    goalDays: 30, goalCols: 10, numberBoxes: true,

    shape: 'circle', rowFill: 'stretch', labelWidth: 22, goalColumn: false, goalHeading: 'Goal',
    showWeekday: true, showPeriod: true, zebra: false,
    weekendShade: true, weekendDays: [0, 6],
    notesRows: 2, notesTitle: 'Notes',

    paper: 'letter', orientation: 'landscape', margin: 10, textScale: 1,
    theme: 'modern', accent: '#b4472e', ruleColor: '#cfc9bb', shadeColor: '#f4f1e8',
    accentTitle: false, inkSaver: false, locale: 'en-US',

    title: '', subtitle: '', headerAlign: 'left',
    fields: false, fieldList: 'Name, Month', footer: ''
  };

  var PRESETS = [
    { name: 'Habit month', s: { layout: 'month', shape: 'circle', listHeading: 'Habit',
        orientation: 'landscape', paper: 'letter', zebra: false, weekendShade: true } },
    { name: 'Chore chart', s: { layout: 'week', shape: 'square', listHeading: 'Who',
        title: 'Chore chart', items: 'Ada\nJonah\nRosa', weeks: 4, goalColumn: false,
        orientation: 'portrait', paper: 'letter', zebra: true, theme: 'bold' } },
    { name: '30-day challenge', s: { layout: 'goal', shape: 'rounded', goalDays: 30,
        goalCols: 10, numberBoxes: true, title: '30 days', items: 'Push-ups',
        orientation: 'portrait', paper: 'letter' } },
    { name: '100 days', s: { layout: 'goal', shape: 'square', goalDays: 100, goalCols: 20,
        numberBoxes: false, title: '100 days', items: 'Practice',
        orientation: 'portrait', paper: 'a4', theme: 'minimal' } },
    { name: 'Weekly routine', s: { layout: 'week', shape: 'circle', weeks: 5,
        orientation: 'portrait', paper: 'a4', goalColumn: true, goalHeading: 'Total' } },
    { name: 'Mood month', s: { layout: 'month', shape: 'square', listHeading: 'Mood',
        items: 'Great\nGood\nOK\nLow\nRough', orientation: 'landscape', paper: 'a4',
        theme: 'editorial', zebra: true, notesRows: 3 } },
    { name: 'Reward chart', s: { layout: 'week', shape: 'star', listHeading: 'Who',
        title: 'Reward chart', items: 'Ada\nJonah\nRosa', weeks: 4, goalColumn: true,
        goalHeading: 'Prize', orientation: 'portrait', paper: 'letter', zebra: false,
        theme: 'bold', rowFill: 'stretch', notesRows: 1, accentTitle: true } },
    { name: 'Pocket tracker', s: { layout: 'month', shape: 'circle', paper: 'a5',
        orientation: 'landscape', margin: 6, textScale: 0.85, notesRows: 0,
        showWeekday: false, theme: 'mono' } }
  ];

  var LAYOUT_ART = {
    month: '<rect class="stroke" x="2" y="2" width="44" height="28"/><path class="stroke" d="M2 9h44M14 2v28"/><path class="stroke" d="M20 9v21M26 9v21M32 9v21M38 9v21M2 16h44M2 23h44"/>',
    week:  '<rect class="stroke" x="2" y="2" width="44" height="12"/><rect class="stroke" x="2" y="18" width="44" height="12"/><path class="stroke" d="M14 2v12M14 18v12M22 2v12M22 18v12M30 2v12M30 18v12M38 2v12M38 18v12M2 8h44M2 24h44"/>',
    goal:  '<g class="stroke"><rect x="3" y="6" width="7" height="7"/><rect x="12" y="6" width="7" height="7"/><rect x="21" y="6" width="7" height="7"/><rect x="30" y="6" width="7" height="7"/><rect x="39" y="6" width="6" height="7"/><rect x="3" y="18" width="7" height="7"/><rect x="12" y="18" width="7" height="7"/><rect x="21" y="18" width="7" height="7"/><rect x="30" y="18" width="7" height="7"/><rect x="39" y="18" width="6" height="7"/></g>'
  };

  var SHAPE_ART = {
    circle:  '<circle class="stroke" cx="24" cy="16" r="9"/>',
    square:  '<rect class="stroke" x="15" y="7" width="18" height="18"/>',
    rounded: '<rect class="stroke" x="15" y="7" width="18" height="18" rx="4"/>',
    diamond: '<rect class="stroke" x="16" y="8" width="16" height="16" transform="rotate(45 24 16)"/>',
    star:    '<path class="fill" d="M24 5l4 8 9 1-6.5 6 1.6 9L24 24.7 15.9 29l1.6-9L11 14l9-1z"/><path class="stroke" d="M24 5l4 8 9 1-6.5 6 1.6 9L24 24.7 15.9 29l1.6-9L11 14l9-1z"/>',
    none:    '<rect class="stroke" x="9" y="7" width="30" height="18" stroke-dasharray="3 3"/>'
  };
  var SHAPE_LABEL = { circle: 'Circle', square: 'Square', rounded: 'Rounded',
                      diamond: 'Diamond', star: 'Star', none: 'Empty' };

  var ACCENTS = ['#b4472e', '#1f6f5c', '#2f4858', '#7a4b8f', '#0f766e',
                 '#a3541f', '#c2185b', '#3b5bdb', '#166534', '#111111'];

  function buildControls() {
    var tiles = $('#layout-tiles');
    Object.keys(AP.tracker.LAYOUTS).forEach(function (id) {
      var def = AP.tracker.LAYOUTS[id];
      tiles.appendChild(el('label', { class: 'tile', title: def.hint }, [
        el('input', { type: 'radio', name: 'layout', 'data-bind': 'layout', value: id }),
        el('span', { class: 'tile-art', html: AP.svg('0 0 48 32', LAYOUT_ART[id]) }),
        el('span', { text: def.label })
      ]));
    });

    var shapes = $('#shape-tiles');
    Object.keys(SHAPE_ART).forEach(function (id) {
      shapes.appendChild(el('label', { class: 'tile' }, [
        el('input', { type: 'radio', name: 'shape', 'data-bind': 'shape', value: id }),
        el('span', { class: 'tile-art', html: AP.svg('0 0 48 32', SHAPE_ART[id]) }),
        el('span', { text: SHAPE_LABEL[id] })
      ]));
    });

    var sm = $('#sel-month');
    for (var m = 0; m < 12; m++) {
      sm.appendChild(el('option', { value: m, text: AP.monthName(2025, m, 'en-US', 'long') }));
    }
    var ws = $('#sel-weekStart');
    [0, 1, 6].forEach(function (d) {
      ws.appendChild(el('option', { value: d, text: AP.dayName(d, 'en-US', 'long') }));
    });
    var wd = $('#weekend-days');
    for (var d = 0; d < 7; d++) {
      wd.appendChild(el('label', { class: 'check' }, [
        el('input', { type: 'checkbox', 'data-list': 'weekendDays:' + d }),
        el('span', { text: AP.dayName(d, 'en-US', 'short') })
      ]));
    }

    AP.fillLocales($('#sel-locale'));
    AP.fillPaperSizes($('#sel-paper'));
    AP.fillSwatches($('#accent-swatches'), 'accent', ACCENTS);
    AP.fillPresets($('#presets'), PRESETS);
  }

  AP.studio({
    key: 'tracker',
    defaults: DEFAULTS,
    init: function (s) {
      var now = AP.today();
      s.month = now.getMonth();
      s.year = now.getFullYear();
    },
    presets: PRESETS,
    keepOnPreset: ['month', 'year', 'subtitle', 'footer'],
    css: ['../../assets/css/sheet.css', 'print.css'],
    buildControls: buildControls,
    render: function (s) { return AP.tracker.render(s); },
    pageSize: function (s) { return AP.pageSize(s.paper, s.orientation); },
    pageRule: function (s) { return AP.tracker.pageRule(s); },
    filename: function (s) { return AP.tracker.filename(s); },
    saveName: function (s) { return AP.tracker.LAYOUTS[s.layout].label + ' tracker'; },
    outputs: {
      margin: function (v) { return v + ' mm'; },
      textScale: function (v) { return Math.round(v * 100) + '%'; },
      labelWidth: function (v) { return v + '%'; }
    },
    onState: function (s) {
      $('#layout-hint').textContent = AP.tracker.LAYOUTS[s.layout].hint;
    }
  });
})();
