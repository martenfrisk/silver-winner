// The three learning tracks and how a learner's profile routes between them.
// Pure module (no store imports) so the routing logic is unit-testable: the
// home page passes in a snapshot of live state.
//
// Profiles reorder and frame — they never hide or lock a track.
import type { Profile } from '$lib/progress.svelte';

export type TrackId = 'course' | 'reader' | 'script';

export interface Track {
	id: TrackId;
	title: string;
	emoji: string;
	href: string;
	/** Who this track is for — the one-liner that makes the structure self-explaining. */
	audience: string;
}

export const tracks: Track[] = [
	{
		id: 'course',
		title: 'Course',
		emoji: '🐱',
		href: '/learn',
		audience: 'Learn to speak and understand. Start here if Burmese is new to you'
	},
	{
		id: 'reader',
		title: 'Reader track',
		emoji: '📖',
		href: '/reader',
		audience: 'Know the script but not the words? Learn the course through reading'
	},
	{
		id: 'script',
		title: 'Script Studio',
		emoji: 'အ',
		href: '/script',
		audience: 'Learn to read and write the letters. Ideal if you already speak some Burmese'
	}
];

export const trackById = new Map(tracks.map((t) => [t.id, t]));

/** Course units whose material a given profile has already told us it knows. */
const KNOWN_UNITS: Partial<Record<NonNullable<Profile>, readonly string[]>> = {
	// Both of these profiles read the script; sitting through "The Script"
	// teaching က, ခ, ဂ… is busywork standing between them and the course.
	'script-reader': ['script'],
	speaker: ['script']
};

/**
 * Whether a course unit can be waved through for this profile. Skipping is
 * offered, never applied automatically — the learner said they know the
 * script, not that they want to be sent past it.
 */
export function canSkipUnit(profile: Profile | null, unitId: string): boolean {
	if (!profile) return false;
	return KNOWN_UNITS[profile]?.includes(unitId) ?? false;
}

/** The track a profile should lead with. Unset/explorer keeps the course front and center. */
export function primaryTrack(profile: Profile | null): TrackId {
	if (profile === 'script-reader') return 'reader';
	if (profile === 'speaker') return 'script';
	return 'course';
}

/**
 * Which row leads inside a unit on the course path.
 *
 * The course unit is one ladder with two ways up it: do the lessons, or read
 * the same material in script. A script-reader wants the reading row first; a
 * beginner wants the lessons. This is `primaryTrack` applied per unit instead
 * of per screen, and it is a reorder only — both rows always render and both
 * stay tappable, which is the never-hide-or-lock rule at unit granularity.
 */
export function primaryMode(profile: Profile | null): 'lessons' | 'read' {
	return profile === 'script-reader' ? 'read' : 'lessons';
}

/** Live-state snapshot the suggestion logic needs (built by the home page). */
export interface SuggestState {
	vocabDue: number;
	glyphsDue: number;
	nextLesson?: { id: string; title: string };
	/** First reader unit without stars. */
	nextReaderUnit?: { id: string; title: string };
	/** First Script Studio unit not yet done. */
	nextScriptUnit?: { id: string; title: string };
	uncrownedLesson?: { id: string; title: string };
}

export interface Suggestion {
	href: string;
	label: string;
}

/** The one hero action on Today. */
export interface NextUp {
	href: string;
	/** Button text, e.g. "Continue the course". */
	title: string;
	/** One line of context under it. */
	sub: string;
	/** Which track it belongs to, for the icon. */
	track: TrackId;
}

/**
 * The single best thing to do right now.
 *
 * Today used to render two cards answering this same question: a "Continue
 * <primary track>" card driven by `primaryTrack`, and a separate suggestion
 * inside the goal dial driven by `suggestFor`. They regularly disagreed, and
 * the dial was hidden until `xp > 0`, so a brand new learner saw neither a
 * suggestion nor any reason to trust the one card that was left.
 *
 * One answer instead: whatever is genuinely most useful, falling back to the
 * profile's home track when nothing is pressing. Always rendered.
 */
