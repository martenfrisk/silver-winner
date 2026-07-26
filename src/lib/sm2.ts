// The self-graded scheduler: SM-2, as used by Anki and its descendants.
//
// The rest of the app schedules on a 5-box Leitner ladder with fixed intervals
// (0 / 4h / 1d / 3d / 7d — see srs.svelte.ts). That ladder is deliberately
// short and shallow: it drives the exercise *format* as much as the timing,
// and it caps out at a week because the app grades you, and a machine-graded
// multiple choice can't tell "knew it cold" from "worked it out".
//
// Self-grading changes what the scheduler knows. When the learner reports how
// the recall actually felt, the schedule can carry a per-card difficulty and
// stretch intervals to months, which is the entire reason spaced repetition
// beats a fixed ladder on long-horizon retention. So the two coexist rather
// than one replacing the other: guided review keeps the boxes, self-graded
// review runs this.
//
// Three grades, not Anki's four. "Hard" is the one Anki users most often
// misuse (it reads as "I got it, but barely" while acting as a near-lapse),
// and dropping it costs little here: `again` covers the miss, `easy` covers
// the instant hit, and `good` covers everything between.

/** How the recall felt. `again` is the only failing grade. */
export type Grade = 'again' | 'good' | 'easy';

/** Per-card scheduling state. Absent on a card that has only been graded by the app. */
export interface Sm2State {
	/** Difficulty multiplier: how fast this card's interval grows. */
	ease: number;
	/** Days until the next review. 0 = still learning, due in minutes. */
	interval: number;
	/** Consecutive non-lapsed reviews. Reset to 0 by `again`. */
	reps: number;
}

const MINUTE = 60_000;
const DAY = 86_400_000;

export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;

/** Ease moves by these on a grade. `good` is the neutral grade and moves nothing. */
const EASE_PENALTY = 0.2;
const EASE_BONUS = 0.15;

/**
 * A lapsed card comes back inside the session rather than tomorrow.
 *
 * Sending a card you just failed a full day out wastes the one moment you
 * know it's weak, and it's why Anki has relearning steps at all.
 */
const RELEARN_MS = 10 * MINUTE;

/** The two fixed steps every card climbs before its ease takes over. */
const FIRST_INTERVAL = 1;
const SECOND_INTERVAL = 6;
/** `easy` on a brand new card skips the 1-day step. */
const EASY_FIRST_INTERVAL = 4;
/** `easy` multiplies whatever the interval would have been. */
const EASY_BONUS = 1.3;

/**
 * Ceiling on a single interval, in days.
 *
 * A year is already far past the point where the schedule is the thing
 * limiting retention, and an uncapped SM-2 will happily propose intervals
 * longer than the learner has been alive after a run of `easy`.
 */
export const MAX_INTERVAL_DAYS = 365;

function clampEase(ease: number): number {
	return Math.max(MIN_EASE, Number.isFinite(ease) ? ease : DEFAULT_EASE);
}

/** The state a card starts in, before its first self-graded review. */
export function newState(): Sm2State {
	return { ease: DEFAULT_EASE, interval: 0, reps: 0 };
}

/**
 * Reads SM-2 state off a stored entry, filling in defaults.
 *
 * A card graded only in guided review has no SM-2 fields at all, so switching
 * the setting on has to be able to start one mid-life rather than refusing to
 * schedule it.
 */
export function stateOf(e: Partial<Sm2State> | undefined): Sm2State {
	return {
		ease: clampEase(e?.ease ?? DEFAULT_EASE),
		interval: Math.max(0, e?.interval ?? 0),
		reps: Math.max(0, Math.round(e?.reps ?? 0))
	};
}

export interface Scheduled {
	state: Sm2State;
	/** Epoch ms the card is next due. */
	due: number;
}

/**
 * Applies one self-grade and returns the card's next state and due date.
 *
 * Pure, and takes `now`, so the interval ladder is testable without waiting a
 * week for the assertion to come true.
 */
export function schedule(prev: Sm2State, grade: Grade, now = Date.now()): Scheduled {
	const s = stateOf(prev);

	if (grade === 'again') {
		// A lapse costs ease and drops the card back to the learning steps. The
		// interval is zeroed rather than halved: the next `good` should rebuild
		// from the bottom, because a card you just blanked on has not earned
		// whatever spacing it had before.
		return {
			state: { ease: clampEase(s.ease - EASE_PENALTY), interval: 0, reps: 0 },
			due: now + RELEARN_MS
		};
	}

	const easy = grade === 'easy';
	const ease = clampEase(s.ease + (easy ? EASE_BONUS : 0));

	// The first two successes use fixed steps, as in SM-2 proper: a card with
	// two data points has not told you enough for its ease to mean anything.
	let days: number;
	if (s.reps === 0) days = easy ? EASY_FIRST_INTERVAL : FIRST_INTERVAL;
	else if (s.reps === 1) days = easy ? Math.round(SECOND_INTERVAL * EASY_BONUS) : SECOND_INTERVAL;
	else days = Math.round(s.interval * ease * (easy ? EASY_BONUS : 1));

	const interval = Math.min(MAX_INTERVAL_DAYS, Math.max(FIRST_INTERVAL, days));
	return { state: { ease, interval, reps: s.reps + 1 }, due: now + interval * DAY };
}

/**
 * "1d", "3w", "10m" — the interval a grade would buy, for the button labels.
 *
 * Showing these is not decoration: it is the only way the learner can tell
 * what their own honesty costs them, which is what stops `easy` becoming the
 * default tap.
 */
export function formatInterval(ms: number): string {
	if (ms < 45 * MINUTE) return `${Math.max(1, Math.round(ms / MINUTE))}m`;
	const days = ms / DAY;
	if (days < 1) return `${Math.round(ms / (60 * MINUTE))}h`;
	if (days < 7) return `${Math.round(days)}d`;
	if (days < 30) return `${Math.round(days / 7)}w`;
	if (days < 365) return `${Math.round(days / 30)}mo`;
	return `${(days / 365).toFixed(days < 730 ? 1 : 0)}y`;
}

/** What each grade would do to a card right now, for the three buttons. */
export function previewGrades(
	prev: Partial<Sm2State> | undefined,
	now = Date.now()
): Record<Grade, string> {
	const s = stateOf(prev);
	const label = (g: Grade) => formatInterval(schedule(s, g, now).due - now);
	return { again: label('again'), good: label('good'), easy: label('easy') };
}
