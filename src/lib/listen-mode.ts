// Making a listening drill test meaning, for learners who already read.
//
// A `listen` drill plays a word and offers three written options. With Burmese
// options that is weak at both ends of the skill range, which the course type
// already says out loud: a learner who can't read is matching shapes, and one
// who *can* read just decodes the options and picks the spelling that sounds
// like what they heard. Neither has to know what the word means. The comment
// on `optionLang` in course.ts has said so for a while, and practice-session
// already builds the comprehension form for its own queue — but the 43
// authored drills in the course stayed script-only for everyone.
//
// So this is the same transform silent-mode.ts performs, for a different
// reason: applied at render time rather than rewritten into the content, so
// one authored drill serves both learners and switching profile takes effect
// on the next question rather than the next session.
//
// Pure, and takes a lookup rather than importing the vocab store, so the
// conversion is testable without a DOM (the same shape as buildSelfReviewQueue).
import type { Exercise } from '$lib/data/course';
import { hasNearSynonyms } from '$lib/near-synonyms';

type ListenEx = Extract<Exercise, { kind: 'listen' }>;

function isListen(ex: { kind: string }): ex is ListenEx {
	return ex.kind === 'listen';
}

/** English meaning for a Burmese option, or undefined when the course has none. */
export type GlossLookup = (my: string) => string | undefined;

/**
 * Swaps the script options of a listening drill for their meanings.
 *
 * Bails out and returns the drill untouched in four cases, each of which is a
 * drill that would get *worse*:
 *
 *   - it already asks for meaning;
 *   - the content marked it `keepScript` — script-reading drills where
 *     decoding is the skill, and the discourse particles whose English
 *     glosses are labels rather than translations;
 *   - an option has no English at all (the Burmese-digit drills, where the
 *     options are numerals rather than vocabulary);
 *   - the meanings it would produce are near-synonyms, which would turn a
 *     fair question into a guess between wordings. See $lib/near-synonyms.
 *
 * `correct` is carried across untouched, so grading and mistake tracking are
 * unaffected by the swap.
 */
export function meaningFirst<T extends { kind: string }>(
	ex: T,
	readsScript: boolean,
	glossOf: GlossLookup
): T | ListenEx {
	if (!readsScript || !isListen(ex)) return ex;
	if (ex.optionLang === 'en' || ex.keepScript) return ex;

	const glossed: string[] = [];
	for (const opt of ex.options) {
		const en = glossOf(opt.text);
		if (!en) return ex;
		glossed.push(en);
	}
	// The gloss for the right option has to be what this drill is teaching.
	// A word taught twice under different meanings (ည is a letter in the
	// script unit and "Night" in the time unit) resolves to whichever lesson
	// came first, so the correct answer would be relabelled with the other
	// lesson's meaning — right index, wrong words on it.
	if (glossed[ex.correct] !== ex.en) return ex;
	// Distinct meanings are the whole point of the swap; if the course glosses
	// two of these options the same way, the script version was the fairer
	// question.
	if (new Set(glossed).size !== glossed.length) return ex;
	if (hasNearSynonyms(glossed)) return ex;

	return {
		...ex,
		optionLang: 'en',
		options: glossed.map((text) => ({ text }))
	};
}
