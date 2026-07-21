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
		href: '/',
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

/** The track a profile should lead with. Unset/explorer keeps the course front and center. */
export function primaryTrack(profile: Profile | null): TrackId {
	if (profile === 'script-reader') return 'reader';
	if (profile === 'speaker') return 'script';
	return 'course';
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
