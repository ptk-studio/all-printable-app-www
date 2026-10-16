/* Landing-page copy, one entry per printable.

   Each page has to earn its place: near-identical templated pages are doorway
   pages and are actively penalised. So every entry below says something true
   and specific about THAT sheet — real spacings, real algorithms, real limits
   — rather than restating the tagline in longer form. Where an entry has
   nothing particular to say, it should not have a page.

   `search` is the phrase people actually type; it shapes the title and H1.

   `intro` does two jobs: it is the visible hero paragraph, where it should be
   as long as it earns, and it is the source of the meta, og: and twitter:
   description, which must fit DESC_MAX in tools/site.mjs. Those rules
   disagree, so an entry whose intro runs past the limit carries an explicit
   `desc` as well — written to be a complete sentence at that length, not the
   intro trimmed. Ten entries fit it already and deliberately have no `desc`;
   `intro` is the fallback. Do not shorten an intro to avoid writing a `desc`:
   that pays for the tag with the page. See issue #31.

   The limit was 200 until #53 and is now 160. Six entries that had fitted on
   `intro` alone needed a `desc` for the first time, and the ten that already
   had one were rewritten to the new length rather than cut to it — which is
   the rule above, applied a second time. The argument for moving the limit is
   in site.mjs: a sentence no search result ever shows the end of is not a
   complete sentence where it counts.

   `faq` is three or four questions per page, and they are not decoration. They
   are the long-tail half of this file — "is the graph paper true to scale", "which
   Avery number is 30 labels per sheet" — and since #53 they are also emitted as
   FAQPage structured data, so a wrong answer here is a wrong answer in a search
   result. Every answer below is checkable against the maker it describes;
   nothing in them was inferred from the name of the sheet.  */
