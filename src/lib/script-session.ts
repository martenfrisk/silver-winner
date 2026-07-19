// Builds exercise queues for Script Studio sessions: intro lessons and
// SRS-driven practice. Distractors are chosen confusable-first — the whole
// point of script drills is discriminating similar shapes.
import {
	AUDIO_VOWELS,
	aspirationMate,
	buildSyllable,
	decodableSentences,
	decodableWords,
	glyphById,
	glyphs,
	unitNotes,
	type DecodableSentence,
	type DecodableWord,
	type Glyph,
	type ScriptUnit,
	type UnitNote
} from '$lib/data/script';
import { srs, MAX_BOX } from '$lib/srs.svelte';

export interface ChoiceOption {
	label: string;
	sub?: string;
	/** Render in the Burmese font at glyph size. */
	my?: boolean;
}

export type ScriptEx =
	| { kind: 'intro'; glyph: Glyph }
	| { kind: 'trace'; glyph: Glyph; fromMemory?: boolean }
	| { kind: 'note'; note: UnitNote }
	| {
			kind: 'choice';
			/** Glyph credited/blamed for the answer (drives SRS grading). */
			glyphId?: string;
			question: string;
			questionKey?: 'what-sound' | 'what-say' | 'which-hear';
			promptBig?: string;
			promptSpeak?: string;
			options: ChoiceOption[];
			correct: number;
			/** Seconds allowed (speed round); omit for untimed. */
			timed?: number;
	  }
	| { kind: 'word'; word: DecodableWord; options: string[]; correct: number }
	| { kind: 'sentence'; sentence: DecodableSentence; options: string[]; correct: number };

function shuffle<T>(a: T[]): T[] {
	return [...a].sort(() => Math.random() - 0.5);
}

function pick<T>(a: T[], n: number): T[] {
	return shuffle(a).slice(0, n);
}

/** Distractor glyphs for a target: confusables first, then same-type fill. */
function distractors(target: Glyph, n: number, pool?: Glyph[]): Glyph[] {
	const out: Glyph[] = [];
	for (const id of target.confusables) {
		const g = glyphById.get(id);
		if (g && out.length < n) out.push(g);
	}
	const fill = (pool ?? glyphs).filter(
		(g) => g.type === target.type && g.id !== target.id && !out.some((o) => o.id === g.id)
	);
	out.push(...pick(fill, n - out.length));
	return out.slice(0, n);
}

function withCorrect(options: ChoiceOption[], correctOption: ChoiceOption) {
	const all = shuffle([...options, correctOption]);
	return { options: all, correct: all.indexOf(correctOption) };
}

/** Glyph → sound. */
export function g2s(glyph: Glyph, timed?: number): ScriptEx {
	const target: ChoiceOption = { label: glyph.sound };
	const { options, correct } = withCorrect(
		distractors(glyph, 2).map((d) => ({ label: d.sound })),
		target
	);
	return {
		kind: 'choice',
		glyphId: glyph.id,
		question: 'What sound does this make?',
		questionKey: 'what-sound',
		promptBig: glyph.char,
		promptSpeak: glyph.speak,
		options,
		correct,
		timed
	};
}

/** Sound → glyph, confusable distractors. */
export function s2g(glyph: Glyph): ScriptEx {
	const target: ChoiceOption = { label: glyph.char, my: true };
	const { options, correct } = withCorrect(
		distractors(glyph, 2).map((d) => ({ label: d.char, my: true })),
		target
	);
	return {
		kind: 'choice',
		glyphId: glyph.id,
		question: `Tap the one that ${glyph.type === 'digit' ? 'means' : 'sounds like'} “${glyph.sound}”`,
		options,
		correct
	};
}

/** Learned consonants / audio vowels available for syllable drills. */
function learnedConsonants(): Glyph[] {
	return glyphs.filter((g) => g.type === 'consonant' && srs.isIntroduced(g.id));
}

function learnedAudioVowels(): string[] {
	return AUDIO_VOWELS.filter((v) => srs.isIntroduced(v));
}

/**
 * Syllable reading drill. `focus` decides which dimension varies among the
 * options: testing a consonant varies the consonant; testing a vowel varies
 * the vowel — that's where the discrimination happens.
 */
