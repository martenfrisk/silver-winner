import { describe, expect, it } from 'vitest';
import { primaryTrack, suggestFor, tracks, type SuggestState } from './tracks';

const fullState: SuggestState = {
	vocabDue: 3,
	glyphsDue: 5,
	nextLesson: { id: 'first-words', title: 'First words' },
	nextReaderUnit: { id: 'greetings', title: 'Greetings' },
	nextScriptUnit: { id: 'first-letters', title: 'First letters' },
	uncrownedLesson: { id: 'first-words', title: 'First words' }
};

describe('primaryTrack', () => {
	it('routes each profile to its natural starting corner', () => {
		expect(primaryTrack('beginner')).toBe('course');
		expect(primaryTrack('explorer')).toBe('course');
		expect(primaryTrack(null)).toBe('course');
		expect(primaryTrack('script-reader')).toBe('reader');
		expect(primaryTrack('speaker')).toBe('script');
	});

	it('every primary is a real track', () => {
		const ids = new Set(tracks.map((t) => t.id));
		for (const p of ['beginner', 'script-reader', 'speaker', 'explorer', null] as const)
			expect(ids.has(primaryTrack(p))).toBe(true);
	});
});

describe('suggestFor', () => {
	it('beginners keep the classic order: due words first', () => {
		expect(suggestFor('beginner', fullState).href).toBe('/practice');
		expect(suggestFor(null, fullState).href).toBe('/practice');
	});

	it('speakers put script work first', () => {
		expect(suggestFor('speaker', fullState).href).toBe('/script/practice');
		// No due glyphs → the next script unit, still ahead of word work.
		expect(suggestFor('speaker', { ...fullState, glyphsDue: 0 }).href).toBe('/script');
	});

	it('script readers put reading ahead of glyph drills', () => {
		const s = suggestFor('script-reader', { ...fullState, vocabDue: 0 });
		expect(s.href).toBe('/reader/greetings');
	});

	it('falls back to a practice round when nothing else applies', () => {
		const empty: SuggestState = { vocabDue: 0, glyphsDue: 0 };
		expect(suggestFor('beginner', empty).href).toBe('/practice');
		expect(suggestFor('speaker', empty).href).toBe('/practice');
	});
});
