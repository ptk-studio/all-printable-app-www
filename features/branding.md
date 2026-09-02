# Sheet credit

Status: **live** — `docs/assets/js/core/brand.js`

A small `all-printable.com` prints in the bottom-right corner of every sheet,
from every generator. Pro removes it — or replaces it.

Three states, decided by one function, `brand.footerText()`:

| | prints |
|---|---|
| free | `all-printable.com` |
| Pro, no footer set | nothing |
| Pro, footer set | whatever they typed |

The third is the one people ask for: a teacher's name, a room number, a studio.
Removing our credit only to leave a blank corner is less useful than letting
them own it, and it costs one field. The custom mark also carries a
`.brand-custom` class, because it is theirs and not a credit for us.

The text lives on the user's profile (`sheetFooter`), not in the browser, so it
follows them to a phone. It is deliberately **not** a locked field — it is
their own text — but the rules cap it at 64 characters, because it lands on
paper and an unbounded string is a way to make a mess of a sheet. `brand.js`
trims and truncates too, so a stale cached value cannot overflow the corner.

## Where it is stamped

In exactly one place: `buildPages()` in `core/studio.js`, which every route to
paper goes through — preview, print, and the standalone HTML export. Stamping
inside each engine would have meant seven chances to forget, and the export
path in particular re-renders, so it would have been the one to miss.

## Why it is positioned absolutely

The paper generator computes its drawing area in exact millimetres:

```
gh = pageHeight − 2 × margin − headerHeight − footerHeight
```

and then sizes the SVG to match. Appending a footer element after the fact
would shrink the flex canvas below the SVG's stated height and silently clip
the grid — while the numbers in the code still looked right.

So the credit is `position: absolute`, anchored to the sheet's own margin:

```css
right: var(--pad); bottom: calc(var(--pad) / 3);
```

It cannot take space from any layout, and it lines up with the content edge at
any margin. Verified after adding it that the 10 mm grid still measures 10 mm
(mean pitch within 0.05 % of true).

It also works for the cards generator, which has no `.page-inner` at all —
pieces are positioned in sheet coordinates — so a footer-based approach would
have needed a special case there.

## The seam for paid removal

One predicate:

```js
function hidden() {
  return !!(AP.entitlements && AP.entitlements.removeBranding);
}
```

Until accounts exist there is nothing to read, so it is false for everyone.
When entitlements arrive, that is the only line that changes.

There is deliberately **no URL parameter or UI toggle**. A credit anyone can
switch off for free is not a paid feature, and adding a hidden override would
make the eventual paid version feel like a con.

## What it is not

Separate from the user's own `footer` field, which every generator already has
and which they set themselves. The credit is additive and sits in the corner;
their footer text keeps its own place.

## Honest limits

- At a margin of 0 mm the credit sits at the very sheet edge and may overlap
  content. Any margin above about 5 mm is clear.
- It is a client-side element like everything else here, so a determined user
  can remove it with developer tools. That is true of any static site, and is
  the reason a real paid tier would want the entitlement checked somewhere the
  user does not control.
