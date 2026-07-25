import { describe, expect, it } from 'vitest';
import { HUBS, HUB_TITLES, TABS, isHubShell, showBar, tabsFor } from './nav';
import { shellPages } from './shell-pages';

describe('the two tab-bar invariants', () => {
	it("every tab's own href lights that tab", () => {
		// Rule 1. Broken before: Practice linked to /practice but lit on /cards,
		// so tapping the lit tab navigated somewhere else.
		for (const tab of TABS) {
			expect(tab.on(tab.href), `${tab.label} -> ${tab.href}`).toBe(true);
		}
	});

	it('every tab href lights exactly its own tab and no other', () => {
		for (const tab of TABS) {
			expect(tabsFor(tab.href).map((t) => t.label), tab.href).toEqual([tab.label]);
		}
	});

	it('every hub route lights exactly one tab', () => {
		// Rule 2. Broken before: /reader and /stories showed the bar with nothing
		// lit, so a whole track read as outside the app.
		for (const path of HUBS) {
			expect(tabsFor(path).map((t) => t.label), path).toHaveLength(1);
		}
	});

	it('shows the bar on every hub and on nothing else it knows about', () => {
		for (const path of HUBS) expect(showBar(path), path).toBe(true);
		// Immersive runs keep their own quit affordance instead.
		for (const path of ['/lesson/first-words', '/practice', '/script/practice', '/stories/teashop', '/reader/greetings', '/script/loanwords', '/script/confusions']) {
			expect(showBar(path), path).toBe(false);
		}
	});
});

describe('who owns what', () => {
	const owner = (p: string) => tabsFor(p)[0]?.label ?? 'NONE';

	it('gives the review runners to Review, including the two under /script', () => {
		expect(owner('/review')).toBe('Review');
		expect(owner('/practice')).toBe('Review');
		expect(owner('/cards')).toBe('Review');
		// Lexically under /script, but they are review, not study.
		expect(owner('/script/practice')).toBe('Review');
		expect(owner('/script/confusions')).toBe('Review');
	});

	it('gives reading and stories to Learn, since they are modes of the course', () => {
		expect(owner('/reader')).toBe('Learn');
		expect(owner('/reader/greetings')).toBe('Learn');
		expect(owner('/stories')).toBe('Learn');
		expect(owner('/stories/teashop')).toBe('Learn');
		expect(owner('/dictionary')).toBe('Learn');
		expect(owner('/lesson/first-words')).toBe('Learn');
	});

	it('leaves Script owning only the study surfaces', () => {
		expect(owner('/script')).toBe('Script');
		expect(owner('/script/builder')).toBe('Script');
		expect(owner('/script/learn/first-letters')).toBe('Script');
		expect(owner('/script/loanwords')).toBe('Script');
	});

	it('keeps Today to itself', () => {
		expect(owner('/')).toBe('Today');
		expect(owner('/account')).toBe('You');
	});
});

describe('the hub shell', () => {
	it('covers exactly the routes that get the tab bar', () => {
		// The root layout wraps these, so the shell and the bar must agree or a
		// page gets one without the other.
		for (const path of HUBS) expect(isHubShell(path), path).toBe(true);
		expect(isHubShell('/lesson/first-words')).toBe(false);
		expect(isHubShell('/practice')).toBe(false);
	});

	it('only titles routes that actually have the shell', () => {
		for (const path of Object.keys(HUB_TITLES)) {
			expect(isHubShell(path), path).toBe(true);
		}
	});

	it('leaves the pages that own their header untitled', () => {
		// /cards swaps its header during a review run and /script/builder has a
		// back arrow that exits to the studio, so both render their own.
		expect(HUB_TITLES['/cards']).toBeUndefined();
		expect(HUB_TITLES['/script/builder']).toBeUndefined();
	});

	it('gives every titled hub a non-empty title', () => {
		for (const [path, meta] of Object.entries(HUB_TITLES)) {
			expect(meta.title.trim(), path).not.toBe('');
		}
	});
});

describe('hubs and the service worker agree', () => {
	it('every hub is precached, or an offline reload 404s on it', () => {
		for (const path of HUBS) {
			expect(shellPages, path).toContain(path);
		}
	});
});
