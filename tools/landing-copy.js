/* Landing-page copy, one entry per printable.

   Each page has to earn its place: near-identical templated pages are doorway
   pages and are actively penalised. So every entry below says something true
   and specific about THAT sheet — real spacings, real algorithms, real limits
   — rather than restating the tagline in longer form. Where an entry has
   nothing particular to say, it should not have a page.

   `search` is the phrase people actually type; it shapes the title and H1.

   `intro` does two jobs: it is the visible hero paragraph, where it should be
   as long as it earns, and it is the source of the meta, og: and twitter:
   description, which must fit 200 characters. Those rules disagree, so an
   entry whose intro runs past 200 carries an explicit `desc` as well —
   written to be a complete sentence at that length, not the intro trimmed.
   Sixteen entries are 199 or under and deliberately have no `desc`; `intro`
   is the fallback. Do not shorten an intro to avoid writing a `desc`: that
   pays for the tag with the page. See issue #31.  */
module.exports = {

  calendar: {
    search: 'printable calendar',
    h1: 'Printable calendar maker',
    intro: 'Build a calendar for any month or year and print it at the exact size you chose. ' +
      'Seven layouts cover the wall, the desk, the planner insert and the year-at-a-glance ' +
      'sheet, and holidays are computed from each country’s rules rather than looked up in ' +
      'a table that stops at next year.',
    desc: 'Build a calendar for any month or year and print it at the exact size you chose. ' +
      'Seven layouts, from the wall to a planner insert, and holidays computed from each ' +
      'country’s own rules.',
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
      ['Can I get Monday-first weeks?', 'Yes, and Saturday-first. You can also choose which days count as the weekend — Friday and Saturday works.']
    ]
  },

  'weekly-planner': {
    search: 'printable weekly planner',
    h1: 'Printable weekly planner',
    intro: 'A week to a page, either as open writing space or with hourly time slots. ' +
      'It is the calendar maker’s week layout, so it carries the same holiday data and the ' +
      'same true-to-size printing as everything else here.',
    desc: 'A week to a page, either as open writing space or with hourly time slots. It is the ' +
      'calendar maker’s week layout, so it prints true to size and carries the same holiday ' +
      'data.',
    points: [
      'Days as rows, columns or a grid — whichever suits your paper',
      'Hourly slots over a range you set, or blank, ruled or dotted space',
      'An optional notes block as an eighth panel',
      'Prints on planner-insert sizes as well as Letter and A4'
    ],
    specs: [['Arrangements', '3'], ['Paper sizes', '18'], ['Hours', 'Any range']],
    faq: [
      ['Can I make a whole year of weeks?', 'Yes — set the number of weeks and it runs from your start date.'],
      ['Will it fit my planner?', 'Classic, A5, Personal and Pocket insert sizes are built in.']
    ]
  },

  'daily-planner': {
    search: 'printable daily planner',
    h1: 'Printable daily planner',
    intro: 'A time-blocked day beside the things you actually want to get done. ' +
      'The split between the schedule and the side column is yours to slide, so it works ' +
      'whether your day is mostly meetings or mostly tasks.',
    desc: 'A time-blocked day beside the things you actually want to get done. The split between ' +
      'the schedule and the task column slides, so it suits a day of meetings or a day of tasks.',
    points: [
      'Any hour range, in whole or half hours, on a 12- or 24-hour clock',
      'A priorities block, a to-do list and notes down the side',
      'Slide the schedule/side split from 35% to 75%',
      'Pocket size for a planner, or Letter for a desk'
    ],
    specs: [['Hours', 'Any range'], ['Half hours', 'Yes'], ['Paper sizes', '18']],
    faq: [
      ['Can I print a week of them?', 'Set the sheet count and you get that many identical day sheets.'],
      ['Is there an undated version?', 'Turn off “show the date beside the title” and the sheet is undated.']
    ]
  },

  'meal-planner': {
    search: 'printable meal planner',
    h1: 'Printable meal planner',
    intro: 'A week of meals with a shopping list beside it. The meal slots are yours — ' +
      'add a snack row, drop breakfast, or plan only dinners — and the week grid takes ' +
      'the bulk of the sheet so there is room to actually write a recipe name.',
    desc: 'A week of meals with a shopping list beside it. Add a snack row, drop breakfast or ' +
      'plan only dinners, and the week grid still takes the bulk of the sheet so there is room ' +
      'to write.',
    points: [
      'Your own meal slots, not a fixed breakfast/lunch/dinner',
      'A shopping checklist in one to four columns',
      'Dates beside each day, or plain weekday names for an undated sheet',
      'Any week start — Monday, Sunday or Saturday'
    ],
    specs: [['Meal slots', 'Up to 6'], ['Shopping columns', '1–4'], ['Paper sizes', '18']],
    faq: [
      ['Can I plan more than a week?', 'Print several sheets; each one covers seven days.'],
      ['Does the shopping list fill itself?', 'No — it prints blank. Nothing you type is stored or processed anywhere.']
    ]
  },

  'graph-paper': {
    search: 'printable graph paper',
    h1: 'Printable graph paper',
    intro: 'Squared paper at the spacing you ask for, drawn as vectors on a sheet that carries ' +
      'its exact media size. Most free graph paper prints at whatever scale the browser picks, ' +
      'so 5 mm squares arrive at 4.8 mm and the sheet is useless for anything measured.',
    desc: 'Squared paper at the spacing you ask for, drawn as vectors on a sheet that carries ' +
      'its exact media size. Ask for 5 mm squares and they measure 5 mm on the page, not 4.8.',
    points: [
      'Any square size in millimetres or inches, including engineering 1/10 in',
      'A heavier line every 2 to 10 squares',
      'Line weight set in real millimetres — a 0.3 mm rule measures 0.3 mm',
      'Whole squares centred on the sheet, so both margins match'
    ],
    specs: [['Spacing', 'Any'], ['Units', 'mm or in'], ['Paper sizes', '18'], ['Verified', '±0.05%']],
    faq: [
      ['How do I know the scale is right?', 'It is measured, not assumed: a rendered 10 mm grid comes out at a mean pitch within 0.05% of true. Print at 100% scale with margins set to None.'],
      ['Can I get 1 cm squares?', 'Set the spacing to 10 mm. Any value from 0.05 upwards works.']
    ]
  },

  'dot-grid': {
    search: 'printable dot grid paper',
    h1: 'Printable dot grid paper',
    intro: 'Bullet-journal dots at true spacing, in the size your notebook actually is. ' +
      'The usual reason to print your own is that you want A5 or a planner insert rather ' +
      'than Letter, and that is exactly what most sites will not give you.',
    desc: 'Bullet-journal dots at true spacing, in the size your notebook actually is. A5 and ' +
      'planner inserts, not only Letter — which is the whole reason to print your own.',
    points: [
      'True 5 mm spacing by default, or any value you like',
      'Adjustable dot size, and a larger dot every 4, 5 or 6',
      'A5, Pocket, Personal and Classic insert sizes built in',
      'Ink-saver mode for a lighter sheet'
    ],
    specs: [['Spacing', 'Any'], ['Dot size', '0.2–1.6 mm'], ['Paper sizes', '18']],
    faq: [
      ['Which spacing do bullet journals use?', 'Usually 5 mm. That is the default here.'],
      ['Can I print it on planner inserts?', 'Yes — Classic, A5, Personal and Pocket are all available.']
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
      ['Can I have no margin line?', 'Yes. Left, both sides or none.']
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
      ['Is this the same as triangle paper?', 'Yes — isometric paper is the triangular grid used for 3D sketching.']
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
      ['Which orientation do most games use?', 'Pointy-top is the more common for hex maps; flat-top is the default in some rulesets. Both are here.']
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
      ['What line gap should I use?', '2.5 mm suits most handwriting; go larger for children or a broad nib.']
    ]
  },

  handwriting: {
    search: 'printable handwriting practice paper',
    h1: 'Printable handwriting practice paper',
    intro: 'Guide lines for learning to write, with a dashed or dotted midline and an optional ' +
      'descender guide. Type a name or a word and it prints as hollow outlines to trace, ' +
      'repeated along each line.',
    points: [
      'Dashed, dotted or no midline',
      'A descender guide below the baseline, and optional slant guides',
      'Type any word and it prints as traceable outlines',
      'Set the row height to suit the age of the writer'
    ],
    specs: [['Midline', '3 styles'], ['Tracing', 'Any word'], ['Row height', 'Any']],
    faq: [
      ['Why does the tracing stop before the right edge?', 'It stops short deliberately rather than risk cutting a word in half, and leaves room to write the word again unaided.']
    ]
  },

  'habit-tracker': {
    search: 'printable habit tracker',
    h1: 'Printable habit tracker',
    intro: 'Your habits down the side, the days across the top, and a box at every crossing. ' +
      'Choose a month, a run of weeks, or a numbered streak for a 30- or 100-day challenge.',
    points: [
      'Month, weekly blocks, or a numbered run of boxes',
      'Circles, squares, rounded boxes, diamonds or stars to fill in',
      'An optional target column, weekend shading and note lines',
      'Up to 40 habits on one sheet'
    ],
    specs: [['Layouts', '3'], ['Box styles', '6'], ['Habits', 'Up to 40']],
    faq: [
      ['Can I do a 100-day challenge?', 'Yes — the challenge layout prints a numbered run of boxes, up to 200.'],
      ['Will the circles stay round on a narrow month grid?', 'Yes. They are sized from the shorter side of their cell, so 31 narrow columns do not stretch them into ellipses.']
    ]
  },

  'chore-chart': {
    search: 'printable chore chart',
    h1: 'Printable chore chart',
    intro: 'Names down the side, days across the top, and a box to tick or sticker. ' +
      'Weekly blocks stack down the sheet, which is the shape that actually works on a ' +
      'fridge door.',
    points: [
      'Several weeks on one sheet, so it lasts a month',
      'Square, circle or star boxes — stars if stickers are involved',
      'Alternate-row shading so eyes track the right line',
      'An optional total or reward column'
    ],
    specs: [['Weeks per sheet', 'Up to 8'], ['People', 'Up to 40'], ['Box styles', '6']],
    faq: [
      ['Can I use it for one child?', 'Yes — put chores in the list instead of names.']
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
      ['How big are the boxes?', 'They scale with the sheet and the number of rows — fewer rows and larger paper give bigger squares.']
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
      ['Can I use my own currency?', 'Type any symbol and it appears in the column headings.']
    ]
  },

  'packing-list': {
    search: 'printable packing list',
    h1: 'Printable packing list',
    intro: 'Checklists by category with blank lines to add to. Tell it how many nights you ' +
      'are away and each category gets a quantity hint — clothing counts as nights plus ' +
      'one, toiletries suggest travel sizes. A nudge, not a rule.',
    desc: 'Checklists by category with blank lines to add to. Say how many nights you are away ' +
      'and each category gets a quantity hint: clothing is nights plus one. A nudge, not a rule.',
    points: [
      'Your own categories, typed as one list',
      'Blank lines under each so you can add as you think of things',
      'Up to four categories across the sheet',
      'A5 for a weekend bag, Letter for a family holiday'
    ],
    specs: [['Categories', 'Any'], ['Across', '1–4'], ['Trip length', 'Any']],
    faq: [
      ['What does the quantity hint do?', 'It prints a small suggestion beside each category heading based on the nights you set. Nothing is enforced.']
    ]
  },

  flashcards: {
    search: 'printable flashcards',
    h1: 'Printable flashcards',
    intro: 'Double-sided flashcards where the backs actually land on the right cards. ' +
      'That sounds obvious and it is the thing most free flashcard sheets get wrong: ' +
      'flipping a sheet on its long edge reverses the column order, so the back of the ' +
      'top-left card has to print top-right.',
    desc: 'Double-sided flashcards where the backs land on the right cards. Flipping a sheet on ' +
      'its long edge reverses the column order, so the back of the top-left card has to print ' +
      'top-right.',
    points: [
      'Duplex layout for long-edge or short-edge flip, checked geometrically',
      'Term and definition from a plain list — one line per card',
      'Ruled backs instead, if you would rather write them yourself',
      'Crop ticks or full cut lines, at any finished size'
    ],
    specs: [['Duplex', 'Both flips'], ['Sizes', 'Any'], ['Marks', 'Crop or cut']],
    faq: [
      ['Which flip setting do I need?', 'Match it to your printer’s duplex option. Long-edge is the usual default.'],
      ['How do I know the backs will line up?', 'The ordering is asserted rather than eyeballed: for every back slot, where it lands after the physical flip must equal the front position of the card it holds.']
    ]
  },

  'times-tables': {
    search: 'printable times tables',
    h1: 'Printable times tables and maths drills',
    intro: 'Drill sheets with a separate answer key, plus the classic multiplication grid ' +
      'blank or filled. Multiplication, addition, subtraction and division, alone or mixed, ' +
      'with the number ranges you choose.',
    points: [
      'Division is built from the answer upwards, so it always divides exactly',
      'Subtraction stays in the whole numbers unless you ask for negatives',
      'Answers print as matching sheets at the end',
      'The same link always makes the same sheet, so a reprint still matches the key'
    ],
    specs: [['Operations', '4'], ['Problems', 'Up to 200'], ['Answer key', 'Yes'], ['Grid', 'Up to 20×20']],
    faq: [
      ['Will division give remainders?', 'Never. A divisor and a quotient are chosen and multiplied to get the dividend, so every division is exact.'],
      ['Can I get the blank grid to fill in?', 'Yes, and it prints a completed grid as the answer key.']
    ]
  },

  sudoku: {
    search: 'printable sudoku',
    h1: 'Printable sudoku',
    intro: 'Sudoku at five difficulties, every puzzle checked for a single solution before ' +
      'it is offered, with answer sheets at the end. The levels are genuinely different: ' +
      'about 43 clues at easy down to 25 at evil.',
    desc: 'Sudoku at five difficulties, every puzzle checked for a single solution before it is ' +
      'offered, with answer sheets at the end. About 43 clues at easy, down to 25 at evil.',
    points: [
      'Five difficulties that actually differ — 43, 36, 30, 27 and 25 clues',
      'Every puzzle verified to have exactly one solution',
      'One, two or four to a sheet, up to 40 puzzles',
      'The link reproduces the same puzzles, so you can reprint them'
    ],
    specs: [['Difficulties', '5'], ['Clues', '43 → 25'], ['Per sheet', '1, 2 or 4']],
    faq: [
      ['Are the puzzles always solvable without guessing?', 'Every puzzle has exactly one solution, which is checked during generation. Harder grids may still need advanced technique.'],
      ['Can I print the same set again later?', 'Yes — the puzzles come from a seed in the link, so the same link deals the same puzzles.']
    ]
  },

  'word-search': {
    search: 'printable word search',
    h1: 'Printable word search',
    intro: 'A word search from your own list, at any grid size, with an answer grid that ' +
      'highlights every word. Diagonals and backwards are optional, so an easy sheet for ' +
      'a small child is two directions on a 10 × 10 grid.',
    desc: 'A word search from your own list, at any grid size, with an answer grid that ' +
      'highlights every word. Diagonals and backwards are optional, so an easy sheet stays easy.',
    points: [
      'Your own words — spelling lists, names, topic vocabulary',
      'Diagonals and backwards on or off, for age-appropriate difficulty',
      'The word list prints beneath the grid',
      'It tells you how many words fitted, rather than dropping one silently'
    ],
    specs: [['Grid', '8–22'], ['Directions', 'Up to 8'], ['Answer key', 'Yes']],
    faq: [
      ['What if a word is too long for the grid?', 'It cannot be placed, and the sheet says how many of your words fitted so you can enlarge the grid.']
    ]
  },

  maze: {
    search: 'printable maze',
    h1: 'Printable mazes',
    intro: 'Mazes generated fresh at any size from four squares across to sixty, with the ' +
      'solution path as the answer key. A small grid suits a toddler; a large one with ' +
      'loops will hold up an adult.',
    points: [
      'Any grid from 4 × 4 to 60 × 80',
      'A loops control that opens dead ends — which makes a maze harder, not easier',
      'Solution path printed as the key',
      'One or two to a sheet'
    ],
    specs: [['Grid', 'Up to 60×80'], ['Loops', 'Adjustable'], ['Solution', 'Yes']],
    faq: [
      ['Why do loops make it harder?', 'Dead ends are what let you rule a branch out. Remove them and there are more ways to go wrong.']
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
      ['Can I use words instead of numbers?', 'Yes. Give it at least as many words as there are squares.']
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
      ['Can I print the same tag twelve times?', 'Turn on “repeat the list to fill every slot” and one entry tiles the sheet.']
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
      ['How many fit on a page?', 'The sheet tells you as you change the size — three 2-inch bookmarks fit across Letter portrait.']
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
      ['Why is the top half upside down?', 'That is what makes a tent card work — fold it and the inverted half becomes the far side, reading correctly to the person opposite.']
    ]
  },

  labels: {
    search: 'printable address labels',
    h1: 'Printable address labels',
    intro: 'Address labels matched to real Avery die-cut stock — 5160, 5161, 5162, 5163, ' +
      '5164 and the A4 L7160, L7163 and L7651 — with a nudge control for when your ' +
      'printer disagrees about where the page starts.',
    points: [
      'Exact die-cut geometry: pick the stock and size, count and offsets are fixed',
      'A nudge in 0.25 mm steps that shifts the whole block',
      'One address repeated across the sheet, or a different one on every label',
      'Multi-line addresses from a single input line'
    ],
    specs: [['Avery stocks', '9'], ['Nudge', '0.25 mm'], ['Repeat', 'Yes']],
    faq: [
      ['My labels print slightly off. What do I do?', 'Print one sheet on plain paper, hold it against the label sheet, measure the drift and nudge the block by that much. Printers disagree about the page origin more than templates do.'],
      ['Which Avery number is 30 labels per sheet?', '5160, also sold as 8160 and 5960. It is in the list.']
    ]
  }
};
