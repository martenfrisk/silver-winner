import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { allLessons } from '$lib/data/course';
import { buildVocabPracticeQueue, exerciseFor, starsFor } from './practice-session';
import { vocabSrs, vocabByMy } from './vocab-srs.svelte';

const T0 = new Date('2026-01-01T12:00:00Z').getTime();

beforeEach(() => {
	vocabSrs.reset();
	vi.useFakeTimers();
	vi.setSystemTime(T0);
});

afterEach(() => {
	vi.useRealTimers();
	vocabSrs.reset();
});

function introduceLessons(n: number) {
	for (const { lesson } of allLessons.slice(0, n)) vocabSrs.introduceLesson(lesson.id);
}

describe('exerciseFor', () => {
	const item = [...vocabByMy.values()][0];

	it('rotates listen / my→en / en→my and keeps the correct index valid', () => {
		introduceLessons(3); // distractor pool
		const kinds = [0, 1, 2].map((i) => exerciseFor(item, i));
		expect(kinds[0].kind).toBe('listen');
		expect(kinds[1].kind).toBe('choice');
		expect(kinds[2].kind).toBe('choice');
		for (const ex of kinds) {
			expect(ex.correct).toBeGreaterThanOrEqual(0);
			expect(ex.correct).toBeLessThan(ex.options.length);
			const texts = ex.options.map((o) => o.text);
			expect(new Set(texts).size).toBe(texts.length);
		}
		if (kinds[0].kind === 'listen') expect(kinds[0].options[kinds[0].correct].text).toBe(item.my);
		if (kinds[1].kind === 'choice') expect(kinds[1].options[kinds[1].correct].text).toBe(item.en);
		if (kinds[2].kind === 'choice') expect(kinds[2].options[kinds[2].correct].text).toBe(item.my);
	});
});

describe('buildVocabPracticeQueue', () => {
	it('is empty with nothing introduced', () => {
		expect(buildVocabPracticeQueue()).toHaveLength(0);
	});

	it('puts recent mistakes first', () => {
		introduceLessons(3);
		const someWord = [...vocabByMy.values()][5].my;
		vocabSrs.recordMistake(someWord);
		const queue = buildVocabPracticeQueue();
		expect(queue[0].my).toBe(someWord);
	});

	it('tops up to at least 8 items when enough vocab exists, capped at 12', () => {
		introduceLessons(4);
		const queue = buildVocabPracticeQueue();
		expect(queue.length).toBeGreaterThanOrEqual(8);
		expect(queue.length).toBeLessThanOrEqual(12);
		// No duplicate items in one session.
		expect(new Set(queue.map((q) => q.my)).size).toBe(queue.length);
	});

	it('every generated exercise grades the item it was built from', () => {
		introduceLessons(3);
		for (const { my, ex } of buildVocabPracticeQueue()) {
			if (ex.kind === 'listen') expect(ex.my).toBe(my);
			else if (ex.kind === 'choice') {
				const item = vocabByMy.get(my)!;
				const correctText = ex.options[ex.correct].text;
				expect([item.my, item.en]).toContain(correctText);
			}
		}
	});
});

describe('starsFor', () => {
	it('3 for perfect, 2 for ≤2 mistakes, else 1', () => {
		expect(starsFor(0)).toBe(3);
		expect(starsFor(2)).toBe(2);
		expect(starsFor(5)).toBe(1);
	});
});