module.exports = {

  calendar: {
    search: 'printable calendar',
    /* "Printable calendar", not "Printable calendar maker". The maker page's
       own H1 is "Calendar maker", and these were the last pair on the site
       close enough to read as the same page (#53). This one now says the head
       term it is actually trying to rank for, and the maker says it is the
       maker. */
    h1: 'Printable calendar',
    intro: 'Build a calendar for any month or year and print it at the exact size you chose. ' +
      'Seven layouts cover the wall, the desk, the planner insert and the year-at-a-glance ' +
      'sheet, and holidays are computed from each country’s rules rather than looked up in ' +
      'a table that stops at next year.',
    desc: 'Build a calendar for any month or year and print it at the exact size you chose. Seven ' +
      'layouts, and holidays computed from each country’s own rules.',
    points: [
      'Month, multi-month, year, year grid, agenda list, weekly planner and photo layouts',
      'Holidays for 42 countries, correct for any year — including Easter-linked dates, ' +
        '“observed” Monday substitutes and Japan’s bridge holidays',
      'Moon phases, ISO or US week numbers, day-of-year, equinoxes and solstices',
      'Your own one-off, annual and monthly repeating events'
    ],
    specs: [['Layouts', '7'], ['Paper sizes', '18'], ['Countries', '42'], ['Languages', '25']],
    faq: [
      ['Which years work?', 'Any of them. Nothing is looked up, so 2031 is as correct as 2026.'],
      ['Can I get Monday-first weeks?', 'Yes, and Saturday-first. You can also choose which days count as the weekend — Friday and Saturday works.'],
      ['Can I print a whole year on one sheet?', 'Yes. “Year on a page” puts all twelve months at a glance, and the year grid runs days down and months across. Multi-month does 2, 3, 4 or 6.'],
      ['Which paper sizes can it print on?', 'Eighteen, from Pocket and Personal planner inserts up to A2 and 24 × 36 in posters — each at its true size.']
    ]
  },

  'weekly-planner': {
    search: 'printable weekly planner',
    h1: 'Printable weekly planner',
    intro: 'A week to a page, either as open writing space or with hourly time slots. ' +
      'It is the calendar maker’s week layout, so it carries the same holiday data and the ' +
      'same true-to-size printing as everything else here.',
    desc: 'A week to a page, as open writing space or with hourly slots. The calendar maker’s ' +
      'week layout, so it prints true to the size you picked.',
    points: [
      'Days as rows, columns or a grid — whichever suits your paper',
      'Hourly slots over a range you set, or blank, ruled or dotted space',
      'An optional notes block as an eighth panel',
      'Prints on planner-insert sizes as well as Letter and A4'
    ],
    specs: [['Arrangements', '3'], ['Paper sizes', '18'], ['Hours', 'Any range']],
    faq: [
      ['Can I make a whole year of weeks?', 'Yes — set the number of weeks and it runs from your start date.'],
      ['Will it fit my planner?', 'Classic, A5, Personal and Pocket insert sizes are built in.'],
      ['Does the week show holidays?', 'Yes. This is the calendar maker’s week layout, so it carries the same holidays for 42 countries as the month and year layouts.'],
      ['Can the days run across instead of down?', 'Days can be rows, columns or a grid. Columns suit landscape paper; rows suit a narrow planner insert.']
    ]
  },

  'daily-planner': {
    search: 'printable daily planner',
    h1: 'Printable daily planner',
    intro: 'A time-blocked day beside the things you actually want to get done. ' +
      'The split between the schedule and the side column is yours to slide, so it works ' +
      'whether your day is mostly meetings or mostly tasks.',
    desc: 'A time-blocked day beside your priorities, to-dos and notes. Slide the split between ' +
      'schedule and side column to suit the day you are having.',
    points: [
      'Any hour range, in whole or half hours, on a 12- or 24-hour clock',
      'A priorities block, a to-do list and notes down the side',
      'Slide the schedule/side split from 35% to 75%',
      'Pocket size for a planner, or Letter for a desk'
    ],
    specs: [['Hours', 'Any range'], ['Half hours', 'Yes'], ['Paper sizes', '18']],
    faq: [
      ['Can I print a week of them?', 'Set the sheet count and you get that many identical day sheets.'],
      ['Is there an undated version?', 'Turn off “show the date beside the title” and the sheet is undated.'],
      ['Can I start the day at 6am?', 'Yes — any hour range, in whole or half hours, on a 12- or 24-hour clock.'],
      ['Can I make it mostly tasks rather than meetings?', 'Slide the schedule/side split down towards 35% and the priorities, to-dos and notes take most of the page.']
    ]
  },

  'meal-planner': {
    search: 'printable meal planner',
    h1: 'Printable meal planner',
    intro: 'A week of meals with a shopping list beside it. The meal slots are yours — ' +
      'add a snack row, drop breakfast, or plan only dinners — and the week grid takes ' +
      'the bulk of the sheet so there is room to actually write a recipe name.',
    desc: 'A week of meals with a shopping list beside it. The meal slots are yours — add a snack ' +
      'row, drop breakfast, plan only dinners.',
    points: [
      'Your own meal slots, not a fixed breakfast/lunch/dinner',
      'A shopping checklist in one to four columns',
      'Dates beside each day, or plain weekday names for an undated sheet',
      'Any week start — Monday, Sunday or Saturday'
    ],
    specs: [['Meal slots', 'Up to 6'], ['Shopping columns', '1–4'], ['Paper sizes', '18']],
    faq: [
      ['Can I plan more than a week?', 'Print several sheets; each one covers seven days.'],
      ['Does the shopping list fill itself?', 'No — it prints blank. Nothing you type is stored or processed anywhere.'],
      ['Can I plan dinners only?', 'Yes. The meal slots are yours to name, so a single row called Dinner is a valid sheet.'],
      ['Which day does the week start on?', 'Monday, Sunday or Saturday — whichever you set.']
    ]
  },

  'graph-paper': {
    search: 'printable graph paper',
    h1: 'Printable graph paper',
    intro: 'Squared paper at the spacing you ask for, drawn as vectors on a sheet that carries ' +
      'its exact media size. Most free graph paper prints at whatever scale the browser picks, ' +
      'so 5 mm squares arrive at 4.8 mm and the sheet is useless for anything measured.',
    desc: 'Squared paper at the spacing you ask for, drawn at true size rather than at whatever ' +
      'scale the browser picks. 5 mm squares measure 5 mm, not 4.8.',
    points: [
      'Any square size in millimetres or inches, including engineering 1/10 in',
      'A heavier line every 2 to 10 squares',
      'Line weight set in real millimetres — a 0.3 mm rule measures 0.3 mm',
      'Whole squares centred on the sheet, so both margins match'
    ],
    specs: [['Spacing', 'Any'], ['Units', 'mm or in'], ['Paper sizes', '18'], ['Verified', '±0.05%']],
    faq: [
      ['How do I know the scale is right?', 'It is measured, not assumed: a rendered 10 mm grid comes out at a mean pitch within 0.05% of true. Print at 100% scale with margins set to None.'],
      ['Can I get 1 cm squares?', 'Set the spacing to 10 mm. Any value from 0.05 upwards works.'],
      ['Is there quarter-inch graph paper?', 'Switch the units to inches and set the spacing to 0.25. Engineering 1/10 in is there too.'],
      ['Can I print graph paper larger than A4?', 'Up to A2 and 24 × 36 in, with the squares still measuring what you asked for.']
    ]
  },

  'dot-grid': {
    search: 'printable dot grid paper',
    h1: 'Printable dot grid paper',
    intro: 'Bullet-journal dots at true spacing, in the size your notebook actually is. ' +
      'The usual reason to print your own is that you want A5 or a planner insert rather ' +
      'than Letter, and that is exactly what most sites will not give you.',
    desc: 'Bullet-journal dots at true 5 mm spacing, in the size your notebook actually is — A5 ' +
      'and planner inserts, not only Letter.',
    points: [
      'True 5 mm spacing by default, or any value you like',
      'Adjustable dot size, and a larger dot every 4, 5 or 6',
      'A5, Pocket, Personal and Classic insert sizes built in',
      'Ink-saver mode for a lighter sheet'
    ],
    specs: [['Spacing', 'Any'], ['Dot size', '0.2–1.6 mm'], ['Paper sizes', '18']],
    faq: [
      ['Which spacing do bullet journals use?', 'Usually 5 mm. That is the default here.'],
      ['Can I print it on planner inserts?', 'Yes — Classic, A5, Personal and Pocket are all available.'],
      ['Can I make the dots fainter?', 'Turn on ink-saver mode for a lighter sheet, or take the dot size down as far as 0.2 mm.'],
      ['Can I get a larger dot every five?', 'Yes — a bigger dot every 4, 5 or 6 marks the grid without ruling a line across it.']
    ]
  },

  'lined-paper': {
    search: 'printable lined paper',
    h1: 'Printable lined paper',
    intro: 'Wide, college and narrow rule at their real spacings — 8.7 mm, 7.1 mm and ' +
      '6.4 mm — rather than an approximation that looks about right on screen.',
    points: [
      'The three US rulings, or any custom line spacing',
      'A margin line on the left or both sides, positioned where you want it',
      'An optional header band and name/date blanks',
      'Choose the line colour, or go hairline for ink saving'
    ],
    specs: [['Wide rule', '8.7 mm'], ['College rule', '7.1 mm'], ['Narrow rule', '6.4 mm']],
    faq: [
      ['What is college rule?', '7.1 mm between lines — narrower than wide rule, which is 8.7 mm.'],
      ['Can I have no margin line?', 'Yes. Left, both sides or none.'],
      ['Is there narrow rule?', 'Narrow rule is 6.4 mm and is one of the three US rulings built in. Any custom spacing works as well.'],
      ['Can I add name and date lines at the top?', 'Yes — an optional header band with name and date blanks prints above the first rule.']
    ]
  },

  isometric: {
    search: 'printable isometric paper',
    h1: 'Printable isometric paper',
    intro: 'A triangular lattice for drawing in three dimensions — lines at 30° and ' +
      '150° with optional verticals, at the spacing you choose.',
    points: [
      'Set the spacing in millimetres or inches',
      'Vertical lines on or off',
      'Line weight and colour to suit pencil or pen work',
      'Prints up to A2 and 24 × 36 in for larger drawings'
    ],
    specs: [['Angles', '30° / 150°'], ['Verticals', 'Optional'], ['Paper sizes', '18']],
    faq: [
      ['Is this the same as triangle paper?', 'Yes — isometric paper is the triangular grid used for 3D sketching.'],
      ['Can I turn the vertical lines off?', 'Yes. Verticals are optional, which leaves the plain 30° and 150° lattice.'],
      ['Can I print it large for a drawing?', 'Up to A2 and 24 × 36 in, at the spacing you set in millimetres or inches.']
    ]
  },

  'hex-paper': {
    search: 'printable hex grid paper',
    h1: 'Printable hexagon paper',
    intro: 'A hex grid for maps, wargames and organic chemistry, in either orientation and ' +
      'at whatever size the game asks for.',
    points: [
      'Pointy-top or flat-top hexagons',
      'Set the size in millimetres or inches',
      'Adjustable line weight so the grid sits under your drawing rather than fighting it',
      'Large paper sizes for battle maps'
    ],
    specs: [['Orientations', '2'], ['Size', 'Any'], ['Paper sizes', '18']],
    faq: [
      ['Which orientation do most games use?', 'Pointy-top is the more common for hex maps; flat-top is the default in some rulesets. Both are here.'],
      ['What hex size should I use?', 'Whatever the game asks for — set it in millimetres or inches and it prints at that size, not at whatever the browser picks.'],
      ['Can I print a large battle map?', 'Yes — up to A2 and 24 × 36 in, so a map need not be taped together from four sheets.']
    ]
  },

  'music-staff': {
    search: 'printable manuscript paper',
    h1: 'Printable manuscript paper',
    intro: 'Music staves, guitar tab, or the two alternating, with the line gap set in ' +
      'millimetres so it matches the nib or pencil you write with.',
    points: [
      'Five-line staves, six-line tab, or alternating systems',
      'Set the number of systems and the gap between staff lines',
      'Optional bar lines, two to five per system',
      'Prints on anything from A5 to 24 × 36 in'
    ],
    specs: [['Systems', '1–24'], ['Line gap', 'Any'], ['Tab', 'Yes']],
    faq: [
      ['Can I get staff and tab on the same page?', 'Yes — choose alternating and the systems interleave.'],
      ['What line gap should I use?', '2.5 mm suits most handwriting; go larger for children or a broad nib.'],
      ['How many staves fit on a page?', 'From one to 24 systems. Fewer systems leaves more room between them.'],
      ['Can I get bar lines already drawn?', 'Yes — two to five bars per system, or none at all.']
    ]
  },

  handwriting: {
    search: 'printable handwriting practice paper',
    h1: 'Printable handwriting practice paper',
    intro: 'Guide lines for learning to write, with a dashed or dotted midline and an optional ' +
      'descender guide. Type a name or a word and it prints as hollow outlines to trace, ' +
      'repeated along each line.',
    desc: 'Guide lines for learning to write, with a dashed or dotted midline and a descender ' +
      'guide. Type a word and it prints as outlines to trace.',
    points: [
      'Dashed, dotted or no midline',
      'A descender guide below the baseline, and optional slant guides',
      'Type any word and it prints as traceable outlines',
      'Set the row height to suit the age of the writer'
    ],
    specs: [['Midline', '3 styles'], ['Tracing', 'Any word'], ['Row height', 'Any']],
    faq: [
      ['Why does the tracing stop before the right edge?', 'It stops short deliberately rather than risk cutting a word in half, and leaves room to write the word again unaided.'],
      ['Can I print my child’s name to trace?', 'Type any word and it prints as hollow outlines, repeated along each line.'],
      ['Which guide lines does it draw?', 'A baseline and a midline — dashed, dotted or absent — with an optional descender guide below and slant guides if you want them.'],
      ['Can I set the line height for a younger child?', 'Yes. The row height is yours to set, so one sheet suits a five-year-old and another a ten-year-old.']
    ]
  },

  'habit-tracker': {
    search: 'printable habit tracker',
    h1: 'Printable habit tracker',
    intro: 'Your habits down the side, the days across the top, and a box at every crossing. ' +
      'Choose a month, a run of weeks, or a numbered streak for a 30- or 100-day challenge.',
    desc: 'Your habits down the side, days across the top, a box at every crossing. Pick a month, ' +
      'a run of weeks, or a numbered 100-day streak.',
    points: [
      'Month, weekly blocks, or a numbered run of boxes',
      'Circles, squares, rounded boxes, diamonds or stars to fill in',
      'An optional target column, weekend shading and note lines',
      'Up to 40 habits on one sheet'
    ],
    specs: [['Layouts', '3'], ['Box styles', '6'], ['Habits', 'Up to 40']],
    faq: [
      ['Can I do a 100-day challenge?', 'Yes — the challenge layout prints a numbered run of boxes, up to 200.'],
      ['Will the circles stay round on a narrow month grid?', 'Yes. They are sized from the shorter side of their cell, so 31 narrow columns do not stretch them into ellipses.'],
      ['How many habits fit on one sheet?', 'Up to 40, and the boxes grow as you use fewer.'],
      ['Can I shade the weekends?', 'Yes, and add a target column and note lines beside the grid.']
    ]
  },

  'chore-chart': {
    search: 'printable chore chart',
    h1: 'Printable chore chart',
    intro: 'Names down the side, days across the top, and a box to tick or sticker. ' +
      'Weekly blocks stack down the sheet, which is the shape that actually works on a ' +
      'fridge door.',
    desc: 'Names down the side, days across the top, a box to tick or sticker. Weekly blocks ' +
      'stack down the sheet — the shape that works on a fridge door.',
    points: [
      'Several weeks on one sheet, so it lasts a month',
      'Square, circle or star boxes — stars if stickers are involved',
      'Alternate-row shading so eyes track the right line',
      'An optional total or reward column'
    ],
    specs: [['Weeks per sheet', 'Up to 8'], ['People', 'Up to 40'], ['Box styles', '6']],
    faq: [
      ['Can I use it for one child?', 'Yes — put chores in the list instead of names.'],
      ['How many weeks fit on a sheet?', 'Up to eight, stacked down the page, so one print can last a month or two.'],
      ['Will stickers fit the boxes?', 'Choose star boxes and use fewer rows — the boxes scale with the sheet, so fewer rows means bigger squares.']
    ]
  },

  'reward-chart': {
    search: 'printable reward chart',
    h1: 'Printable reward chart',
    intro: 'A star grid with squares sized for the stickers that actually come in the packet. ' +
      'Names or goals down the side, weeks across, and a prize column at the end.',
    points: [
      'Star, circle or square boxes',
      'A prize or target column to write the reward in',
      'Several weeks per sheet',
      'Bold type so a small child can find their own row'
    ],
    specs: [['Weeks per sheet', 'Up to 8'], ['Box styles', '6'], ['Prize column', 'Yes']],
    faq: [
      ['How big are the boxes?', 'They scale with the sheet and the number of rows — fewer rows and larger paper give bigger squares.'],
      ['Is there somewhere to write the prize?', 'Yes — an optional prize or target column prints at the end of each row.'],
      ['Can one chart cover several children?', 'Put the names down the side, one row each, with the weeks running across.']
    ]
  },

  budget: {
    search: 'printable budget sheet',
    h1: 'Printable budget sheet',
    intro: 'Money in and out, grouped how you think about it, with a total row on each group. ' +
      'Type your groups and line items as one list and the sheet lays itself out.',
    points: [
      'Your own groups and items, typed as “Heading: item, item”',
      'Planned, actual and difference columns',
      'A total row with a heavier rule on each group',
      'Print twelve sheets and it steps forward a month at a time'
    ],
    specs: [['Groups', 'Any'], ['Columns', 'Up to 3 across'], ['Run', 'Up to 40 sheets']],
    faq: [
      ['Does it add anything up?', 'No — it is paper. The total row is there for you to fill in.'],
      ['Can I use my own currency?', 'Type any symbol and it appears in the column headings.'],
      ['Can I get a sheet for every month?', 'Print up to 40 sheets in one run and it steps the month forward one sheet at a time.'],
      ['How do I set up my own categories?', 'Type them as one list — “Heading: item, item” — and each heading becomes a group with its own total row.']
    ]
  },

  'packing-list': {
    search: 'printable packing list',
    h1: 'Printable packing list',
    intro: 'Checklists by category with blank lines to add to. Tell it how many nights you ' +
      'are away and each category gets a quantity hint — clothing counts as nights plus ' +
      'one, toiletries suggest travel sizes. A nudge, not a rule.',
    desc: 'Checklists by category with blank lines to add to. Say how many nights you are away ' +
      'and each category gets a quantity hint. A nudge, not a rule.',
    points: [
      'Your own categories, typed as one list',
      'Blank lines under each so you can add as you think of things',
      'Up to four categories across the sheet',
      'A5 for a weekend bag, Letter for a family holiday'
    ],
    specs: [['Categories', 'Any'], ['Across', '1–4'], ['Trip length', 'Any']],
    faq: [
      ['What does the quantity hint do?', 'It prints a small suggestion beside each category heading based on the nights you set. Nothing is enforced.'],
      ['Can I add things once it is printed?', 'That is what the blank lines under each category are for.'],
      ['Which paper size suits a weekend?', 'A5 for a weekend bag; Letter or A4 when you want four categories across for a family holiday.']
    ]
  },

  flashcards: {
    search: 'printable flashcards',
    h1: 'Printable flashcards',
    intro: 'Double-sided flashcards where the backs actually land on the right cards. ' +
      'That sounds obvious and it is the thing most free flashcard sheets get wrong: ' +
      'flipping a sheet on its long edge reverses the column order, so the back of the ' +
      'top-left card has to print top-right.',
    desc: 'Double-sided flashcards where the backs land on the right cards. A long-edge flip ' +
      'reverses the columns, so the top-left back prints top-right.',
    points: [
      'Duplex layout for long-edge or short-edge flip, checked geometrically',
      'Term and definition from a plain list — one line per card',
      'Ruled backs instead, if you would rather write them yourself',
      'Crop ticks or full cut lines, at any finished size'
    ],
    specs: [['Duplex', 'Both flips'], ['Sizes', 'Any'], ['Marks', 'Crop or cut']],
    faq: [
      ['Which flip setting do I need?', 'Match it to your printer’s duplex option. Long-edge is the usual default.'],
      ['How do I know the backs will line up?', 'The ordering is asserted rather than eyeballed: for every back slot, where it lands after the physical flip must equal the front position of the card it holds.'],
      ['Can I type the cards as a list?', 'Yes — one line per card, term and definition separated by a bar.'],
      ['What if I want to write the cards myself?', 'Choose ruled backs. The sizing and the cut marks are the same.']
    ]
  },

  'times-tables': {
    search: 'printable times tables',
    h1: 'Printable times tables and maths drills',
    intro: 'Drill sheets with a separate answer key, plus the classic multiplication grid ' +
      'blank or filled. Multiplication, addition, subtraction and division, alone or mixed, ' +
      'with the number ranges you choose.',
    desc: 'Drill sheets with a separate answer key, plus the classic multiplication grid blank or ' +
      'filled. Multiplication, addition, subtraction and division.',
    points: [
      'Division is built from the answer upwards, so it always divides exactly',
      'Subtraction stays in the whole numbers unless you ask for negatives',
      'Answers print as matching sheets at the end',
      'The same link always makes the same sheet, so a reprint still matches the key'
    ],
    specs: [['Operations', '4'], ['Problems', 'Up to 200'], ['Answer key', 'Yes'], ['Grid', 'Up to 20×20']],
    faq: [
      ['Will division give remainders?', 'Never. A divisor and a quotient are chosen and multiplied to get the dividend, so every division is exact.'],
      ['Can I get the blank grid to fill in?', 'Yes, and it prints a completed grid as the answer key.'],
      ['How many problems fit on a sheet?', 'Up to 200, with the answers printed as matching sheets at the end.'],
      ['Can I keep it to the numbers we have covered?', 'Set the ranges per operation. Subtraction stays in the whole numbers unless you ask for negatives.']
    ]
  },

  sudoku: {
    search: 'printable sudoku',
    h1: 'Printable sudoku',
    intro: 'Sudoku at five difficulties, every puzzle checked for a single solution before ' +
      'it is offered, with answer sheets at the end. The levels are genuinely different: ' +
      'about 43 clues at easy down to 25 at evil.',
    desc: 'Sudoku at five difficulties, every puzzle checked for a single solution, with answer ' +
      'sheets at the end. About 43 clues at easy, down to 25 at evil.',
    points: [
      'Five difficulties that actually differ — 43, 36, 30, 27 and 25 clues',
      'Every puzzle verified to have exactly one solution',
      'One, two or four to a sheet, up to 40 puzzles',
      'The link reproduces the same puzzles, so you can reprint them'
    ],
    specs: [['Difficulties', '5'], ['Clues', '43 → 25'], ['Per sheet', '1, 2 or 4']],
    faq: [
      ['Are the puzzles always solvable without guessing?', 'Every puzzle has exactly one solution, which is checked during generation. Harder grids may still need advanced technique.'],
      ['Can I print the same set again later?', 'Yes — the puzzles come from a seed in the link, so the same link deals the same puzzles.'],
      ['How many can I print at once?', 'Up to 40, at one, two or four to a sheet, with the answer sheets after them.'],
      ['Are the five difficulties actually different?', 'Yes — 43 clues at easy, then 36, 30, 27 and 25 at evil.']
    ]
  },

  'word-search': {
    search: 'printable word search',
    h1: 'Printable word search',
    intro: 'A word search from your own list, at any grid size, with an answer grid that ' +
      'highlights every word. Diagonals and backwards are optional, so an easy sheet for ' +
      'a small child is two directions on a 10 × 10 grid.',
    desc: 'A word search from your own list, at any grid size, with an answer grid that ' +
      'highlights every word. Diagonals and backwards are optional.',
    points: [
      'Your own words — spelling lists, names, topic vocabulary',
      'Diagonals and backwards on or off, for age-appropriate difficulty',
      'The word list prints beneath the grid',
      'It tells you how many words fitted, rather than dropping one silently'
    ],
    specs: [['Grid', '8–22'], ['Directions', 'Up to 8'], ['Answer key', 'Yes']],
    faq: [
      ['What if a word is too long for the grid?', 'It cannot be placed, and the sheet says how many of your words fitted so you can enlarge the grid.'],
      ['How do I make an easy one for a young child?', 'Turn diagonals and backwards off and use a 10 × 10 grid — that leaves two directions to search.'],
      ['Is there an answer sheet?', 'Yes. The answer grid highlights every word, and the word list prints beneath the puzzle.']
    ]
  },

  maze: {
    search: 'printable maze',
    h1: 'Printable mazes',
    intro: 'Mazes generated fresh at any size from four squares across to sixty, with the ' +
      'solution path as the answer key. A small grid suits a toddler; a large one with ' +
      'loops will hold up an adult.',
    desc: 'Mazes generated fresh from four squares across to sixty, with the solution path as the ' +
      'key. A small grid suits a toddler; a large one holds up an adult.',
    points: [
      'Any grid from 4 × 4 to 60 × 80',
      'A loops control that opens dead ends — which makes a maze harder, not easier',
      'Solution path printed as the key',
      'One or two to a sheet'
    ],
    specs: [['Grid', 'Up to 60×80'], ['Loops', 'Adjustable'], ['Solution', 'Yes']],
    faq: [
      ['Why do loops make it harder?', 'Dead ends are what let you rule a branch out. Remove them and there are more ways to go wrong.'],
      ['What size suits a young child?', 'Around 8 × 8. The grid runs from 4 × 4 up to 60 × 80, so the same maker covers a toddler and an adult.'],
      ['Does it print the solution?', 'Yes — the solution path prints as the answer key.']
    ]
  },

  bingo: {
    search: 'printable bingo cards',
    h1: 'Printable bingo cards',
    intro: 'Unique bingo cards in one pass, with numbers drawn per column the way B-I-N-G-O ' +
      'does — 1 to 15 under B, 61 to 75 under O — or your own words in the squares.',
    points: [
      'Numbers with proper per-column ranges, or your own word list',
      'Grids from 3 × 3 to 6 × 6, with an optional free centre',
      'Header letters you can change or remove',
      'Up to 40 cards, two or four to a sheet'
    ],
    specs: [['Grids', '3–6'], ['Cards', 'Up to 40'], ['Word mode', 'Yes']],
    faq: [
      ['Are the cards different from each other?', 'Yes — each is dealt separately from the sheet’s seed.'],
      ['Can I use words instead of numbers?', 'Yes. Give it at least as many words as there are squares.'],
      ['Does it use the proper B-I-N-G-O ranges?', 'Yes — 1 to 15 under B through to 61 to 75 under O. The header letters can be changed or removed.']
    ]
  },

  'gift-tags': {
    search: 'printable gift tags',
    h1: 'Printable gift tags',
    intro: 'Gift tags with cut marks, rounded corners and a punch-hole mark so the hole ' +
      'lands in the same place on every tag.',
    points: [
      'Crop ticks or full cut lines',
      'A marked punch hole at the height you choose',
      'Rounded corners, and a fold line for folded tags',
      'Repeat one design to fill the sheet, or give every tag its own text'
    ],
    specs: [['Marks', 'Crop or cut'], ['Corners', '0–10 mm'], ['Hole', 'Marked']],
    faq: [
      ['Can I print the same tag twelve times?', 'Turn on “repeat the list to fill every slot” and one entry tiles the sheet.'],
      ['Will the punch hole land in the same place on every tag?', 'Yes. It is marked at the height you set, identically on every tag on the sheet.'],
      ['Can I write a different name on each one?', 'Yes — give every tag its own text, or repeat one design to fill the sheet.']
    ]
  },

  bookmarks: {
    search: 'printable bookmarks',
    h1: 'Printable bookmarks',
    intro: 'Several bookmarks to a sheet with trim marks, at a finished size you set. ' +
      'Print on card, cut along the ticks, punch a hole for a tassel.',
    points: [
      'Any finished size — 2 × 6 in and 50 × 180 mm are ready to pick',
      'Crop ticks so the cuts line up',
      'An outline and a punch-hole mark if you want them',
      'Repeat one design across the sheet'
    ],
    specs: [['Per sheet', 'Fits automatically'], ['Marks', 'Crop or cut'], ['Sizes', 'Any']],
    faq: [
      ['How many fit on a page?', 'The sheet tells you as you change the size — three 2-inch bookmarks fit across Letter portrait.'],
      ['What size should a bookmark be?', '2 × 6 in and 50 × 180 mm are ready to pick, and any finished size works.'],
      ['Should I print on card?', 'Card holds up better. Cut along the crop ticks and punch a hole at the top for a tassel.']
    ]
  },

  'place-cards': {
    search: 'printable place cards',
    h1: 'Printable place cards',
    intro: 'Tent-fold place cards from a guest list. The top half prints upside down on ' +
      'purpose, so once the card is folded both sides read the right way up.',
    points: [
      'Paste a guest list, get a sheet of cards',
      'A dashed fold line across the middle',
      'Crop ticks for trimming',
      'Six themes, so it can match the rest of the table'
    ],
    specs: [['Fold', 'Tent'], ['Sizes', 'Any'], ['Marks', 'Crop or cut']],
    faq: [
      ['Why is the top half upside down?', 'That is what makes a tent card work — fold it and the inverted half becomes the far side, reading correctly to the person opposite.'],
      ['Can I make them from a guest list?', 'Paste the list and you get a sheet of cards, one name each.'],
      ['How do I know where to fold?', 'A dashed fold line prints across the middle, with crop ticks for the trim.']
    ]
  },

  labels: {
    search: 'printable address labels',
    h1: 'Printable address labels',
    intro: 'Address labels matched to real Avery die-cut stock — 5160, 5161, 5162, 5163, ' +
      '5164 and the A4 L7160, L7163 and L7651 — with a nudge control for when your ' +
      'printer disagrees about where the page starts.',
    desc: 'Address labels matched to real Avery die-cut stock — 5160, 5161, 5162, 5163, 5164 and ' +
      'three A4 sheets — with a nudge for printer drift.',
    points: [
      'Exact die-cut geometry: pick the stock and size, count and offsets are fixed',
      'A nudge in 0.25 mm steps that shifts the whole block',
      'One address repeated across the sheet, or a different one on every label',
      'Multi-line addresses from a single input line'
    ],
    specs: [['Avery stocks', '9'], ['Nudge', '0.25 mm'], ['Repeat', 'Yes']],
    faq: [
      ['My labels print slightly off. What do I do?', 'Print one sheet on plain paper, hold it against the label sheet, measure the drift and nudge the block by that much. Printers disagree about the page origin more than templates do.'],
      ['Which Avery number is 30 labels per sheet?', '5160, also sold as 8160 and 5960. It is in the list.'],
      ['Does it do A4 label sheets?', 'Yes — L7160, L7163 and L7651, alongside the five US Avery stocks.'],
      ['Can every label be different?', 'Yes. Type one address to repeat across the sheet, or a different one for every label.']
    ]
  }
};
