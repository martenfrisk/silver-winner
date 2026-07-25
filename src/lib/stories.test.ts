import { describe, expect, it } from 'vitest';
import { lineMy, stories, storiesForUnit, storyStarsKey } from '$lib/data/stories';
import { course } from '$lib/data/course';
import { lessonOrder } from '$lib/data/lesson-order';
import { vocabByMy } from './vocab-srs.svelte';

describe('stories data', () => {
	it('has unique ids and valid comprehension answers', () => {
		expect(new Set(stories.map((s) => s.id)).size).toBe(stories.length);
		for (const s of stories) {
			expect(s.check.correct).toBeGreaterThanOrEqual(0);
			expect(s.check.correct).toBeLessThan(s.check.options.length);
			expect(s.lines.length).toBeGreaterThanOrEqual(3);
		}
	});

	it('only requires lessons that exist in the course', () => {
		for (const s of stories)
			for (const id of s.requires) expect(lessonOrder).toContain(id);
	});

	it('is decodable: every chunk is course vocab or explicitly marked new', () => {
		// A chunk counts as known if it's a taught vocab item, a taught item plus
		// trailing particles, or pure digits/particles. Anything else must carry
		// isNew so the player flags it.
		const known = (my: string) =>
			vocabByMy.has(my) || /^[၀-၉]+$/.test(my) || my === 'ပါ';
		for (const s of stories) {
			for (const line of s.lines) {
				for (const chunk of line.chunks) {
					if (!chunk.isNew) expect(known(chunk.my), `${s.id}: ${chunk.my}`).toBe(true);
				}
			}
		}
	});

	it('never collides with course lesson ids in the stars map', () => {
		for (const s of stories) expect(lessonOrder).not.toContain(storyStarsKey(s.id));
	});

	it('lineMy joins chunks into the speakable line', () => {
		const first = stories[0].lines[0];
		expect(lineMy(first)).toBe(first.chunks.map((c) => c.my).join(' '));
	});
});

describe('storiesForUnit', () => {
	const unitOf = new Map<string, string>();
	for (const u of course) for (const l of u.lessons) unitOf.set(l.id, u.id);
	const forUnit = (id: string) =>
		storiesForUnit(id, (lid) => unitOf.get(lid), lessonOrder).map((s) => s.id);

	it('files each story under the unit that unlocks it, not its earliest prerequisite', () => {
		// teashop needs burmese-digits (unit 2) plus two food lessons (unit 4). It
		// belongs under food: that is where the learner is when it opens.
		expect(forUnit('food')).toContain('teashop');
		expect(forUnit('numbers')).not.toContain('teashop');
		// pagoda spans greetings and places; places comes later.
		expect(forUnit('places')).toContain('pagoda');
		expect(forUnit('greetings')).not.toContain('pagoda');
	});

	it('files a single-unit story under that unit', () => {
		expect(forUnit('greetings')).toEqual(['hello-shwe']);
	});

	it('gives every story exactly one home, so none is orphaned or duplicated', () => {
		const placed = course.flatMap((u) => forUnit(u.id));
		expect(placed.sort()).toEqual(stories.map((s) => s.id).sort());
	});

	it('returns nothing for a unit with no story', () => {
		expect(forUnit('real-talk')).toEqual([]);
	});
});
