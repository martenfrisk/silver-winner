// What a lesson contains, for the preview sheet on the path.
//
// The path used to answer "what is in this lesson?" with a lock icon and a
// buzz. That is the wrong answer twice over: a learner deciding whether to
// keep going deserves to see what is coming, and one who already knows the
// material has no way to say so short of sitting through everything before it.
//
// So the preview lists every word of every part, and the sheet offers to open
// the lesson. The linear order stays the obvious route — it is what the path
// draws, what "Start here" points at, and what the node numbering implies —
// but it stops being a wall.
//
// Pure, and takes the stars map as an argument rather than importing the
// store, the same way $lib/rounds does, so it can be unit-tested without a DOM.
import { lessonSteps, stepExercises, stepStarsKey, type Lesson, type LessonStep } from '$lib/data/course';
import { ROUND_LABELS } from '$lib/rounds';

export interface OutlineWord {
	my: string;
	/** Absent in a scriptOnly lesson, and never shown there — see Lesson.scriptOnly. */
	roman?: string;
	en: string;
	emoji?: string;
}

export interface OutlinePart {
	step: LessonStep;
	label: string;
	words: OutlineWord[];
	stars: number;
	done: boolean;
}

export interface LessonOutline {
	id: string;
	title: string;
	emoji: string;
	unitTitle: string;
	scriptOnly: boolean;
	optional: boolean;
	parts: OutlinePart[];
	/** Every word in the lesson, across all parts. */
	wordCount: number;
}

/**
 * One lesson laid out part by part, with the words each part teaches.
 *
 * Only `learn` exercises count as words: they are what the vocab index is
 * built from too (see vocab-srs), so the preview promises exactly what the
 * lesson will actually add to the learner's deck rather than counting drills.
 */
export function lessonOutline(
	lesson: Lesson,
	unitTitle: string,
	stars: Record<string, number>
): LessonOutline {
	const parts = lessonSteps(lesson).map((step) => {
		const earned = stars[stepStarsKey(lesson.id, step)] ?? 0;
		const words: OutlineWord[] = [];
		for (const ex of stepExercises(lesson, step)) {
			if (ex.kind !== 'learn') continue;
			words.push({ my: ex.my, roman: ex.roman, en: ex.en, emoji: ex.emoji });
		}
		return { step, label: ROUND_LABELS[step], words, stars: earned, done: earned > 0 };
	});

	return {
		id: lesson.id,
		title: lesson.title,
		emoji: lesson.emoji,
		unitTitle,
		scriptOnly: lesson.scriptOnly === true,
		optional: lesson.optional === true,
		parts,
		wordCount: parts.reduce((n, p) => n + p.words.length, 0)
	};
}
