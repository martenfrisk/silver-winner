// Splitting Burmese text into the units a learner actually manipulates.
//
// Intl.Segmenter's grapheme clusters are *not* those units. It happily emits
// bare dependent signs as their own cluster — ကျောင်း comes back as
// ["ကျေ", "ာ", "င်", "း"] — and a tile holding just "း" or "ါ" renders as a
// stranded mark (or a dotted circle), so building a word from such tiles can
// never look right even when the answer is correct.
//
// A Burmese syllable is a base consonant plus its medials, vowel signs, an
// optional killed final consonant (a consonant carrying asat ်) and tone
// marks. Re-joining the clusters by that rule gives tiles that each render
// standalone and read as real syllables:
//
//   ကျောင်း          → ကျောင်း
//   ကျေးဇူးတင်ပါတယ်  → ကျေး · ဇူး · တင် · ပါ · တယ်
//   မင်္ဂလာပါ         → မင်္ဂ · လာ · ပါ

/** Signs that can never begin a syllable: vowels, medials, tones, virama. */
const DEPENDENT = /^[ါ-ှၞ-ၠၢ-ၤၧ-ၭၱ-ၴႂ-ႍႏႚ-ႝ]/;

/** U+103A MYANMAR SIGN ASAT — kills a consonant, making it a syllable final. */
const ASAT = '်';

/**
 * U+1039 MYANMAR SIGN VIRAMA — stacks the next consonant under this one.
 * Whether the stack arrives as one cluster or two depends on the ICU version
 * (node and bun disagree on မင်္ဂ), so a tile left dangling on a virama always
 * swallows whatever follows it.
 */
const VIRAMA = '္';

const segmenter = new Intl.Segmenter('my', { granularity: 'grapheme' });

/**
 * Splits Burmese text into syllables. Whitespace is dropped, so joining the
 * result reproduces the input minus spaces — the same contract the assemble
 * exercise grades against.
 */
export function syllables(text: string): string[] {
	const out: string[] = [];
	for (const { segment } of segmenter.segment(text)) {
		if (!segment.trim()) continue;
		// A cluster belongs to the syllable before it when it opens with a
		// dependent sign, carries asat (a killed final), or completes a stack
		// the previous tile left open.
		const attaches =
			DEPENDENT.test(segment) ||
			segment.includes(ASAT) ||
			(out.at(-1)?.endsWith(VIRAMA) ?? false);
		if (out.length > 0 && attaches) out[out.length - 1] += segment;
		else out.push(segment);
	}
	return out;
}

/** How many syllables a word is — the practical measure of "how long". */
export function syllableCount(text: string): number {
	return syllables(text).length;
}
