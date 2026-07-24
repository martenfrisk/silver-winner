/**
 * Routes the service worker precaches at install time.
 *
 * The page that installs the SW loads before the SW controls it, so it never
 * passes through the fetch handler. Anything not listed here 404s on an
 * offline reload until it has been visited online once.
 *
 * Kept in a plain module rather than inline in `service-worker.ts` so
 * `shell-pages.test.ts` can check it against the routes on disk — the list
 * had already fallen three routes behind by the time that test was written.
 *
 * Dynamic routes (`/lesson/[id]`) are excluded on purpose: there is no finite
 * set to precache, and the navigation handler caches them as they're visited.
 */
export const shellPages = [
	'/',
	'/account',
	'/learn',
	'/practice',
	'/reader',
	'/script',
	'/script/builder',
	'/script/loanwords',
	'/script/practice',
	'/stories'
];

/** Route prefixes deliberately left out of the shell (unlinked dev tooling). */
export const shellExcluded = ['/dev'];
