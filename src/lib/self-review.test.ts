import { describe, expect, it } from 'vitest';
import { buildSelfReviewQueue, starsFor, type SelfReviewState } from './self-review';
import type { VocabItem } from './vocab-srs.svelte';

const item = (my: string): VocabItem => ({
	my,
	roman: `${my}-roman`,
	en: `${my}-en`,
	lessonId: 'first-words'
});

const state = (o: Partial<SelfReviewState> = {}): SelfReviewState => ({
	dueIds: [],
	byMy: new Map([
		['က', item('က')],
		['ခ', item('ခ')],
		['ဂ', item('ဂ')]
	]),
	...o
});

describe('buildSelfReviewQueue', () => {
	it('is empty when nothing is due — it never invents cards to fill a session', () => {
		expect(buildSelfReviewQueue(state())).toEqual([]);
	});

	it('keeps the scheduler’s due order', () => {
		const q = buildSelfReviewQueue(state({ dueIds: ['ဂ', 'က', 'ခ'] }));
		expect(q.map((c) => c.my)).toEqual(['ဂ', 'က', 'ခ']);
	});

	it('carries both sides of the card', () => {
		const [card] = buildSelfReviewQueue(state({ dueIds: ['က'] }));
		expect(card).toEqual({ my: 'က', roman: 'က-roman', en: 'က-en' });
	});

	it('caps the session', () => {
		const dueIds = ['က', 'ခ', 'ဂ'];
		expect(buildSelfReviewQueue(state({ dueIds }), 2)).toHaveLength(2);
	});

	it('drops words the course no longer teaches rather than rendering a blank card', () => {
		const q = buildSelfReviewQueue(state({ dueIds: ['က', 'deleted-word', 'ခ'] }));
		expect(q.map((c) => c.my)).toEqual(['က', 'ခ']);
	});

	it('does not let dropped words eat the cap', () => {
		const q = buildSelfReviewQueue(state({ dueIds: ['gone', 'က', 'ခ'] }), 2);
		expect(q.map((c) => c.my)).toEqual(['က', 'ခ']);
	});
});

describe('starsFor', () => {
	it('gives three for a clean run', () => {
		expect(starsFor(10, 0)).toBe(3);
	});

	it('gives two for the odd lapse', () => {
		expect(starsFor(8, 2)).toBe(2);
	});

	it('gives one when a quarter of the session lapsed', () => {
		expect(starsFor(8, 3)).toBe(1);
	});

	it('does not divide by zero on an empty session', () => {
		expect(starsFor(0, 0)).toBe(0);
	});
});
