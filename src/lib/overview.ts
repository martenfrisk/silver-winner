// Reading `progress.stars` as a whole, for the first time.
//
// Four separate systems write stars into one map under disjoint key prefixes:
// course lessons (`first-words`), deeper rounds (`first-words#2`), reader units
// (`reader-greetings`) and stories (`story-teashop`). The three key builders
// that produce them live in three different modules, and until now nothing
// owned the inverse — so nothing could read the map back. That is why the app
// had no cross-track progress anywhere, and why /account could show a course
// lesson count but not a reader or story one.
//
// `starKind` is that inverse, and it is the single place that knows the key
// shapes. A round-trip test drives all three builders through it, so a future
// fifth star-bearing system cannot quietly land in 'unknown'.

export type StarKind = 'lesson' | 'round' | 'reader' | 'story' | 'unknown';

export interface ParsedKey {
	kind: StarKind;
	/** Lesson id, unit id or story id, depending on `kind`. */
	id: string;
	/** Only for 'round': which deeper round (2 or 3). */
	round?: number;
}

const READER_PREFIX = 'reader-';
const STORY_PREFIX = 'story-';

/**
 * Which system wrote a stars key, and what it points at.
 *
 * Order matters: the prefixed forms are checked before the bare one, because a
 * bare lesson id is the fallback and would otherwise swallow everything.
 */
export function starKind(key: string): ParsedKey {
	if (!key) return { kind: 'unknown', id: key };

	if (key.startsWith(READER_PREFIX)) {
		const id = key.slice(READER_PREFIX.length);
		return id ? { kind: 'reader', id } : { kind: 'unknown', id: key };
	}
	if (key.startsWith(STORY_PREFIX)) {
		const id = key.slice(STORY_PREFIX.length);
		return id ? { kind: 'story', id } : { kind: 'unknown', id: key };
	}
	const hash = key.indexOf('#');
	if (hash > 0) {
		const round = Number(key.slice(hash + 1));
		if (round === 2 || round === 3) return { kind: 'round', id: key.slice(0, hash), round };
		return { kind: 'unknown', id: key };
	}
	return { kind: 'lesson', id: key };
}

export interface TrackSummary {
	id: 'course' | 'rounds' | 'reader' | 'script' | 'stories';
	title: string;
	href: string;
	done: number;
	total: number;
	/** 0..1. Zero when the track has nothing in it, never NaN. */
	pct: number;
}

/** Everything the cross-track figures need, passed in so this stays store-free. */
export interface OverviewSnapshot {
	stars: Record<string, number>;
	/** Course lesson ids, in order. */
	lessonIds: readonly string[];
	/** Lessons waved through with "I know this" — see courseTotal. */
	skippedIds: readonly string[];
	/** Course unit ids (the reader track shares these). */
	unitIds: readonly string[];
	/** All story ids, and the ones whose prerequisites are met. */
	storyIds: readonly string[];
	unlockedStoryIds: readonly string[];
	/** Total deeper rounds available across the course (steps 2 and 3). */
	totalRounds: number;
	scriptUnitsDone: number;
	scriptUnitsTotal: number;
}

function pct(done: number, total: number): number {
	return total > 0 ? done / total : 0;
}

/** Keys of a given kind that actually earned a star. */
function idsOfKind(stars: Record<string, number>, kind: StarKind): Set<string> {
	const out = new Set<string>();
	for (const [key, value] of Object.entries(stars)) {
		if (value > 0 && starKind(key).kind === kind) out.add(starKind(key).id);
	}
	return out;
}

export function courseDone(s: OverviewSnapshot): number {
	const done = idsOfKind(s.stars, 'lesson');
	// Only count real course lessons: the map may hold ids from elsewhere.
	return s.lessonIds.filter((id) => done.has(id)).length;
}

/**
 * Lessons that make up this learner's course.
 *
 * Skipping a unit ("I know this", offered to profiles that already read the
 * script) waves its lessons through without stars, so counting them here left
 * the meter permanently short of its own total — 21/24 with the missing three
 * unreachable by design. A skip removes a lesson from the ladder rather than
 * marking it done, so it leaves the denominator too.
 *
 * The `done.has` clause is belt and braces: completing a lesson un-skips it
 * (see progress.completeLesson), so a lesson should never be both — but if one
 * ever were, dropping it from the total while `courseDone` still counted it
 * would report more done than exist.
 */
export function courseTotal(s: OverviewSnapshot): number {
	const skipped = new Set(s.skippedIds);
	const done = idsOfKind(s.stars, 'lesson');
	return s.lessonIds.filter((id) => !skipped.has(id) || done.has(id)).length;
}

/**
 * Deeper rounds (steps 2 and 3) completed across the whole course.
 *
 * These were invisible outside a ring on one lesson node, which is a strange
 * amount of content to hide: most lessons have two extra rounds.
 */
export function courseRounds(s: OverviewSnapshot): { done: number; total: number } {
	let done = 0;
	for (const [key, value] of Object.entries(s.stars)) {
		const parsed = starKind(key);
		if (value > 0 && parsed.kind === 'round' && s.lessonIds.includes(parsed.id)) done++;
	}
	return { done, total: s.totalRounds };
}

export function readerDone(s: OverviewSnapshot): number {
	const done = idsOfKind(s.stars, 'reader');
	return s.unitIds.filter((id) => done.has(id)).length;
}

export function storiesDone(s: OverviewSnapshot): number {
	const done = idsOfKind(s.stars, 'story');
	return s.storyIds.filter((id) => done.has(id)).length;
}

/** One row per track, for the progress strip and the stats grid. */
export function trackSummaries(s: OverviewSnapshot): TrackSummary[] {
	const course = courseDone(s);
	const courseOf = courseTotal(s);
	const rounds = courseRounds(s);
	const reader = readerDone(s);
	const story = storiesDone(s);
	return [
		{
			id: 'course',
			title: 'Course',
			href: '/learn',
			done: course,
			total: courseOf,
			pct: pct(course, courseOf)
		},
		// The optional parts, counted separately rather than folded into the
		// course row. Two different questions — "have I unlocked everything?"
		// and "have I learned everything it teaches?" — and one bar answering
		// only the first is how most of the material stayed invisible.
		{
			id: 'rounds',
			title: 'Lesson parts',
			href: '/learn',
			done: rounds.done,
			total: rounds.total,
			pct: pct(rounds.done, rounds.total)
		},
		{
			id: 'reader',
			title: 'Reading',
			href: '/reader',
			done: reader,
			total: s.unitIds.length,
			pct: pct(reader, s.unitIds.length)
		},
		{
			id: 'script',
			title: 'Letters',
			href: '/script',
			done: s.scriptUnitsDone,
			total: s.scriptUnitsTotal,
			pct: pct(s.scriptUnitsDone, s.scriptUnitsTotal)
		},
		{
			id: 'stories',
			title: 'Stories',
			href: '/stories',
			done: story,
			total: s.storyIds.length,
			pct: pct(story, s.storyIds.length)
		}
	];
}

/**
 * One number for "how far through Shwe am I".
 *
 * Weighted by each track's size rather than averaging the percentages, so
 * finishing all 3 stories doesn't count as much as finishing all 24 lessons.
 */
export function overallPct(s: OverviewSnapshot): number {
	const rows = trackSummaries(s);
	const done = rows.reduce((n, r) => n + r.done, 0);
	const total = rows.reduce((n, r) => n + r.total, 0);
	return pct(done, total);
}
