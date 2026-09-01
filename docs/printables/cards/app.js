/* Cards & labels generator. */
(function () {
  var el = AP.el, $ = AP.$;

  var DEFAULTS = {
    type: 'flash',
    stock: 'auto', sizePreset: 'flash35',
    cardW: 127, cardH: 76.2, gapX: 0, gapY: 0, margin: 10,
    cols: 0, rows: 0, nudgeX: 0, nudgeY: 0,

    items: 'bonjour | hello\nmerci | thank you\ns’il vous plaît | please\npardon | excuse me',
    fillSheet: false, category: '', numbering: true,

    duplex: 'long', backMode: 'text', backLines: 4,
    marks: 'crop', markLength: 3, markWeight: 0.2,
    cardBorder: false, corner: 0,
    fold: 'none', tent: false, hole: false, holeInset: 6,

    align: 'center', fontScale: 1,
    paper: 'letter', orientation: 'landscape',
    theme: 'modern', accent: '#b4472e', ruleColor: '#b9b3a5', inkSaver: false,
    slug: true
  };

  var PRESETS = [
    { name: 'Flashcards', s: { type: 'flash', stock: 'auto', sizePreset: 'flash35',
        cardW: 127, cardH: 76.2, duplex: 'long', backMode: 'text', marks: 'crop',
        align: 'center', numbering: true, cardBorder: false,
        paper: 'letter', orientation: 'landscape' } },
    { name: 'Study cards small', s: { type: 'flash', stock: 'auto', sizePreset: 'business',
        cardW: 88.9, cardH: 50.8, duplex: 'long', backMode: 'text', marks: 'cut',
        numbering: false, paper: 'letter', orientation: 'portrait', fontScale: 0.9 } },
    { name: 'Blank note cards', s: { type: 'flash', stock: 'auto', sizePreset: 'a7',
        cardW: 74, cardH: 105, duplex: 'long', backMode: 'lines', backLines: 6,
        marks: 'crop', items: 'Idea\nIdea\nIdea\nIdea', numbering: false,
        paper: 'a4', orientation: 'portrait' } },
    { name: 'Gift tags', s: { type: 'tag', stock: 'auto', sizePreset: 'tag',
        cardW: 50.8, cardH: 88.9, duplex: 'none', marks: 'crop', hole: true,
        cardBorder: true, corner: 3, align: 'center', numbering: false,
        items: 'To:\\\\From:\nTo:\\\\From:\nTo:\\\\From:\nTo:\\\\From:',
        paper: 'letter', orientation: 'portrait' } },
    { name: 'Bookmarks', s: { type: 'bookmark', stock: 'auto', sizePreset: 'bookmark',
        cardW: 50.8, cardH: 152.4, duplex: 'none', marks: 'crop', cardBorder: true,
        hole: true, numbering: false, align: 'center',
        items: 'Read\\\\more', paper: 'letter', orientation: 'portrait', fillSheet: true } },
    { name: 'Place cards', s: { type: 'place', stock: 'auto', sizePreset: 'place',
        cardW: 88.9, cardH: 101.6, tent: true, fold: 'horizontal', duplex: 'none',
        marks: 'crop', numbering: false, align: 'center', theme: 'editorial',
        items: 'Ada Whitfield\nJonah Reyes\nRosa Lindqvist\nSam Oyelaran',
        paper: 'letter', orientation: 'portrait' } },
    { name: 'Address labels', s: { type: 'label', stock: 'avery5160', duplex: 'none',
        marks: 'none', align: 'left', numbering: false, fillSheet: true, fontScale: 0.8,
        items: 'Ashwood Press\\\\14 Bellamy Row\\\\Portland, OR 97202' } },
    { name: 'Shipping labels', s: { type: 'label', stock: 'avery5163', duplex: 'none',
        marks: 'none', align: 'left', numbering: false, fontScale: 0.85,
        items: 'Name\\\\Street\\\\City, State ZIP' } }
  ];

  var TYPE_ART = {
    flash:    '<rect class="stroke" x="3" y="6" width="24" height="16" rx="2"/><rect class="stroke" x="20" y="11" width="24" height="16" rx="2"/>',
    tag:      '<path class="stroke" d="M8 12l6-6h16v20H14l-6-6z"/><circle class="stroke" cx="26" cy="10" r="2"/><path class="stroke" d="M18 16h10M18 21h6"/>',
    bookmark: '<rect class="stroke" x="8" y="3" width="10" height="26"/><rect class="stroke" x="21" y="3" width="10" height="26"/><rect class="stroke" x="34" y="3" width="10" height="26"/><circle class="stroke" cx="13" cy="7" r="1.4"/><circle class="stroke" cx="26" cy="7" r="1.4"/><circle class="stroke" cx="39" cy="7" r="1.4"/>',
    place:    '<path class="stroke" d="M6 22h36v7H6z"/><path class="stroke" d="M6 22l7-14h36l-7 14"/><path class="stroke" stroke-dasharray="2 2" d="M13 8h36"/>',
    label:    '<rect class="stroke" x="3" y="4" width="13" height="7"/><rect class="stroke" x="18" y="4" width="13" height="7"/><rect class="stroke" x="33" y="4" width="12" height="7"/><rect class="stroke" x="3" y="13" width="13" height="7"/><rect class="stroke" x="18" y="13" width="13" height="7"/><rect class="stroke" x="33" y="13" width="12" height="7"/><rect class="stroke" x="3" y="22" width="13" height="7"/><rect class="stroke" x="18" y="22" width="13" height="7"/><rect class="stroke" x="33" y="22" width="12" height="7"/>'
  };

  var ACCENTS = ['#b4472e', '#1f6f5c', '#2f4858', '#7a4b8f', '#0f766e',
                 '#a3541f', '#c2185b', '#3b5bdb', '#166534', '#111111'];

  function buildControls() {
    var tiles = $('#type-tiles');
    Object.keys(AP.cards.TYPES).forEach(function (id) {
      var def = AP.cards.TYPES[id];
      tiles.appendChild(el('label', { class: 'tile', title: def.hint }, [
        el('input', { type: 'radio', name: 'type', 'data-bind': 'type', value: id }),
        el('span', { class: 'tile-art', html: AP.svg('0 0 48 32', TYPE_ART[id]) }),
        el('span', { text: def.label })
      ]));
    });

    var stock = $('#sel-stock');
    Object.keys(AP.impose.STOCK).forEach(function (id) {
      stock.appendChild(el('option', { value: id, text: AP.impose.STOCK[id].label }));
    });

    var size = $('#sel-size');
    size.appendChild(el('option', { value: '', text: 'Custom…' }));
    Object.keys(AP.impose.SIZES).forEach(function (id) {
      size.appendChild(el('option', { value: id, text: AP.impose.SIZES[id].label }));
    });
    /* Choosing a named size writes the two millimetre fields. */
    size.addEventListener('change', function () {
      var def = AP.impose.SIZES[size.value];
      if (!def) return;
      studio.set('cardW', def.w);
      studio.set('cardH', def.h);
    });

    AP.fillPaperSizes($('#sel-paper'));
    AP.fillSwatches($('#accent-swatches'), 'accent', ACCENTS);
    AP.fillPresets($('#presets'), PRESETS);
  }

  var studio = AP.studio({
    key: 'cards',
    defaults: DEFAULTS,
    presets: PRESETS,
    keepOnPreset: ['category'],
    css: ['../../assets/css/sheet.css', 'print.css'],
    buildControls: buildControls,
    render: function (s) { return AP.cards.render(s); },
    pageSize: function (s) { return AP.pageSize(AP.cards.paperFor(s), s.orientation); },
    pageRule: function (s) { return AP.cards.pageRule(s); },
    filename: function (s) { return AP.cards.filename(s); },
    saveName: function (s) { return AP.cards.TYPES[s.type].label; },
    outputs: {
      margin: function (v) { return v + ' mm'; },
      gapX: function (v) { return v + ' mm'; },
      gapY: function (v) { return v + ' mm'; },
      nudgeX: function (v) { return (v > 0 ? '+' : '') + v + ' mm'; },
      nudgeY: function (v) { return (v > 0 ? '+' : '') + v + ' mm'; },
      fontScale: function (v) { return Math.round(v * 100) + '%'; },
      corner: function (v) { return v + ' mm'; },
      markWeight: function (v) { return v.toFixed(2) + ' mm'; }
    },
    onState: function (s) {
      $('#type-hint').textContent = AP.cards.TYPES[s.type].hint;
      var g = AP.cards.grid(s);
      var per = g.perSheet;
      var n = (s.items || '').split(/\n/).filter(function (l) {
        return l.trim() && l.trim().charAt(0) !== '#';
      }).length || 1;
      var sheets = s.fillSheet ? 1 : Math.ceil(n / per);
      $('#grid-readout').textContent =
        g.cols + ' × ' + g.rows + ' = ' + per + ' per sheet · ' +
        g.w.toFixed(1) + ' × ' + g.h.toFixed(1) + ' mm · ' +
        sheets + (sheets === 1 ? ' sheet' : ' sheets') +
        (s.duplex !== 'none' ? ' (doubled for backs)' : '');
    }
  });
})();
