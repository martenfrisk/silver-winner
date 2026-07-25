// A third kind of module, alongside the two in CLAUDE.md's table.
//
// Stores (`*.svelte.ts`) own a localStorage key. Pure modules (`.ts`) own
// logic and import no stores. This owns *neither*: it holds no storage of its
// own and exists only to read across every store at once, so the app finally
// has one answer to "how far along am I?" instead of four screens each holding
// a piece of it.
//
// Fields are `$derived`, not getters, on purpose. `vocabSrs.dueCount` and
// `srs.dueCount` each walk their whole entry map, and the tab bar reads
// `combinedDue` on every hub render — as getters they would recompute on every
// pass instead of once per change.
import { course, allLessons, lessonSteps } from '$lib/data/course';
import { scriptUnits, totalGlyphs } from '$lib/data/script';
import { stories } from '$lib/data/stories';
import { progress } from '$lib/progress.svelte';
import { srs } from '$lib/srs.svelte';
import { vocabSrs } from '$lib/vocab-srs.svelte';
import { customCards } from '$lib/custom-cards.svelte';
import { confusions } from '$lib/confusion.svelte';
import {
	courseRounds,
	overallPct,
	trackSummaries,
	type OverviewSnapshot,
	type TrackSummary
} from '$lib/overview';
import { combinedDue, deckSummaries, hasAnyDeck, type DeckSummary, type ReviewSnapshot } from '$lib/review';

// Content-derived constants: fixed at module load, never per render.
const LESSON_IDS = allLessons.map((l) => l.lesson.id);
const UNIT_IDS = course.map((u) => u.id);
const STORY_IDS = stories.map((s) => s.id);
/** Deeper rounds available across the course: every step past the first. */
const TOTAL_ROUNDS = allLessons.reduce((n, l) => n + Math.max(0, lessonSteps(l.lesson).length - 1), 0);

class Overview {
	private snapshot = $derived<OverviewSnapshot>({
		stars: progress.stars,
		lessonIds: LESSON_IDS,
		unitIds: UNIT_IDS,
		storyIds: STORY_IDS,
		unlockedStoryIds: stories
			.filter((s) => s.requires.every((id) => progress.isCompleted(id)))
			.map((s) => s.id),
		totalRounds: TOTAL_ROUNDS,
		scriptUnitsDone: srs.unitsDone.length,
		scriptUnitsTotal: scriptUnits.length
	});

	private review = $derived<ReviewSnapshot>({
		vocab: {
			due: vocabSrs.dueCount,
			known: vocabSrs.introducedCount,
			mastered: vocabSrs.masteredCount
		},
		glyphs: { due: srs.dueCount, known: srs.introducedCount, total: totalGlyphs },
		cards: { due: customCards.dueCount, count: customCards.count },
		pairs: { total: confusions.total }
	});

	tracks = $derived<TrackSummary[]>(trackSummaries(this.snapshot));
	rounds = $derived(courseRounds(this.snapshot));
	overall = $derived(overallPct(this.snapshot));

	decks = $derived<DeckSummary[]>(deckSummaries(this.review));
	combinedDue = $derived(combinedDue(this.review));
	hasDecks = $derived(hasAnyDeck(this.review));

	crownCount = $derived(Object.keys(progress.crowns).length);
	storiesUnlocked = $derived(this.snapshot.unlockedStoryIds.length);

	/** Convenience for the stats grid, so it doesn't re-derive per tile. */
	track(id: TrackSummary['id']): TrackSummary {
		return this.tracks.find((t) => t.id === id)!;
	}
}

export const overview = new Overview();
