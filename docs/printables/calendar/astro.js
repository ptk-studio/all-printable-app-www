/* ==========================================================================
   Astronomy: moon phases and equinox/solstice dates.
   Both use Jean Meeus's algorithms (Astronomical Algorithms, 2nd ed.).
   Dates are computed in UTC; that is accurate to the day almost everywhere.
   ========================================================================== */
window.AP = window.AP || {};
(function () {
  var RAD = Math.PI / 180;
  function sin(d) { return Math.sin(d * RAD); }
  function cos(d) { return Math.cos(d * RAD); }

  /* Julian Day → { y, m, d } (UTC, Gregorian). */
  function jdToDate(jd) {
    var z = Math.floor(jd + 0.5), f = jd + 0.5 - z;
    var a = z;
    if (z >= 2299161) {
      var alpha = Math.floor((z - 1867216.25) / 36524.25);
      a = z + 1 + alpha - Math.floor(alpha / 4);
    }
    var b = a + 1524,
        c = Math.floor((b - 122.1) / 365.25),
        d = Math.floor(365.25 * c),
        e = Math.floor((b - d) / 30.6001);
    var day = b - d - Math.floor(30.6001 * e) + f;
    var month = e < 14 ? e - 1 : e - 13;
    var year = month > 2 ? c - 4716 : c - 4715;
    return AP.date(year, month - 1, Math.floor(day));
  }

  /* ---- Equinoxes and solstices ------------------------------------------ */
  var PERIODIC = [
    [485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186],
    [182, 27.85, 445267.112], [156, 73.14, 45036.886], [136, 171.52, 22518.443],
    [77, 222.54, 65928.934], [74, 296.72, 3034.906], [70, 243.58, 9037.513],
    [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.226],
    [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417],
    [18, 155.12, 67555.328], [17, 288.79, 4562.452], [16, 198.04, 62894.029],
    [14, 199.76, 31436.921], [12, 95.39, 14577.848], [12, 287.11, 31931.756],
    [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074]
  ];

  var SEASON_COEF = [
    /* March equinox */    [2451623.80984, 365242.37404, 0.05169, -0.00411, -0.00057],
    /* June solstice */    [2451716.56767, 365241.62603, 0.00325, 0.00888, -0.00030],
    /* September equinox */[2451810.21715, 365242.01767, -0.11575, 0.00337, 0.00078],
    /* December solstice */[2451900.05952, 365242.74049, -0.06223, -0.00823, 0.00032]
  ];

  function seasonJDE(year, k) {
    var Y = (year - 2000) / 1000, c = SEASON_COEF[k];
    var jde0 = c[0] + c[1] * Y + c[2] * Y * Y + c[3] * Y * Y * Y + c[4] * Y * Y * Y * Y;
    var T = (jde0 - 2451545.0) / 36525;
    var W = 35999.373 * T - 2.47;
    var dl = 1 + 0.0334 * cos(W) + 0.0007 * cos(2 * W);
    var S = 0;
    for (var i = 0; i < PERIODIC.length; i++) {
      S += PERIODIC[i][0] * cos(PERIODIC[i][1] + PERIODIC[i][2] * T);
    }
    return jde0 + (0.00001 * S) / dl;
  }

  var SEASON_NAMES = [
    ['March Equinox', 'Spring begins'],
    ['June Solstice', 'Summer begins'],
    ['September Equinox', 'Autumn begins'],
    ['December Solstice', 'Winter begins']
  ];

  AP.seasons = function (year) {
    var out = [];
    for (var k = 0; k < 4; k++) {
      out.push({ date: jdToDate(seasonJDE(year, k)), name: SEASON_NAMES[k][0], kind: k });
    }
    return out;
  };

  /* ---- Moon phases ------------------------------------------------------- */
  /* phase: 0 new, 1 first quarter, 2 full, 3 last quarter */
  function phaseJDE(k, phase) {
    k = k + phase * 0.25;
    var T = k / 1236.85;
    var jde = 2451550.09766 + 29.530588861 * k
            + 0.00015437 * T * T - 0.000000150 * T * T * T + 0.00000000073 * Math.pow(T, 4);
    var E  = 1 - 0.002516 * T - 0.0000074 * T * T;
    var M  = 2.5534 + 29.10535670 * k - 0.0000014 * T * T - 0.00000011 * T * T * T;
    var Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T * T
           + 0.00001238 * T * T * T - 0.000000058 * Math.pow(T, 4);
    var F  = 160.7108 + 390.67050284 * k - 0.0016118 * T * T
           - 0.00000227 * T * T * T + 0.000000011 * Math.pow(T, 4);
    var O  = 124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T * T * T;
    var c = 0;

    if (phase === 0) {
      c = -0.40720 * sin(Mp) + 0.17241 * E * sin(M) + 0.01608 * sin(2 * Mp)
        + 0.01039 * sin(2 * F) + 0.00739 * E * sin(Mp - M) - 0.00514 * E * sin(Mp + M)
        + 0.00208 * E * E * sin(2 * M) - 0.00111 * sin(Mp - 2 * F) - 0.00057 * sin(Mp + 2 * F)
        + 0.00056 * E * sin(2 * Mp + M) - 0.00042 * sin(3 * Mp) + 0.00042 * E * sin(M + 2 * F)
        + 0.00038 * E * sin(M - 2 * F) - 0.00024 * E * sin(2 * Mp - M) - 0.00017 * sin(O)
        - 0.00007 * sin(Mp + 2 * M);
    } else if (phase === 2) {
      c = -0.40614 * sin(Mp) + 0.17302 * E * sin(M) + 0.01614 * sin(2 * Mp)
        + 0.01043 * sin(2 * F) + 0.00734 * E * sin(Mp - M) - 0.00515 * E * sin(Mp + M)
        + 0.00209 * E * E * sin(2 * M) - 0.00111 * sin(Mp - 2 * F) - 0.00057 * sin(Mp + 2 * F)
        + 0.00056 * E * sin(2 * Mp + M) - 0.00042 * sin(3 * Mp) + 0.00042 * E * sin(M + 2 * F)
        + 0.00038 * E * sin(M - 2 * F) - 0.00024 * E * sin(2 * Mp - M) - 0.00017 * sin(O)
        - 0.00007 * sin(Mp + 2 * M);
    } else {
      c = -0.62801 * sin(Mp) + 0.17172 * E * sin(M) - 0.01183 * E * sin(Mp + M)
        + 0.00862 * sin(2 * Mp) + 0.00804 * sin(2 * F) + 0.00454 * E * sin(Mp - M)
        + 0.00204 * E * E * sin(2 * M) - 0.00180 * sin(Mp - 2 * F) - 0.00070 * sin(Mp + 2 * F)
        - 0.00040 * sin(3 * Mp) - 0.00034 * E * sin(2 * Mp - M) + 0.00032 * E * sin(M + 2 * F)
        + 0.00032 * E * sin(M - 2 * F) - 0.00028 * E * E * sin(Mp + 2 * M)
        + 0.00027 * E * sin(2 * Mp + M) - 0.00017 * sin(O);
      var W = 0.00306 - 0.00038 * E * cos(M) + 0.00026 * cos(Mp)
            - 0.00002 * cos(Mp - M) + 0.00002 * cos(Mp + M) + 0.00002 * cos(2 * F);
      c += (phase === 1 ? W : -W);
    }
    return jde + c;
  }

  /* All four principal phases falling inside `year`, keyed by YYYY-MM-DD. */
  AP.moonPhases = function (year) {
    var out = {};
    var kStart = Math.floor((year - 2000) * 12.3685) - 2;
    var kEnd = kStart + 16;
    for (var k = kStart; k <= kEnd; k++) {
      for (var p = 0; p < 4; p++) {
        var dt = jdToDate(phaseJDE(k, p));
        if (dt.getFullYear() !== year) continue;
        out[AP.key(dt)] = p;
      }
    }
    return out;
  };

  AP.moonPhasesForYears = function (years) {
    var merged = {};
    years.forEach(function (y) { Object.assign(merged, AP.moonPhases(y)); });
    return merged;
  };

  /* Small inline SVG glyph for a principal phase. */
  AP.moonGlyph = function (phase, size) {
    var s = size || 10, r = s / 2;
    var body;
    if (phase === 0) body = '<circle cx="' + r + '" cy="' + r + '" r="' + (r - .6) + '" fill="none" stroke="currentColor" stroke-width="1"/>';
    else if (phase === 2) body = '<circle cx="' + r + '" cy="' + r + '" r="' + (r - .6) + '" fill="currentColor"/>';
    else {
      var right = phase === 1;
      body = '<circle cx="' + r + '" cy="' + r + '" r="' + (r - .6) + '" fill="none" stroke="currentColor" stroke-width="1"/>' +
        '<path d="M' + r + ' ' + 0.6 + ' A ' + (r - .6) + ' ' + (r - .6) + ' 0 0 ' + (right ? 1 : 0) + ' ' + r + ' ' + (s - 0.6) + ' Z" fill="currentColor"/>';
    }
    return '<svg class="moon" width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + ' ' + s + '" xmlns="http://www.w3.org/2000/svg">' + body + '</svg>';
  };
})();
