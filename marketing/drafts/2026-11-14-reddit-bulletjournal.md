# Reddit draft: r/bulletjournal, true-size dot grid (#61)

**Status:** draft for the Owner to read, edit and post from their own account. **The worker never posts.**
**Written:** 2026-11-14 by web-worker1 (Claude). Approved approach: #61, manager option 2.

## The sub's rules: UNVERIFIED

**The Owner reads the sub's rules before posting.** This session couldn't open Reddit: Reddit returned a block page, and
Chrome and the fetch tool refuse reddit.com (#61, update 1). So nothing here was checked against the rules.

- Rules: https://www.reddit.com/r/bulletjournal/about/rules
- Look especially for self-promotion and link rules, any flair a "free resource" post needs, and whether links must
  go in a comment rather than the post body.
- If the sub doesn't allow it, don't post; the alternative sub is below.

## The link (UTM-tagged)

```
https://app.all-printable.com/dot-grid/?utm_source=reddit&utm_medium=social&utm_campaign=bulletjournal-2026-11-14
```

It goes to the dot-grid landing page (live, 200), which links to the maker. If you post on a different day, change the
date at the end of the campaign name so the 48-hour and 7-day readings stay separate.

## Title

> I made a free dot grid generator that prints true 5 mm dots at your notebook's real size (A5, Personal, Pocket, Classic)

Shorter alternative:

> Free printable dot grid at true 5 mm spacing, sized for A5 and planner inserts

## Body

> I kept running out of dot grid pages, and every free printable I found was Letter-size dots that came out at
> slightly the wrong spacing once scaled down to A5. So I built a page that prints the dots at real millimetres for the
> size you're actually using.
>
> What it does:
>
> - 5 mm spacing by default, or any spacing you want
> - Dot size from 0.2 mm (barely there) up to 1.6 mm, and an optional bigger dot every 4, 5 or 6 dots
> - A5, Pocket, Personal and Classic insert sizes built in, plus Letter, A4 and others (18 paper sizes)
> - An ink-saver mode for a lighter sheet
>
> It's free, no sign-up. Print at 100% scale with no margins and the spacing comes out right.
>
> [link]
>
> I'd love to hear which insert sizes or dot styles you'd want that aren't there.

(Every feature line above is from the live page's own copy: `tools/landing-copy.js`, `dot-grid`.)

## If someone asks "is this yours?"

> Yes, I made it. It's part of a small site of free printables I'm building. Happy to take requests.

Say so plainly. Don't post from a second account, and don't ask others to upvote.

## When to post

There's no sourced best time. A weekday morning, US Eastern, is a common choice for US-heavy subs. Check whether the
sub's rules or wiki name a day for resource posts, and use that if so.

## Alternative sub (one line)

r/homeschool: the times-tables worksheet with answer keys (`/times-tables/`), same UTM pattern with `utm_campaign=homeschool-<date>`.

## Measuring (worker, after the Owner posts)

GA4 property for app.all-printable.com, source `reddit`, campaign `bulletjournal-<date>`. Read at **48 hours** and **7 days**
and record them on #61.

Analytics on the app is opt-in (consent), so GA4 will **under-count**. Read the numbers as a floor.
