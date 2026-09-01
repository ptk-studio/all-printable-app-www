/* ==========================================================================
   The catalogue of printables. Adding a new generator means adding an entry
   here and dropping a folder under public/printables/. Plain script (not
   JSON + fetch) so the site also works when opened straight from disk.
   ========================================================================== */
window.AP = window.AP || {};

AP.CATEGORIES = [
  { id: 'calendars', label: 'Calendars & planners',
    blurb: 'Wall, desk, pocket and year-at-a-glance — on any paper size.' },
  { id: 'paper', label: 'Paper & grids',
    blurb: 'The ruled, squared and dotted sheets you always run out of.' },
  { id: 'home', label: 'Home & life',
    blurb: 'Charts and trackers for the fridge door.' },
  { id: 'learning', label: 'Learning',
    blurb: 'Practice sheets and drills for classrooms and kitchen tables.' },
  { id: 'fun', label: 'Games & puzzles',
    blurb: 'Something to print when the wifi goes down.' },
  { id: 'labels', label: 'Cards & labels',
    blurb: 'Small formats that need to line up exactly.' }
];

AP.PRINTABLES = [
  /* ---- live ---- */
  { id: 'calendar', cat: 'calendars', status: 'live',
    name: 'Calendar',
    tagline: 'Seven layouts, thirty countries of holidays, any paper size',
    href: 'printables/calendar/index.html',
    bullets: ['Month, multi-month, year, year grid, agenda, weekly, photo',
              'Holidays computed for any year — no stale data',
              'Moon phases, week numbers, your own recurring events'],
    art: 'calendar' },

  /* ---- planned ---- */
  { id: 'weekly-planner', cat: 'calendars', status: 'live',
    name: 'Weekly planner',
    tagline: 'Hourly or open, rows / columns / grid',
    href: 'printables/calendar/index.html#preset=weekly',
    bullets: ['Built into the calendar maker as the week-per-page layout'],
    art: 'week' },
  { id: 'daily-planner', cat: 'calendars', status: 'soon', name: 'Daily planner',
    tagline: 'Time-blocked day sheets with priorities and notes', art: 'day' },
  { id: 'meal-planner', cat: 'calendars', status: 'soon', name: 'Meal planner',
    tagline: 'Week of meals with a shopping list that fills itself', art: 'meal' },

  { id: 'graph-paper', cat: 'paper', status: 'soon', name: 'Graph paper',
    tagline: 'Any square size in mm or inches, any line weight', art: 'grid' },
  { id: 'dot-grid', cat: 'paper', status: 'soon', name: 'Dot grid',
    tagline: 'Bullet-journal dots, sized to your notebook', art: 'dots' },
  { id: 'lined-paper', cat: 'paper', status: 'soon', name: 'Lined paper',
    tagline: 'Wide, college and narrow rule, with or without margin', art: 'lines' },
  { id: 'isometric', cat: 'paper', status: 'soon', name: 'Isometric paper',
    tagline: 'Triangle grid for 3D sketching', art: 'iso' },
  { id: 'music-staff', cat: 'paper', status: 'soon', name: 'Manuscript paper',
    tagline: 'Staves, tab and grand staff', art: 'staff' },
  { id: 'handwriting', cat: 'paper', status: 'soon', name: 'Handwriting practice',
    tagline: 'Dashed guide lines, with your own words traced', art: 'hand' },

  { id: 'chore-chart', cat: 'home', status: 'soon', name: 'Chore chart',
    tagline: 'Names down, days across, stickers on top', art: 'chart' },
  { id: 'habit-tracker', cat: 'home', status: 'soon', name: 'Habit tracker',
    tagline: 'A month of circles to fill in', art: 'habit' },
  { id: 'budget', cat: 'home', status: 'soon', name: 'Budget sheet',
    tagline: 'Monthly in / out with running totals', art: 'budget' },
  { id: 'packing-list', cat: 'home', status: 'soon', name: 'Packing list',
    tagline: 'Trip-length aware checklists', art: 'list' },

  { id: 'flashcards', cat: 'learning', status: 'soon', name: 'Flashcards',
    tagline: 'Double-sided, cut-line accurate, from your own list', art: 'cards' },
  { id: 'times-tables', cat: 'learning', status: 'soon', name: 'Times tables',
    tagline: 'Drill sheets with an answer key', art: 'math' },
  { id: 'reward-chart', cat: 'learning', status: 'soon', name: 'Reward chart',
    tagline: 'Star grids that actually fit the stickers', art: 'star' },

  { id: 'sudoku', cat: 'fun', status: 'soon', name: 'Sudoku',
    tagline: 'Five difficulties, printed with solutions', art: 'sudoku' },
  { id: 'word-search', cat: 'fun', status: 'soon', name: 'Word search',
    tagline: 'Your own word list, any grid size', art: 'search' },
  { id: 'bingo', cat: 'fun', status: 'soon', name: 'Bingo cards',
    tagline: 'Unique cards in one pass', art: 'bingo' },
  { id: 'maze', cat: 'fun', status: 'soon', name: 'Mazes',
    tagline: 'Generated fresh, easy to fiendish', art: 'maze' },

  { id: 'gift-tags', cat: 'labels', status: 'soon', name: 'Gift tags',
    tagline: 'Cut lines and fold marks included', art: 'tag' },
  { id: 'bookmarks', cat: 'labels', status: 'soon', name: 'Bookmarks',
    tagline: 'Six to a sheet with trim marks', art: 'bookmark' },
  { id: 'place-cards', cat: 'labels', status: 'soon', name: 'Place cards',
    tagline: 'Tent-fold cards from a guest list', art: 'place' },
  { id: 'labels', cat: 'labels', status: 'soon', name: 'Address labels',
    tagline: 'Matched to standard label sheet layouts', art: 'label' }
];

AP.byCategory = function (catId) {
  return AP.PRINTABLES.filter(function (p) { return p.cat === catId; });
};
