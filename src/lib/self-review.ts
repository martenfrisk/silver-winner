// Queue builder for self-graded word review (see $lib/sm2 for the scheduler
// and progress.selfReview for the setting that turns it on).
//
// Deliberately unlike buildVocabPracticeQueue, which tops a thin session up
// with the weakest introduced words so that opening /practice always gives you
// something to do. That is the right call for guided review, where the app is
// choosing your workload for you. It is the wrong call here: the whole promise
// of a spaced scheduler is that it decides *when*, and a queue that invents
// cards to fill a session is one that quietly retires the schedule and reviews
// everything early. If nothing is due, nothing is due, and the session says so.
//
// Pure and store-free like the other session builders: it takes the state it
// needs and returns a queue, so the page wires the store into it.
import type { VocabItem } from '$lib/vocab-srs.svelte';

/** One card: Burmese on the front, English on the back. */
export interface SelfReviewCard {
	my: string;
	roman?: string;
	en: string;
}

/**
 * Most cards in one sitting.
 *
 * Anki's own default is 200, which is a number for someone maintaining a
 * 10,000-card deck over years. This course has a few hundred words total, and
 * a session you can finish is one you come back to.
 */
export const SESSION_CAP = 20;

export interface SelfReviewState {
	/** Words the scheduler says are due, oldest-due first (vocabSrs.dueIds()). */
	dueIds: readonly string[];
	/** The course vocabulary index (vocabByMy). */
	byMy: ReadonlyMap<string, VocabItem>;
}

/**
 * The due queue, capped.
 *
 * Due order is kept as given rather than interleaved by lesson the way guided
 * practice does it. Interleaving fights blocked practice, which is a property
 * of how a *lesson's* cohort enters the queue together; a mature self-graded
 * deck is already mixed, because its order comes from when each card happened
 * to fall due rather than from where it was taught.
 */
export function buildSelfReviewQueue(s: SelfReviewState, cap = SESSION_CAP): SelfReviewCard[] {
	const out: SelfReviewCard[] = [];
	for (const my of s.dueIds) {
		if (out.length >= cap) break;
		// Words whose content has since been edited or removed are dropped
		// rather than rendered as a blank card.
		const item = s.byMy.get(my);
		if (item) out.push({ my: item.my, roman: item.roman, en: item.en });
	}
	return out;
}

/**
 * Stars for a finished session, by how much of it needed a second look.
 *
 * `again` is the only grade that counts against you: `easy` and `good` are
 * both hits, and a scheduler that treats "took a moment" as a failure teaches
 * the learner to press `easy` to protect their score.
 */
export function starsFor(total: number, lapses: number): number {
	if (total === 0) return 0;
	const missRate = lapses / total;
	if (missRate === 0) return 3;
	return missRate <= 0.25 ? 2 : 1;
}
