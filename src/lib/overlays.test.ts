import { afterEach, describe, expect, it } from 'vitest';
import { scriptSheet } from './script-sheet.svelte';
import { wordSheet } from './word-sheet.svelte';
import { overlayOpen } from './overlays.svelte';

afterEach(() => {
	scriptSheet.hide();
	wordSheet.hide();
});

describe('overlayOpen', () => {
	it('is false with nothing up', () => {
		expect(overlayOpen()).toBe(false);
	});

	// Each of these is a real failure mode: while a sheet is open, the player
	// underneath must not treat a digit as an answer to a question the learner
	// can no longer see.
	it('is true for the script sheet', () => {
		scriptSheet.show();
		expect(overlayOpen()).toBe(true);
	});

	it('is true for the word sheet', () => {
		wordSheet.show('ရေ');
		expect(overlayOpen()).toBe(true);
	});

	it('stays true while either is still up', () => {
		scriptSheet.show();
		wordSheet.show('ရေ');
		wordSheet.hide();
		expect(overlayOpen()).toBe(true);
		scriptSheet.hide();
		expect(overlayOpen()).toBe(false);
	});
});

describe('wordSheet', () => {
	it('opens on a word and reports it', () => {
		wordSheet.show('ရေ');
		expect(wordSheet.word).toBe('ရေ');
		expect(wordSheet.open).toBe(true);
	});

	it('closes back to nothing', () => {
		wordSheet.show('ရေ');
		wordSheet.hide();
		expect(wordSheet.word).toBeNull();
		expect(wordSheet.open).toBe(false);
	});

	it('swaps straight to another word, for the related-word links', () => {
		wordSheet.show('ရေ');
		wordSheet.show('ထမင်း');
		expect(wordSheet.word).toBe('ထမင်း');
	});

	// A reveal can hand over an empty string for an exercise with no Burmese
	// side; opening a blank sheet over the question would just trap the learner.
	it('refuses to open on an empty word', () => {
		wordSheet.show('');
		expect(wordSheet.open).toBe(false);
		wordSheet.show('   ');
		expect(wordSheet.open).toBe(false);
	});
});
