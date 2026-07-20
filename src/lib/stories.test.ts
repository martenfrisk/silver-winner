import { describe, expect, it } from 'vitest';
import { lineMy, stories, storyStarsKey } from '$lib/data/stories';
import { lessonOrder } from '$lib/data/course';
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
