// Everything the word sheet shows about one word, resolved in one call.
//
// This exists because "Look it up" on a wrong-answer reveal used to be a link
// to /dictionary?q=<word>. Leaving a session to read one definition cost the
// session: the player rebuilds its queue on mount, so the browser Back button
// — which is the only way back, and not an obvious one — landed the learner on
// a different question than the one they had just missed. The fix is to bring
// the entry to them, which means something has to assemble it without a page.
//
// Pure, and takes the vocabulary rather than importing the store, so the
// assembly is unit-testable and the sheet stays a rendering concern.
import { morphology, sharesPartWith, type MorphPart } from '$lib/data/morphology';
import type { VocabItem } from '$lib/vocab-srs.svelte';

export interface RelatedWord {
	my: string;
	roman: string;
	en: string;
}

export interface WordEntry {
	/** The word looked up, always set even when the course doesn't teach it. */
	my: string;
	roman?: string;
	en?: string;
	/** Whether this is course vocabulary with a real entry behind it. */
	known: boolean;
	/** How the word comes apart, empty when it doesn't. */
	parts: MorphPart[];
	related: RelatedWord[];
}

export const MAX_RELATED = 6;

/**
 * Shortest word either side of a substring match may be.
 *
 * The script lessons teach bare glyphs as vocabulary, and a glyph is inside a
 * large fraction of the course: မင်္ဂလာပါ contains ဂ, င, ပ and မ, so without
 * this the entry for "Hello" listed four letters as related words. Sharing a
 * character is orthography, not morphology — it explains nothing about the
 * word, and it crowds out the one genuine relative. Applies in both
 * directions: to the word being looked up, and to each candidate.
 */
const MIN_SUBSTRING_LENGTH = 2;

/**
 * One word's entry, with the words worth seeing next to it.
 *
 * Related words are ordered by how much they explain: sharing a morphological
 * part comes first (that link is authored, and it is the one that makes a
 * compound stop looking arbitrary), then compounds this word is built into or
 * out of. A word the course doesn't teach still returns an entry — reveals
 * carry whole phrases, and "no definition" is a worse answer than the parts
 * the phrase is made of.
 */
export function lookupWord(
	my: string,
	vocab: readonly VocabItem[],
	byMy: ReadonlyMap<string, VocabItem>,
	cap = MAX_RELATED
): WordEntry {
	const self = byMy.get(my);
	const seen = new Set<string>([my]);
	const related: RelatedWord[] = [];

	const push = (word: string) => {
		if (related.length >= cap || seen.has(word)) return;
		const item = byMy.get(word);
		if (!item) return; // in the morphology table but no longer taught
		seen.add(word);
		related.push({ my: item.my, roman: item.roman, en: item.en });
	};

	for (const word of sharesPartWith(my)) push(word);

	if (my.length >= MIN_SUBSTRING_LENGTH) {
		for (const v of vocab) {
			if (related.length >= cap) break;
			if (v.my.length < MIN_SUBSTRING_LENGTH) continue;
			// Either direction: the compound this word builds, and the pieces it
			// is built from that happen to be taught in their own right.
			if (v.my.includes(my) || my.includes(v.my)) push(v.my);
		}
	}

	return {
		my,
		roman: self?.roman,
		en: self?.en,
		known: self !== undefined,
		parts: (morphology[my] ?? []).filter((p) => p.my.trim()),
		related
	};
}
