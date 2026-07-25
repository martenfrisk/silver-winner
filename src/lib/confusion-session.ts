// Builds Confusion Lab sessions: sort-into-bins trials over the contrast pairs
// this learner actually gets wrong.
//
// Scope note. Only aspiration pairs are drilled here. The tone contrasts are
// the other obvious candidate and are deliberately left out for now: creaky
// versus high is a phonation difference, and it is the distinction synthetic
// speech is least likely to render faithfully. Training a contrast on audio
// that doesn't reliably carry it teaches a distinction that isn't there —
// worse than not training it. Tone belongs here once a native speaker has
// checked the clips (IDEAS #24).
import { AUDIO_VOWELS, aspirationPairs, buildSyllable, glyphById } from '$lib/data/script';
import { shuffle } from '$lib/shuffle';
import { buildSortTrial, prioritize, type ConfusionMatrix, type SortChip, type SortTrial } from '$lib/confusion';

export interface LabTrial extends SortTrial {
	/** Human labels for the two bins, in bin order. */
	binLabels: [string, string];
	/** The glyph characters, for the bin headers. */
	binChars: [string, string];
}

/** Contrast pairs the learner has met both halves of. */
export function availablePairs(isIntroduced: (id: string) => boolean): [string, string][] {
	return aspirationPairs.filter(([a, b]) => isIntroduced(a) && isIntroduced(b));
}

/**
 * A session of sort trials, hardest-for-this-learner first.
 *
 * One trial per contrast pair rather than several: the lab is a diagnostic
 * sharpener, not a grind, and repeating the same two bins immediately would
 * let the learner coast on the previous trial's answers.
 */
export function buildLabSession(
	matrix: ConfusionMatrix,
	isIntroduced: (id: string) => boolean,
	learnedVowels: string[],
	max = 4
): LabTrial[] {
	const pairs = prioritize(availablePairs(isIntroduced), matrix);
	const vowels = learnedVowels.filter((v) => AUDIO_VOWELS.includes(v));
	if (vowels.length === 0) return [];

	const trials: LabTrial[] = [];
	for (const [a, b] of pairs) {
		if (trials.length >= max) break;
		const candidates: SortChip[] = shuffle([
			...vowels.map((v) => ({ text: buildSyllable(a, v).text, binId: a })),
			...vowels.map((v) => ({ text: buildSyllable(b, v).text, binId: b }))
		]);
		const trial = buildSortTrial([a, b], candidates);
		if (!trial) continue;
		const ga = glyphById.get(a);
		const gb = glyphById.get(b);
		if (!ga || !gb) continue;
		trials.push({
			...trial,
			// Chips are shuffled again so the two bins' items don't arrive in
			// blocks — the pool order is itself a cue worth removing.
			chips: shuffle(trial.chips),
			binLabels: [ga.sound, gb.sound],
			binChars: [ga.char, gb.char]
		});
	}
	return trials;
}
