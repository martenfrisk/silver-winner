import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { allLessons } from '$lib/data/course';
import { vocabSrs, vocabByMy, VOCAB_MAX_BOX } from './vocab-srs.svelte';

const T0 = new Date('2026-01-01T12:00:00Z').getTime();
const firstLesson = allLessons[0].lesson;
const firstVocab = [...vocabByMy.values()].filter((v) => v.lessonId === firstLesson.id);

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
	it('seeds every learn word of the lesson at box 1', () => {
		expect(firstVocab.length).toBeGreaterThan(0);
		vocabSrs.introduceLesson(firstLesson.id);
		for (const v of firstVocab) expect(vocabSrs.box(v.my)).toBe(1);
		expect(vocabSrs.introducedCount).toBe(firstVocab.length);
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
