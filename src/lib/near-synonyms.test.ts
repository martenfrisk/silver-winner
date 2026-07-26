import { describe, expect, it } from 'vitest';
import { hasNearSynonyms, nearSynonymPair } from './near-synonyms';

describe('catches options a learner cannot choose between on meaning', () => {
	it('flags one phrase nested in another', () => {
		// The reported case: three partings for သွားတော့မယ်.
		expect(nearSynonymPair(['I’m off now', 'See you', 'See you tomorrow'])).toEqual([
			'See you',
			'See you tomorrow'
		]);
	});

	it('flags a nested option whatever the order', () => {
		expect(hasNearSynonyms(['See you tomorrow', 'See you'])).toBe(true);
	});

	it('ignores punctuation and case when comparing', () => {
		expect(hasNearSynonyms(['OK', '…okay? / OK!'])).toBe(true);
	});

	it('flags two options sharing most of their content words', () => {
		expect(hasNearSynonyms(['Please speak slowly', 'Please speak again slowly'])).toBe(true);
	});
});

describe('leaves genuinely distinct options alone', () => {
	it('passes the replacement set for သွားတော့မယ်', () => {
		expect(hasNearSynonyms(['I’m off now', 'I’m tired', 'Not well'])).toBe(false);
	});

	it('does not trip on a single shared filler word', () => {
		// "I'm" and "it" carry no meaning here; two options sharing only those
		// are still telling the learner different things.
		expect(hasNearSynonyms(['It’s spicy', 'It’s sweet', 'It’s salty'])).toBe(false);
		expect(hasNearSynonyms(['I’m hungry', 'I’m tired'])).toBe(false);
	});

	it('allows a deliberate minimal contrast', () => {
		// The classifier drill teaches exactly this distinction, so it must
		// survive the rule.
		expect(hasNearSynonyms(['one (thing)', 'two (things)', 'one (person)'])).toBe(false);
	});

	it('handles empty and single-option sets', () => {
		expect(hasNearSynonyms([])).toBe(false);
		expect(hasNearSynonyms(['Hello'])).toBe(false);
		expect(hasNearSynonyms(['', 'Hello'])).toBe(false);
	});
});

describe('what it deliberately cannot catch', () => {
	// Documented limitation: a shared semantic field with no shared words.
	// The discourse particles need `keepScript` in the content instead, and
	// this test exists so nobody assumes the rule covers them.
	it('misses untranslatable labels that share no words', () => {
		expect(hasNearSynonyms(['…right? / …okay?', '…of course / obviously', '(softener)'])).toBe(
			false
		);
	});
});
