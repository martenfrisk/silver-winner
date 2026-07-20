// Builds exercise queues for the Reader track: course vocabulary drilled
// script-first, for learners who studied the Script Studio before (or instead
// of) the lesson path. No romanization is ever attached — options carry no
// `sub` fields — so the script itself does all the work.
import { course, type Exercise, type Option, type Unit } from '$lib/data/course';

/** The exercise kinds a reader session generates. */
export type ReaderExercise = Extract<Exercise, { kind: 'choice' } | { kind: 'listen' }>;

export interface ReaderVocab {
	my: string;
	roman: string;
	en: string;
}

const MAX_ITEMS = 12;

function shuffle<T>(a: T[]): T[] {
	return [...a].sort(() => Math.random() - 0.5);
}

/** A unit's vocabulary is its lessons' `learn` exercises, deduped on Burmese text. */
export function unitVocab(unit: Unit): ReaderVocab[] {
	const seen = new Set<string>();
	const out: ReaderVocab[] = [];
	for (const lesson of unit.lessons) {
		for (const ex of lesson.exercises) {
			if (ex.kind !== 'learn' || seen.has(ex.my)) continue;
			seen.add(ex.my);
			out.push({ my: ex.my, roman: ex.roman, en: ex.en });
		}
	}
	return out;
}

const allVocab: ReaderVocab[] = course.flatMap((u) => unitVocab(u));

/** Distractors: same-unit words first (fair game), whole course as backfill. */
function distractors(
	target: ReaderVocab,
	pool: ReaderVocab[],
	n: number,
	keyOf: (v: ReaderVocab) => string
): ReaderVocab[] {
	const seen = new Set<string>([keyOf(target)]);
	const out: ReaderVocab[] = [];
	for (const source of [pool, allVocab]) {
		for (const v of shuffle(source)) {
			if (out.length >= n) return out;
			const k = keyOf(v);
			if (v.my === target.my || seen.has(k)) continue;
			seen.add(k);
			out.push(v);
		}
	}
	return out;
}

/** "Tap what you hear": audio prompt, script-only options. */
function listenEx(item: ReaderVocab, pool: ReaderVocab[]): ReaderExercise {
	const options: Option[] = [
		{ text: item.my },
		...distractors(item, pool, 2, (v) => v.my).map((v) => ({ text: v.my }))
	];
	return { kind: 'listen', my: item.my, roman: item.roman, en: item.en, options, correct: 0 };
}

/** Read the script → pick the English meaning. */
function readMyEn(item: ReaderVocab, pool: ReaderVocab[]): ReaderExercise {
	const options: Option[] = [
		{ text: item.en },
		...distractors(item, pool, 2, (v) => v.en).map((v) => ({ text: v.en }))
	];
	return {
		kind: 'choice',
		question: 'What does this mean?',
		promptMy: item.my,
		options,
		correct: 0
	};
}

/** English prompt → pick the written Burmese. */
function readEnMy(item: ReaderVocab, pool: ReaderVocab[]): ReaderExercise {
	const options: Option[] = [
		{ text: item.my },
		...distractors(item, pool, 2, (v) => v.my).map((v) => ({ text: v.my }))
	];
	return {
		kind: 'choice',
		question: `Which one says “${item.en}”?`,
		options,
		correct: 0
	};
}

/**
 * A reader session for one course unit: up to MAX_ITEMS of its words, each as
 * one drill, rotating audio→script, script→meaning and meaning→script.
 */
export function buildReaderQueue(unit: Unit): ReaderExercise[] {
	const vocab = unitVocab(unit);
	const picked = shuffle(vocab).slice(0, MAX_ITEMS);
	return picked.map((item, i) => {
		const kind = i % 3;
		if (kind === 0) return listenEx(item, vocab);
		if (kind === 1) return readMyEn(item, vocab);
		return readEnMy(item, vocab);
	});
}

/** The stars-map key a unit's reader sessions are recorded under. */
export function readerStarsKey(unitId: string): string {
	return `reader-${unitId}`;
}

export function starsFor(mistakes: number): number {
	return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
}
