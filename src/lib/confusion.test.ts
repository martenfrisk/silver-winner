import { describe, expect, it } from 'vitest';
import {
	buildSortTrial,
	missesFor,
	prioritize,
	rank,
	rankMerged,
	record,
	scoreSort,
	type ConfusionMatrix,
	type SortChip
} from './confusion';

describe('record', () => {
	it('counts a confusion as an ordered pair', () => {
		let m: ConfusionMatrix = {};
		m = record(m, 'kha', 'ga');
		m = record(m, 'kha', 'ga');
		m = record(m, 'kha', 'ka');
		expect(m.kha).toEqual({ ga: 2, ka: 1 });
	});

	it('ignores a self-confusion, which is just a correct answer', () => {
		expect(record({}, 'ka', 'ka')).toEqual({});
	});

	it('does not mutate the matrix it is given', () => {
		const m: ConfusionMatrix = { kha: { ga: 1 } };
		const next = record(m, 'kha', 'ga');
		expect(m.kha.ga).toBe(1);
		expect(next.kha.ga).toBe(2);
	});
});

describe('rank', () => {
	const m: ConfusionMatrix = { kha: { ga: 3, ka: 1 }, sa: { hsa: 2 } };

	it('orders worst first', () => {
		expect(rank(m).map((p) => `${p.target}/${p.picked}`)).toEqual([
			'kha/ga',
			'sa/hsa',
			'kha/ka'
		]);
	});

	it('is stable, so the map does not reshuffle between renders', () => {
		expect(rank(m)).toEqual(rank(m));
	});

	it('skips zero counts', () => {
		expect(rank({ ka: { ga: 0 } })).toEqual([]);
	});
});

describe('rankMerged', () => {
	it('treats a confusion as symmetric — one problem, not two', () => {
		// Mixing up ခ for ဂ and ဂ for ခ is the same blind spot.
		const merged = rankMerged({ kha: { ga: 2 }, ga: { kha: 3 } });
		expect(merged).toHaveLength(1);
		expect(merged[0].count).toBe(5);
	});

	it('keeps genuinely different pairs apart', () => {
		expect(rankMerged({ kha: { ga: 2, ka: 2 } })).toHaveLength(2);
	});
});

describe('missesFor', () => {
	it('counts a glyph missed as a target and as a wrong pick', () => {
		const m: ConfusionMatrix = { kha: { ga: 2 }, ka: { kha: 3 }, sa: { hsa: 1 } };
		expect(missesFor(m, 'kha')).toBe(5);
		expect(missesFor(m, 'hsa')).toBe(1);
		expect(missesFor(m, 'nothing')).toBe(0);
	});
});

describe('prioritize', () => {
	const pairs = [
		['ka', 'kha'],
		['sa', 'hsa'],
		['ta', 'hta']
	] as const;

	it("puts the learner's real confusions first", () => {
		const m: ConfusionMatrix = { hta: { ta: 4 } };
		expect(prioritize(pairs, m)[0]).toEqual(['ta', 'hta']);
	});

	it('counts a pair in both directions', () => {
		const m: ConfusionMatrix = { sa: { hsa: 1 }, hsa: { sa: 5 } };
		expect(prioritize(pairs, m)[0]).toEqual(['sa', 'hsa']);
	});

	it('falls back to authored order for a learner with no history', () => {
		expect(prioritize(pairs, {})).toEqual([
			['ka', 'kha'],
			['sa', 'hsa'],
			['ta', 'hta']
		]);
	});
});

describe('buildSortTrial', () => {
	const chips = (binId: string, n: number): SortChip[] =>
		Array.from({ length: n }, (_, i) => ({ text: `${binId}${i}`, binId }));

	it('draws from both bins', () => {
		const trial = buildSortTrial(['ka', 'kha'], [...chips('ka', 5), ...chips('kha', 5)], 6);
		expect(trial).not.toBeNull();
		expect(trial!.chips).toHaveLength(6);
		expect(new Set(trial!.chips.map((c) => c.binId))).toEqual(new Set(['ka', 'kha']));
	});

	it('refuses a trial that would be all one bin', () => {
		// Answerable by noticing the pool is uniform — tests nothing.
		expect(buildSortTrial(['ka', 'kha'], chips('ka', 6), 6)).toBeNull();
	});

	it('tops up from the fuller side rather than shrinking the trial', () => {
		const trial = buildSortTrial(['ka', 'kha'], [...chips('ka', 5), ...chips('kha', 1)], 6);
		expect(trial!.chips).toHaveLength(6);
		expect(trial!.chips.filter((c) => c.binId === 'kha')).toHaveLength(1);
	});

	it('returns null when there is nothing to build from', () => {
		expect(buildSortTrial(['ka', 'kha'], [], 6)).toBeNull();
	});
});

describe('scoreSort', () => {
	const trial = {
		bins: ['ka', 'kha'] as [string, string],
		chips: [
			{ text: 'ကာ', binId: 'ka' },
			{ text: 'ခါ', binId: 'kha' },
			{ text: 'ကီ', binId: 'ka' }
		]
	};

	it('scores every placement and names the misses', () => {
		const placed = new Map([
			['ကာ', 'ka'],
			['ခါ', 'ka'],
			['ကီ', 'ka']
		]);
		const s = scoreSort(trial, placed);
		expect(s).toMatchObject({ correct: 2, total: 3 });
		expect(s.wrong.map((c) => c.text)).toEqual(['ခါ']);
	});

	it('counts an unplaced chip as wrong rather than skipping it', () => {
		const s = scoreSort(trial, new Map([['ကာ', 'ka']]));
		expect(s.correct).toBe(1);
		expect(s.wrong).toHaveLength(2);
	});

	it('gives a perfect score when every chip lands right', () => {
		const placed = new Map([
			['ကာ', 'ka'],
			['ခါ', 'kha'],
			['ကီ', 'ka']
		]);
		expect(scoreSort(trial, placed)).toMatchObject({ correct: 3, total: 3, wrong: [] });
	});
});
