import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { customCards, CUSTOM_MAX_BOX } from './custom-cards.svelte';

const T0 = new Date('2026-01-01T12:00:00Z').getTime();

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(T0);
	for (const c of customCards.all()) customCards.remove(c.id);
});
afterEach(() => vi.useRealTimers());

describe('customCards', () => {
	it('adds a card, due immediately, at box 0', () => {
		customCards.add('umbrella', 'ထီး');
		expect(customCards.count).toBe(1);
		expect(customCards.dueCount).toBe(1);
		const [c] = customCards.all();
		expect(c.box).toBe(0);
		expect(c.front).toBe('umbrella');
	});

	it('ignores a blank front or back', () => {
		customCards.add('', 'x');
		customCards.add('x', '   ');
		expect(customCards.count).toBe(0);
	});

	it('a hit climbs a box and pushes the due date out; a miss resets to box 0', () => {
		customCards.add('a', 'b');
		const id = customCards.all()[0].id;

		customCards.grade(id, true);
		expect(customCards.all()[0].box).toBe(1);
		expect(customCards.dueCount).toBe(0); // no longer due — scheduled ahead

		// It comes back after its interval.
		vi.setSystemTime(T0 + 5 * 3600_000);
		expect(customCards.dueCount).toBe(1);

		customCards.grade(id, false);
		expect(customCards.all()[0].box).toBe(0);
		expect(customCards.dueCount).toBe(1); // box 0 is due now
	});

	it('caps the box at the top of the ladder', () => {
		customCards.add('a', 'b');
		const id = customCards.all()[0].id;
		for (let i = 0; i < 10; i++) customCards.grade(id, true);
		expect(customCards.all()[0].box).toBe(CUSTOM_MAX_BOX);
	});

	it('removes a card', () => {
		customCards.add('a', 'b');
		customCards.remove(customCards.all()[0].id);
		expect(customCards.count).toBe(0);
	});
});
