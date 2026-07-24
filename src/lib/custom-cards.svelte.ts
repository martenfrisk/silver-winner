// Learner-authored review cards — the hybrid-SRS prototype. A card is just a
// front (prompt) and a back (answer) the learner types in; it then rides the
// same 5-box Leitner ladder as the vocab and glyph SRS, reviewed by self-grade.
// Everything is localStorage, like the rest of the app — no backend, no sync.
import { browser } from '$app/environment';

const STORAGE_KEY = 'myanlingo-custom-v1';

/** Same interval ladder as srs.svelte.ts / vocab-srs.svelte.ts. */
const INTERVALS = [0, 4 * 3600_000, 24 * 3600_000, 3 * 24 * 3600_000, 7 * 24 * 3600_000];
export const CUSTOM_MAX_BOX = INTERVALS.length - 1;

export interface CustomCard {
	id: string;
	front: string;
	back: string;
	box: number;
	due: number;
	created: number;
}

function newId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

class CustomCards {
	cards = $state<CustomCard[]>([]);

	constructor() {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) this.cards = JSON.parse(raw);
		} catch {
			/* corrupt storage — start empty */
		}
	}

	get count(): number {
		return this.cards.length;
	}

	get dueCount(): number {
		const now = Date.now();
		return this.cards.filter((c) => c.due <= now).length;
	}

	/** Due cards, oldest-due first — the review queue. */
	dueCards(): CustomCard[] {
		const now = Date.now();
		return this.cards.filter((c) => c.due <= now).sort((a, b) => a.due - b.due);
	}

	/** Newest first, for the management list. */
	all(): CustomCard[] {
		return [...this.cards].sort((a, b) => b.created - a.created);
	}

	add(front: string, back: string): void {
		front = front.trim();
		back = back.trim();
		if (!front || !back) return;
		const now = Date.now();
		this.cards = [...this.cards, { id: newId(), front, back, box: 0, due: now, created: now }];
		this.save();
	}

	remove(id: string): void {
		this.cards = this.cards.filter((c) => c.id !== id);
		this.save();
	}

	/** Self-grade: a hit climbs a box, a miss drops to box 0. */
	grade(id: string, ok: boolean): void {
		const now = Date.now();
		this.cards = this.cards.map((c) => {
			if (c.id !== id) return c;
			const box = ok ? Math.min(c.box + 1, CUSTOM_MAX_BOX) : 0;
			return { ...c, box, due: now + INTERVALS[box] };
		});
		this.save();
	}

	private save(): void {
		if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cards));
	}
}

export const customCards = new CustomCards();
