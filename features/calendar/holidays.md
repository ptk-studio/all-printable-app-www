# Holiday coverage

`public/printables/calendar/holidays.js`

## Why rules, not tables

Sites that ship a JSON file of holiday dates are wrong the moment someone asks
for 2031. Every country here is expressed as a short list of rules, so any year
computes correctly:

- `fx(month, day)` — a fixed date.
- `nw(month, weekday, n)` — the nth weekday of a month; `-1` means the last.
- `ea(offset)` — an offset from Western (Gregorian) Easter.
- `oe(offset)` — an offset from Orthodox Easter (Julian computus, shifted).
- `rg(month, weekday, d1, d2)` — that weekday within a date window, for
  Nordic midsummer and All Saints' Day.
- `cu(fn)` — anything else, such as Victoria Day (Monday on or before 24 May)
  or Japan's equinoxes.

Easter uses the Anonymous Gregorian algorithm; Japan's equinoxes use Uchida's
formula (valid 1980–2099).

## Weekend substitution

Each country declares how a holiday landing on a weekend is handled:

| Mode | Behaviour | Used by |
|---|---|---|
| `us` | Saturday → previous Friday, Sunday → following Monday | US, Canada |
| `uk` | Weekend → next free weekday, cumulatively | UK, Ireland, Australia, NZ |
| `sun` | Sunday → Monday | South Africa |
| `jp` | Sunday → next free weekday, plus the 国民の休日 bridge rule for a weekday sandwiched between two holidays | Japan |
| `null` | No substitution | most of Europe |

Substitutes are labelled "(observed)" and are hidden unless the user asks for
them.

Verified against known dates: US Independence Day 2026 falls on a Saturday and
is observed Friday 3 July; UK Christmas and Boxing Day 2027 fall at the weekend
and produce substitutes on Monday 27 and Tuesday 28 December; Japan 2026 gets a
citizens' holiday on 22 September between Respect-for-the-Aged Day and the
autumnal equinox.

## Countries

Argentina, Australia, Austria, Belgium, Brazil, Canada, Czechia, Denmark,
Finland, France, Germany, Greece, India, Ireland, Italy, Japan, Mexico,
Netherlands, New Zealand, Norway, Poland, Portugal, Russia, South Africa,
South Korea, Spain, Sweden, Switzerland, United Kingdom, United States.

Regional caveats are shown in the sidebar as tooltips: Germany and Switzerland
list nationwide holidays only, the UK list is England & Wales, Australia omits
state-specific days, Spain omits autonomous-community days.

## What is deliberately not computed

Festivals fixed to lunar or lunisolar calendars — Diwali, Eid al-Fitr and
al-Adha, Seollal, Chuseok, Vesak, Hari Raya, most of the Hindu and Islamic
calendars — depend on observation or on ephemeris tables that would need
maintaining, and a wrong date on a printed wall calendar is worse than no date.
They are left to the events box, which handles exact dates well.

Chinese New Year is the one exception: it is offered as an optional layer from
a table covering 2024–2038, because it is unambiguous and very widely wanted.

## Optional layers

- **Observances** — Valentine's Day, Mother's and Father's Day (US dates),
  Halloween, Black Friday, Cyber Monday, Earth Day, April Fools', Christmas
  Eve, New Year's Eve and others.
- **Equinoxes and solstices** — Meeus's algorithm with the 24 periodic terms,
  accurate to well under a day.
