import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { allLessons, course, stepExercises, type LessonStep } from '$lib/data/course';
import { vocabSrs, vocabByMy, VOCAB_MAX_BOX } from './vocab-srs.svelte';

const T0 = new Date('2026-01-01T12:00:00Z').getTime();
const firstLesson = allLessons[0].lesson;
const firstVocab = [...vocabByMy.values()].filter((v) => v.lessonId === firstLesson.id);

/** The learn words of one step of a lesson, in course order. */
function stepVocab(lesson: typeof firstLesson, step: LessonStep): string[] {
	return stepExercises(lesson, step)
		.filter((ex) => ex.kind === 'learn')
		.map((ex) => (ex as Extract<typeof ex, { kind: 'learn' }>).my);
}

beforeEach(() => {
	vocabSrs.reset();
	vi.useFakeTimers();
	vi.setSystemTime(T0);
});

afterEach(() => {
	vi.useRealTimers();
	vocabSrs.reset();
});

describe('introduceLesson', () => {
	it('seeds every learn word of step 1 at box 1', () => {
		const step1 = stepVocab(firstLesson, 1);
		expect(step1.length).toBeGreaterThan(0);
		vocabSrs.introduceLesson(firstLesson.id);
		for (const my of step1) expect(vocabSrs.box(my)).toBe(1);
		expect(vocabSrs.introducedCount).toBe(step1.length);
	});

	// Steps 2 and 3 are optional depth. Their words must not appear in the
	// review queue before the learner has actually met them.
	it('leaves deeper steps alone until that step is finished', () => {
		const step2 = stepVocab(firstLesson, 2);
		expect(step2.length).toBeGreaterThan(0); // guards the fixture, not the code

		vocabSrs.introduceLesson(firstLesson.id, 1);
		for (const my of step2) expect(vocabSrs.box(my)).toBe(-1);

		vocabSrs.introduceLesson(firstLesson.id, 2);
		for (const my of step2) expect(vocabSrs.box(my)).toBe(1);
	});

	it('never files the same word under two steps', () => {
		const seen = new Set<string>();
		for (const { lesson } of allLessons) {
			for (const step of [1, 2, 3, 4] as LessonStep[]) {
				for (const my of stepVocab(lesson, step)) {
					expect(seen.has(`${lesson.id}:${my}`)).toBe(false);
					seen.add(`${lesson.id}:${my}`);
				}
			}
		}
	});

	it('is a no-op for unknown lessons', () => {
		vocabSrs.introduceLesson('nope');
		expect(vocabSrs.introducedCount).toBe(0);
	});
});

describe('grade', () => {
	const word = firstVocab[0].my;

	it('escalates to mastery and demotes on lapses', () => {
		vocabSrs.introduceLesson(firstLesson.id);
		for (let i = 0; i < 10; i++) vocabSrs.grade(word, true);
		expect(vocabSrs.box(word)).toBe(VOCAB_MAX_BOX);
		expect(vocabSrs.masteredCount).toBe(1);
		vocabSrs.grade(word, false);
		expect(vocabSrs.box(word)).toBe(VOCAB_MAX_BOX - 1);
		expect(vocabSrs.dueIds()).toContain(word);
	});

	it('missing a word puts it at the front of the mistakes list; getting it right clears it', () => {
		vocabSrs.introduceLesson(firstLesson.id);
		vocabSrs.grade(word, false);
		expect(vocabSrs.mistakes[0]).toBe(word);
		vocabSrs.grade(word, true);
		expect(vocabSrs.mistakes).not.toContain(word);
	});
});

describe('recordMistake', () => {
	it('records mappable words, dedupes, newest first', () => {
		const [a, b] = [firstVocab[0].my, firstVocab[1].my];
		vocabSrs.recordMistake(a);
		vocabSrs.recordMistake(b);
		vocabSrs.recordMistake(a);
		expect(vocabSrs.mistakes).toEqual([a, b]);
	});

	it('skips strings that are not course vocabulary', () => {
		vocabSrs.recordMistake('not-a-word');
		expect(vocabSrs.mistakes).toHaveLength(0);
	});

	it('caps the list at 20', () => {
		const words = [...vocabByMy.keys()].slice(0, 25);
		expect(words.length).toBeGreaterThan(20);
		for (const w of words) vocabSrs.recordMistake(w);
		expect(vocabSrs.mistakes).toHaveLength(20);
	});
});

