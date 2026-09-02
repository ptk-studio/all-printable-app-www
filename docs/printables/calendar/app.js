/* Calendar generator — only what is specific to calendars. State, control
   binding, preview, printing and export all live in core/studio.js. */
(function () {
  var el = AP.el, $ = AP.$;

  var DEFAULTS = {
    layout: 'month',
    perPage: 4, yearCols: 3, ygridOrient: 'across', ygridLabels: false, agendaCols: 1,
    weekShape: 'rows', weekHours: false, hourStart: 7, hourEnd: 21, weekNotes: true, weekFill: 'lines',
    photoSize: 45, photoData: '', showRangeTitle: false,

    startMonth: null, startYear: null, startDay: 1, count: 12,
    weekStart: 0, weekendDays: [0, 6], locale: 'en-US',

    paper: 'letter', orientation: 'portrait', margin: 10, textScale: 1,

    theme: 'classic', accent: '#b4472e', ruleColor: '#cfc9bb', shadeColor: '#f4f1e8',
    rules: 'all', weekendStyle: 'tint', numberPos: 'tl', numberScale: 1,
    dowStyle: 'short', dowAlign: 'left', headerAlign: 'left',
    accentTitle: false, inkSaver: false,

    weekNumbers: 'none', altLabel: 'none', adjacent: 'grey', sixWeeks: false,
    markToday: false, miniMonths: false, moon: false,
    cellFill: 'none', notes: 'none', notesPos: 'below', notesSize: 22, notesTitle: 'Notes',

    holiday: {
      countries: [], style: 'name', showObserved: false,
      observances: false, lunarNewYear: false, seasons: false,
      legend: false, substitute: true
    },
    events: '', subtitle: '', footer: ''
  };

  var PRESETS = [
    { name: 'Family wall', s: { layout: 'month', paper: 'letter', orientation: 'portrait',
        sixWeeks: true, miniMonths: true, numberScale: 1.3, theme: 'classic',
        weekendStyle: 'tint', holiday: { countries: ['US'], style: 'name' } } },
    { name: 'Desk month', s: { layout: 'month', paper: 'a5', orientation: 'landscape',
        theme: 'modern', numberScale: 1.1, margin: 8, weekendStyle: 'tint' } },
    { name: 'Year planner', s: { layout: 'yeargrid', paper: 'a3', orientation: 'landscape',
        ygridOrient: 'across', theme: 'modern', margin: 8, count: 1 } },
    { name: 'Year at a glance', s: { layout: 'year', paper: 'letter', orientation: 'portrait',
        yearCols: 3, theme: 'classic', count: 1 } },
    { name: 'Weekly planner', s: { layout: 'week', paper: 'a5', orientation: 'portrait',
        weekShape: 'rows', weekHours: false, weekFill: 'lines', weekNotes: true,
        count: 12, margin: 9 } },
    { name: 'Hourly week', s: { layout: 'week', paper: 'letter', orientation: 'landscape',
        weekShape: 'columns', weekHours: true, hourStart: 7, hourEnd: 20,
        weekNotes: true, count: 12 } },
    { name: 'Six months', s: { layout: 'multi', perPage: 6, paper: 'letter',
        orientation: 'landscape', theme: 'modern', count: 12, showRangeTitle: true } },
    { name: 'Minimal poster', s: { layout: 'year', paper: 'poster1824', orientation: 'portrait',
        theme: 'minimal', yearCols: 3, rules: 'none', weekendStyle: 'none',
        margin: 25, count: 1 } },
    { name: 'Bullet journal', s: { layout: 'agenda', paper: 'a5', orientation: 'portrait',
        theme: 'mono', agendaCols: 1, margin: 8, weekendStyle: 'tint' } },
    { name: 'Photo calendar', s: { layout: 'photo', paper: 'letter', orientation: 'portrait',
        photoSize: 48, theme: 'editorial', headerAlign: 'center', numberScale: .9 } },
    /* ---- Pro ---- */
    { name: 'Moon year wall', pro: true, s: { layout: 'month', paper: 'a3',
        orientation: 'portrait', theme: 'editorial', sixWeeks: true, moon: true,
        numberScale: 1.35, margin: 12, weekendStyle: 'tint',
        holiday: { seasons: true } } },
    { name: 'Term wall chart', pro: true, s: { layout: 'multi', perPage: 4,
        paper: 'a3', orientation: 'landscape', theme: 'modern', margin: 10,
        count: 12, weekendStyle: 'tint', weekNumbers: 'iso',
        holiday: { seasons: true } } }
  ];

  var LAYOUT_ART = {
    month:    '<rect class="stroke" x="2" y="2" width="44" height="26"/><line class="stroke" x1="2" y1="9" x2="46" y2="9"/><line class="stroke" x1="15" y1="9" x2="15" y2="28"/><line class="stroke" x1="28" y1="9" x2="28" y2="28"/><line class="stroke" x1="2" y1="16" x2="46" y2="16"/><line class="stroke" x1="2" y1="22" x2="46" y2="22"/>',
    multi:    '<rect class="stroke" x="2" y="2" width="20" height="12"/><rect class="stroke" x="26" y="2" width="20" height="12"/><rect class="stroke" x="2" y="17" width="20" height="12"/><rect class="stroke" x="26" y="17" width="20" height="12"/>',
    year:     '<rect class="stroke" x="2" y="2" width="12" height="8"/><rect class="stroke" x="18" y="2" width="12" height="8"/><rect class="stroke" x="34" y="2" width="12" height="8"/><rect class="stroke" x="2" y="13" width="12" height="8"/><rect class="stroke" x="18" y="13" width="12" height="8"/><rect class="stroke" x="34" y="13" width="12" height="8"/><rect class="stroke" x="2" y="24" width="12" height="6"/><rect class="stroke" x="18" y="24" width="12" height="6"/><rect class="stroke" x="34" y="24" width="12" height="6"/>',
    yeargrid: '<rect class="stroke" x="2" y="2" width="44" height="28"/><line class="stroke" x1="2" y1="8" x2="46" y2="8"/><line class="stroke" x1="9" y1="2" x2="9" y2="30"/><line class="stroke" x1="17" y1="2" x2="17" y2="30"/><line class="stroke" x1="25" y1="2" x2="25" y2="30"/><line class="stroke" x1="33" y1="2" x2="33" y2="30"/><line class="stroke" x1="40" y1="2" x2="40" y2="30"/>',
    agenda:   '<line class="stroke" x1="4" y1="5" x2="44" y2="5"/><line class="stroke" x1="4" y1="11" x2="44" y2="11"/><line class="stroke" x1="4" y1="17" x2="44" y2="17"/><line class="stroke" x1="4" y1="23" x2="44" y2="23"/><line class="stroke" x1="4" y1="29" x2="44" y2="29"/><line class="stroke" x1="12" y1="2" x2="12" y2="30"/>',
    week:     '<rect class="stroke" x="2" y="2" width="44" height="6"/><rect class="stroke" x="2" y="10" width="44" height="6"/><rect class="stroke" x="2" y="18" width="44" height="6"/><rect class="stroke" x="2" y="26" width="44" height="5"/>',
    photo:    '<rect class="fill" x="2" y="2" width="44" height="14"/><rect class="stroke" x="2" y="2" width="44" height="14"/><rect class="stroke" x="2" y="19" width="44" height="11"/><line class="stroke" x1="16" y1="19" x2="16" y2="30"/><line class="stroke" x1="31" y1="19" x2="31" y2="30"/>'
  };

  var ACCENTS = ['#b4472e', '#1f6f5c', '#2f4858', '#7a4b8f', '#0f766e', '#a3541f',
                 '#c2185b', '#3b5bdb', '#166534', '#111111'];

  function buildControls() {
    var tiles = $('#layout-tiles');
    Object.keys(AP.calendar.LAYOUTS).forEach(function (id) {
      var def = AP.calendar.LAYOUTS[id];
      tiles.appendChild(el('label', { class: 'tile', title: def.hint }, [
        el('input', { type: 'radio', name: 'layout', 'data-bind': 'layout', value: id }),
        el('span', { class: 'tile-art', html: AP.svg('0 0 48 32', LAYOUT_ART[id]) }),
        el('span', { text: def.label })
      ]));
    });

    var sm = $('#sel-startMonth');
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

    var cl = $('#country-list');
    AP.holidays.countryList().forEach(function (c) {
      cl.appendChild(el('label', { class: 'check', title: c.note || '' }, [
        el('input', { type: 'checkbox', 'data-list': 'holiday.countries:' + c.id }),
        el('span', { text: c.label })
      ]));
    });

    AP.fillSwatches($('#accent-swatches'), 'accent', ACCENTS);
    AP.fillPresets($('#presets'), PRESETS);
  }

  var studio = AP.studio({
    key: 'calendar',
    defaults: DEFAULTS,
    init: function (s) {
      var now = AP.today();
      s.startMonth = now.getMonth();
      s.startYear = now.getFullYear();
    },
    presets: PRESETS,
    keepOnPreset: ['startMonth', 'startYear', 'events', 'subtitle', 'footer'],
    css: ['../../assets/css/sheet.css', 'print.css'],
    buildControls: buildControls,
    render: function (s) { return AP.calendar.render(s); },
    pageSize: function (s) { return AP.pageSize(s.paper, s.orientation); },
    pageRule: function (s) { return AP.calendar.pageRule(s); },
    filename: function (s) { return AP.calendar.filename(s); },
    saveName: function (s) { return AP.calendar.LAYOUTS[s.layout].label + ' ' + s.startYear; },
    outputs: {
      margin: function (v) { return v + ' mm'; },
      textScale: function (v) { return Math.round(v * 100) + '%'; },
      numberScale: function (v) { return Math.round(v * 100) + '%'; },
      notesSize: function (v) { return v + '%'; },
      photoSize: function (v) { return v + '%'; }
    },
    onState: function (s) {
      var lay = AP.calendar.LAYOUTS[s.layout];
      $('#layout-hint').textContent = lay.hint;
      $('#count-label').textContent = AP.calendar.UNIT_LABEL[lay.unit];
    }
  });

  /* Calendar-only inputs the studio does not know about. */
  $('#btn-events-csv').addEventListener('click', function () { $('#events-file').click(); });
  $('#events-file').addEventListener('change', function (e) {
    var f = e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      var lines = String(r.result).split(/\r?\n/).map(function (l) {
        return l.replace(/^"|"$/g, '').replace(/^([^,]+),\s*/, '$1 ');
      });
      var joined = lines.join('\n').trim();
      studio.set('events', (studio.state.events ? studio.state.events + '\n' : '') + joined);
      AP.toast('Events imported');
    };
    r.readAsText(f);
    e.target.value = '';
  });

  $('#photo-file').addEventListener('change', function (e) {
    var f = e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () { studio.set('photoData', r.result); };
    r.readAsDataURL(f);
  });
})();
