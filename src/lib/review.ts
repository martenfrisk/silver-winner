// One review surface over every deck.
//
// The app grew four separate places to revisit things you already know:
// /practice (course vocabulary), /script/practice (glyphs), /cards (your own
// cards) and /script/confusions (contrast pairs). Each had its own due count,
// its own entry point, and no combined view — so "do I have anything to
// review?" had four answers and the learner had to visit four screens to
// assemble them.
//
// This module is the one answer. The four runners keep their URLs and keep
// working; they stop being destinations and become decks reached from one hub.
//
// Note what `combinedDue` deliberately leaves out: the confusion matrix has no
// schedule (see $lib/confusion — it is a bare count of what got mixed up, with
// no due date), so folding it into the number would make one figure mean two
// things. It is listed as an always-available targeted drill instead, and
// contributes nothing to the count.

export type DeckId = 'words' | 'letters' | 'cards' | 'pairs';

export interface DeckSummary {
	id: DeckId;
	title: string;
	/** Plural noun for count lines: "5 words", "1 card". Not the title, which reads badly inline. */
	noun: string;
	href: string;
	/** Items due now. Always 0 for unscheduled decks. */
	due: number;
	/** Items the learner has met. */
	known: number;
	/** Items that exist to be met, when that is a fixed number. */
	total?: number;
	/** Whether this deck is on an SRS schedule and so contributes to the count. */
	scheduled: boolean;
	/** One line of context, shown under the title. Always set. */
	note?: string;
	/** How to describe what's in the deck, when there is no `note` to show instead. */
	stock: string;
	/** Nothing to do here yet. */
	empty: boolean;
}

/** Live state the hub needs, passed in so this module stays store-free. */
export interface ReviewSnapshot {
	vocab: { due: number; known: number; mastered: number };
	glyphs: { due: number; known: number; total: number };
	cards: { due: number; count: number };
	/** Worst confusion pair, already merged and ranked — see $lib/confusion. */
	pairs: { total: number; worst?: { a: string; b: string } };
}

/**
 * Everything due right now, across the scheduled decks.
 *
 * This is the number on the Review tab badge, so it has to mean exactly one
 * thing: items the SRS says are ready. See the note above about confusions.
 */
export function combinedDue(s: ReviewSnapshot): number {
	return s.vocab.due + s.glyphs.due + s.cards.due;
}

/** One line per deck, in the order the hub lists them. */
export function deckSummaries(s: ReviewSnapshot): DeckSummary[] {
	const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
	return [
		{
			id: 'words',
			title: 'Words',
			noun: 'words',
			href: '/practice',
			due: s.vocab.due,
			known: s.vocab.known,
			scheduled: true,
			note: s.vocab.known === 0 ? 'Finish a lesson to start collecting words' : undefined,
			stock: `${s.vocab.known} learned, ${s.vocab.mastered} mastered`,
			empty: s.vocab.known === 0
		},
		{
			id: 'letters',
			title: 'Letters',
			noun: 'letters',
			href: '/script/practice',
			due: s.glyphs.due,
			known: s.glyphs.known,
			total: s.glyphs.total,
			scheduled: true,
			note: s.glyphs.known === 0 ? 'Learn some letters in Script Studio first' : undefined,
			stock: `${s.glyphs.known} of ${s.glyphs.total} learned`,
			empty: s.glyphs.known === 0
		},
		{
			id: 'cards',
			title: 'My cards',
			// Not "learned" — the learner wrote these, they didn't earn them.
			noun: 'cards',
			href: '/cards',
			due: s.cards.due,
			known: s.cards.count,
			scheduled: true,
			note: s.cards.count === 0 ? 'Write your own card for anything that keeps slipping' : undefined,
			stock: `${s.cards.count} ${plural(s.cards.count, 'card', 'cards')} you wrote`,
			empty: s.cards.count === 0
		},
		{
			id: 'pairs',
			title: 'Trouble pairs',
			noun: 'pairs',
			href: '/script/confusions',
			due: 0,
			known: s.pairs.total,
			scheduled: false,
			// Unscheduled on purpose, so say what it is instead of showing a 0.
			note: s.pairs.worst
				? `You mix up ${s.pairs.worst.a} and ${s.pairs.worst.b}`
				: 'Sounds you confuse show up here',
			stock: `${s.pairs.total} recorded`,
			empty: s.pairs.total === 0
		}
	];
}

/** Decks worth showing a learner right now. */
export function activeDecks(s: ReviewSnapshot): DeckSummary[] {
	return deckSummaries(s).filter((d) => !d.empty);
}

/** Whether the learner has anything at all to review yet. */
export function hasAnyDeck(s: ReviewSnapshot): boolean {
	return activeDecks(s).length > 0;
}

/**
 * How to spend one mixed review session, capped.
 *
 * Proportional to what is due, so the biggest backlog leads, but every
 * scheduled deck with anything due gets at least one item — a session that
 * silently skips a deck is how a deck rots. Defined now; the chained runner
 * that consumes it comes later.
 */
export function reviewPlan(s: ReviewSnapshot, cap = 20): { deck: DeckId; take: number }[] {
	const scheduled = deckSummaries(s).filter((d) => d.scheduled && d.due > 0);
	if (scheduled.length === 0) return [];

	const total = scheduled.reduce((n, d) => n + d.due, 0);
	if (total <= cap) return scheduled.map((d) => ({ deck: d.id, take: d.due }));

	// One each first, then share out what's left by weight.
	const plan = scheduled.map((d) => ({ deck: d.id, take: 1, due: d.due }));
	let left = cap - plan.length;
	for (const p of plan) {
		if (left <= 0) break;
		const extra = Math.min(left, Math.floor(((p.due - 1) / total) * cap));
		p.take += extra;
		left -= extra;
	}
	// Rounding leaves a remainder; give it to the biggest backlog.
	for (const p of [...plan].sort((a, b) => b.due - a.due)) {
		if (left <= 0) break;
		const room = p.due - p.take;
		const add = Math.min(room, left);
		p.take += add;
		left -= add;
	}
	return plan.map(({ deck, take }) => ({ deck, take }));
}
