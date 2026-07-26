// Lesson parts: what the course path used to call "More words" and "Even
// more", buried in two chips that only appeared once a lesson was finished.
//
// That framing undersold them badly. Every one of the 24 lessons has a part 2,
// eighteen have a part 3, and each part teaches roughly as many new words as
// the first — 42 of the course's 66 parts were optional-looking extras reached
// through a chip most learners never saw. They are not extras. They are the
// rest of the lesson.
//
// So the vocabulary here is "parts", numbered, and the only thing that makes
// part 1 special is stated where it matters rather than implied by hiding the
// others: finishing part 1 unlocks the next lesson, and finishing the rest
// does not. Nothing else about them is different, including the XP.
//
// Pure module: takes `progress.stars` as an argument so the path, Today and
// the lesson player can all agree without any of them importing a store.
import { lessonSteps, stepStarsKey, type Lesson, type LessonStep } from '$lib/data/course';

export const ROUND_LABELS: Record<LessonStep, string> = {
	1: 'Part 1',
	2: 'Part 2',
	3: 'Part 3'
};

export function roundLabel(step: LessonStep): string {
	return ROUND_LABELS[step];
}

/**
 * Where a part is played.
 *
 * Part 1 keeps the bare lesson URL, the same way `stepStarsKey` keeps the bare
 * lesson id — every existing link into a lesson stays correct.
 */
export function roundHref(lessonId: string, step: LessonStep): string {
	return step === 1 ? `/lesson/${lessonId}` : `/lesson/${lessonId}?step=${step}`;
}

export interface RoundInfo {
	step: LessonStep;
	label: string;
	stars: number;
	done: boolean;
	/** Part 1 alone gates the next lesson. */
	required: boolean;
	/** Openable now. The deeper parts' only dependency is part 1. */
	unlocked: boolean;
	href: string;
}

/**
 * Every part of one lesson with its state — the row the path renders.
 *
 * Deeper parts wait on part 1 because they teach on top of its vocabulary, not
 * because they are a reward for it. They are listed either way: a learner
 * looking at a lesson should be able to see it has three parts before deciding
 * whether to start it.
 */
export function lessonRounds(
	lesson: Lesson,
	stars: Record<string, number>,
	lessonUnlocked: boolean
): RoundInfo[] {
	const coreDone = (stars[stepStarsKey(lesson.id, 1)] ?? 0) > 0;
	return lessonSteps(lesson).map((step) => {
		const earned = stars[stepStarsKey(lesson.id, step)] ?? 0;
		return {
			step,
			label: ROUND_LABELS[step],
			stars: earned,
			done: earned > 0,
			required: step === 1,
			unlocked: step === 1 ? lessonUnlocked : coreDone,
			href: roundHref(lesson.id, step)
		};
	});
}

/** How many of a lesson's parts are finished, and how many there are. */
export function roundsOf(lesson: Lesson, stars: Record<string, number>): { done: number; total: number } {
	const steps = lessonSteps(lesson);
	return {
		done: steps.filter((s) => (stars[stepStarsKey(lesson.id, s)] ?? 0) > 0).length,
		total: steps.length
	};
}

export interface OpenRound {
	lessonId: string;
	lessonTitle: string;
	step: LessonStep;
	label: string;
	href: string;
}

/**
 * The part a learner can pick up right now, earliest first.
 *
 * Restricted to lessons whose part 1 is done, so this never points at content
 * that would open locked. Course order rather than most-recent, so a part
 * skipped back in unit 1 keeps being offered instead of being buried under
 * everything since.
 */
export function nextOpenRound(
	lessons: readonly Lesson[],
	stars: Record<string, number>
): OpenRound | undefined {
	for (const lesson of lessons) {
		if ((stars[stepStarsKey(lesson.id, 1)] ?? 0) === 0) continue;
		for (const step of lessonSteps(lesson)) {
			if (step === 1) continue;
			if ((stars[stepStarsKey(lesson.id, step)] ?? 0) > 0) continue;
			return {
				lessonId: lesson.id,
				lessonTitle: lesson.title,
				step,
				label: ROUND_LABELS[step],
				href: roundHref(lesson.id, step)
			};
		}
	}
	return undefined;
}

/** Parts left to do in lessons already started — the count on Today's tile. */
export function openRoundCount(lessons: readonly Lesson[], stars: Record<string, number>): number {
	let n = 0;
	for (const lesson of lessons) {
		if ((stars[stepStarsKey(lesson.id, 1)] ?? 0) === 0) continue;
		for (const step of lessonSteps(lesson)) {
			if (step !== 1 && (stars[stepStarsKey(lesson.id, step)] ?? 0) === 0) n++;
		}
	}
	return n;
}

/**
 * The next part of the lesson just finished, for the completion screen.
 *
 * Returns nothing once the lesson is exhausted, and nothing for a part the
 * learner has already cleared — replaying is what the path is for.
 */
export function nextPartOf(
	lesson: Lesson,
	after: LessonStep,
	stars: Record<string, number>
): OpenRound | undefined {
	const steps = lessonSteps(lesson);
	const next = steps[steps.indexOf(after) + 1];
	if (next === undefined) return undefined;
	if ((stars[stepStarsKey(lesson.id, next)] ?? 0) > 0) return undefined;
	return {
		lessonId: lesson.id,
		lessonTitle: lesson.title,
		step: next,
		label: ROUND_LABELS[next],
		href: roundHref(lesson.id, next)
	};
}
