import { describe, expect, it } from 'vitest';
import { sample, shuffle } from './shuffle';

describe('shuffle', () => {
	it('keeps every element exactly once', () => {
		const src = [1, 2, 3, 4, 5, 6, 7, 8];
		const out = shuffle(src);
		expect(out).toHaveLength(src.length);
		expect([...out].sort((a, b) => a - b)).toEqual(src);
	});

	it('does not mutate its input', () => {
		const src = [1, 2, 3];
		shuffle(src);
		expect(src).toEqual([1, 2, 3]);
	});

	it('handles empty and single-element arrays', () => {
		expect(shuffle([])).toEqual([]);
		expect(shuffle(['a'])).toEqual(['a']);
	});

	// The regression this module exists for: with `sort(() => Math.random() - 0.5)`
	// a 3-option drill left the answer in the last slot ~25% of the time instead
	// of ~33%, which a learner can exploit. Chi-square over the landing position,
	// 4 degrees of freedom for 5 options; 18.47 is the 0.999 critical value, so a
	// correct shuffle fails this roughly once in a thousand runs.
	it('lands each element in each position with equal probability', () => {
		const size = 5;
		const runs = 30_000;
		const src = Array.from({ length: size }, (_, i) => i);
		const landed = new Array(size).fill(0);

		for (let i = 0; i < runs; i++) landed[shuffle(src).indexOf(0)]++;

		const expected = runs / size;
		const chiSq = landed.reduce((acc, n) => acc + (n - expected) ** 2 / expected, 0);
		expect(chiSq).toBeLessThan(18.47);
	});
});

describe('sample', () => {
	it('takes n distinct elements from the source', () => {
		const src = ['a', 'b', 'c', 'd', 'e'];
		const out = sample(src, 3);
		expect(out).toHaveLength(3);
		expect(new Set(out).size).toBe(3);
		for (const v of out) expect(src).toContain(v);
	});

	it('caps at the source length rather than padding', () => {
		expect(sample(['a', 'b'], 5)).toHaveLength(2);
	});
});
