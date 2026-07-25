import { describe, expect, it } from 'vitest';
import {
	BUILDER_RUN,
	COMBO_BONUS_AT,
	STAR_BONUS_AT,
	sessionXp,
	type SessionKind
} from './xp';

const KINDS: SessionKind[] = ['teach', 'review', 'lab'];

describe('sessionXp', () => {
	it('pays teaching double the first time and standard on a replay', () => {
		expect(sessionXp({ kind: 'teach', firstTime: true })).toBe(20);
		expect(sessionXp({ kind: 'teach', firstTime: false })).toBe(10);
	});

	it('does not give a first-time bonus to reviewing or labs', () => {
		// Only meeting material is the scarce event; a first drill is not.
		expect(sessionXp({ kind: 'review', firstTime: true })).toBe(10);
		expect(sessionXp({ kind: 'lab', firstTime: true })).toBe(10);
	});

	it('applies the same bonuses to every kind', () => {
		for (const kind of KINDS) {
			const bare = sessionXp({ kind });
			expect(sessionXp({ kind, stars: STAR_BONUS_AT }) - bare, kind).toBe(5);
			expect(sessionXp({ kind, maxCombo: COMBO_BONUS_AT }) - bare, kind).toBe(5);
			expect(sessionXp({ kind, crowned: true }) - bare, kind).toBe(10);
		}
	});

	it('only pays the star bonus for a perfect finish', () => {
		expect(sessionXp({ kind: 'review', stars: STAR_BONUS_AT - 1 })).toBe(10);
		expect(sessionXp({ kind: 'review', stars: STAR_BONUS_AT })).toBe(15);
	});

	it('only pays the combo bonus once the streak is long enough', () => {
		expect(sessionXp({ kind: 'review', maxCombo: COMBO_BONUS_AT - 1 })).toBe(10);
		expect(sessionXp({ kind: 'review', maxCombo: COMBO_BONUS_AT })).toBe(15);
		// A longer combo is not worth more; it is a threshold, not a multiplier.
		expect(sessionXp({ kind: 'review', maxCombo: 50 })).toBe(15);
	});

	it('stacks every bonus on a perfect crowned run', () => {
		expect(
			sessionXp({ kind: 'teach', firstTime: true, stars: 3, maxCombo: 9, crowned: true })
		).toBe(40);
	});

	it('treats missing fields as no bonus rather than throwing', () => {
		for (const kind of KINDS) expect(sessionXp({ kind }), kind).toBe(10);
	});

	it('never returns less than the base for its kind', () => {
		for (const kind of KINDS) {
			expect(sessionXp({ kind, stars: 0, maxCombo: 0, crowned: false })).toBe(10);
		}
	});

	it('keeps maintenance from out-earning progress', () => {
		// The property the table exists to guarantee: no review or lab run can
		// beat first-time teaching on equal terms.
		const best = { stars: 3, maxCombo: 10 };
		expect(sessionXp({ kind: 'review', ...best })).toBeLessThan(
			sessionXp({ kind: 'teach', firstTime: true, ...best })
		);
		expect(sessionXp({ kind: 'lab', ...best })).toBeLessThan(
			sessionXp({ kind: 'teach', firstTime: true, ...best })
		);
	});

	it('caps what an unbounded sandbox can pay', () => {
		// The builder used to pay 2 XP per correct build with no cap. A whole
		// run must now be worth no more than any other lab session.
		expect(BUILDER_RUN).toBeGreaterThan(1);
		expect(sessionXp({ kind: 'lab' })).toBe(10);
		expect(2 * BUILDER_RUN).toBeGreaterThan(sessionXp({ kind: 'lab' }));
	});
});
