// Escape hatch for items a learner can't get right.
//
// Every player re-queues a missed exercise at the end of the session,
// Duolingo-style. On its own that loop has no exit: miss the same word every
// time it comes back and it comes back again, so a review can trap you on one
// item for dozens of attempts. Nothing is learned after the third miss in a
// row — the answer has been shown three times — and the session stops being a
// review at all.
//
// So attempts are counted per item and, past the limit, the item is retired
// from the session instead of re-queued. It isn't forgiven: the SRS still has
// it (deferred a little, so it doesn't headline the very next session), and it
// comes back another day with a fresh three attempts.

/** Misses of the same item in one session before it stops coming back. */
export const MAX_ATTEMPTS = 3;

export class AttemptTracker {
	#misses = new Map<string, number>();

	/** Records a miss and reports whether the item should be re-queued. */
	miss(key: string): boolean {
		const n = (this.#misses.get(key) ?? 0) + 1;
		this.#misses.set(key, n);
		return n < MAX_ATTEMPTS;
	}

	/** How many times this item has been missed in this session. */
	count(key: string): number {
		return this.#misses.get(key) ?? 0;
	}

	/** Whether the item has hit the limit and been retired. */
	retired(key: string): boolean {
		return this.count(key) >= MAX_ATTEMPTS;
	}
}
