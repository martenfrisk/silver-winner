// Spaced-repetition state for course vocabulary: one Leitner-box entry per
// vocab item, persisted to localStorage. Entries are keyed by the item's
// Burmese text — stable across content edits — and introduced when the lesson
// that teaches them is completed. Box 0 = new/lapsed … box 4 = mastered.
//
// The store also tracks the learner's recent in-lesson mistakes (capped,
// deduped, most recent first) so the /practice session can target them first.
import { browser } from '$app/environment';
import { course } from '$lib/data/course';
import { progress } from '$lib/progress.svelte';

const STORAGE_KEY = 'myanlingo-vocab-v1';

/** Review intervals per box, in milliseconds (same ladder as the script SRS). */
const INTERVALS = [
	0, // box 0: due immediately
	4 * 3600_000, // box 1: 4 hours
	24 * 3600_000, // box 2: 1 day
	3 * 24 * 3600_000, // box 3: 3 days
	7 * 24 * 3600_000 // box 4: 7 days
];

export const VOCAB_MAX_BOX = INTERVALS.length - 1;

/** Most recent mistakes kept for targeted practice. */
const MISTAKE_CAP = 20;

export interface VocabItem {
	my: string;
	roman: string;
	en: string;
	lessonId: string;
}

export interface VocabEntry {
	box: number;
	due: number; // epoch ms
	seen: number;
	lapses: number;
}

interface Saved {
	entries: Record<string, VocabEntry>;
	mistakes: string[];
}

// ── Vocabulary index, derived once from the course data ───────────────
// A lesson's vocabulary is its `learn` exercises.
const byLesson = new Map<string, VocabItem[]>();
const byMy = new Map<string, VocabItem>();
for (const unit of course) {
	for (const lesson of unit.lessons) {
		const items: VocabItem[] = [];
		for (const ex of lesson.exercises) {
			if (ex.kind !== 'learn') continue;
			const item: VocabItem = { my: ex.my, roman: ex.roman, en: ex.en, lessonId: lesson.id };
			items.push(item);
			if (!byMy.has(ex.my)) byMy.set(ex.my, item);
		}
		byLesson.set(lesson.id, items);
	}
}

/** Every course vocab item, keyed by its Burmese text. */
export const vocabByMy: ReadonlyMap<string, VocabItem> = byMy;

/** All course vocab items in course order. */
export const allVocab: readonly VocabItem[] = [...byMy.values()];

class VocabSrs {
	entries = $state<Record<string, VocabEntry>>({});
	/** Burmese texts of recently missed vocab, most recent first. */
	mistakes = $state<string[]>([]);

	constructor() {
		if (browser) {
			try {
				const raw = localStorage.getItem(STORAGE_KEY);
				if (raw) {
					const s: Saved = JSON.parse(raw);
					this.entries = s.entries ?? {};
					this.mistakes = s.mistakes ?? [];
				}
			} catch {
				// Corrupt storage — start fresh.
			}
			// Migration/seed: lessons completed before this store existed (or on
			// another code path) still get their vocabulary into the SRS.
			this.seedFromProgress();
		}
	}

	private save() {
		if (!browser) return;
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ entries: this.entries, mistakes: this.mistakes } satisfies Saved)
		);
	}

	/** Introduces the vocab of every already-completed lesson that's missing. */
	private seedFromProgress() {
		const missing: string[] = [];
		for (const [lessonId, items] of byLesson) {
			if (!progress.isCompleted(lessonId)) continue;
			for (const item of items) if (!(item.my in this.entries)) missing.push(item.my);
		}
		if (missing.length > 0) this.introduce(missing);
	}

	isIntroduced(my: string): boolean {
		return my in this.entries;
	}

	box(my: string): number {
		return this.entries[my]?.box ?? -1; // -1 = not introduced
	}

	/** Called when a course lesson completes: seed its vocab at box 1. */
	introduceLesson(lessonId: string) {
		const items = byLesson.get(lessonId);
		if (items && items.length > 0) this.introduce(items.map((v) => v.my));
	}

	private introduce(myTexts: string[]) {
		const now = Date.now();
		const next = { ...this.entries };
		for (const my of myTexts) {
			if (!next[my]) next[my] = { box: 1, due: now + INTERVALS[1], seen: 1, lapses: 0 };
		}
		this.entries = next;
		this.save();
	}

	/** Grade one practice answer and reschedule the item. */
	grade(my: string, correct: boolean) {
		const now = Date.now();
		const e = this.entries[my] ?? { box: 0, due: now, seen: 0, lapses: 0 };
		const box = correct ? Math.min(VOCAB_MAX_BOX, e.box + 1) : Math.max(0, e.box - 1);
		this.entries = {
			...this.entries,
			[my]: {
				box,
				due: now + (correct ? INTERVALS[box] : 0),
				seen: e.seen + 1,
				lapses: e.lapses + (correct ? 0 : 1)
			}
		};
		// Practicing a mistake correctly clears it from the list; missing it
		// (again) bumps it back to the front.
		if (correct) this.mistakes = this.mistakes.filter((m) => m !== my);
		else this.mistakes = [my, ...this.mistakes.filter((m) => m !== my)].slice(0, MISTAKE_CAP);
		this.save();
	}

	/** Records an in-lesson mistake for later practice (no SRS penalty). */
	recordMistake(my: string) {
		if (!byMy.has(my)) return; // unmappable — skip
		this.mistakes = [my, ...this.mistakes.filter((m) => m !== my)].slice(0, MISTAKE_CAP);
		this.save();
	}

	/** Introduced items that are due for review, oldest first. */
	dueIds(now = Date.now()): string[] {
		return Object.entries(this.entries)
			.filter(([, e]) => e.due <= now)
			.sort((a, b) => a[1].due - b[1].due)
			.map(([my]) => my);
	}

	get dueCount(): number {
		return this.dueIds().length;
	}

	get introducedCount(): number {
		return Object.keys(this.entries).length;
	}

	get masteredCount(): number {
		return Object.values(this.entries).filter((e) => e.box >= VOCAB_MAX_BOX).length;
	}

	reset() {
		this.entries = {};
		this.mistakes = [];
		this.save();
	}
}

export const vocabSrs = new VocabSrs();
