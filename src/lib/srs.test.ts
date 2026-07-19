// The store runs headless here: `browser` is false under vitest's node
// environment, so the constructor skips localStorage and save() no-ops.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { srs, MAX_BOX } from './srs.svelte';

const T0 = new Date('2026-01-01T12:00:00Z').getTime();
const H = 3600_000;

beforeEach(() => {
	srs.reset();
	vi.useFakeTimers();
	vi.setSystemTime(T0);
});

afterEach(() => {
	vi.useRealTimers();
	srs.reset();
});

describe('introduce', () => {
	it('seeds new ids at box 1, due in 4 hours', () => {
		srs.introduce(['ka', 'ma']);
		expect(srs.isIntroduced('ka')).toBe(true);
		expect(srs.box('ka')).toBe(1);
		expect(srs.entries['ka'].due).toBe(T0 + 4 * H);
	});

	it('never resets an existing entry', () => {
		srs.introduce(['ka']);
		srs.grade('ka', true); // box 2
		srs.introduce(['ka']);
		expect(srs.box('ka')).toBe(2);
	});
});

describe('grade', () => {
	it('moves up one box when correct, capped at MAX_BOX', () => {
		srs.introduce(['ka']);
		for (let i = 0; i < 10; i++) srs.grade('ka', true);
		expect(srs.box('ka')).toBe(MAX_BOX);
	});

	it('moves down one box and is due immediately when wrong', () => {
		srs.introduce(['ka']);
		srs.grade('ka', true); // box 2
		srs.grade('ka', false); // box 1, due now
		expect(srs.box('ka')).toBe(1);
		expect(srs.entries['ka'].due).toBe(T0);
		expect(srs.entries['ka'].lapses).toBe(1);
		expect(srs.dueIds()).toContain('ka');
	});

	it('floors at box 0', () => {
		srs.introduce(['ka']);
		srs.grade('ka', false);
		srs.grade('ka', false);
		expect(srs.box('ka')).toBe(0);
	});

	it('uses the interval of the NEW box on success', () => {
		srs.introduce(['ka']);
		srs.grade('ka', true); // → box 2 = 1 day
		expect(srs.entries['ka'].due).toBe(T0 + 24 * H);
	});
});

describe('dueIds', () => {
	it('returns due items oldest first, omits future ones', () => {
		srs.introduce(['ka', 'ma', 'na']); // all due at T0 + 4h
		srs.grade('ma', false); // due at T0
		expect(srs.dueIds(T0)).toEqual(['ma']);
		expect(srs.dueIds(T0 + 5 * H)[0]).toBe('ma'); // oldest first
		expect(srs.dueIds(T0 + 5 * H)).toHaveLength(3);
	});
});

describe('counters and units', () => {
	it('tracks introduced/mastered counts', () => {
		srs.introduce(['ka', 'ma']);
		for (let i = 0; i < MAX_BOX; i++) srs.grade('ka', true);
		expect(srs.introducedCount).toBe(2);
		expect(srs.masteredCount).toBe(1);
	});

	it('unlocks units strictly in order', () => {
		const order = ['u1', 'u2', 'u3'];
		expect(srs.isUnitUnlocked(order, 'u1')).toBe(true);
		expect(srs.isUnitUnlocked(order, 'u2')).toBe(false);
		srs.markUnitDone('u1');
		expect(srs.isUnitUnlocked(order, 'u2')).toBe(true);
		expect(srs.isUnitUnlocked(order, 'u3')).toBe(false);
	});
});
