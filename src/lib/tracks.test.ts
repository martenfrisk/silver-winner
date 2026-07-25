import { describe, expect, it } from 'vitest';
import { canSkipUnit, nextUp, primaryTrack, suggestFor, tracks, type SuggestState } from './tracks';

const fullState: SuggestState = {
	vocabDue: 3,
	glyphsDue: 5,
	nextLesson: { id: 'first-words', title: 'First words' },
	nextReaderUnit: { id: 'greetings', title: 'Greetings' },
	nextScriptUnit: { id: 'first-letters', title: 'First letters' },
	uncrownedLesson: { id: 'first-words', title: 'First words' }
};

describe('canSkipUnit', () => {
	it('lets the profiles that read the script skip the script unit', () => {
		expect(canSkipUnit('script-reader', 'script')).toBe(true);
		expect(canSkipUnit('speaker', 'script')).toBe(true);
	});

	it('offers nothing to profiles that are here to learn the script', () => {
		expect(canSkipUnit('beginner', 'script')).toBe(false);
		expect(canSkipUnit('explorer', 'script')).toBe(false);
		expect(canSkipUnit(null, 'script')).toBe(false);
	});

	it('never opens up units nobody claimed to know', () => {
		for (const unit of ['greetings', 'numbers', 'food', 'family', 'places', 'time'])
			expect(canSkipUnit('speaker', unit)).toBe(false);
	});
});

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

describe('nextUp: the one hero action', () => {
	const base: SuggestState = { vocabDue: 0, glyphsDue: 0 };
	const lesson = { id: 'first-words', title: 'First words' };

	it('is always answerable, even for a learner with nothing at all', () => {
		// Today renders this unconditionally now, including at xp === 0.
		const n = nextUp(null, base);
		expect(n.href).toBeTruthy();
		expect(n.title).toBeTruthy();
	});

	it('leads with due words, and points at the review hub not a runner', () => {
		const n = nextUp('beginner', { ...base, vocabDue: 6, nextLesson: lesson });
		expect(n.href).toBe('/review');
		expect(n.sub).toContain('6');
	});

	it('lets a speaker clear letters before words', () => {
		const n = nextUp('speaker', { ...base, vocabDue: 3, glyphsDue: 4 });
		expect(n.title).toBe('Review your letters');
	});

	it('carries on down the profile track when nothing is due', () => {
		const reader = { id: 'greetings', title: 'Greetings' };
		expect(nextUp('script-reader', { ...base, nextReaderUnit: reader, nextLesson: lesson }).href).toBe(
			'/reader/greetings'
		);
		expect(nextUp('speaker', { ...base, nextScriptUnit: { id: 'x', title: 'Hooks' }, nextLesson: lesson }).href).toBe(
			'/script'
		);
		expect(nextUp('beginner', { ...base, nextLesson: lesson }).href).toBe('/lesson/first-words');
	});

	it('offers the other tracks before crowns once the main one runs out', () => {
		// A beginner who finished the course should be pointed at reading and
		// letters, not straight into crown replays.
		const n = nextUp('beginner', {
			...base,
			nextReaderUnit: { id: 'greetings', title: 'Greetings' },
			uncrownedLesson: lesson
		});
		expect(n.track).toBe('reader');
	});

	it('falls back to crowns, then to a review round', () => {
		expect(nextUp('beginner', { ...base, uncrownedLesson: lesson }).title).toBe('Go for a crown');
		expect(nextUp('beginner', base).href).toBe('/review');
	});

	it('never returns a singular/plural mismatch', () => {
		expect(nextUp('beginner', { ...base, vocabDue: 1 }).sub).toBe('1 word ready');
		expect(nextUp('beginner', { ...base, vocabDue: 2 }).sub).toBe('2 words ready');
	});
});
