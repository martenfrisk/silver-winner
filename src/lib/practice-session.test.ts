import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { allLessons } from '$lib/data/course';
import { buildVocabPracticeQueue, exerciseFor, isBuildable, starsFor } from './practice-session';
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

	it('rotates listen / listen-meaning / my→en / en→my at low boxes, correct index valid', () => {
		introduceLessons(3); // distractor pool
		const kinds = [0, 1, 2, 3].map((i) => exerciseFor(item, i, 0));
		expect(kinds.map((k) => k.kind)).toEqual(['listen', 'listen', 'choice', 'choice']);
		for (const ex of kinds) {
			if (ex.kind !== 'listen' && ex.kind !== 'choice') throw new Error('unexpected kind');
			expect(ex.correct).toBeGreaterThanOrEqual(0);
			expect(ex.correct).toBeLessThan(ex.options.length);
			const texts = ex.options.map((o) => o.text);
			expect(new Set(texts).size).toBe(texts.length);
		}
		// Slot 0 asks for the script, slot 1 asks for the meaning — the two
		// listening directions, distinguished by optionLang.
		if (kinds[0].kind === 'listen') {
			expect(kinds[0].optionLang).toBeUndefined();
			expect(kinds[0].options[kinds[0].correct].text).toBe(item.my);
		}
		if (kinds[1].kind === 'listen') {
			expect(kinds[1].optionLang).toBe('en');
			expect(kinds[1].options[kinds[1].correct].text).toBe(item.en);
		}
		if (kinds[2].kind === 'choice') expect(kinds[2].options[kinds[2].correct].text).toBe(item.en);
		if (kinds[3].kind === 'choice') expect(kinds[3].options[kinds[3].correct].text).toBe(item.my);
	});

	it('never puts script in the options of a comprehension drill', () => {
		introduceLessons(6);
		const MY = /[က-႟]/;
		for (const v of [...vocabByMy.values()].slice(0, 20)) {
			const ex = exerciseFor(v, 1, 0);
			if (ex.kind !== 'listen' || ex.optionLang !== 'en') continue;
			// A script option would hand a reader the answer without listening.
			for (const o of ex.options) expect(MY.test(o.text)).toBe(false);
		}
	});

	it('climbs to production at box 2–3: assemble tiles rebuild the word', () => {
		introduceLessons(3);
		const ex = exerciseFor(item, 0, 2);
		expect(ex.kind).toBe('assemble');
		if (ex.kind !== 'assemble') return;
		expect(ex.answer.map((a) => a.t).join('')).toBe(item.my);
		// Decoy tiles never duplicate answer tiles, so a correct build is unambiguous.
		const answerTiles = new Set(ex.answer.map((a) => a.t));
		for (const e of ex.extras) expect(answerTiles.has(e.t)).toBe(false);
	});

	it('script readers skip the recognition rung — production formats from box 0', () => {
		introduceLessons(3);
		// Same call that yields 'listen' for everyone else at box 0…
		expect(exerciseFor(item, 0, 0).kind).toBe('listen');
		// …starts at the production rung for script readers.
		expect(exerciseFor(item, 0, 0, 'script-reader').kind).toBe('assemble');
	});

	it('builds from syllable tiles, never bare vowel or tone marks', () => {
		introduceLessons(6);
		const school = vocabByMy.get('ကျောင်း')!;
		const ex = exerciseFor(school, 0, 2);
		expect(ex.kind).toBe('assemble');
		if (ex.kind !== 'assemble') return;
		// Grapheme-cluster tiles would give ["ကျေ","ာ","င်","း"] — three of them
		// unrenderable on their own, and reorderable into nonsense.
		expect(ex.answer.map((a) => a.t)).toEqual(['ကျောင်း']);
		const dependent = /^[ါ-ှ]/;
		for (const t of [...ex.answer, ...ex.extras]) expect(dependent.test(t.t)).toBe(false);
	});

	it('never asks for a long phrase to be built from memory', () => {
		introduceLessons(6);
		const thankYou = vocabByMy.get('ကျေးဇူးတင်ပါတယ်')!; // 5 syllables
		expect(isBuildable(thankYou)).toBe(false);
		// Every rung that would normally produce 'assemble' falls back instead.
		for (const box of [2, 3, 4]) {
			for (const i of [0, 1, 2]) {
				expect(exerciseFor(thankYou, i, box).kind).not.toBe('assemble');
			}
		}
		expect(exerciseFor(thankYou, 0, 0, 'script-reader').kind).not.toBe('assemble');
	});

	it('still builds short words at the production rung', () => {
		introduceLessons(6);
		const water = vocabByMy.get('ရေ')!;
		expect(isBuildable(water)).toBe(true);
		expect(exerciseFor(water, 0, 2).kind).toBe('assemble');
	});

	it('climbs to free recall at box 4, alternating with assemble', () => {
		introduceLessons(3);
		const a = exerciseFor(item, 0, 4);
		const b = exerciseFor(item, 1, 4);
		expect(a.kind).toBe('recall');
		expect(b.kind).toBe('assemble');
		if (a.kind === 'recall') {
			expect(a.my).toBe(item.my);
			expect(a.en).toBe(item.en);
		}
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
