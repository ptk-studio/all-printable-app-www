/* Paper & grids generator — the parts specific to this printable. */
(function () {
  var el = AP.el, $ = AP.$;

  var DEFAULTS = {
    type: 'grid',
    unit: 'mm', size: 5,
    major: 5, dotSize: 0.6,
    rulePreset: 'college', marginLine: 'left', marginAt: 25, headerRule: false,
    isoVertical: true, hexOrient: 'pointy',
    staves: 10, staffGap: 2.5, staffKind: 'staff', staffBars: 1,
    hwMid: 'dashed', hwDescender: true, hwSlant: false, hwTrace: '',

    paper: 'letter', orientation: 'portrait', margin: 10, pages: 1,

    color: '#9bb0c4', accent: '#b4472e', weight: 0.2, majorWeight: 0.4,
    border: false, inkSaver: false, theme: 'modern',

    title: '', fields: false, fieldList: 'Name, Date', footer: '', pageNumbers: false
  };

  var PRESETS = [
    { name: 'Graph 5 mm', s: { type: 'grid', unit: 'mm', size: 5, major: 5, paper: 'a4' } },
    { name: 'Quad ¼ in', s: { type: 'grid', unit: 'in', size: 0.25, major: 4, paper: 'letter' } },
    { name: 'Engineering', s: { type: 'grid', unit: 'in', size: 0.1, major: 10,
        paper: 'letter', weight: 0.12, majorWeight: 0.3, color: '#8fae86', border: true } },
    { name: 'Bullet dots', s: { type: 'dots', unit: 'mm', size: 5, dotSize: 0.6, major: 0,
        paper: 'a5', margin: 6, color: '#a9a396' } },
    { name: 'College ruled', s: { type: 'lines', rulePreset: 'college', marginLine: 'left',
        marginAt: 32, headerRule: true, paper: 'letter', color: '#9bb0c4' } },
    { name: 'Wide ruled', s: { type: 'lines', rulePreset: 'wide', marginLine: 'left',
        marginAt: 32, paper: 'letter' } },
    { name: 'Isometric', s: { type: 'iso', unit: 'mm', size: 5, isoVertical: true,
        paper: 'a4', color: '#b3c2d1' } },
    { name: 'Hex map', s: { type: 'hex', unit: 'mm', size: 10, hexOrient: 'pointy',
        paper: 'a4', color: '#a9a396' } },
    { name: 'Manuscript', s: { type: 'staff', staves: 10, staffGap: 2.5, staffKind: 'staff',
        paper: 'letter', color: '#3a3a3a', weight: 0.25 } },
    { name: 'Guitar tab', s: { type: 'staff', staves: 8, staffGap: 3, staffKind: 'tab',
        staffBars: 4, paper: 'letter', color: '#3a3a3a' } },
    { name: 'Handwriting', s: { type: 'hand', unit: 'mm', size: 16, hwMid: 'dashed',
        hwDescender: true, paper: 'letter', color: '#9bb0c4', theme: 'classic' } },
    /* ---- Pro ---- */
    { name: 'Cornell notes', pro: true, s: { type: 'lines', rulePreset: 'college',
        marginLine: 'left', marginAt: 55, headerRule: true, paper: 'letter',
        theme: 'minimal', color: '#9bb0c4' } },
    { name: 'Storyboard', pro: true, s: { type: 'grid', unit: 'mm', size: 24,
        major: 0, border: true, paper: 'a4', orientation: 'landscape',
        weight: 0.35, color: '#a9a396', margin: 12 } }
  ];

  var TYPE_ART = {
    grid:  '<rect class="stroke" x="3" y="2" width="42" height="28"/><path class="stroke" d="M13 2v28M24 2v28M35 2v28M3 9h42M3 16h42M3 23h42"/>',
    dots:  '<g class="fill"><circle cx="9" cy="7" r="1.4"/><circle cx="19" cy="7" r="1.4"/><circle cx="29" cy="7" r="1.4"/><circle cx="39" cy="7" r="1.4"/><circle cx="9" cy="16" r="1.4"/><circle cx="19" cy="16" r="1.4"/><circle cx="29" cy="16" r="1.4"/><circle cx="39" cy="16" r="1.4"/><circle cx="9" cy="25" r="1.4"/><circle cx="19" cy="25" r="1.4"/><circle cx="29" cy="25" r="1.4"/><circle cx="39" cy="25" r="1.4"/></g>',
    lines: '<path class="stroke" d="M4 6h40M4 12h40M4 18h40M4 24h40M4 30h40"/><path class="stroke" d="M12 2v30"/>',
    iso:   '<path class="stroke" d="M4 26L16 5l12 21zM16 5l12 21L40 5M4 26h40M10 15h12M22 15h12"/>',
    hex:   '<path class="stroke" d="M10 8l5-3 5 3v6l-5 3-5-3zM22 8l5-3 5 3v6l-5 3-5-3zM16 18l5-3 5 3v6l-5 3-5-3zM28 18l5-3 5 3v6l-5 3-5-3z"/>',
    staff: '<path class="stroke" d="M3 6h42M3 10h42M3 14h42M3 18h42M3 22h42"/><path class="stroke" d="M3 6v16M45 6v16"/>',
    hand:  '<path class="stroke" d="M4 8h40M4 24h40"/><path class="stroke" stroke-dasharray="3 3" d="M4 16h40"/><path class="stroke" d="M14 24c0-9 5-12 8-9s-4 9-1 11 5-2 6-5"/>'
  };

  var INKS = ['#9bb0c4', '#a9a396', '#8fae86', '#c9a0a0', '#b0a8c8', '#3a3a3a', '#6b7280', '#b4472e'];

  function buildControls() {
    var tiles = $('#type-tiles');
    Object.keys(AP.paper.TYPES).forEach(function (id) {
      var def = AP.paper.TYPES[id];
      tiles.appendChild(el('label', { class: 'tile', title: def.hint }, [
        el('input', { type: 'radio', name: 'type', 'data-bind': 'type', value: id }),
        el('span', { class: 'tile-art', html: AP.svg('0 0 48 32', TYPE_ART[id]) }),
        el('span', { text: def.label })
      ]));
    });

    var rule = $('#sel-rule');
    Object.keys(AP.paper.RULES).forEach(function (id) {
      var r = AP.paper.RULES[id];
      rule.appendChild(el('option', {
        value: id, text: r.mm ? r.label + ' · ' + r.mm + ' mm' : r.label
      }));
    });

    AP.fillPaperSizes($('#sel-paper'));
    AP.fillSwatches($('#ink-swatches'), 'color', INKS);
    AP.fillPresets($('#presets'), PRESETS);
  }

  AP.studio({
    key: 'paper',
    defaults: DEFAULTS,
    presets: PRESETS,
    keepOnPreset: ['title', 'footer', 'fields', 'fieldList'],
    css: ['../../assets/css/sheet.css', 'print.css'],
    buildControls: buildControls,
    render: function (s) { return AP.paper.render(s); },
    pageSize: function (s) { return AP.pageSize(s.paper, s.orientation); },
    pageRule: function (s) { return AP.paper.pageRule(s); },
    filename: function (s) { return AP.paper.filename(s); },
    saveName: function (s) { return AP.paper.TYPES[s.type].label + ' ' + s.size + s.unit; },
    outputs: {
      size: function (v, s) { return AP.paper.effectiveStep(s); },
      margin: function (v) { return v + ' mm'; },
      weight: function (v) { return v.toFixed(2) + ' mm'; },
      majorWeight: function (v) { return v.toFixed(2) + ' mm'; },
      dotSize: function (v) { return v.toFixed(2) + ' mm'; },
      marginAt: function (v) { return v + ' mm'; }
    },
    onState: function (s) {
      $('#type-hint').textContent = AP.paper.TYPES[s.type].hint;
    }
  });
})();