export function nextUp(profile: Profile | null, s: SuggestState): NextUp {
	const primary = primaryTrack(profile);

	// Due work first, but only when there is enough of it to be worth
	// interrupting a learner who has somewhere else to be.
	if (s.vocabDue > 0 && (primary !== 'script' || s.glyphsDue === 0)) {
		return {
			href: '/review',
			title: 'Review your words',
			sub: `${s.vocabDue} word${s.vocabDue === 1 ? '' : 's'} ready`,
			track: 'course'
		};
	}
	if (s.glyphsDue > 0) {
		return {
			href: '/review',
			title: 'Review your letters',
			sub: `${s.glyphsDue} letter${s.glyphsDue === 1 ? '' : 's'} ready`,
			track: 'script'
		};
	}

	// Nothing due: carry on down the profile's own track.
	if (primary === 'reader' && s.nextReaderUnit) {
		return {
			href: `/reader/${s.nextReaderUnit.id}`,
			title: 'Continue reading',
			sub: `Next: ${s.nextReaderUnit.title}`,
			track: 'reader'
		};
	}
	if (primary === 'script' && s.nextScriptUnit) {
		return {
			href: '/script',
			title: 'Continue the script',
			sub: `Next: ${s.nextScriptUnit.title}`,
			track: 'script'
		};
	}
	if (s.nextLesson) {
		return {
			href: `/lesson/${s.nextLesson.id}`,
			title: 'Continue the course',
			sub: `Next: ${s.nextLesson.title}`,
			track: 'course'
		};
	}

	// The learner's own track is exhausted; offer the others before crowns.
	if (s.nextReaderUnit) {
		return {
			href: `/reader/${s.nextReaderUnit.id}`,
			title: 'Read a unit in script',
			sub: s.nextReaderUnit.title,
			track: 'reader'
		};
	}
	if (s.nextScriptUnit) {
		return {
			href: '/script',
			title: 'Learn the next letters',
			sub: s.nextScriptUnit.title,
			track: 'script'
		};
	}
	if (s.uncrownedLesson) {
		return {
			href: `/lesson/${s.uncrownedLesson.id}?mode=hard`,
			title: 'Go for a crown',
			sub: `Hard mode: ${s.uncrownedLesson.title}`,
			track: 'course'
		};
	}
	return { href: '/review', title: 'Keep everything fresh', sub: 'A quick review round', track: 'course' };
}

/**
 * The single best "do this next" action for the daily nudge, ordered by what
 * the profile is actually here to learn: speakers put script first, script
 * readers put reading first, everyone else keeps the classic order.
 */
export function suggestFor(profile: Profile | null, s: SuggestState): Suggestion {
	const wordReview = s.vocabDue > 0 && {
		href: '/practice',
		label: `a word review (${s.vocabDue} due)`
	};
	const glyphDrill = s.glyphsDue > 0 && {
		href: '/script/practice',
		label: `a glyph drill (${s.glyphsDue} due)`
	};
	const lesson = s.nextLesson && {
		href: `/lesson/${s.nextLesson.id}`,
		label: `the next lesson: ${s.nextLesson.title}`
	};
	const readerUnit = s.nextReaderUnit && {
		href: `/reader/${s.nextReaderUnit.id}`,
		label: `reading ${s.nextReaderUnit.title}`
	};
	const scriptUnit = s.nextScriptUnit && {
		href: '/script',
		label: `the next letters: ${s.nextScriptUnit.title}`
	};
	const crown = s.uncrownedLesson && {
		href: `/lesson/${s.uncrownedLesson.id}?mode=hard`,
		label: `a 👑 crown run of ${s.uncrownedLesson.title}`
	};
	const fallback = { href: '/practice', label: 'a practice round' };

	const order =
		profile === 'speaker'
			? [glyphDrill, scriptUnit, wordReview, lesson, crown]
			: profile === 'script-reader'
				? [wordReview, readerUnit, lesson, glyphDrill, crown]
				: [wordReview, glyphDrill, lesson, crown];

	for (const o of order) if (o) return o;
	return fallback;
}
