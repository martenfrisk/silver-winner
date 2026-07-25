// The bottom tab bar's routing table, kept out of the component so the two
// rules below can be enforced by tests instead of by care.
//
// Both rules were broken before this module existed, and every navigation
// complaint traced back to one of them:
//
//   1. A tab's `href` must satisfy its own `on()`. The Practice tab used to
//      light up on /cards while linking to /practice, so tapping the lit tab
//      took you somewhere else entirely.
//   2. Every hub route must light exactly one tab. /reader and /stories showed
//      the bar with nothing lit, which is how a whole track ends up feeling
//      like it isn't part of the app.

export interface TabSpec {
	href: string;
	label: string;
	/** Whether this tab owns the given path. */
	on: (path: string) => boolean;
}

/**
 * Routes that get the tab bar. Players (a lesson, a review run, a story) do
 * not: there the bar is a distraction and an escape hatch out of the flow.
 *
 * An exact-match allowlist is easier to reason about than trying to enumerate
 * every immersive route. `/script/builder` is here because it is a browsable
 * sandbox rather than a timed run; without the bar its only exit was a lone
 * back arrow.
 */
export const HUBS = [
	'/',
	'/learn',
	'/reader',
	'/review',
	'/script',
	'/script/builder',
	'/account',
	'/stories',
	'/dictionary',
	'/cards'
];

/**
 * Review owns four runners, two of which live under /script/ for historical
 * reasons. Matching them here (and excluding them from Script below) is what
 * keeps a glyph drill from lighting the Script tab.
 */
export function inReview(p: string): boolean {
	return (
		p === '/review' ||
		p.startsWith('/practice') ||
		p === '/cards' ||
		p === '/script/practice' ||
		p === '/script/confusions'
	);
}

/** Reading and stories are modes of the course, so they belong to Learn. */
export function inLearn(p: string): boolean {
	return (
		p === '/learn' ||
		p.startsWith('/lesson') ||
		p === '/dictionary' ||
		p.startsWith('/reader') ||
		p.startsWith('/stories')
	);
}

export const TABS: TabSpec[] = [
	{ href: '/', label: 'Today', on: (p) => p === '/' },
	{ href: '/learn', label: 'Learn', on: inLearn },
	{ href: '/review', label: 'Review', on: inReview },
	{ href: '/script', label: 'Script', on: (p) => p.startsWith('/script') && !inReview(p) },
	{ href: '/account', label: 'You', on: (p) => p.startsWith('/account') }
];

export function showBar(path: string): boolean {
	return HUBS.includes(path);
}

/** Which tabs claim this path. Should always be exactly one for a hub. */
export function tabsFor(path: string): TabSpec[] {
	return TABS.filter((t) => t.on(path));
}