export function syllableRead(glyph: Glyph): ScriptEx | null {
	const cons = learnedConsonants();
	const vowels = learnedAudioVowels();
	if (glyph.type === 'consonant') {
		if (vowels.length === 0) return null;
		const v = pick(vowels, 1)[0];
		const target = buildSyllable(glyph.id, v);
		const others = distractors(glyph, 2, cons).map((d) => buildSyllable(d.id, v));
		const opts = [target, ...others].map((s) => ({ label: s.roman }));
		const { options, correct } = withCorrect(opts.slice(1), opts[0]);
		return {
			kind: 'choice',
			glyphId: glyph.id,
			question: 'What does it say?',
			questionKey: 'what-say',
			promptBig: target.text,
			promptSpeak: target.text,
			options,
			correct
		};
	}
	if (AUDIO_VOWELS.includes(glyph.id)) {
		if (cons.length === 0) return null;
		const base = pick(cons, 1)[0];
		const target = buildSyllable(base.id, glyph.id);
		const otherVowels = pick(
			AUDIO_VOWELS.filter((v) => v !== glyph.id),
			2
		);
		const opts = [target, ...otherVowels.map((v) => buildSyllable(base.id, v))].map((s) => ({
			label: s.roman
		}));
		const { options, correct } = withCorrect(opts.slice(1), opts[0]);
		return {
			kind: 'choice',
			glyphId: glyph.id,
			question: 'What does it say?',
			questionKey: 'what-say',
			promptBig: target.text,
			promptSpeak: target.text,
			options,
			correct
		};
	}
	return null;
}

/**
 * Minimal-pair listening drill for aspiration contrasts (က/ခ, စ/ဆ, တ/ထ, ပ/ဖ):
 * play one member's syllable, learner picks which written syllable they heard.
 * Only built from `allAudioSyllables()` material, so the prompt always has
 * a real MP3. Graded against the practiced glyph's SRS entry.
 */
export function pairListen(glyph: Glyph): ScriptEx | null {
	const mateId = aspirationMate.get(glyph.id);
	if (!mateId || !srs.isIntroduced(mateId)) return null;
	const vowels = learnedAudioVowels();
	if (vowels.length === 0) return null;
	const v = pick(vowels, 1)[0];
	const a = buildSyllable(glyph.id, v);
	const b = buildSyllable(mateId, v);
	const [played, other] = Math.random() < 0.5 ? [a, b] : [b, a];
	const { options, correct } = withCorrect(
		[{ label: other.text, my: true }],
		{ label: played.text, my: true }
	);
	return {
		kind: 'choice',
		glyphId: glyph.id,
		question: 'Which one did you hear?',
		questionKey: 'which-hear',
		promptSpeak: played.text,
		options,
		correct
	};
}

/**
 * Tone-contrast listening drill: low tone (…ာ) vs high tone (…ား) of the
 * same syllable. Graded against the visarga (း) SRS entry.
 */
export function toneListen(): ScriptEx | null {
	if (!srs.isIntroduced('visarga')) return null;
	const cons = learnedConsonants();
	const vowels = learnedAudioVowels();
	if (cons.length === 0 || vowels.length === 0) return null;
	const c = pick(cons, 1)[0];
	const v = pick(vowels, 1)[0];
	const low = buildSyllable(c.id, v, false);
	const high = buildSyllable(c.id, v, true);
	const [played, other] = Math.random() < 0.5 ? [low, high] : [high, low];
	const { options, correct } = withCorrect(
		[{ label: other.text, my: true }],
		{ label: played.text, my: true }
	);
	return {
		kind: 'choice',
		glyphId: 'visarga',
		question: 'Which one did you hear?',
		questionKey: 'which-hear',
		promptSpeak: played.text,
		options,
		correct
	};
}

/** Listening drill for a practiced glyph, if one applies. */
function listenDrill(glyph: Glyph): ScriptEx | null {
	if (glyph.id === 'visarga') return toneListen();
	if (glyph.type === 'consonant') return pairListen(glyph);
	return null;
}

export function wordRead(word: DecodableWord, allWords: DecodableWord[]): ScriptEx {
	const others = pick(
		allWords.filter((w) => w.my !== word.my && w.roman !== word.roman),
		2
	).map((w) => w.roman);
	const options = shuffle([word.roman, ...others]);
	return { kind: 'word', word, options, correct: options.indexOf(word.roman) };
}

export function sentenceRead(s: DecodableSentence, all: DecodableSentence[]): ScriptEx {
	const others = pick(
		all.filter((x) => x.my !== s.my && x.en !== s.en),
		2
	).map((x) => x.en);
	const options = shuffle([s.en, ...others]);
	return { kind: 'sentence', sentence: s, options, correct: options.indexOf(s.en) };
}

/** All decodable words from finished units (for practice sprinkles). */
function unlockedWords(): DecodableWord[] {
	return srs.unitsDone.flatMap((u) => decodableWords[u] ?? []);
}

/** All decodable sentences from finished units. */
function unlockedSentences(): DecodableSentence[] {
	return srs.unitsDone.flatMap((u) => decodableSentences[u] ?? []);
}

