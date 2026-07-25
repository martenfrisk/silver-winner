// Persistence for the confusion matrix — see $lib/confusion for what it is
// and why it's worth keeping.
import { browser } from '$app/environment';
import {
	missesFor,
	rank,
	rankMerged,
	record,
	type ConfusionMatrix,
	type ConfusionPair
} from '$lib/confusion';
import { CONFUSION_KEY as STORAGE_KEY, sanitizeConfusions } from '$lib/backup';

class Confusions {
	matrix = $state<ConfusionMatrix>({});

	constructor() {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) this.matrix = sanitizeConfusions(JSON.parse(raw));
		} catch {
			/* corrupt storage — start empty */
		}
	}

	private save() {
		if (!browser) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(this.matrix));
	}

	/** The learner reached for `picked` when the answer was `target`. */
	note(target: string, picked: string) {
		const next = record(this.matrix, target, picked);
		if (next === this.matrix) return;
		this.matrix = next;
		this.save();
	}

	get worst(): ConfusionPair[] {
		return rankMerged(this.matrix);
	}

	get all(): ConfusionPair[] {
		return rank(this.matrix);
	}

	missesFor(id: string): number {
		return missesFor(this.matrix, id);
	}

	get total(): number {
		return this.all.reduce((n, p) => n + p.count, 0);
	}

	reset() {
		this.matrix = {};
		this.save();
	}
}

export const confusions = new Confusions();
