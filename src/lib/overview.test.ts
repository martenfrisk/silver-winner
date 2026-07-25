import { describe, expect, it } from 'vitest';
import { stepStarsKey } from './data/course';
import { readerStarsKey } from './reader-session';
import { storyStarsKey } from './data/stories';
import {
	courseDone,
	courseRounds,
	overallPct,
	readerDone,
	starKind,
	storiesDone,
	trackSummaries,
	type OverviewSnapshot
} from './overview';

const snap = (o: Partial<OverviewSnapshot> = {}): OverviewSnapshot => ({
	stars: {},
	lessonIds: ['first-words', 'how-are-you', 'polite-talk'],
	unitIds: ['greetings', 'numbers'],
	storyIds: ['hello-shwe', 'teashop'],
	unlockedStoryIds: ['hello-shwe'],
	totalRounds: 6,
	scriptUnitsDone: 0,
	scriptUnitsTotal: 11,
	...o
});

describe('starKind round-trips the real key builders', () => {
	// The point of this test: starKind is the inverse of three builders that
	// live in three different modules. If a fifth star system appears and
	// forgets to teach starKind about itself, it lands in 'unknown' and
	// silently stops counting. Drive the actual builders, not string literals.
	it('parses a plain lesson key from stepStarsKey', () => {
		expect(starKind(stepStarsKey('first-words', 1))).toEqual({
			kind: 'lesson',
			id: 'first-words'
		});
	});

	it('parses deeper-round keys from stepStarsKey', () => {
		expect(starKind(stepStarsKey('first-words', 2))).toEqual({
			kind: 'round',
			id: 'first-words',
			round: 2
		});
		expect(starKind(stepStarsKey('first-words', 3))).toEqual({
			kind: 'round',
			id: 'first-words',
			round: 3
		});
	});

	it('parses a reader key from readerStarsKey', () => {
		expect(starKind(readerStarsKey('greetings'))).toEqual({ kind: 'reader', id: 'greetings' });
	});

	it('parses a story key from storyStarsKey', () => {
		expect(starKind(storyStarsKey('teashop'))).toEqual({ kind: 'story', id: 'teashop' });
	});

	it('never mistakes one system for another', () => {
		const kinds = [
			stepStarsKey('x', 1),
			stepStarsKey('x', 2),
			readerStarsKey('x'),
			storyStarsKey('x')
		].map((k) => starKind(k).kind);
		expect(new Set(kinds).size).toBe(4);
	});

	it('refuses garbage instead of guessing', () => {
		expect(starKind('').kind).toBe('unknown');
		expect(starKind('reader-').kind).toBe('unknown');
		expect(starKind('story-').kind).toBe('unknown');
		expect(starKind('lesson#9').kind).toBe('unknown');
		expect(starKind('lesson#').kind).toBe('unknown');
	});
});

describe('per-track counts', () => {
	const stars = {
		[stepStarsKey('first-words', 1)]: 3,
		[stepStarsKey('how-are-you', 1)]: 2,
		[stepStarsKey('first-words', 2)]: 3,
		[readerStarsKey('greetings')]: 2,
		[storyStarsKey('hello-shwe')]: 3
	};

	it('counts each system separately out of one map', () => {
		const s = snap({ stars });
		expect(courseDone(s)).toBe(2);
		expect(courseRounds(s)).toEqual({ done: 1, total: 6 });
		expect(readerDone(s)).toBe(1);
		expect(storiesDone(s)).toBe(1);
	});

	it('does not let a deeper round inflate the lesson count', () => {
		// first-words#2 must not read as a second completed lesson.
		expect(courseDone(snap({ stars: { [stepStarsKey('first-words', 2)]: 3 } }))).toBe(0);
	});

	it('ignores keys for content that no longer exists', () => {
		const s = snap({ stars: { 'deleted-lesson': 3, [readerStarsKey('gone')]: 3 } });
		expect(courseDone(s)).toBe(0);
		expect(readerDone(s)).toBe(0);
	});

	it('ignores a zero-star entry', () => {
		expect(courseDone(snap({ stars: { 'first-words': 0 } }))).toBe(0);
	});
});

describe('trackSummaries', () => {
	it('returns all four tracks even when empty, with no NaN', () => {
		const rows = trackSummaries(snap({ storyIds: [], unitIds: [] }));
		expect(rows.map((r) => r.id)).toEqual(['course', 'reader', 'script', 'stories']);
		for (const r of rows) expect(Number.isFinite(r.pct), r.id).toBe(true);
	});

	it('carries the script track through from the srs counts', () => {
		const rows = trackSummaries(snap({ scriptUnitsDone: 4 }));
		const script = rows.find((r) => r.id === 'script')!;
		expect(script).toMatchObject({ done: 4, total: 11 });
		expect(script.pct).toBeCloseTo(4 / 11);
	});

	it('every row links somewhere real', () => {
		for (const r of trackSummaries(snap())) expect(r.href).toMatch(/^\//);
	});
});

describe('overallPct', () => {
	it('is zero for a fresh learner and never NaN', () => {
		expect(overallPct(snap())).toBe(0);
		expect(overallPct(snap({ lessonIds: [], unitIds: [], storyIds: [], scriptUnitsTotal: 0 }))).toBe(
			0
		);
	});

	it('weights by track size rather than averaging percentages', () => {
		// All 2 stories done but nothing else: averaging the four percentages
		// would say 25%, which badly overstates 2 items out of 18.
		const s = snap({
			stars: { [storyStarsKey('hello-shwe')]: 3, [storyStarsKey('teashop')]: 3 }
		});
		expect(overallPct(s)).toBeCloseTo(2 / (3 + 2 + 11 + 2));
	});

	it('reaches 1 when everything is done', () => {
		const s = snap({
			stars: {
				'first-words': 3,
				'how-are-you': 3,
				'polite-talk': 3,
				[readerStarsKey('greetings')]: 3,
				[readerStarsKey('numbers')]: 3,
				[storyStarsKey('hello-shwe')]: 3,
				[storyStarsKey('teashop')]: 3
			},
			scriptUnitsDone: 11
		});
		expect(overallPct(s)).toBe(1);
	});
});