/**
 * The canvas tracing pad is disabled — no `trace` exercise is queued while
 * this is false.
 *
 * It graded by template coverage: paint over ~50% of the glyph's pixels and
 * it passes. That can't tell drawing the letter apart from scribbling across
 * its area, so it ended the exercise early (mid-letter) and passed everyone,
 * which also made the write-from-memory drill's SRS grade meaningless.
 *
 * TraceExercise.svelte, the ScriptSession wiring and the stroke-hint data are
 * all kept. Re-enabling needs real handwriting validation — per-stroke path
 * comparison against authored strokes, not a pixel-coverage ratio — plus the
 * stroke-hint realignment noted in IDEAS.md #6.
 */
const TRACING_ENABLED = false;

// ── Intro lesson queue ────────────────────────────────────────────────
export function buildIntroQueue(unit: ScriptUnit): ScriptEx[] {
	const queue: ScriptEx[] = [];
	const unitGlyphs = unit.glyphIds.map((id) => glyphById.get(id)!);
	const isDigits = unit.id === 'digits';

	// Concept units (e.g. stacked consonants) open with explainer cards.
	for (const note of unitNotes[unit.id] ?? []) queue.push({ kind: 'note', note });

	unitGlyphs.forEach((g, i) => {
		queue.push({ kind: 'intro', glyph: g });
		if (TRACING_ENABLED && g.traceable && g.type === 'consonant')
			queue.push({ kind: 'trace', glyph: g });
		// Quiz the letter right away, and re-quiz an earlier one for contrast.
		queue.push(g2s(g));
		if (i >= 1 && i % 2 === 1) queue.push(s2g(unitGlyphs[i - 1]));
	});

	// A couple of trace exercises for digits (they're quick).
	if (TRACING_ENABLED && isDigits) {
		for (const g of pick(unitGlyphs, 2)) queue.push({ kind: 'trace', glyph: g });
	}

	// Syllable reading with the unit's new material where possible.
	const sylls = unitGlyphs
		.map((g) => syllableRead(g))
		.filter((x): x is ScriptEx => x !== null);
	queue.push(...pick(sylls, 3));

	// Decodable words: the payoff. Glyphless concept units lean on words
	// entirely, so they read all of them (plus a couple of re-quizzes).
	const words = decodableWords[unit.id] ?? [];
	const allWords = [...words, ...unlockedWords()];
	if (unitGlyphs.length === 0) {
		for (const w of shuffle(words)) queue.push(wordRead(w, allWords));
		for (const w of pick(words, 2)) queue.push(wordRead(w, allWords));
	} else {
		for (const w of pick(words, 4)) queue.push(wordRead(w, allWords));
	}

	// Decodable sentences: later units close with real reading.
	const sentences = decodableSentences[unit.id] ?? [];
	if (sentences.length > 0) {
		const pool = [...sentences, ...unlockedSentences()];
		for (const s of pick(sentences, 2)) queue.push(sentenceRead(s, pool));
	}

	return queue;
}

// ── Practice queue (SRS-driven) ───────────────────────────────────────
export function buildPracticeQueue(): { queue: ScriptEx[]; count: number } {
	const now = Date.now();
	let ids = srs.dueIds(now);
	if (ids.length < 8) {
		// Top up with the weakest introduced items so a session is always worthwhile.
		const fill = Object.entries(srs.entries)
			.filter(([id]) => !ids.includes(id))
			.sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
			.map(([id]) => id);
		ids = [...ids, ...fill];
	}
	ids = ids.slice(0, 10);
	if (ids.length === 0) return { queue: [], count: 0 };

	const queue: ScriptEx[] = [];
	for (const id of ids) {
		const g = glyphById.get(id);
		if (!g) continue;
		const box = srs.box(id);
		// Once the shape is known (box ≥ 2), sometimes swap in a minimal-pair
		// listening drill — hearing the contrast is the hard part.
		const listen = box >= 2 && Math.random() < 0.5 ? listenDrill(g) : null;
		if (box <= 1) {
			queue.push(g2s(g));
		} else if (box === 2) {
			queue.push(listen ?? s2g(g));
		} else if (box === 3) {
			queue.push(listen ?? syllableRead(g) ?? s2g(g));
		} else {
			// Mastered: keep it honest with a speed round — or, for traceable
			// consonants, sometimes demand the shape from memory.
			const memTrace =
				TRACING_ENABLED && g.traceable && g.type === 'consonant' && Math.random() < 0.4
					? ({ kind: 'trace', glyph: g, fromMemory: true } as const)
					: null;
			queue.push(listen ?? memTrace ?? g2s(g, 5));
		}
	}

	// Sprinkle in real reading.
	const words = unlockedWords();
	for (const w of pick(words, Math.min(2, words.length))) queue.push(wordRead(w, words));
	const sentences = unlockedSentences();
	if (sentences.length >= 3) {
		for (const s of pick(sentences, 1)) queue.push(sentenceRead(s, sentences));
	}

	return { queue: shuffle(queue), count: ids.length };
}

export function starsFor(mistakes: number): number {
	return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
}

export { MAX_BOX };
