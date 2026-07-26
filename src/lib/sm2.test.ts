import { describe, expect, it } from 'vitest';
import {
	DEFAULT_EASE,
	MAX_INTERVAL_DAYS,
	MIN_EASE,
	formatInterval,
	newState,
	previewGrades,
	schedule,
	stateOf,
	type Grade,
	type Sm2State
} from './sm2';

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;

/** Days between `now` and the scheduled due date. */
const days = (s: { due: number }) => (s.due - NOW) / DAY;

/** Walks a card through a run of grades, returning its final state. */
function run(grades: Grade[], from: Sm2State = newState()): Sm2State {
	let s = from;
	for (const g of grades) s = schedule(s, g, NOW).state;
	return s;
}

describe('the fixed opening steps', () => {
	it('sends a brand new card 1 day out on good', () => {
		expect(days(schedule(newState(), 'good', NOW))).toBe(1);
	});

	it('skips the 1-day step on easy', () => {
		expect(days(schedule(newState(), 'easy', NOW))).toBe(4);
	});

	it('uses the fixed 6-day second step, ignoring the stored interval', () => {
		// reps 1 is still a fixed step: two data points don't justify trusting
		// this card's ease yet.
		const odd = { ease: DEFAULT_EASE, interval: 99, reps: 1 };
		expect(days(schedule(odd, 'good', NOW))).toBe(6);
	});

	it('grows by ease only from the third success', () => {
		const after = run(['good', 'good']);
		expect(after.reps).toBe(2);
		expect(after.interval).toBe(6);
		// 6 * 2.5 = 15
		expect(days(schedule(after, 'good', NOW))).toBe(15);
	});
});

describe('again', () => {
	it('brings the card back inside the session, not tomorrow', () => {
		const mature = { ease: DEFAULT_EASE, interval: 100, reps: 8 };
		const next = schedule(mature, 'again', NOW);
		expect(next.due - NOW).toBe(10 * 60_000);
	});

	it('zeroes the interval and the rep count', () => {
		const next = run(['good', 'good', 'good', 'again']);
		expect(next.interval).toBe(0);
		expect(next.reps).toBe(0);
	});

	it('costs ease', () => {
		expect(run(['again']).ease).toBeCloseTo(DEFAULT_EASE - 0.2);
	});

	it('rebuilds from the bottom afterwards rather than resuming the old spacing', () => {
		const lapsed = run(['good', 'good', 'good', 'again']);
		expect(days(schedule(lapsed, 'good', NOW))).toBe(1);
	});

	it('never drives ease below the floor, however many lapses', () => {
		const s = run(Array<Grade>(50).fill('again'));
		expect(s.ease).toBe(MIN_EASE);
	});
});

describe('ease', () => {
	it('is unmoved by good — it is the neutral grade', () => {
		expect(run(['good', 'good', 'good']).ease).toBe(DEFAULT_EASE);
	});

	it('climbs on easy', () => {
		expect(run(['easy']).ease).toBeCloseTo(DEFAULT_EASE + 0.15);
	});

	it('makes a card that keeps lapsing come back sooner than an easy one', () => {
		const hard = run(['again', 'again', 'good', 'good']);
		const simple = run(['easy', 'easy']);
		expect(days(schedule(hard, 'good', NOW))).toBeLessThan(
			days(schedule(simple, 'good', NOW))
		);
	});
});

describe('interval bounds', () => {
	it('caps a runaway interval at a year', () => {
		const s = run(Array<Grade>(40).fill('easy'));
		expect(s.interval).toBe(MAX_INTERVAL_DAYS);
		expect(days(schedule(s, 'easy', NOW))).toBe(MAX_INTERVAL_DAYS);
	});

	it('never schedules a success less than a day out', () => {
		// A minimum-ease card at interval 1: 1 * 1.3 rounds to 1, not 0.
		const floor = { ease: MIN_EASE, interval: 1, reps: 5 };
		expect(days(schedule(floor, 'good', NOW))).toBeGreaterThanOrEqual(1);
	});
});

describe('stateOf tolerates entries the Leitner ladder wrote', () => {
	it('defaults a card that has never been self-graded', () => {
		expect(stateOf(undefined)).toEqual(newState());
	});

	it('can start mid-life, so switching the setting on schedules rather than refuses', () => {
		expect(days(schedule(stateOf({}), 'good', NOW))).toBe(1);
	});

	it('repairs a corrupt ease instead of propagating NaN', () => {
		expect(stateOf({ ease: NaN }).ease).toBe(DEFAULT_EASE);
		expect(stateOf({ ease: 0 }).ease).toBe(MIN_EASE);
	});

	it('repairs negative counters', () => {
		expect(stateOf({ interval: -5, reps: -2 })).toMatchObject({ interval: 0, reps: 0 });
	});
});

describe('formatInterval', () => {
	it.each([
		[10 * 60_000, '10m'],
		[DAY, '1d'],
		[3 * DAY, '3d'],
		[14 * DAY, '2w'],
		[60 * DAY, '2mo'],
		[365 * DAY, '1.0y']
	])('renders %ims as %s', (ms, expected) => {
		expect(formatInterval(ms)).toBe(expected);
	});
});

describe('previewGrades', () => {
	it('labels all three buttons for a new card', () => {
		expect(previewGrades(undefined, NOW)).toEqual({ again: '10m', good: '1d', easy: '4d' });
	});

	it('always offers more spacing for easy than for good', () => {
		const s = run(['good', 'good', 'good']);
		expect(schedule(s, 'easy', NOW).due).toBeGreaterThan(schedule(s, 'good', NOW).due);
	});

	it('previews without mutating the card', () => {
		const s = run(['good']);
		const before = { ...s };
		previewGrades(s, NOW);
		expect(s).toEqual(before);
	});
});
