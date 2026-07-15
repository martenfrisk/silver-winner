import { browser } from '$app/environment';
import { lessonOrder } from '$lib/data/course';

const STORAGE_KEY = 'myanlingo-progress-v1';

interface Saved {
	xp: number;
	streak: number;
	lastStudy: string; // YYYY-MM-DD
	stars: Record<string, number>; // lessonId -> 1..3
	sound: boolean;
	showRoman: boolean;
	immersion: boolean;
	createdAt: number;
}

function today(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterday(): string {
	const d = new Date();
	d.setDate(d.getDate() - 1);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

class Progress {
	xp = $state(0);
	streak = $state(0);
	lastStudy = $state('');
	stars = $state<Record<string, number>>({});
	sound = $state(true);
	// Romanization is a crutch — hidden by default; audio carries pronunciation.
	showRoman = $state(false);
	// Immersion mode: UI strings gradually switch to Burmese as script knowledge grows.
	immersion = $state(false);
	createdAt = $state(Date.now());

	constructor() {
		if (browser) {
			try {
				const raw = localStorage.getItem(STORAGE_KEY);
				if (raw) {
					const s: Saved = JSON.parse(raw);
					this.xp = s.xp ?? 0;
					this.streak = s.streak ?? 0;
					this.lastStudy = s.lastStudy ?? '';
					this.stars = s.stars ?? {};
					this.sound = s.sound ?? true;
					this.showRoman = s.showRoman ?? false;
					this.immersion = s.immersion ?? false;
					this.createdAt = s.createdAt ?? Date.now();
				}
			} catch {
				// Corrupt storage — start fresh.
			}
			// A streak lapses if the last study day is before yesterday.
			if (this.lastStudy && this.lastStudy < yesterday()) {
				this.streak = 0;
				this.save();
			}
		}
	}

	private save() {
		if (!browser) return;
		const s: Saved = {
			xp: this.xp,
			streak: this.streak,
			lastStudy: this.lastStudy,
			stars: this.stars,
			sound: this.sound,
			showRoman: this.showRoman,
			immersion: this.immersion,
			createdAt: this.createdAt
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
	}

	/** Records a finished lesson. Returns the XP earned. */
	completeLesson(lessonId: string, earnedStars: number): number {
		const isFirstTime = !(lessonId in this.stars);
		const xpEarned = (isFirstTime ? 20 : 10) + (earnedStars === 3 ? 5 : 0);
		this.xp += xpEarned;
		this.stars = {
			...this.stars,
			[lessonId]: Math.max(this.stars[lessonId] ?? 0, earnedStars)
		};

		const t = today();
		if (this.lastStudy !== t) {
			this.streak = this.lastStudy === yesterday() ? this.streak + 1 : 1;
			this.lastStudy = t;
		}
		this.save();
		return xpEarned;
	}

	/** Awards XP from outside the course (script sessions) and keeps the streak alive. */
	addXp(amount: number) {
		this.xp += amount;
		const t = today();
		if (this.lastStudy !== t) {
			this.streak = this.lastStudy === yesterday() ? this.streak + 1 : 1;
			this.lastStudy = t;
		}
		this.save();
	}

	isCompleted(lessonId: string): boolean {
		return lessonId in this.stars;
	}

	/** A lesson is unlocked if it is first, or the previous lesson is completed. */
	isUnlocked(lessonId: string): boolean {
		const i = lessonOrder.indexOf(lessonId);
		if (i <= 0) return i === 0;
		return this.isCompleted(lessonOrder[i - 1]);
	}

	/** The first not-yet-completed unlocked lesson (the "current" node). */
	get currentLesson(): string | undefined {
		return lessonOrder.find((id) => !this.isCompleted(id));
	}

	get completedCount(): number {
		// Only count course lessons — the stars map may hold other keys someday.
		return Object.keys(this.stars).filter((id) => lessonOrder.includes(id)).length;
	}

	toggleSound() {
		this.sound = !this.sound;
		this.save();
	}

	toggleRoman() {
		this.showRoman = !this.showRoman;
		this.save();
	}

	toggleImmersion() {
		this.immersion = !this.immersion;
		this.save();
	}

	reset() {
		this.xp = 0;
		this.streak = 0;
		this.lastStudy = '';
		this.stars = {};
		this.save();
	}
}

export const progress = new Progress();
