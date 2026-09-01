/* Paper sizes shared by every printable. All dimensions in millimetres,
   portrait orientation (width < height). */
window.AP = window.AP || {};

AP.PAPER = {
  letter:      { label: 'US Letter',   sub: '8.5 × 11 in',   w: 215.9, h: 279.4, group: 'US' },
  legal:       { label: 'US Legal',    sub: '8.5 × 14 in',   w: 215.9, h: 355.6, group: 'US' },
  tabloid:     { label: 'Tabloid',     sub: '11 × 17 in',    w: 279.4, h: 431.8, group: 'US' },
  halfletter:  { label: 'Half Letter', sub: '5.5 × 8.5 in',  w: 139.7, h: 215.9, group: 'US' },
  a3:          { label: 'A3',          sub: '297 × 420 mm',  w: 297,   h: 420,   group: 'ISO' },
  a4:          { label: 'A4',          sub: '210 × 297 mm',  w: 210,   h: 297,   group: 'ISO' },
  a5:          { label: 'A5',          sub: '148 × 210 mm',  w: 148,   h: 210,   group: 'ISO' },
  a6:          { label: 'A6',          sub: '105 × 148 mm',  w: 105,   h: 148,   group: 'ISO' },
  b5:          { label: 'B5',          sub: '176 × 250 mm',  w: 176,   h: 250,   group: 'ISO' },
  square8:     { label: 'Square 8in',  sub: '8 × 8 in',      w: 203.2, h: 203.2, group: 'Special' },
  square12:    { label: 'Square 12in', sub: '12 × 12 in',    w: 304.8, h: 304.8, group: 'Special' },
  poster1824:  { label: 'Poster',      sub: '18 × 24 in',    w: 457.2, h: 609.6, group: 'Special' },
  poster2436:  { label: 'Movie Poster',sub: '24 × 36 in',    w: 609.6, h: 914.4, group: 'Special' },
  a2:          { label: 'A2 Poster',   sub: '420 × 594 mm',  w: 420,   h: 594,   group: 'Special' }
};

/* Planner disc / ring-binder inserts — popular sizes people cannot get elsewhere. */
AP.PAPER.happyclassic = { label: 'Planner Classic', sub: '7 × 9.25 in',  w: 177.8, h: 234.95, group: 'Planner' };
AP.PAPER.a5binder     = { label: 'A5 Binder',       sub: '148 × 210 mm', w: 148,   h: 210,    group: 'Planner' };
AP.PAPER.personal     = { label: 'Personal',        sub: '95 × 171 mm',  w: 95,    h: 171,    group: 'Planner' };
AP.PAPER.pocket       = { label: 'Pocket',          sub: '81 × 120 mm',  w: 81,    h: 120,    group: 'Planner' };

/* Returns {w,h} in mm for a paper id + orientation. */
AP.pageSize = function (paperId, orientation) {
  var p = AP.PAPER[paperId] || AP.PAPER.letter;
  return orientation === 'landscape' ? { w: p.h, h: p.w } : { w: p.w, h: p.h };
};

AP.paperGroups = function () {
  var groups = {};
  Object.keys(AP.PAPER).forEach(function (id) {
    var g = AP.PAPER[id].group;
    (groups[g] = groups[g] || []).push(id);
  });
  return groups;
};
