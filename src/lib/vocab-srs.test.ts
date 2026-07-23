import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { allLessons, stepExercises, type LessonStep } from '$lib/data/course';
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
			for (const step of [1, 2, 3] as LessonStep[]) {
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
