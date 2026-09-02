/* ==========================================================================
   Line-art thumbnails for the catalogue, drawn rather than shipped as images.

   Read at build time by tools/build-categories.mjs, which inlines the drawings
   into the catalogue index and the six category pages. No browser fetches this
   file on this host — it is data for the generator, kept beside registry.js
   because the two are the catalogue's source of truth.

   The marketing home page at all-printable.com does load it, to draw its
   category cards in the browser.
   ========================================================================== */
window.AP = window.AP || {};

AP.ART = {
    calendar: '<rect class="stroke" x="4" y="8" width="64" height="44" rx="3"/><path class="stroke" d="M4 19h64"/><path class="stroke" d="M18 4v8M54 4v8"/><path class="stroke" d="M20 19v33M36 19v33M52 19v33M4 30h64M4 41h64"/><rect class="fill" x="21" y="31" width="14" height="10"/>',
    week:     '<rect class="stroke" x="4" y="6" width="64" height="9" rx="2"/><rect class="stroke" x="4" y="18" width="64" height="9" rx="2"/><rect class="stroke" x="4" y="30" width="64" height="9" rx="2"/><rect class="stroke" x="4" y="42" width="64" height="9" rx="2"/><path class="stroke" d="M16 6v45"/>',
    day:      '<rect class="stroke" x="10" y="4" width="52" height="52" rx="3"/><path class="stroke" d="M18 16h36M18 24h36M18 32h36M18 40h24"/><circle class="fill" cx="14" cy="16" r="2"/><circle class="fill" cx="14" cy="24" r="2"/><circle class="fill" cx="14" cy="32" r="2"/>',
    meal:     '<rect class="stroke" x="4" y="8" width="40" height="44" rx="3"/><path class="stroke" d="M4 22h40M4 36h40M24 8v44"/><path class="stroke" d="M52 12v16M58 12v16M55 28v24M52 12a3 8 0 006 0"/>',
    grid:     '<rect class="stroke" x="6" y="6" width="60" height="48"/><path class="stroke" d="M18 6v48M30 6v48M42 6v48M54 6v48M6 18h60M6 30h60M6 42h60"/>',
    dots:     '<g class="fill"><circle cx="12" cy="12" r="2"/><circle cx="26" cy="12" r="2"/><circle cx="40" cy="12" r="2"/><circle cx="54" cy="12" r="2"/><circle cx="12" cy="26" r="2"/><circle cx="26" cy="26" r="2"/><circle cx="40" cy="26" r="2"/><circle cx="54" cy="26" r="2"/><circle cx="12" cy="40" r="2"/><circle cx="26" cy="40" r="2"/><circle cx="40" cy="40" r="2"/><circle cx="54" cy="40" r="2"/></g><rect class="stroke" x="4" y="4" width="64" height="48"/>',
    lines:    '<rect class="stroke" x="6" y="4" width="60" height="52"/><path class="stroke" d="M14 4v52"/><path class="stroke" d="M18 14h44M18 22h44M18 30h44M18 38h44M18 46h30"/>',
    iso:      '<path class="stroke" d="M8 44l16-28 16 28zM24 16l16 28 16-28zM8 44h48"/><path class="stroke" d="M16 30h16M40 30h16"/>',
    hex:      '<path class="stroke" d="M14 14l7-4 7 4v8l-7 4-7-4zM32 14l7-4 7 4v8l-7 4-7-4zM23 30l7-4 7 4v8l-7 4-7-4zM5 30l7-4 7 4v8l-7 4-7-4z"/>',
    staff:    '<path class="stroke" d="M6 14h60M6 20h60M6 26h60M6 32h60M6 38h60"/><path class="stroke" d="M14 46c4-6 8-2 8 2s-6 6-8 0"/>',
    hand:     '<path class="stroke" d="M6 16h60M6 40h60"/><path class="stroke" stroke-dasharray="4 4" d="M6 28h60"/><path class="stroke" d="M16 40c0-12 6-16 10-12s-4 12-2 14 6-2 8-6"/>',
    chart:    '<rect class="stroke" x="6" y="8" width="60" height="44"/><path class="stroke" d="M6 20h60M24 8v44M38 8v44M52 8v44M6 32h60M6 42h60"/><path class="stroke" d="M28 26l3 3 5-6M42 26l3 3 5-6"/>',
    habit:    '<rect class="stroke" x="6" y="8" width="60" height="44" rx="3"/><g class="stroke"><circle cx="18" cy="22" r="4"/><circle cx="32" cy="22" r="4"/><circle cx="46" cy="22" r="4"/><circle cx="18" cy="38" r="4"/><circle cx="32" cy="38" r="4"/></g><circle class="fill" cx="18" cy="22" r="4"/><circle class="fill" cx="32" cy="22" r="4"/>',
    budget:   '<rect class="stroke" x="6" y="6" width="60" height="48"/><path class="stroke" d="M6 18h60M46 6v48M6 30h60M6 42h60"/><path class="stroke" d="M14 36h20M14 48h14"/>',
    list:     '<rect class="stroke" x="12" y="4" width="48" height="52" rx="3"/><g class="stroke"><rect x="18" y="14" width="7" height="7"/><rect x="18" y="28" width="7" height="7"/><rect x="18" y="42" width="7" height="7"/></g><path class="stroke" d="M31 18h22M31 32h22M31 46h14"/>',
    cards:    '<rect class="stroke" x="4" y="12" width="38" height="28" rx="3"/><rect class="stroke" x="26" y="22" width="38" height="28" rx="3"/><path class="stroke" d="M34 36h22M34 42h14"/>',
    math:     '<rect class="stroke" x="6" y="6" width="60" height="48"/><path class="stroke" d="M6 18h60M20 6v48"/><path class="stroke" d="M28 28h8M32 24v8M46 28h8M50 24v8M28 42h8M46 42h8"/>',
    star:     '<rect class="stroke" x="6" y="8" width="60" height="44"/><path class="stroke" d="M6 22h60M22 8v44M38 8v44M54 8v44"/><path class="fill" d="M14 30l2 4 4 .5-3 3 .8 4.2-3.8-2-3.8 2 .8-4.2-3-3 4-.5z"/><path class="fill" d="M30 30l2 4 4 .5-3 3 .8 4.2-3.8-2-3.8 2 .8-4.2-3-3 4-.5z"/>',
    sudoku:   '<rect class="stroke" x="6" y="6" width="48" height="48"/><path class="stroke" d="M22 6v48M38 6v48M6 22h48M6 38h48"/><path class="stroke" stroke-width=".7" d="M11.3 6v48M16.6 6v48M6 11.3h48M6 16.6h48"/>',
    search:   '<rect class="stroke" x="4" y="8" width="52" height="44"/><path class="stroke" d="M12 18h8M24 18h8M36 18h8M12 30h8M24 30h8M36 30h8M12 42h8M24 42h8"/><ellipse class="stroke" cx="30" cy="30" rx="24" ry="7" transform="rotate(-20 30 30)"/>',
    bingo:    '<rect class="stroke" x="6" y="6" width="56" height="48"/><path class="stroke" d="M6 18h56M6 30h56M6 42h56M20 6v48M34 6v48M48 6v48"/><circle class="fill" cx="27" cy="24" r="4"/><circle class="fill" cx="41" cy="36" r="4"/>',
    maze:     '<rect class="stroke" x="6" y="6" width="56" height="48"/><path class="stroke" d="M6 18h34M20 18v22M20 40h28M34 30h28M34 30v-12M48 6v12M48 40v14"/>',
    tag:      '<path class="stroke" d="M10 20l14-14h30v34l-14 14H10z"/><circle class="stroke" cx="44" cy="16" r="3"/><path class="stroke" d="M18 34h22M18 42h14"/>',
    bookmark: '<path class="stroke" d="M22 4h24v52l-12-9-12 9z"/><path class="stroke" d="M28 16h12M28 26h12"/>',
    place:    '<path class="stroke" d="M8 40h56v14H8z"/><path class="stroke" d="M8 40l10-24h38l-10 24"/><path class="stroke" d="M22 46h28"/>',
    label:    '<rect class="stroke" x="6" y="8" width="26" height="16" rx="2"/><rect class="stroke" x="38" y="8" width="26" height="16" rx="2"/><rect class="stroke" x="6" y="32" width="26" height="16" rx="2"/><rect class="stroke" x="38" y="32" width="26" height="16" rx="2"/>'
};
