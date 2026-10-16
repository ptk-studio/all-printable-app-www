/* The origin this copy of the site is published under.
 *
 * It feeds every canonical link, og:url, JSON-LD url and sitemap entry, so it
 * has to be right or search engines are told the pages live somewhere they do
 * not. One constant shared by both generators, because two copies that must
 * agree eventually will not.
 *
 * This repo publishes to app.all-printable.com. The marketing home page lives
 * in the all-printable-www repo at all-printable.com.
 *
 * Not to be confused with the credit printed on each sheet, which is the brand
 * "all-printable.com" and stays that whatever host serves the page — see
 * docs/assets/js/core/brand.js.
 */
export const SITE = 'https://app.all-printable.com';

/* The longest a page's meta description may be, in characters.
 *
 * It governs both halves of the site and they are written by different means,
 * which is why it lives here rather than in either of them. build-landing.mjs
 * fails the build when a generated description exceeds it; check-site-urls.mjs
 * fails when one of the eight hand-written pages does. A second copy of the
 * number in the second file would be two values that must agree — the thing
 * this module exists to prevent, and the reason the guard was worth adding at
 * all: a description drifted to 232 characters across four copies and nothing
 * said anything.
 *
 * It was 200 until #53, on the reasoning that 200 is the limit that keeps the
 * string a complete sentence while Google's own truncation sits nearer 155-160.
 * That reasoning was sound and the conclusion was still wrong: 23 of the 41
 * descriptions sat between 161 and 199, which is to say they were complete
 * sentences that no search result ever showed the end of. A complete sentence
 * the reader cannot see is not worth more than a complete sentence they can, so
 * the limit is now the visible one and the sentences were rewritten to fit it
 * rather than trimmed to it.
 *
 * 160 is still ours rather than Google's — Google measures pixels, not
 * characters, and the real cutoff moves with the words. It is the character
 * count that keeps a typical sentence inside that pixel budget. Do not raise it
 * to make a description fit; shorten the description.
 */
export const DESC_MAX = 160;