describe('introduceUnit (the reader track)', () => {
	// The reader track reads a whole course unit, but used to introduce none of
	// its words — so a learner who only ever read ended up with an empty review
	// deck and no reason to come back.
	const unit = course[0];
	const unitWords = unit.lessons.flatMap((l) =>
		stepExercises(l, 1).filter((ex) => ex.kind === 'learn').map((ex) => ex.my)
	);

	it('seeds every step-1 word in the unit, across all its lessons', () => {
		vocabSrs.reset();
		expect(vocabSrs.introducedCount).toBe(0);
		vocabSrs.introduceUnit(unit.id);
		for (const my of unitWords) expect(vocabSrs.isIntroduced(my), my).toBe(true);
		expect(unitWords.length).toBeGreaterThan(1);
	});

	it('leaves other units alone', () => {
		vocabSrs.reset();
		vocabSrs.introduceUnit(unit.id);
		const otherWord = stepExercises(course[1].lessons[0], 1).find((ex) => ex.kind === 'learn');
		if (otherWord) expect(vocabSrs.isIntroduced(otherWord.my)).toBe(false);
	});

	it('does not disturb a word already being reviewed', () => {
		vocabSrs.reset();
		vocabSrs.introduceUnit(unit.id);
		const [first] = unitWords;
		vocabSrs.grade(first, true);
		const box = vocabSrs.box(first);
		vocabSrs.introduceUnit(unit.id); // re-reading the unit
		expect(vocabSrs.box(first)).toBe(box);
	});

	it('ignores an unknown unit rather than throwing', () => {
		vocabSrs.reset();
		expect(() => vocabSrs.introduceUnit('no-such-unit')).not.toThrow();
		expect(vocabSrs.introducedCount).toBe(0);
	});
});

describe('gradeSelf (self-graded review)', () => {
	const DAY = 86_400_000;
	let word: string;

	beforeEach(() => {
		word = firstVocab[0].my;
		vocabSrs.introduceLesson(firstLesson.id);
	});

	it('schedules by SM-2 rather than the box intervals', () => {
		// The Leitner ladder would put a box-2 item exactly 1 day out; SM-2's
		// second fixed step is 6 days. Grading twice reaches it.
		vocabSrs.gradeSelf(word, 'good');
		vocabSrs.gradeSelf(word, 'good');
		expect(vocabSrs.entries[word].due - T0).toBe(6 * DAY);
	});

	it('brings a lapse back inside the session', () => {
		vocabSrs.gradeSelf(word, 'again');
		expect(vocabSrs.entries[word].due - T0).toBe(10 * 60_000);
	});

	it('persists the SM-2 state alongside the box', () => {
		vocabSrs.gradeSelf(word, 'easy');
		expect(vocabSrs.entries[word]).toMatchObject({ reps: 1, interval: 4 });
		expect(vocabSrs.entries[word].ease).toBeGreaterThan(2.5);
	});

	// The box drives the exercise format in guided review, so a learner who
	// switches the setting off must not land back on beginner recognition
	// drills for words they have been reviewing for months.
	it('keeps the box moving so guided review stays in step', () => {
		const before = vocabSrs.box(word);
		vocabSrs.gradeSelf(word, 'good');
		expect(vocabSrs.box(word)).toBe(before + 1);
		vocabSrs.gradeSelf(word, 'again');
		expect(vocabSrs.box(word)).toBe(before);
	});

	it('never pushes the box past the top', () => {
		for (let i = 0; i < 10; i++) vocabSrs.gradeSelf(word, 'good');
		expect(vocabSrs.box(word)).toBe(VOCAB_MAX_BOX);
	});

	it('counts a lapse and clears it on a hit, like the app-graded path', () => {
		vocabSrs.gradeSelf(word, 'again');
		expect(vocabSrs.entries[word].lapses).toBe(1);
		expect(vocabSrs.mistakes).toContain(word);
		vocabSrs.gradeSelf(word, 'good');
		expect(vocabSrs.mistakes).not.toContain(word);
	});

	it('can pick up a word the app graded first, without resetting it', () => {
		vocabSrs.grade(word, true); // guided review, no SM-2 state written
		expect(vocabSrs.entries[word].reps).toBeUndefined();
		vocabSrs.gradeSelf(word, 'good');
		// Starts the SM-2 ladder from the bottom but keeps the box it earned.
		expect(vocabSrs.entries[word]).toMatchObject({ reps: 1, interval: 1 });
		expect(vocabSrs.box(word)).toBe(3);
	});

	it('grades a word it has never seen rather than throwing', () => {
		vocabSrs.reset();
		expect(() => vocabSrs.gradeSelf(word, 'good')).not.toThrow();
		expect(vocabSrs.isIntroduced(word)).toBe(true);
	});
});
