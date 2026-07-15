// Spaced-repetition state for the Script Studio: one Leitner-box entry per
// glyph, persisted to localStorage. Box 0 = new/lapsed … box 4 = mastered.
import { browser } from '$app/environment';

const STORAGE_KEY = 'myanlingo-script-v1';

/** Review intervals per box, in milliseconds. */
const INTERVALS = [
	0, // box 0: due immediately
	4 * 3600_000, // box 1: 4 hours
	24 * 3600_000, // box 2: 1 day
	3 * 24 * 3600_000, // box 3: 3 days
	7 * 24 * 3600_000 // box 4: 7 days
];

export const MAX_BOX = INTERVALS.length - 1;

export interface SrsEntry {
	box: number;
	due: number; // epoch ms
	seen: number;
	lapses: number;
}

interface Saved {
	entries: Record<string, SrsEntry>;
	unitsDone: string[];
}

class Srs {
	entries = $state<Record<string, SrsEntry>>({});
	unitsDone = $state<string[]>([]);

	constructor() {
		if (browser) {
			try {
				const raw = localStorage.getItem(STORAGE_KEY);
				if (raw) {
					const s: Saved = JSON.parse(raw);
					this.entries = s.entries ?? {};
					this.unitsDone = s.unitsDone ?? [];
				}
			} catch {
				// Corrupt storage — start fresh.
			}
		}
	}

	private save() {
		if (!browser) return;
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ entries: this.entries, unitsDone: this.unitsDone } satisfies Saved)
		);
	}

	isIntroduced(id: string): boolean {
		return id in this.entries;
	}

	box(id: string): number {
		return this.entries[id]?.box ?? -1; // -1 = not introduced
	}

	/** Called when an intro unit finishes: seed each glyph at box 1. */
	introduce(ids: string[]) {
		const now = Date.now();
		const next = { ...this.entries };
		for (const id of ids) {
			if (!next[id]) next[id] = { box: 1, due: now + INTERVALS[1], seen: 1, lapses: 0 };
		}
		this.entries = next;
		this.save();
	}

	/** Grade one drill answer and reschedule the item. */
	grade(id: string, correct: boolean) {
		const now = Date.now();
		const e = this.entries[id] ?? { box: 0, due: now, seen: 0, lapses: 0 };
		const box = correct ? Math.min(MAX_BOX, e.box + 1) : Math.max(0, e.box - 1);
		this.entries = {
			...this.entries,
			[id]: {
				box,
				due: now + (correct ? INTERVALS[box] : 0),
				seen: e.seen + 1,
				lapses: e.lapses + (correct ? 0 : 1)
			}
		};
		this.save();
	}

	/** Introduced items that are due for review, oldest first. */
	dueIds(now = Date.now()): string[] {
		return Object.entries(this.entries)
			.filter(([, e]) => e.due <= now)
			.sort((a, b) => a[1].due - b[1].due)
			.map(([id]) => id);
	}

	get dueCount(): number {
		return this.dueIds().length;
	}

	get introducedCount(): number {
		return Object.keys(this.entries).length;
	}

	get masteredCount(): number {
		return Object.values(this.entries).filter((e) => e.box >= MAX_BOX).length;
	}

	isUnitDone(id: string): boolean {
		return this.unitsDone.includes(id);
	}

	markUnitDone(id: string) {
		if (!this.unitsDone.includes(id)) {
			this.unitsDone = [...this.unitsDone, id];
			this.save();
		}
	}

	/** Units unlock in order; the first not-done unit is next. */
	isUnitUnlocked(unitIds: string[], id: string): boolean {
		const i = unitIds.indexOf(id);
		if (i <= 0) return i === 0;
		return this.unitsDone.includes(unitIds[i - 1]);
	}

	reset() {
		this.entries = {};
		this.unitsDone = [];
		this.save();
	}
}

export const srs = new Srs();
