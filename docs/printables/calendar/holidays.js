/* ==========================================================================
   Holiday engine
   Rule-driven so a country is a short declarative list rather than a data
   dump. Everything is computed in the browser — no network, no yearly data
   refresh, works for any year.
   ========================================================================== */
window.AP = window.AP || {};
(function () {
  var D = AP.date;

  /* ---- rule primitives -------------------------------------------------- */

  function nth(y, m, wd, n) {
    if (n > 0) {
      var first = D(y, m, 1);
      var off = (wd - first.getDay() + 7) % 7;
      return D(y, m, 1 + off + (n - 1) * 7);
    }
    var last = D(y, m, AP.daysInMonth(y, m));
    return D(y, m, last.getDate() - ((last.getDay() - wd + 7) % 7));
  }

  /* First `wd` falling within [d1, d2] of month m. */
  function inRange(y, m, wd, d1, d2) {
    for (var d = d1; d <= d2; d++) if (D(y, m, d).getDay() === wd) return D(y, m, d);
    return null;
  }

  /* Last `wd` on or before m/d. */
  function onOrBefore(y, m, d, wd) {
    var dt = D(y, m, d);
    return AP.addDays(dt, -((dt.getDay() - wd + 7) % 7));
  }

  /* Western (Gregorian) Easter Sunday — Anonymous Gregorian algorithm. */
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100,
        d = Math.floor(b / 4), e = b % 4,
        f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
        h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4,
        l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451),
        month = Math.floor((h + l - 7 * m + 114) / 31),
        day = ((h + l - 7 * m + 114) % 31) + 1;
    return D(y, month - 1, day);
  }

  /* Orthodox Easter (Julian computus, converted to Gregorian). */
  function orthodoxEaster(y) {
    var a = y % 4, b = y % 7, c = y % 19,
        d = (19 * c + 15) % 30,
        e = (2 * a + 4 * b - d + 34) % 7,
        month = Math.floor((d + e + 114) / 31),
        day = ((d + e + 114) % 31) + 1;
    var julian = D(y, month - 1, day);
    return AP.addDays(julian, 13); /* Julian → Gregorian offset for 1900–2099 */
  }

  /* Japanese equinoxes — Uchida's formula, valid 1980–2099. */
  function jpEquinox(y, spring) {
    var base = spring ? 20.8431 : 23.2488;
    var day = Math.floor(base + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
    return D(y, spring ? 2 : 8, day);
  }

  AP.easter = easter;

  /* ---- rule builders ---------------------------------------------------- */
  function fx(m, d, name, flags) { return { fn: function (y) { return D(y, m - 1, d); }, name: name, f: flags }; }
  function nw(m, wd, n, name, flags) { return { fn: function (y) { return nth(y, m - 1, wd, n); }, name: name, f: flags }; }
  function ea(off, name, flags) { return { fn: function (y) { return AP.addDays(easter(y), off); }, name: name, f: flags }; }
  function oe(off, name, flags) { return { fn: function (y) { return AP.addDays(orthodoxEaster(y), off); }, name: name, f: flags }; }
  function rg(m, wd, d1, d2, name, flags) { return { fn: function (y) { return inRange(y, m - 1, wd, d1, d2); }, name: name, f: flags }; }
  function cu(fn, name, flags) { return { fn: fn, name: name, f: flags }; }

  var SUN = 0, MON = 1, TUE = 2, WED = 3, THU = 4, FRI = 5, SAT = 6;

  /* ---- country definitions ---------------------------------------------- */
  /* `sub` describes how a holiday landing on a weekend is substituted:
       'us'  Saturday → previous Friday, Sunday → following Monday
       'uk'  weekend → next free weekday (cumulative)
       'sun' Sunday only → following Monday
       'jp'  Sunday → next free weekday
       null  no substitution                                                 */

  var C = {
    US: { label: 'United States', sub: 'us', rules: [
      fx(1, 1, "New Year's Day"),
      nw(1, MON, 3, 'Martin Luther King Jr. Day'),
      nw(2, MON, 3, "Presidents' Day"),
      nw(5, MON, -1, 'Memorial Day'),
      fx(6, 19, 'Juneteenth'),
      fx(7, 4, 'Independence Day'),
      nw(9, MON, 1, 'Labor Day'),
      nw(10, MON, 2, 'Columbus Day'),
      fx(11, 11, 'Veterans Day'),
      nw(11, THU, 4, 'Thanksgiving'),
      fx(12, 25, 'Christmas Day')
    ]},

    CA: { label: 'Canada', sub: 'us', rules: [
      fx(1, 1, "New Year's Day"),
      ea(-2, 'Good Friday'),
      cu(function (y) { return onOrBefore(y, 4, 24, MON); }, 'Victoria Day'),
      fx(7, 1, 'Canada Day'),
      nw(9, MON, 1, 'Labour Day'),
      fx(9, 30, 'Truth and Reconciliation Day'),
      nw(10, MON, 2, 'Thanksgiving'),
      fx(11, 11, 'Remembrance Day'),
      fx(12, 25, 'Christmas Day'),
      fx(12, 26, 'Boxing Day')
    ]},

    GB: { label: 'United Kingdom', note: 'England & Wales bank holidays', sub: 'uk', rules: [
      fx(1, 1, "New Year's Day"),
      ea(-2, 'Good Friday'),
      ea(1, 'Easter Monday'),
      nw(5, MON, 1, 'Early May Bank Holiday'),
      nw(5, MON, -1, 'Spring Bank Holiday'),
      nw(8, MON, -1, 'Summer Bank Holiday'),
      fx(12, 25, 'Christmas Day'),
      fx(12, 26, 'Boxing Day')
    ]},

    IE: { label: 'Ireland', sub: 'uk', rules: [
      fx(1, 1, "New Year's Day"),
      cu(function (y) { var f = D(y, 1, 1); return f.getDay() === FRI ? f : nth(y, 1, MON, 1); }, "St Brigid's Day"),
      fx(3, 17, "St Patrick's Day"),
      ea(1, 'Easter Monday'),
      nw(5, MON, 1, 'May Bank Holiday'),
      nw(6, MON, 1, 'June Bank Holiday'),
      nw(8, MON, 1, 'August Bank Holiday'),
      nw(10, MON, -1, 'October Bank Holiday'),
      fx(12, 25, 'Christmas Day'),
      fx(12, 26, "St Stephen's Day")
    ]},

    AU: { label: 'Australia', note: 'National holidays; state days vary', sub: 'uk', rules: [
      fx(1, 1, "New Year's Day"),
      fx(1, 26, 'Australia Day'),
      ea(-2, 'Good Friday'),
      ea(1, 'Easter Monday'),
      fx(4, 25, 'Anzac Day'),
      nw(6, MON, 2, "King's Birthday"),
      fx(12, 25, 'Christmas Day'),
      fx(12, 26, 'Boxing Day')
    ]},

    NZ: { label: 'New Zealand', sub: 'uk', rules: [
      fx(1, 1, "New Year's Day"),
      fx(1, 2, 'Day after New Year'),
      fx(2, 6, 'Waitangi Day'),
      ea(-2, 'Good Friday'),
      ea(1, 'Easter Monday'),
      fx(4, 25, 'Anzac Day'),
      nw(6, MON, 1, "King's Birthday"),
      nw(10, MON, 4, 'Labour Day'),
      fx(12, 25, 'Christmas Day'),
      fx(12, 26, 'Boxing Day')
    ]},

    DE: { label: 'Germany', note: 'Nationwide holidays only', sub: null, rules: [
      fx(1, 1, 'Neujahr'),
      ea(-2, 'Karfreitag'),
      ea(1, 'Ostermontag'),
      fx(5, 1, 'Tag der Arbeit'),
      ea(39, 'Christi Himmelfahrt'),
      ea(50, 'Pfingstmontag'),
      fx(10, 3, 'Tag der Deutschen Einheit'),
      fx(12, 25, '1. Weihnachtstag'),
      fx(12, 26, '2. Weihnachtstag')
    ]},

    AT: { label: 'Austria', sub: null, rules: [
      fx(1, 1, 'Neujahr'), fx(1, 6, 'Heilige Drei Könige'),
      ea(1, 'Ostermontag'), fx(5, 1, 'Staatsfeiertag'),
      ea(39, 'Christi Himmelfahrt'), ea(50, 'Pfingstmontag'), ea(60, 'Fronleichnam'),
      fx(8, 15, 'Mariä Himmelfahrt'), fx(10, 26, 'Nationalfeiertag'),
      fx(11, 1, 'Allerheiligen'), fx(12, 8, 'Mariä Empfängnis'),
      fx(12, 25, 'Christtag'), fx(12, 26, 'Stefanitag')
    ]},

    CH: { label: 'Switzerland', note: 'Nationwide holidays only', sub: null, rules: [
      fx(1, 1, 'Neujahr'), ea(-2, 'Karfreitag'), ea(1, 'Ostermontag'),
      ea(39, 'Auffahrt'), ea(50, 'Pfingstmontag'),
      fx(8, 1, 'Bundesfeier'), fx(12, 25, 'Weihnachten')
    ]},

    FR: { label: 'France', sub: null, rules: [
      fx(1, 1, "Jour de l'An"),
      ea(1, 'Lundi de Pâques'),
      fx(5, 1, 'Fête du Travail'),
      fx(5, 8, 'Victoire 1945'),
      ea(39, 'Ascension'),
      ea(50, 'Lundi de Pentecôte'),
      fx(7, 14, 'Fête Nationale'),
      fx(8, 15, 'Assomption'),
      fx(11, 1, 'Toussaint'),
      fx(11, 11, 'Armistice 1918'),
      fx(12, 25, 'Noël')
    ]},

    BE: { label: 'Belgium', sub: null, rules: [
      fx(1, 1, 'Nieuwjaar'), ea(0, 'Pasen'), ea(1, 'Paasmaandag'),
      fx(5, 1, 'Dag van de Arbeid'), ea(39, 'O.L.H. Hemelvaart'), ea(50, 'Pinkstermaandag'),
      fx(7, 21, 'Nationale feestdag'), fx(8, 15, 'O.L.V. Hemelvaart'),
      fx(11, 1, 'Allerheiligen'), fx(11, 11, 'Wapenstilstand'), fx(12, 25, 'Kerstmis')
    ]},

    NL: { label: 'Netherlands', sub: null, rules: [
      fx(1, 1, 'Nieuwjaarsdag'),
      ea(0, 'Eerste Paasdag'), ea(1, 'Tweede Paasdag'),
      cu(function (y) { var k = D(y, 3, 27); return k.getDay() === SUN ? D(y, 3, 26) : k; }, 'Koningsdag'),
      fx(5, 5, 'Bevrijdingsdag'),
      ea(39, 'Hemelvaartsdag'), ea(49, 'Eerste Pinksterdag'), ea(50, 'Tweede Pinksterdag'),
      fx(12, 25, 'Eerste Kerstdag'), fx(12, 26, 'Tweede Kerstdag')
    ]},

    ES: { label: 'Spain', note: 'National holidays only', sub: null, rules: [
      fx(1, 1, 'Año Nuevo'), fx(1, 6, 'Reyes'),
      ea(-2, 'Viernes Santo'), fx(5, 1, 'Día del Trabajador'),
      fx(8, 15, 'Asunción'), fx(10, 12, 'Fiesta Nacional'),
      fx(11, 1, 'Todos los Santos'), fx(12, 6, 'Día de la Constitución'),
      fx(12, 8, 'Inmaculada Concepción'), fx(12, 25, 'Navidad')
    ]},

    IT: { label: 'Italy', sub: null, rules: [
      fx(1, 1, 'Capodanno'), fx(1, 6, 'Epifania'), ea(1, "Lunedì dell'Angelo"),
      fx(4, 25, 'Festa della Liberazione'), fx(5, 1, 'Festa del Lavoro'),
      fx(6, 2, 'Festa della Repubblica'), fx(8, 15, 'Ferragosto'),
      fx(11, 1, 'Ognissanti'), fx(12, 8, 'Immacolata'),
      fx(12, 25, 'Natale'), fx(12, 26, 'Santo Stefano')
    ]},

    PT: { label: 'Portugal', sub: null, rules: [
      fx(1, 1, 'Ano Novo'), ea(-2, 'Sexta-feira Santa'), ea(0, 'Páscoa'),
      fx(4, 25, 'Dia da Liberdade'), fx(5, 1, 'Dia do Trabalhador'), ea(60, 'Corpo de Deus'),
      fx(6, 10, 'Dia de Portugal'), fx(8, 15, 'Assunção'),
      fx(10, 5, 'Implantação da República'), fx(11, 1, 'Todos os Santos'),
      fx(12, 1, 'Restauração da Independência'), fx(12, 8, 'Imaculada Conceição'),
      fx(12, 25, 'Natal')
    ]},

    SE: { label: 'Sweden', sub: null, rules: [
      fx(1, 1, 'Nyårsdagen'), fx(1, 6, 'Trettondedag jul'),
      ea(-2, 'Långfredagen'), ea(0, 'Påskdagen'), ea(1, 'Annandag påsk'),
      fx(5, 1, 'Första maj'), ea(39, 'Kristi himmelsfärdsdag'),
      fx(6, 6, 'Sveriges nationaldag'),
      rg(6, SAT, 20, 26, 'Midsommardagen'),
      rg(11, SAT, 1, 6, 'Alla helgons dag'),
      fx(12, 25, 'Juldagen'), fx(12, 26, 'Annandag jul')
    ]},

    NO: { label: 'Norway', sub: null, rules: [
      fx(1, 1, 'Første nyttårsdag'), ea(-3, 'Skjærtorsdag'), ea(-2, 'Langfredag'),
      ea(0, 'Første påskedag'), ea(1, 'Andre påskedag'),
      fx(5, 1, 'Arbeidernes dag'), fx(5, 17, 'Grunnlovsdag'),
      ea(39, 'Kristi himmelfartsdag'), ea(49, 'Første pinsedag'), ea(50, 'Andre pinsedag'),
      fx(12, 25, 'Første juledag'), fx(12, 26, 'Andre juledag')
    ]},

    DK: { label: 'Denmark', sub: null, rules: [
      fx(1, 1, 'Nytårsdag'), ea(-3, 'Skærtorsdag'), ea(-2, 'Langfredag'),
      ea(0, 'Påskedag'), ea(1, '2. påskedag'),
      ea(39, 'Kristi himmelfartsdag'), ea(49, 'Pinsedag'), ea(50, '2. pinsedag'),
      fx(12, 25, 'Juledag'), fx(12, 26, '2. juledag')
    ]},

    FI: { label: 'Finland', sub: null, rules: [
      fx(1, 1, 'Uudenvuodenpäivä'), fx(1, 6, 'Loppiainen'),
      ea(-2, 'Pitkäperjantai'), ea(0, 'Pääsiäispäivä'), ea(1, '2. pääsiäispäivä'),
      fx(5, 1, 'Vappu'), ea(39, 'Helatorstai'),
      rg(6, FRI, 19, 25, 'Juhannusaatto'),
      rg(6, SAT, 20, 26, 'Juhannuspäivä'),
      rg(11, SAT, 1, 6, 'Pyhäinpäivä'),
      fx(12, 6, 'Itsenäisyyspäivä'),
      fx(12, 24, 'Jouluaatto'), fx(12, 25, 'Joulupäivä'), fx(12, 26, 'Tapaninpäivä')
    ]},

    PL: { label: 'Poland', sub: null, rules: [
      fx(1, 1, 'Nowy Rok'), fx(1, 6, 'Trzech Króli'),
      ea(0, 'Wielkanoc'), ea(1, 'Poniedziałek Wielkanocny'),
      fx(5, 1, 'Święto Pracy'), fx(5, 3, 'Święto Konstytucji'),
      ea(60, 'Boże Ciało'), fx(8, 15, 'Wniebowzięcie NMP'),
      fx(11, 1, 'Wszystkich Świętych'), fx(11, 11, 'Święto Niepodległości'),
      fx(12, 25, 'Boże Narodzenie'), fx(12, 26, 'Drugi dzień Świąt')
    ]},

    CZ: { label: 'Czechia', sub: null, rules: [
      fx(1, 1, 'Nový rok'), ea(-2, 'Velký pátek'), ea(1, 'Velikonoční pondělí'),
      fx(5, 1, 'Svátek práce'), fx(5, 8, 'Den vítězství'),
      fx(7, 5, 'Cyrila a Metoděje'), fx(7, 6, 'Jana Husa'),
      fx(9, 28, 'Den české státnosti'), fx(10, 28, 'Vznik Československa'),
      fx(11, 17, 'Den boje za svobodu'),
      fx(12, 24, 'Štědrý den'), fx(12, 25, '1. svátek vánoční'), fx(12, 26, '2. svátek vánoční')
    ]},

    BR: { label: 'Brazil', sub: null, rules: [
      fx(1, 1, 'Confraternização Universal'),
      ea(-48, 'Carnaval'), ea(-47, 'Carnaval'), ea(-2, 'Sexta-feira Santa'),
      fx(4, 21, 'Tiradentes'), fx(5, 1, 'Dia do Trabalhador'), ea(60, 'Corpus Christi'),
      fx(9, 7, 'Independência'), fx(10, 12, 'Nossa Senhora Aparecida'),
      fx(11, 2, 'Finados'), fx(11, 15, 'Proclamação da República'),
      fx(11, 20, 'Consciência Negra'), fx(12, 25, 'Natal')
    ]},

    MX: { label: 'Mexico', sub: null, rules: [
      fx(1, 1, 'Año Nuevo'), nw(2, MON, 1, 'Día de la Constitución'),
      nw(3, MON, 3, 'Natalicio de Benito Juárez'), fx(5, 1, 'Día del Trabajo'),
      fx(9, 16, 'Día de la Independencia'), nw(11, MON, 3, 'Día de la Revolución'),
      fx(12, 25, 'Navidad')
    ]},

    AR: { label: 'Argentina', sub: null, rules: [
      fx(1, 1, 'Año Nuevo'), ea(-48, 'Carnaval'), ea(-47, 'Carnaval'),
      fx(3, 24, 'Día de la Memoria'), fx(4, 2, 'Día del Veterano'),
      ea(-2, 'Viernes Santo'), fx(5, 1, 'Día del Trabajador'),
      fx(5, 25, 'Revolución de Mayo'), fx(6, 20, 'Paso a la Inmortalidad de Belgrano'),
      fx(7, 9, 'Día de la Independencia'), fx(12, 8, 'Inmaculada Concepción'),
      fx(12, 25, 'Navidad')
    ]},

    ZA: { label: 'South Africa', sub: 'sun', rules: [
      fx(1, 1, "New Year's Day"), fx(3, 21, 'Human Rights Day'),
      ea(-2, 'Good Friday'), ea(1, 'Family Day'),
      fx(4, 27, 'Freedom Day'), fx(5, 1, "Workers' Day"),
      fx(6, 16, 'Youth Day'), fx(8, 9, "National Women's Day"),
      fx(9, 24, 'Heritage Day'), fx(12, 16, 'Day of Reconciliation'),
      fx(12, 25, 'Christmas Day'), fx(12, 26, 'Day of Goodwill')
    ]},

    IN: { label: 'India', note: 'Gazetted national holidays; regional & lunar festivals vary', sub: null, rules: [
      fx(1, 26, 'Republic Day'), fx(8, 15, 'Independence Day'),
      fx(10, 2, 'Gandhi Jayanti'), fx(12, 25, 'Christmas')
    ]},

    JP: { label: 'Japan', sub: 'jp', rules: [
      fx(1, 1, '元日'), nw(1, MON, 2, '成人の日'),
      fx(2, 11, '建国記念の日'), fx(2, 23, '天皇誕生日'),
      cu(function (y) { return jpEquinox(y, true); }, '春分の日'),
      fx(4, 29, '昭和の日'), fx(5, 3, '憲法記念日'), fx(5, 4, 'みどりの日'), fx(5, 5, 'こどもの日'),
      nw(7, MON, 3, '海の日'), fx(8, 11, '山の日'),
      nw(9, MON, 3, '敬老の日'),
      cu(function (y) { return jpEquinox(y, false); }, '秋分の日'),
      nw(10, MON, 2, 'スポーツの日'),
      fx(11, 3, '文化の日'), fx(11, 23, '勤労感謝の日')
    ]},

    KR: { label: 'South Korea', note: 'Solar holidays only; lunar dates (Seollal, Chuseok) vary', sub: null, rules: [
      fx(1, 1, '신정'), fx(3, 1, '삼일절'), fx(5, 5, '어린이날'),
      fx(6, 6, '현충일'), fx(8, 15, '광복절'), fx(10, 3, '개천절'),
      fx(10, 9, '한글날'), fx(12, 25, '성탄절')
    ]},

    RU: { label: 'Russia', sub: null, rules: [
      fx(1, 1, 'Новый год'), fx(1, 7, 'Рождество Христово'),
      fx(2, 23, 'День защитника Отечества'), fx(3, 8, 'Международный женский день'),
      fx(5, 1, 'Праздник Весны и Труда'), fx(5, 9, 'День Победы'),
      fx(6, 12, 'День России'), fx(11, 4, 'День народного единства')
    ]},

    HU: { label: 'Hungary', sub: null, rules: [
      fx(1, 1, 'Újév'), fx(3, 15, 'Nemzeti ünnep'),
      ea(-2, 'Nagypéntek'), ea(0, 'Húsvét'), ea(1, 'Húsvéthétfő'),
      fx(5, 1, 'A munka ünnepe'), ea(49, 'Pünkösd'), ea(50, 'Pünkösdhétfő'),
      fx(8, 20, 'Az államalapítás ünnepe'), fx(10, 23, 'Nemzeti ünnep'),
      fx(11, 1, 'Mindenszentek'), fx(12, 25, 'Karácsony'), fx(12, 26, 'Karácsony másnapja')
    ]},

    SK: { label: 'Slovakia', sub: null, rules: [
      fx(1, 1, 'Deň vzniku SR'), fx(1, 6, 'Zjavenie Pána'),
      ea(-2, 'Veľký piatok'), ea(1, 'Veľkonočný pondelok'),
      fx(5, 1, 'Sviatok práce'), fx(5, 8, 'Deň víťazstva nad fašizmom'),
      fx(7, 5, 'Sv. Cyrila a Metoda'), fx(8, 29, 'Výročie SNP'),
      fx(9, 1, 'Deň Ústavy SR'), fx(9, 15, 'Sedembolestná Panna Mária'),
      fx(11, 1, 'Sviatok všetkých svätých'), fx(11, 17, 'Deň boja za slobodu'),
      fx(12, 24, 'Štedrý deň'), fx(12, 25, 'Prvý sviatok vianočný'),
      fx(12, 26, 'Druhý sviatok vianočný')
    ]},

    SI: { label: 'Slovenia', sub: null, rules: [
      fx(1, 1, 'Novo leto'), fx(1, 2, 'Novo leto'), fx(2, 8, 'Prešernov dan'),
      ea(0, 'Velika noč'), ea(1, 'Velikonočni ponedeljek'),
      fx(4, 27, 'Dan upora proti okupatorju'), fx(5, 1, 'Praznik dela'),
      fx(5, 2, 'Praznik dela'), ea(49, 'Binkošti'),
      fx(6, 25, 'Dan državnosti'), fx(8, 15, 'Marijino vnebovzetje'),
      fx(10, 31, 'Dan reformacije'), fx(11, 1, 'Dan spomina na mrtve'),
      fx(12, 25, 'Božič'), fx(12, 26, 'Dan samostojnosti')
    ]},

    HR: { label: 'Croatia', sub: null, rules: [
      fx(1, 1, 'Nova godina'), fx(1, 6, 'Bogojavljenje'),
      ea(0, 'Uskrs'), ea(1, 'Uskrsni ponedjeljak'),
      fx(5, 1, 'Praznik rada'), ea(60, 'Tijelovo'),
      fx(5, 30, 'Dan državnosti'), fx(6, 22, 'Dan antifašističke borbe'),
      fx(8, 5, 'Dan pobjede'), fx(8, 15, 'Velika Gospa'),
      fx(11, 1, 'Svi sveti'), fx(11, 18, 'Dan sjećanja'),
      fx(12, 25, 'Božić'), fx(12, 26, 'Sveti Stjepan')
    ]},

    RO: { label: 'Romania', note: 'Orthodox Easter dates', sub: null, rules: [
      fx(1, 1, 'Anul Nou'), fx(1, 2, 'Anul Nou'), fx(1, 24, 'Unirea Principatelor'),
      oe(-2, 'Vinerea Mare'), oe(0, 'Paștele'), oe(1, 'Paștele'),
      fx(5, 1, 'Ziua Muncii'), fx(6, 1, 'Ziua Copilului'),
      oe(49, 'Rusaliile'), oe(50, 'Rusaliile'),
      fx(8, 15, 'Adormirea Maicii Domnului'), fx(11, 30, 'Sfântul Andrei'),
      fx(12, 1, 'Ziua Națională'), fx(12, 25, 'Crăciunul'), fx(12, 26, 'Crăciunul')
    ]},

    BG: { label: 'Bulgaria', note: 'Orthodox Easter dates', sub: null, rules: [
      fx(1, 1, 'Нова година'), fx(3, 3, 'Ден на Освобождението'),
      oe(-2, 'Разпети петък'), oe(0, 'Великден'), oe(1, 'Великден'),
      fx(5, 1, 'Ден на труда'), fx(5, 6, 'Гергьовден'),
      fx(5, 24, 'Ден на българската просвета'), fx(9, 6, 'Ден на Съединението'),
      fx(9, 22, 'Ден на Независимостта'),
      fx(12, 24, 'Бъдни вечер'), fx(12, 25, 'Коледа'), fx(12, 26, 'Коледа')
    ]},

    LU: { label: 'Luxembourg', sub: null, rules: [
      fx(1, 1, 'Neijoerschdag'), ea(1, 'Ouschterméindeg'),
      fx(5, 1, 'Dag vun der Aarbecht'), fx(5, 9, 'Europadag'),
      ea(39, 'Christi Himmelfaart'), ea(50, 'Péngschtméindeg'),
      fx(6, 23, 'Nationalfeierdag'), fx(8, 15, 'Mariä Himmelfaart'),
      fx(11, 1, 'Allerhellegen'), fx(12, 25, 'Chrëschtdag'), fx(12, 26, 'Stiefesdag')
    ]},

    EE: { label: 'Estonia', sub: null, rules: [
      fx(1, 1, 'Uusaasta'), fx(2, 24, 'Iseseisvuspäev'),
      ea(-2, 'Suur reede'), ea(0, 'Ülestõusmispühade 1. püha'),
      fx(5, 1, 'Kevadpüha'), ea(49, 'Nelipühade 1. püha'),
      fx(6, 23, 'Võidupüha'), fx(6, 24, 'Jaanipäev'),
      fx(8, 20, 'Taasiseseisvumispäev'),
      fx(12, 24, 'Jõululaupäev'), fx(12, 25, 'Esimene jõulupüha'),
      fx(12, 26, 'Teine jõulupüha')
    ]},

    LV: { label: 'Latvia', sub: null, rules: [
      fx(1, 1, 'Jaunais gads'), ea(-2, 'Lielā Piektdiena'),
      ea(0, 'Lieldienas'), ea(1, 'Otrās Lieldienas'),
      fx(5, 1, 'Darba svētki'), fx(5, 4, 'Neatkarības deklarācija'),
      fx(6, 23, 'Līgo diena'), fx(6, 24, 'Jāņi'),
      fx(11, 18, 'Proklamēšanas diena'),
      fx(12, 24, 'Ziemassvētku vakars'), fx(12, 25, 'Ziemassvētki'),
      fx(12, 26, 'Otrie Ziemassvētki'), fx(12, 31, 'Vecgada vakars')
    ]},

    LT: { label: 'Lithuania', sub: null, rules: [
      fx(1, 1, 'Naujieji metai'), fx(2, 16, 'Valstybės atkūrimo diena'),
      fx(3, 11, 'Nepriklausomybės atkūrimo diena'),
      ea(0, 'Velykos'), ea(1, 'Antroji Velykų diena'),
      fx(5, 1, 'Darbo diena'), fx(6, 24, 'Joninės'),
      fx(7, 6, 'Valstybės diena'), fx(8, 15, 'Žolinė'),
      fx(11, 1, 'Visų šventųjų diena'), fx(11, 2, 'Vėlinės'),
      fx(12, 24, 'Kūčios'), fx(12, 25, 'Kalėdos'), fx(12, 26, 'Kalėdos')
    ]},

    IS: { label: 'Iceland', sub: null, rules: [
      fx(1, 1, 'Nýársdagur'), ea(-3, 'Skírdagur'), ea(-2, 'Föstudagurinn langi'),
      ea(0, 'Páskadagur'), ea(1, 'Annar í páskum'),
      rg(4, THU, 19, 25, 'Sumardagurinn fyrsti'),
      fx(5, 1, 'Verkalýðsdagurinn'), ea(39, 'Uppstigningardagur'),
      ea(49, 'Hvítasunnudagur'), ea(50, 'Annar í hvítasunnu'),
      fx(6, 17, 'Þjóðhátíðardagurinn'),
      nw(8, MON, 1, 'Frídagur verslunarmanna'),
      fx(12, 25, 'Jóladagur'), fx(12, 26, 'Annar í jólum')
    ]},

    CL: { label: 'Chile', sub: null, rules: [
      fx(1, 1, 'Año Nuevo'), ea(-2, 'Viernes Santo'), ea(-1, 'Sábado Santo'),
      fx(5, 1, 'Día del Trabajo'), fx(5, 21, 'Día de las Glorias Navales'),
      fx(6, 29, 'San Pedro y San Pablo'), fx(7, 16, 'Virgen del Carmen'),
      fx(8, 15, 'Asunción de la Virgen'),
      fx(9, 18, 'Independencia Nacional'), fx(9, 19, 'Día de las Glorias del Ejército'),
      fx(10, 12, 'Encuentro de Dos Mundos'), fx(10, 31, 'Iglesias Evangélicas'),
      fx(11, 1, 'Día de Todos los Santos'), fx(12, 8, 'Inmaculada Concepción'),
      fx(12, 25, 'Navidad')
    ]},

    GR: { label: 'Greece', sub: null, rules: [
      fx(1, 1, 'Πρωτοχρονιά'), fx(1, 6, 'Θεοφάνεια'),
      oe(-48, 'Καθαρά Δευτέρα'), fx(3, 25, 'Ευαγγελισμός'),
      oe(-2, 'Μεγάλη Παρασκευή'), oe(1, 'Δευτέρα του Πάσχα'),
      fx(5, 1, 'Εργατική Πρωτομαγιά'), oe(50, 'Αγίου Πνεύματος'),
      fx(8, 15, 'Κοίμηση της Θεοτόκου'), fx(10, 28, 'Επέτειος του Όχι'),
      fx(12, 25, 'Χριστούγεννα'), fx(12, 26, 'Σύναξη Θεοτόκου')
    ]}
  };

  /* ---- optional observance layers --------------------------------------- */
  var OBSERVANCES = [
    fx(2, 2, 'Groundhog Day'),
    fx(2, 14, "Valentine's Day"),
    fx(3, 8, "International Women's Day"),
    fx(3, 17, "St Patrick's Day"),
    fx(4, 1, "April Fools' Day"),
    fx(4, 22, 'Earth Day'),
    ea(0, 'Easter Sunday'),
    fx(5, 4, 'Star Wars Day'),
    fx(5, 5, 'Cinco de Mayo'),
    nw(5, SUN, 2, "Mother's Day"),
    nw(6, SUN, 3, "Father's Day"),
    fx(10, 31, 'Halloween'),
    cu(function (y) { return AP.addDays(nth(y, 10, THU, 4), 1); }, 'Black Friday'),
    cu(function (y) { return AP.addDays(nth(y, 10, THU, 4), 4); }, 'Cyber Monday'),
    fx(12, 24, 'Christmas Eve'),
    fx(12, 31, "New Year's Eve")
  ];

  /* Chinese New Year — astronomically determined, so a lookup table. */
  var CNY = {
    2024: [2, 10], 2025: [1, 29], 2026: [2, 17], 2027: [2, 6],  2028: [1, 26],
    2029: [2, 13], 2030: [2, 3],  2031: [1, 23], 2032: [2, 11], 2033: [1, 31],
    2034: [2, 19], 2035: [2, 8],  2036: [1, 28], 2037: [2, 15], 2038: [2, 4]
  };

  /* ---- substitution ------------------------------------------------------ */
  function applySub(mode, list) {
    if (!mode) return list;
    var taken = {};
    list.forEach(function (h) { taken[AP.key(h.date)] = true; });
    var extra = [];

    list.forEach(function (h) {
      var wd = h.date.getDay(), moved = null;
      if (mode === 'us') {
        if (wd === SAT) moved = AP.addDays(h.date, -1);
        else if (wd === SUN) moved = AP.addDays(h.date, 1);
      } else if (mode === 'uk') {
        if (wd === SAT || wd === SUN) {
          moved = AP.addDays(h.date, wd === SAT ? 2 : 1);
          while (taken[AP.key(moved)]) moved = AP.addDays(moved, 1);
        }
      } else if (mode === 'sun') {
        if (wd === SUN) moved = AP.addDays(h.date, 1);
      } else if (mode === 'jp') {
        if (wd === SUN) {
          moved = AP.addDays(h.date, 1);
          while (taken[AP.key(moved)]) moved = AP.addDays(moved, 1);
        }
      }
      if (moved) {
        taken[AP.key(moved)] = true;
        extra.push({ date: moved, name: h.name + ' (observed)', type: 'public', observed: true });
      }
    });

    /* Japan: an ordinary weekday sandwiched between two holidays is itself
       a holiday (国民の休日). */
    if (mode === 'jp') {
      list.concat(extra).forEach(function (h) {
        var gap = AP.addDays(h.date, 1);
        var next = AP.addDays(h.date, 2);
        if (taken[AP.key(gap)] || !taken[AP.key(next)]) return;
        if (gap.getDay() === SUN) return;
        taken[AP.key(gap)] = true;
        extra.push({ date: gap, name: '国民の休日', type: 'public', observed: true });
      });
    }
    return list.concat(extra);
  }

  /* ---- public API -------------------------------------------------------- */
  AP.holidays = {
    countries: C,

    countryList: function () {
      return Object.keys(C).sort(function (a, b) {
        return C[a].label.localeCompare(C[b].label);
      }).map(function (id) { return { id: id, label: C[id].label, note: C[id].note }; });
    },

    /* Returns { 'YYYY-MM-DD': [ {name, type, observed} ] } for one year. */
    forYear: function (year, opts) {
      opts = opts || {};
      var out = {};
      function push(dt, name, type, observed) {
        if (!dt || isNaN(dt)) return;
        var k = AP.key(dt);
        (out[k] = out[k] || []).push({ name: name, type: type, observed: !!observed });
      }

      (opts.countries || []).forEach(function (id) {
        var def = C[id];
        if (!def) return;
        var list = [];
        def.rules.forEach(function (r) {
          var dt = r.fn(year);
          if (dt) list.push({ date: dt, name: r.name });
        });
        if (opts.substitute !== false) list = applySub(def.sub, list);
        list.forEach(function (h) { push(h.date, h.name, 'public', h.observed); });
      });

      if (opts.observances) {
        OBSERVANCES.forEach(function (r) { push(r.fn(year), r.name, 'observance'); });
      }

      if (opts.lunarNewYear && CNY[year]) {
        push(D(year, CNY[year][0] - 1, CNY[year][1]), 'Chinese New Year', 'observance');
      }

      if (opts.seasons && AP.seasons) {
        AP.seasons(year).forEach(function (s) { push(s.date, s.name, 'season'); });
      }

      return out;
    },

    /* Merged map covering every year touched by a page range. */
    forYears: function (years, opts) {
      var merged = {};
      years.forEach(function (y) {
        var m = AP.holidays.forYear(y, opts);
        Object.keys(m).forEach(function (k) {
          merged[k] = (merged[k] || []).concat(m[k]);
        });
      });
      return merged;
    }
  };
})();
