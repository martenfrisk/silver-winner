import { describe, expect, it } from 'vitest';
import { allLessons, lessonSteps, stepStarsKey, type Lesson } from './data/course';
import {
	lessonRounds,
	nextOpenRound,
	nextPartOf,
	openRoundCount,
	roundHref,
	roundsOf
} from './rounds';

const lessons = allLessons.map((l) => l.lesson);
/** A real multi-part lesson from the course, so the fixtures can't drift from the content. */
const lesson: Lesson = lessons.find((l) => lessonSteps(l).length === 3)!;
const twoPart: Lesson = lessons.find((l) => lessonSteps(l).length === 2)!;

const cleared = (l: Lesson, ...steps: number[]) =>
	Object.fromEntries(steps.map((s) => [stepStarsKey(l.id, s as 1 | 2 | 3), 3]));

describe('the course really is mostly parts', () => {
	// Guards the premise of this whole module: if a content edit ever left the
	// lessons single-part, the path UI below would be dead weight.
	it('gives every lesson more than one part', () => {
		for (const l of lessons) expect(lessonSteps(l).length, l.id).toBeGreaterThan(1);
	});
});

describe('roundHref', () => {
	it('leaves part 1 on the bare lesson URL, so old links stay correct', () => {
		expect(roundHref('first-words', 1)).toBe('/lesson/first-words');
	});

	it('addresses deeper parts by step', () => {
		expect(roundHref('first-words', 3)).toBe('/lesson/first-words?step=3');
	});
});

describe('lessonRounds', () => {
	it('lists every part of the lesson, not just the finished ones', () => {
		const rounds = lessonRounds(lesson, {}, true);
		expect(rounds.map((r) => r.step)).toEqual([1, 2, 3]);
	});

	it('marks only part 1 as required', () => {
		const rounds = lessonRounds(lesson, {}, true);
		expect(rounds.filter((r) => r.required).map((r) => r.step)).toEqual([1]);
	});

	it('locks the deeper parts until part 1 is done', () => {
		const rounds = lessonRounds(lesson, {}, true);
		expect(rounds.map((r) => r.unlocked)).toEqual([true, false, false]);
	});

	it('opens every deeper part at once when part 1 lands', () => {
		// Part 3 does not wait on part 2: the parts are siblings, not a ladder.
		const rounds = lessonRounds(lesson, cleared(lesson, 1), true);
		expect(rounds.map((r) => r.unlocked)).toEqual([true, true, true]);
	});

	it('keeps part 1 shut while the lesson itself is locked', () => {
		expect(lessonRounds(lesson, {}, false)[0].unlocked).toBe(false);
	});

	it('carries each part’s own stars', () => {
		const rounds = lessonRounds(lesson, { [stepStarsKey(lesson.id, 2)]: 2 }, true);
		expect(rounds[1]).toMatchObject({ stars: 2, done: true });
		expect(rounds[2]).toMatchObject({ stars: 0, done: false });
	});
});

describe('roundsOf', () => {
	it('counts finished parts against the lesson’s own total', () => {
		expect(roundsOf(lesson, cleared(lesson, 1, 3))).toEqual({ done: 2, total: 3 });
		expect(roundsOf(twoPart, {})).toEqual({ done: 0, total: 2 });
	});
});

describe('nextOpenRound', () => {
	it('offers nothing before any lesson is started', () => {
		expect(nextOpenRound(lessons, {})).toBeUndefined();
	});

	it('offers part 2 of a lesson whose part 1 is done', () => {
		const next = nextOpenRound(lessons, cleared(lessons[0], 1));
		expect(next).toMatchObject({ lessonId: lessons[0].id, step: 2, label: 'Part 2' });
	});

	it('moves on to part 3 once part 2 is cleared', () => {
		const next = nextOpenRound(lessons, cleared(lessons[0], 1, 2));
		expect(next).toMatchObject({ step: 3 });
	});

	// The point of course order: a part skipped early keeps being offered
	// rather than being buried under everything done since.
	it('goes back for an earlier lesson’s unfinished part', () => {
		const stars = { ...cleared(lessons[0], 1), ...cleared(lessons[1], 1, 2, 3) };
		expect(nextOpenRound(lessons, stars)).toMatchObject({ lessonId: lessons[0].id, step: 2 });
	});

	it('never points at a part that would open locked', () => {
		// Lesson 2 untouched, so its parts must not be offered.
		const next = nextOpenRound(lessons, cleared(lessons[0], 1, 2, 3));
		expect(next?.lessonId).not.toBe(lessons[1].id);
	});

	it('offers nothing once every started lesson is exhausted', () => {
		expect(nextOpenRound([lessons[0]], cleared(lessons[0], 1, 2, 3))).toBeUndefined();
	});
});

describe('openRoundCount', () => {
	it('is zero before anything is started', () => {
		expect(openRoundCount(lessons, {})).toBe(0);
	});

	it('counts only the parts of lessons already begun', () => {
		expect(openRoundCount(lessons, cleared(lessons[0], 1))).toBe(lessonSteps(lessons[0]).length - 1);
	});

	it('drops as parts are finished', () => {
		expect(openRoundCount([lessons[0]], cleared(lessons[0], 1, 2))).toBe(
			lessonSteps(lessons[0]).length - 2
		);
	});
});

describe('nextPartOf', () => {
	it('offers the next part straight after finishing one', () => {
		expect(nextPartOf(lesson, 1, cleared(lesson, 1))).toMatchObject({ step: 2, label: 'Part 2' });
	});

	it('skips a part the learner already cleared', () => {
		expect(nextPartOf(lesson, 1, cleared(lesson, 1, 2))).toBeUndefined();
	});

	it('offers nothing after the last part', () => {
		expect(nextPartOf(lesson, 3, cleared(lesson, 1, 2, 3))).toBeUndefined();
		expect(nextPartOf(twoPart, 2, cleared(twoPart, 1, 2))).toBeUndefined();
	});
});
