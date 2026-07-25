import { describe, expect, it } from 'vitest';
import { interleaveByGroup, longestRun } from './interleave';

/** "a1" -> group "a". */
const group = (s: string) => s[0];

describe('interleaveByGroup', () => {
	it('breaks up two equal cohorts completely', () => {
		const items = ['a1', 'a2', 'a3', 'b1', 'b2', 'b3'];
		const out = interleaveByGroup(items, group);
		expect(longestRun(out, group)).toBe(1);
		expect([...out].sort()).toEqual([...items].sort());
	});

	it('is the fix for the real case: two lesson cohorts arriving in due order', () => {
		// What dueIds() hands over today — every word of lesson 1, then lesson 2.
		const items = [...Array(8)].map((_, i) => `a${i}`).concat([...Array(8)].map((_, i) => `b${i}`));
		expect(longestRun(items, group)).toBe(8); // blocked
		expect(longestRun(interleaveByGroup(items, group), group)).toBe(1);
	});

	it('preserves order within a group, so the most overdue item still leads it', () => {
		const out = interleaveByGroup(['a1', 'a2', 'a3', 'b1', 'b2'], group);
		expect(out.filter((s) => s[0] === 'a')).toEqual(['a1', 'a2', 'a3']);
		expect(out.filter((s) => s[0] === 'b')).toEqual(['b1', 'b2']);
	});

	it('loses no items and invents none', () => {
		const items = ['a1', 'a2', 'b1', 'c1', 'c2', 'c3', 'c4'];
		const out = interleaveByGroup(items, group);
		expect(out).toHaveLength(items.length);
		expect([...out].sort()).toEqual([...items].sort());
	});

	it('spreads a dominant group as far as it can, then necessarily repeats it', () => {
		// 5 of one group, 1 of another: the tail has nothing left to alternate with.
		const out = interleaveByGroup(['a1', 'a2', 'a3', 'a4', 'a5', 'b1'], group);
		expect(out).toHaveLength(6);
		// b lands early rather than being stranded at one end.
		expect(out.indexOf('b1')).toBeGreaterThan(0);
		expect(out.indexOf('b1')).toBeLessThan(5);
	});

	it('leaves a single group alone', () => {
		const items = ['a1', 'a2', 'a3', 'a4'];
		expect(interleaveByGroup(items, group)).toEqual(items);
	});

	it('leaves very short queues alone', () => {
		expect(interleaveByGroup(['a1', 'b1'], group)).toEqual(['a1', 'b1']);
		expect(interleaveByGroup([], group)).toEqual([]);
	});

	it('does not mutate the input', () => {
		const items = ['a1', 'a2', 'b1', 'b2'];
		const copy = [...items];
		interleaveByGroup(items, group);
		expect(items).toEqual(copy);
	});

	it('is deterministic', () => {
		const items = ['a1', 'b1', 'a2', 'c1', 'b2', 'a3'];
		expect(interleaveByGroup(items, group)).toEqual(interleaveByGroup(items, group));
	});
});

describe('longestRun', () => {
	it('counts the longest same-group streak', () => {
		expect(longestRun(['a1', 'a2', 'a3', 'b1'], group)).toBe(3);
		expect(longestRun(['a1', 'b1', 'a2', 'b2'], group)).toBe(1);
		expect(longestRun([], group)).toBe(0);
	});
});
