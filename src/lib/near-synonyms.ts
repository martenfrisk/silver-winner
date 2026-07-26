// When a multiple choice stops testing meaning.
//
// A choice is only a comprehension test if the options mean different things.
// Offering "I'm off now", "See you" and "See you tomorrow" for သွားတော့မယ်
// asks which English phrase the author picked, not whether the learner
// understood the Burmese — the nuance between three L2 partings does not map
// onto three English ones, so there is nothing to reason toward and a learner
// who knew the word perfectly still has to guess.
//
// Two shapes are catchable mechanically, and this module is the one place
// that decides:
//
//   - `scripts/lint-content.ts` runs it over authored options, so the problem
//     is caught when the content is written.
//   - `$lib/listen-mode` runs it over options it is about to *generate*, so
//     the meaning-first transform can refuse to build a bad question out of a
//     good one.
//
// What it cannot catch: a set that shares no words but one semantic field —
// three discourse particles glossed "…right?", "…of course", "(softener)".
// Those need the `keepScript` flag in the content and a human deciding.

/** Words too common to signal that two options mean the same thing. */
const STOP = new Set([
	'the', 'a', 'an', 'is', 'it', 'to', 'of', 'my', 'you', 'i', 'im', 'and', 'are', 'not'
]);

function letters(s: string): string {
	return s.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function contentWords(s: string): string[] {
	return letters(s)
		.split(' ')
		.filter((w) => w.length > 2 && !STOP.has(w));
}

/** Two options a learner can't tell apart on meaning, or null. */
export function nearSynonymPair(options: readonly string[]): [string, string] | null {
	for (let i = 0; i < options.length; i++) {
		for (let j = i + 1; j < options.length; j++) {
			const a = letters(options[i]);
			const b = letters(options[j]);
			if (!a || !b) continue;
			// One phrase inside another ("See you" in "See you tomorrow"), or
			// two content words in common, which in a 2-4 word option is most
			// of it.
			const nested = a.includes(b) || b.includes(a);
			const aw = contentWords(options[i]);
			const shared = contentWords(options[j]).filter((w) => aw.includes(w));
			if (nested || shared.length >= 2) return [options[i], options[j]];
		}
	}
	return null;
}

/** Whether an option set fails the test above. */
export function hasNearSynonyms(options: readonly string[]): boolean {
	return nearSynonymPair(options) !== null;
}
