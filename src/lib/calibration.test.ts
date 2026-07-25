import { describe, expect, it } from 'vitest';
import {
	ASK_MAX_BOX,
	ASK_MIN_BOX,
	EXPIRE_AFTER_MS,
	MAX_ASKS_PER_SESSION,
	MIN_FOR_LEAN,
	RESOLVE_AFTER_MS,
	describeLean,
	isExpired,
	isResolvable,
	shouldAsk,
	summarize,
	verdictLine,
	type Resolved
} from './calibration';

const T0 = new Date('2026-07-25T09:00:00Z').getTime();
const ask = (o: Partial<Parameters<typeof shouldAsk>[0]> = {}) =>
	shouldAsk({ correct: true, box: 2, hasPending: false, askedThisSession: 0, rand: 0, ...o });

describe('shouldAsk', () => {
	it('asks after a correct answer on a mid-box item', () => {
		expect(ask()).toBe(true);
	});

	it('never asks after a miss', () => {
		// "Will you still know this tomorrow?" presumes you know it now.
		expect(ask({ correct: false })).toBe(false);
	});

	it('skips boxes where the answer is rhetorical', () => {
		expect(ask({ box: ASK_MIN_BOX - 1 })).toBe(false); // brand new
		expect(ask({ box: ASK_MAX_BOX + 1 })).toBe(false); // mastered
		expect(ask({ box: ASK_MIN_BOX })).toBe(true);
		expect(ask({ box: ASK_MAX_BOX })).toBe(true);
	});

	it('does not stack a second prediction on the same item', () => {
		expect(ask({ hasPending: true })).toBe(false);
	});

	it('caps how often it interrupts one session', () => {
		expect(ask({ askedThisSession: MAX_ASKS_PER_SESSION - 1 })).toBe(true);
		expect(ask({ askedThisSession: MAX_ASKS_PER_SESSION })).toBe(false);
	});

	it('is occasional, not every eligible item', () => {
		expect(ask({ rand: 0.99 })).toBe(false);
	});
});

describe('resolution timing', () => {
	const pending = { id: 'x', said: true, at: T0, box: 2 };

	it('will not resolve on a review too soon to mean anything', () => {
		// Answering again twenty minutes later says nothing about tomorrow.
		expect(isResolvable(pending, T0 + 20 * 60_000)).toBe(false);
		expect(isResolvable(pending, T0 + RESOLVE_AFTER_MS - 1)).toBe(false);
	});

	it('resolves once a night has passed', () => {
		expect(isResolvable(pending, T0 + RESOLVE_AFTER_MS)).toBe(true);
	});

	it('expires a prediction the learner never came back to', () => {
		expect(isExpired(pending, T0 + EXPIRE_AFTER_MS - 1)).toBe(false);
		expect(isExpired(pending, T0 + EXPIRE_AFTER_MS)).toBe(true);
	});
});

describe('summarize', () => {
	const r = (said: boolean, ok: boolean): Resolved => ({ said, ok, at: T0 });

	it('reports nothing useful from an empty history', () => {
		const s = summarize([]);
		expect(s).toMatchObject({ resolved: 0, right: 0, accuracy: 0, lean: 'unknown' });
	});

	it('counts matches, overshoots and undershoots', () => {
		const s = summarize([r(true, true), r(true, false), r(false, true), r(false, false)]);
		expect(s.resolved).toBe(4);
		expect(s.right).toBe(2); // said-yes-knew, said-no-missed
		expect(s.overshoot).toBe(1);
		expect(s.undershoot).toBe(1);
		expect(s.accuracy).toBe(0.5);
	});

	it('withholds a lean until there is enough to go on', () => {
		const few = Array.from({ length: MIN_FOR_LEAN - 1 }, () => r(true, false));
		expect(summarize(few).lean).toBe('unknown');
	});

	it('calls out overconfidence when the misses are lopsided', () => {
		const s = summarize([
			r(true, false),
			r(true, false),
			r(true, false),
			r(true, false),
			r(true, true),
			r(false, false)
		]);
		expect(s.lean).toBe('overconfident');
	});

	it('calls out underconfidence the same way', () => {
		const s = summarize([
			r(false, true),
			r(false, true),
			r(false, true),
			r(false, true),
			r(true, true),
			r(false, false)
		]);
		expect(s.lean).toBe('underconfident');
	});

	it('treats a near-even split as calibrated rather than picking a side', () => {
		const s = summarize([
			r(true, false),
			r(false, true),
			r(true, true),
			r(false, false),
			r(true, true),
			r(true, false)
		]);
		expect(s.lean).toBe('calibrated');
	});
});

describe('copy', () => {
	it('describeLean counts down while the sample is thin', () => {
		expect(describeLean(summarize([]))).toContain(String(MIN_FOR_LEAN));
	});

	it('verdictLine covers all four outcomes distinctly', () => {
		const lines = new Set([
			verdictLine(true, true),
			verdictLine(true, false),
			verdictLine(false, true),
			verdictLine(false, false)
		]);
		expect(lines.size).toBe(4);
	});
});
