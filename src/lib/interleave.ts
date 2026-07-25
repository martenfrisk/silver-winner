// Spreads a queue so consecutive items come from different groups.
//
// Why this exists: practice queues are ordered by SRS due date, and every word
// of a lesson step is introduced in one call with an identical due timestamp.
// Sorting by due therefore emits a lesson's whole cohort back to back, and the
// first review after a lesson — the one that matters most — is maximally
// blocked practice.
//
// Blocked practice is the comfortable arrangement and the worse one. Rohrer &
// Taylor (2007) found blocking produced better performance *during* practice
// and worse performance on a delayed test; Kornell & Bjork (2008) found
// interleaving beat blocking for classifying new examples, while about 80% of
// their participants judged blocking to have worked better. Expect the same
// here: sessions will feel slightly harder and stick better.
//
// Note that jittering the due timestamps does *not* fix this. That only
// decorrelates items within one cohort — every word of lesson 1 is still due
// before every word of lesson 2, so the blocks survive. The ordering has to
// change after selection, which is what this does.

/**
 * Reorders `items` so that neighbours come from different groups where the
 * group sizes allow it, preserving each group's internal order (which is due
 * order, so the most overdue item in a group still leads that group).
 *
 * Greedy: always take from the largest group that isn't the one just used.
 * With one dominant group the tail necessarily repeats it, which is correct —
 * there is nothing left to interleave with.
 */
export function interleaveByGroup<T>(items: readonly T[], groupOf: (item: T) => string): T[] {
	if (items.length < 3) return [...items];

	const buckets = new Map<string, T[]>();
	for (const item of items) {
		const key = groupOf(item);
		const bucket = buckets.get(key);
		if (bucket) bucket.push(item);
		else buckets.set(key, [item]);
	}
	// Nothing to interleave against.
	if (buckets.size < 2) return [...items];

	const out: T[] = [];
	let last: string | null = null;
	while (out.length < items.length) {
		let pick: string | null = null;
		let most = 0;
		for (const [key, bucket] of buckets) {
			if (bucket.length === 0 || key === last) continue;
			if (bucket.length > most) {
				most = bucket.length;
				pick = key;
			}
		}
		// Only the just-used group has items left; the tail has to repeat it.
		if (pick === null) {
			for (const [key, bucket] of buckets) {
				if (bucket.length > 0) {
					pick = key;
					break;
				}
			}
		}
		if (pick === null) break; // unreachable: out.length < items.length implies stock
		out.push(buckets.get(pick)!.shift()!);
		last = pick;
	}
	return out;
}

/** Longest run of same-group neighbours — 1 means perfectly alternating. */
export function longestRun<T>(items: readonly T[], groupOf: (item: T) => string): number {
	let best = 0;
	let run = 0;
	let last: string | null = null;
	for (const item of items) {
		const key = groupOf(item);
		run = key === last ? run + 1 : 1;
		last = key;
		if (run > best) best = run;
	}
	return best;
}
