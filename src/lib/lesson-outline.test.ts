import { describe, expect, it } from 'vitest';
import { allLessons, lessonSteps, stepStarsKey } from './data/course';
import { lessonOutline } from './lesson-outline';

const lessons = allLessons.map((l) => l.lesson);
const first = allLessons[0];
const fourPart = allLessons.find((l) => lessonSteps(l.lesson).length === 4)!;
const scriptOnly = allLessons.find((l) => l.lesson.scriptOnly)!;

describe('lessonOutline', () => {
	it('lists every part of the lesson, in order', () => {
		const o = lessonOutline(fourPart.lesson, fourPart.unit.title, {});
		expect(o.parts.map((p) => p.step)).toEqual([1, 2, 3, 4]);
		expect(o.parts.map((p) => p.label)).toEqual(['Part 1', 'Part 2', 'Part 3', 'Part 4']);
	});

	// The preview's promise is "these are the words you'll come away with",
	// so it has to count the same things the vocab index does — learn cards,
	// not drills, which repeat the same words several times over.
	it('counts only the words the lesson teaches, not the drills', () => {
		const o = lessonOutline(first.lesson, first.unit.title, {});
		const learnCards = first.lesson.exercises.filter((e) => e.kind === 'learn').length;
		expect(o.wordCount).toBe(learnCards);
		expect(o.wordCount).toBeLessThan(first.lesson.exercises.length);
	});

	it('carries stars through per part, so a preview shows what is done', () => {
		const stars = { [stepStarsKey(fourPart.lesson.id, 2)]: 3 };
		const o = lessonOutline(fourPart.lesson, fourPart.unit.title, stars);
		expect(o.parts[1]).toMatchObject({ step: 2, stars: 3, done: true });
		expect(o.parts[0]).toMatchObject({ step: 1, stars: 0, done: false });
	});

	// A scriptOnly lesson has no `roman` to leak, and the preview renders the
	// same words as the lesson — so if one ever appeared here it would be a
	// romanization the learner was promised they would not be shown.
	it('never carries romanization out of a scriptOnly lesson', () => {
		const o = lessonOutline(scriptOnly.lesson, scriptOnly.unit.title, {});
		expect(o.scriptOnly).toBe(true);
		for (const p of o.parts) for (const w of p.words) expect(w.roman).toBeUndefined();
	});

	it('every lesson in the course produces a non-empty outline', () => {
		for (const { lesson, unit } of allLessons) {
			const o = lessonOutline(lesson, unit.title, {});
			expect(o.wordCount, lesson.id).toBeGreaterThan(0);
			expect(o.parts.length, lesson.id).toBe(lessonSteps(lesson).length);
		}
	});

	it('reports the unit it belongs to, since the sheet has no other context', () => {
		const o = lessonOutline(first.lesson, first.unit.title, {});
		expect(o.unitTitle).toBe(first.unit.title);
		expect(lessons).toContain(first.lesson);
	});
});
