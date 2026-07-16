// Builds exercise queues for course vocabulary practice: recent mistakes
// first, then due SRS items, topped up with the weakest introduced items so a
// session is always worthwhile. Each vocab item becomes a listen or choice
// exercise composed client-side, reusing the lesson player's components.
import type { Exercise, Option } from '$lib/data/course';
import { allVocab, vocabByMy, vocabSrs, type VocabItem } from '$lib/vocab-srs.svelte';

/** The exercise kinds a practice session generates. */
export type PracticeExercise = Extract<Exercise, { kind: 'choice' } | { kind: 'listen' }>;

/** A practice step: the exercise plus the vocab item it grades. */
export interface VocabEx {
	my: string;
	ex: PracticeExercise;
}

const MIN_ITEMS = 8;
const MAX_ITEMS = 12;

function shuffle<T>(a: T[]): T[] {
	return [...a].sort(() => Math.random() - 0.5);
}

/**
 * Distractor vocab for a target: introduced items first (they're fair game),
 * topped up from the whole course if the learner knows too few words yet.
 * `keyOf` deduplicates on the side being displayed (en vs my).
 */
function distractors(target: VocabItem, n: number, keyOf: (v: VocabItem) => string): VocabItem[] {
	const seen = new Set<string>([keyOf(target)]);
	const take = (pool: VocabItem[], out: VocabItem[]) => {
		for (const v of shuffle(pool)) {
			if (out.length >= n) break;
			const k = keyOf(v);
			if (v.my === target.my || seen.has(k)) continue;
			seen.add(k);
			out.push(v);
		}
		return out;
	};
	const introduced = allVocab.filter((v) => vocabSrs.isIntroduced(v.my));
	const out = take(introduced, []);
	if (out.length < n) take([...allVocab], out);
	return out;
}

/** "Tap what you hear": audio prompt, Burmese options. */
function listenEx(item: VocabItem): PracticeExercise {
	const options: Option[] = [
		{ text: item.my, sub: item.roman },
		...distractors(item, 2, (v) => v.my).map((v) => ({ text: v.my, sub: v.roman }))
	];
	return { kind: 'listen', my: item.my, roman: item.roman, en: item.en, options, correct: 0 };
}

/** Burmese prompt → pick the English meaning. */
function choiceMyEn(item: VocabItem): PracticeExercise {
	const options: Option[] = [
		{ text: item.en },
		...distractors(item, 2, (v) => v.en).map((v) => ({ text: v.en }))
	];
	return {
		kind: 'choice',
		question: 'What does this mean?',
		promptMy: item.my,
		promptRoman: item.roman,
		options,
		correct: 0
	};
}

/** English prompt → pick the Burmese word. */
function choiceEnMy(item: VocabItem): PracticeExercise {
	const options: Option[] = [
		{ text: item.my, sub: item.roman },
		...distractors(item, 2, (v) => v.my).map((v) => ({ text: v.my, sub: v.roman }))
	];
	return {
		kind: 'choice',
		question: `How do you say “${item.en}”?`,
		options,
		correct: 0
	};
}

/** One exercise for a vocab item, rotating between the three drill forms. */
export function exerciseFor(item: VocabItem, i: number): PracticeExercise {
	const kind = i % 3;
	if (kind === 0) return listenEx(item);
	if (kind === 1) return choiceMyEn(item);
	return choiceEnMy(item);
}

// ── Practice queue (mistakes first, then SRS) ─────────────────────────
export function buildVocabPracticeQueue(): VocabEx[] {
	// 1. Recent mistakes (already deduped, most recent first).
	const ids = vocabSrs.mistakes.filter((m) => vocabByMy.has(m));

	// 2. Due SRS items, oldest first.
	for (const my of vocabSrs.dueIds()) {
		if (ids.length >= MAX_ITEMS) break;
		if (!ids.includes(my)) ids.push(my);
	}

	// 3. Top up with the weakest introduced items so a session is worthwhile.
	if (ids.length < MIN_ITEMS) {
		const fill = Object.entries(vocabSrs.entries)
			.filter(([my]) => !ids.includes(my) && vocabByMy.has(my))
			.sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
			.map(([my]) => my);
		for (const my of fill) {
			if (ids.length >= MIN_ITEMS) break;
			ids.push(my);
		}
	}

	return ids.slice(0, MAX_ITEMS).map((my, i) => ({ my, ex: exerciseFor(vocabByMy.get(my)!, i) }));
}

export function starsFor(mistakes: number): number {
	return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
}
