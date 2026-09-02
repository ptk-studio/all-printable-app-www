/* Form sheets generator — budget, packing list, meal plan, day planner. */
(function () {
  var el = AP.el, $ = AP.$;

  var DEFAULTS = {
    type: 'budget',
    sheets: 1,

    groups: 'Income: Salary, Side work\nHome: Rent, Utilities, Council tax\nLiving: Groceries, Transport, Phone\nSaving: Emergency fund, Pension',
    rowsPerGroup: 6, columns: 2, totals: true, showActual: true, showDiff: false,
    currency: '', zebra: false,

    blankRows: 4, nights: 5, showCounts: true,

    meals: 'Breakfast\nLunch\nDinner', showDates: true, shoppingList: true,
    shoppingTitle: 'Shopping', shoppingRows: 14, shoppingCols: 2,

    hourStart: 7, hourEnd: 21, halfHours: false, hour24: false, sideWidth: 58,
    scheduleTitle: 'Schedule', priorities: 3, prioritiesTitle: 'Top three',
    todos: 8, todosTitle: 'To do',

    checkShape: 'square',
    notesRows: 3, notesTitle: 'Notes',

    month: null, year: null, startDay: 1, weekStart: 1, locale: 'en-US',
    paper: 'letter', orientation: 'portrait', margin: 12, textScale: 1,
    theme: 'modern', accent: '#b4472e', ruleColor: '#cfc9bb', shadeColor: '#f4f1e8',
    accentTitle: false, inkSaver: false, headerAlign: 'left', showPeriod: true,
    title: '', subtitle: '', fields: false, fieldList: 'Name, Date', footer: ''
  };

  var PRESETS = [
    { name: 'Monthly budget', s: { type: 'budget', columns: 2, totals: true, showActual: true,
        rowsPerGroup: 6, paper: 'letter', orientation: 'portrait' } },
    { name: 'Simple budget', s: { type: 'budget', columns: 1, showActual: false, showDiff: false,
        rowsPerGroup: 10, groups: 'Money in: \nMoney out: ', paper: 'a4', notesRows: 4 } },
    { name: 'Budget year', s: { type: 'budget', sheets: 12, columns: 2, totals: true,
        showActual: true, showDiff: true, paper: 'letter', orientation: 'landscape' } },
    { name: 'Packing list', s: { type: 'packing', columns: 3, blankRows: 5, nights: 5,
        groups: 'Clothes: Tops, Trousers, Underwear, Socks, Jumper\nToiletries: Toothbrush, Shampoo, Razor\nTech: Charger, Adapter, Headphones\nDocuments: Passport, Tickets, Insurance\nOther: Book, Snacks',
        paper: 'letter', orientation: 'portrait' } },
    { name: 'Weekend bag', s: { type: 'packing', columns: 2, blankRows: 6, nights: 2,
        groups: 'Clothes: \nWash bag: \nTech: \nDon’t forget: ',
        paper: 'a5', margin: 8, notesRows: 0 } },
    { name: 'Meal plan', s: { type: 'meal', meals: 'Breakfast\nLunch\nDinner',
        shoppingList: true, shoppingRows: 14, shoppingCols: 2, showDates: true,
        paper: 'letter', orientation: 'portrait' } },
    { name: 'Meals + snacks', s: { type: 'meal', meals: 'Breakfast\nLunch\nDinner\nSnack',
        shoppingList: true, shoppingRows: 12, shoppingCols: 3, notesRows: 0,
        paper: 'letter', orientation: 'landscape' } },
    { name: 'Day planner', s: { type: 'daily', hourStart: 7, hourEnd: 21, priorities: 3,
        todos: 9, notesRows: 4, sideWidth: 58, paper: 'letter', orientation: 'portrait' } },
    { name: 'Half-hour day', s: { type: 'daily', hourStart: 8, hourEnd: 18, halfHours: true,
        priorities: 3, todos: 6, notesRows: 3, sideWidth: 62, paper: 'a4' } },
    { name: 'Pocket day', s: { type: 'daily', hourStart: 8, hourEnd: 20, priorities: 3,
        todos: 5, notesRows: 0, sideWidth: 60, paper: 'a5', margin: 7, textScale: .9 } }
  ];

  var TYPE_ART = {
    budget: '<rect class="stroke" x="4" y="4" width="40" height="24"/><path class="stroke" d="M4 10h40M30 4v24M4 16h40M4 22h40"/>',
    packing:'<g class="stroke"><rect x="5" y="6" width="5" height="5"/><rect x="5" y="14" width="5" height="5"/><rect x="5" y="22" width="5" height="5"/><rect x="26" y="6" width="5" height="5"/><rect x="26" y="14" width="5" height="5"/><rect x="26" y="22" width="5" height="5"/></g><path class="stroke" d="M13 8.5h9M13 16.5h9M13 24.5h9M34 8.5h9M34 16.5h9M34 24.5h9"/>',
    meal:   '<rect class="stroke" x="4" y="4" width="26" height="24"/><path class="stroke" d="M4 10h26M12 4v24M4 16h26M4 22h26"/><path class="stroke" d="M36 6v9M40 6v9M38 15v13M36 6a2 5 0 004 0"/>',
    daily:  '<rect class="stroke" x="4" y="4" width="22" height="24"/><path class="stroke" d="M11 4v24M4 10h22M4 16h22M4 22h22"/><g class="stroke"><rect x="31" y="6" width="4" height="4"/><rect x="31" y="14" width="4" height="4"/><rect x="31" y="22" width="4" height="4"/></g><path class="stroke" d="M38 8h6M38 16h6M38 24h6"/>'
  };

  var ACCENTS = ['#b4472e', '#1f6f5c', '#2f4858', '#7a4b8f', '#0f766e',
                 '#a3541f', '#c2185b', '#3b5bdb', '#166534', '#111111'];

  function buildControls() {
    var tiles = $('#type-tiles');
    Object.keys(AP.forms.TYPES).forEach(function (id) {
      var def = AP.forms.TYPES[id];
      tiles.appendChild(el('label', { class: 'tile', title: def.hint }, [
        el('input', { type: 'radio', name: 'type', 'data-bind': 'type', value: id }),
        el('span', { class: 'tile-art', html: AP.svg('0 0 48 32', TYPE_ART[id]) }),
        el('span', { text: def.label })
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
    AP.fillLocales($('#sel-locale'));
    AP.fillPaperSizes($('#sel-paper'));
    AP.fillSwatches($('#accent-swatches'), 'accent', ACCENTS);
    AP.fillPresets($('#presets'), PRESETS);
  }

  AP.studio({
    key: 'forms',
    defaults: DEFAULTS,
    init: function (s) {
      var now = AP.today();
      s.month = now.getMonth();
      s.year = now.getFullYear();
    },
    presets: PRESETS,
    keepOnPreset: ['month', 'year', 'subtitle', 'footer', 'locale'],
    css: ['../../assets/css/sheet.css', 'print.css'],
    buildControls: buildControls,
    render: function (s) { return AP.forms.render(s); },
    pageSize: function (s) { return AP.pageSize(s.paper, s.orientation); },
    pageRule: function (s) { return AP.forms.pageRule(s); },
    filename: function (s) { return AP.forms.filename(s); },
    saveName: function (s) { return AP.forms.TYPES[s.type].label; },
    outputs: {
      margin: function (v) { return v + ' mm'; },
      textScale: function (v) { return Math.round(v * 100) + '%'; },
      sideWidth: function (v) { return v + '% / ' + (100 - v) + '%'; }
    },
    onState: function (s) {
      $('#type-hint').textContent = AP.forms.TYPES[s.type].hint;
    }
  });
})();
