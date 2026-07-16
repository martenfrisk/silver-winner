import { describe, expect, it } from 'vitest';
import manifest from '$lib/audio-manifest.json';
import {
	allAudioSyllables,
	aspirationMate,
	aspirationPairs,
	AUDIO_VOWELS,
	buildSyllable,
	glyphById,
	glyphs,
	TALL_AA
} from './script';

describe('buildSyllable', () => {
	it('composes consonant + regular ာ', () => {
		expect(buildSyllable('ma', 'aa').text).toBe('မာ');
	});

	it('uses the tall ါ after TALL_AA consonants', () => {
		for (const id of TALL_AA) {
			expect(buildSyllable(id, 'aa').text).toBe(glyphById.get(id)!.char + 'ါ');
		}
		expect(buildSyllable('ka', 'aa').text).toBe('ကာ');
	});

	it('appends း for the high tone', () => {
		const low = buildSyllable('ma', 'aa', false);
		const high = buildSyllable('ma', 'aa', true);
		expect(high.text).toBe(low.text + 'း');
		expect(high.highTone).toBe(true);
	});

	it('romanizes initial + vowel', () => {
		expect(buildSyllable('kha', 'i').roman).toBe('khi');
		expect(buildSyllable('a', 'aa').roman).toBe('a'); // null initial
	});
});

describe('allAudioSyllables', () => {
	const all = allAudioSyllables();
	const consonants = glyphs.filter((g) => g.type === 'consonant');

	it('covers consonants × audio vowels × two tones', () => {
		expect(all.length).toBe(consonants.length * AUDIO_VOWELS.length * 2);
	});

	it('produces unique texts', () => {
		expect(new Set(all.map((s) => s.text)).size).toBe(all.length);
	});

	it('every syllable has a pre-generated audio file', () => {
		const spoken = manifest as Record<string, string>;
		for (const s of all) expect(spoken[s.text], s.text).toBeDefined();
	});
});

describe('aspiration pairs', () => {
	it('reference real glyphs and map both ways', () => {
		for (const [a, b] of aspirationPairs) {
			expect(glyphById.has(a)).toBe(true);
			expect(glyphById.has(b)).toBe(true);
			expect(aspirationMate.get(a)).toBe(b);
			expect(aspirationMate.get(b)).toBe(a);
		}
	});
});
