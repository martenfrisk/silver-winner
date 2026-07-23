import { describe, expect, it } from 'vitest';
import { course } from '$lib/data/course';
import { buildReaderQueue, readerStarsKey, unitVocab } from './reader-session';

describe('unitVocab', () => {
	it('collects every unit’s learn exercises, deduped', () => {
		for (const unit of course) {
			const vocab = unitVocab(unit);
			expect(vocab.length).toBeGreaterThan(0);
			expect(new Set(vocab.map((v) => v.my)).size).toBe(vocab.length);
		}
	});
});

describe('buildReaderQueue', () => {
	it('builds a script-only session for every unit — no romanization anywhere', () => {
		for (const unit of course) {
			const queue = buildReaderQueue(unit);
			expect(queue.length).toBeGreaterThanOrEqual(Math.min(unitVocab(unit).length, 12));
			for (const ex of queue) {
				expect(ex.correct).toBeGreaterThanOrEqual(0);
				expect(ex.correct).toBeLessThan(ex.options.length);
				// The whole point of the track: options never carry roman subs.
				for (const o of ex.options) expect(o.sub).toBeUndefined();
				if (ex.kind === 'choice') expect(ex.promptRoman).toBeUndefined();
				// Options are distinct, so the answer is unambiguous.
				const texts = ex.options.map((o) => o.text);
				expect(new Set(texts).size).toBe(texts.length);
				// A listening drill's answer is the script it played, or — in the
				// comprehension form — the meaning of it.
				if (ex.kind === 'listen')
					expect(texts).toContain(ex.optionLang === 'en' ? ex.en : ex.my);
			}
		}
	});

	it('rotates the four drill forms', () => {
		const queue = buildReaderQueue(course[0]);
		expect(queue.some((ex) => ex.kind === 'listen' && ex.optionLang !== 'en')).toBe(true);
		expect(queue.some((ex) => ex.kind === 'listen' && ex.optionLang === 'en')).toBe(true);
		expect(queue.some((ex) => ex.kind === 'choice' && ex.promptMy)).toBe(true);
		expect(queue.some((ex) => ex.kind === 'choice' && !ex.promptMy)).toBe(true);
	});
});

describe('readerStarsKey', () => {
	it('never collides with course lesson ids', () => {
		const lessonIds = new Set(course.flatMap((u) => u.lessons.map((l) => l.id)));
		for (const unit of course) expect(lessonIds.has(readerStarsKey(unit.id))).toBe(false);
	});
});
