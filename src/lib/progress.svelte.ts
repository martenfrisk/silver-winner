import { browser } from '$app/environment';
import { lessonOrder } from '$lib/data/course';

const STORAGE_KEY = 'myanlingo-progress-v1';

export type Theme = 'system' | 'light' | 'dark';

interface Saved {
	xp: number;
	streak: number;
	lastStudy: string; // YYYY-MM-DD
	stars: Record<string, number>; // lessonId -> 1..3
	sound: boolean;
	showRoman: boolean;
	immersion: boolean;
	theme: Theme;
	createdAt: number;
	activity: Record<string, number>; // YYYY-MM-DD -> XP earned that day
	dailyGoal: number;
	achievements: Record<string, number>; // achievement id -> epoch ms earned
	freezes: number; // streak freezes held (bought with XP)
	crowns: Record<string, number>; // lessonId -> epoch ms of the perfect hard-mode run
}

export const FREEZE_COST = 100;
export const MAX_FREEZES = 2;

/** How many days of per-day XP history to keep. */
const ACTIVITY_CAP_DAYS = 400;

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
	// Temporary, session-only mute — for "I don't have headphones right now"
	// without changing the permanent Sound preference below. Deliberately not
	// persisted: it resets to false on the next app load, same as forgetting
	// you ever muted it.
	tempMute = $state(false);
	// Romanization is a crutch — hidden by default; audio carries pronunciation.
	showRoman = $state(false);
	// Immersion mode: UI strings gradually switch to Burmese as script knowledge grows.
	immersion = $state(false);
	// 'system' follows the OS preference; 'light'/'dark' force it via data-theme on <html>.
	theme = $state<Theme>('system');
	createdAt = $state(Date.now());
	// Per-day XP history (drives the daily goal ring and the heatmap).
	activity = $state<Record<string, number>>({});
	dailyGoal = $state(20);
	// Earned achievements never un-earn, even if the underlying stat drops.
	achievements = $state<Record<string, number>>({});
	// Streak freezes: each one silently covers one missed day.
	freezes = $state(0);
	// Crowns: perfect hard-mode (drills-only) replays of completed lessons.
	crowns = $state<Record<string, number>>({});

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
					this.theme = s.theme === 'light' || s.theme === 'dark' ? s.theme : 'system';
					this.createdAt = s.createdAt ?? Date.now();
					this.activity = s.activity ?? {};
					this.dailyGoal = s.dailyGoal ?? 20;
					this.achievements = s.achievements ?? {};
					this.freezes = s.freezes ?? 0;
					this.crowns = s.crowns ?? {};
				}
			} catch {
				// Corrupt storage — start fresh.
			}
			// A streak lapses if the last study day is before yesterday — unless
			// held freezes cover every missed day, in which case they're consumed
			// and the streak survives (lastStudy moves to yesterday so the next
			// study continues it normally).
			if (this.lastStudy && this.lastStudy < yesterday()) {
				const missed = Math.max(
					1,
					Math.round((Date.parse(yesterday()) - Date.parse(this.lastStudy)) / 86_400_000)
				);
				if (missed <= this.freezes) {
					this.freezes -= missed;
					this.lastStudy = yesterday();
				} else {
					this.streak = 0;
				}
				this.save();
			}
			// The inline script in app.html applied the theme pre-paint; keep in sync.
			this.applyTheme();
		}
	}

	/** Mirrors the theme onto <html data-theme>. 'system' removes the attribute so the
	 *  prefers-color-scheme media query (which tracks live OS changes) takes over. */
	private applyTheme() {
		if (!browser) return;
		const el = document.documentElement;
		if (this.theme === 'system') el.removeAttribute('data-theme');
		else el.setAttribute('data-theme', this.theme);
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
			theme: this.theme,
			createdAt: this.createdAt,
			activity: this.activity,
			dailyGoal: this.dailyGoal,
			achievements: this.achievements,
			freezes: this.freezes,
			crowns: this.crowns
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
	}

	/** Records a finished lesson. Returns the XP earned. */
	completeLesson(lessonId: string, earnedStars: number): number {
		const isFirstTime = !(lessonId in this.stars);
		const xpEarned = (isFirstTime ? 20 : 10) + (earnedStars === 3 ? 5 : 0);
		this.stars = {
			...this.stars,
			[lessonId]: Math.max(this.stars[lessonId] ?? 0, earnedStars)
		};
		this.addXp(xpEarned);
		return xpEarned;
	}

	/** Awards XP, logs it on today's activity, and keeps the streak alive. */
	addXp(amount: number) {
		this.xp += amount;
		const t = today();
		const next = { ...this.activity, [t]: (this.activity[t] ?? 0) + amount };
		// Cap the history so localStorage doesn't grow forever.
		const dates = Object.keys(next).sort();
		for (const d of dates.slice(0, Math.max(0, dates.length - ACTIVITY_CAP_DAYS))) delete next[d];
		this.activity = next;
		if (this.lastStudy !== t) {
			this.streak = this.lastStudy === yesterday() ? this.streak + 1 : 1;
			this.lastStudy = t;
		}
		this.save();
	}

	/** XP earned today (drives the daily-goal ring). */
	get xpToday(): number {
		return this.activity[today()] ?? 0;
	}

	/** Days on which the (current) daily goal was reached. */
	get goalDaysCount(): number {
		return Object.values(this.activity).filter((xp) => xp >= this.dailyGoal).length;
	}

	setDailyGoal(goal: number) {
		this.dailyGoal = goal;
		this.save();
	}

	/** Buys one streak freeze with XP. Returns whether the purchase happened. */
	buyFreeze(): boolean {
		if (this.xp < FREEZE_COST || this.freezes >= MAX_FREEZES) return false;
		this.xp -= FREEZE_COST;
		this.freezes++;
		this.save();
		return true;
	}

	/** Records a perfect hard-mode run (idempotent). */
	awardCrown(lessonId: string) {
		if (lessonId in this.crowns) return;
		this.crowns = { ...this.crowns, [lessonId]: Date.now() };
		this.save();
	}

	isCrowned(lessonId: string): boolean {
		return lessonId in this.crowns;
	}

	/** Marks an achievement as earned (idempotent). */
	award(id: string) {
		if (id in this.achievements) return;
		this.achievements = { ...this.achievements, [id]: Date.now() };
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

	/** Whether audio should actually play right now — permanent setting AND not temporarily muted. */
	get audioOn(): boolean {
		return this.sound && !this.tempMute;
	}

	toggleTempMute() {
		this.tempMute = !this.tempMute;
		// Not persisted — no save().
	}

	toggleRoman() {
		this.showRoman = !this.showRoman;
		this.save();
	}

	toggleImmersion() {
		this.immersion = !this.immersion;
		this.save();
	}

	setTheme(theme: Theme) {
		this.theme = theme;
		this.save();
		this.applyTheme();
	}

	reset() {
		this.xp = 0;
		this.streak = 0;
		this.lastStudy = '';
		this.stars = {};
		this.activity = {};
		this.achievements = {};
		this.freezes = 0;
		this.crowns = {};
		this.save();
	}
}

export const progress = new Progress();
