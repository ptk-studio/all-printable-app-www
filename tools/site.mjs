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
