import { browser } from '$app/environment';
import { lessonOrder, optionalLessons } from '$lib/data/lesson-order';
import { PROGRESS_KEY as STORAGE_KEY, sanitizeProgress, type ProgressSaved } from '$lib/backup';
import { DEFAULT_VOICE, isVoiceId, type VoiceId } from '$lib/voices';
import { sessionXp } from '$lib/xp';

export type Theme = 'system' | 'light' | 'dark';

/**
 * Where the learner is starting from — set once via the home-hero chooser
 * (StartChooser) and changeable in settings. Drives which track home leads
 * with plus small content tweaks; never hides or locks anything.
 * 'explorer' = "just exploring": stop asking, keep the neutral layout.
 */
export type Profile = 'beginner' | 'script-reader' | 'speaker' | 'explorer';

const PROFILES: readonly Profile[] = ['beginner', 'script-reader', 'speaker', 'explorer'];

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
	/**
	 * Self-graded word review: Burmese on the front, the learner grades their
	 * own recall, scheduled by SM-2 instead of the Leitner boxes (see $lib/sm2).
	 *
	 * Off by default and staying that way. Self-grading is strictly better for
	 * a learner who is honest with themselves and strictly worse for one who
	 * isn't, and a beginner has no way to know yet which of the two they are —
	 * so it is offered, never defaulted into.
	 */
	selfReview = $state(false);
	// 'system' follows the OS preference; 'light'/'dark' force it via data-theme on <html>.
	theme = $state<Theme>('system');
	// null = the home hero hasn't asked "where are you starting from?" yet.
	profile = $state<Profile | null>(null);
	// Preferred talker. Contrast drills override it per trial on purpose — see
	// the note in $lib/voices about why one voice forever is a learning problem.
	voice = $state<VoiceId>(DEFAULT_VOICE);
	createdAt = $state(Date.now());
	// Per-day XP history (drives the daily goal ring and the heatmap).
	activity = $state<Record<string, number>>({});
	dailyGoal = $state(20);
	// Earned achievements never un-earn, even if the underlying stat drops.
	achievements = $state<Record<string, number>>({});
	// Streak freezes: each one covers one missed day.
	freezes = $state(0);
	/**
	 * Set when the constructor spends freezes to save a lapsing streak, so the
	 * learner can be told. They used to be consumed in silence: you paid 100 XP
	 * for something whose only evidence was a number quietly going down.
	 * Cleared by acknowledgeFreeze() once shown.
	 */
	freezeNotice = $state<{ date: string; used: number; streak: number } | null>(null);
	// Crowns: perfect hard-mode (drills-only) replays of completed lessons.
	crowns = $state<Record<string, number>>({});
	// Lessons waved through because the learner already knows the material
	// (see canSkipUnit in $lib/tracks). Skipped lessons unlock what follows but
	// earn nothing: no stars, no XP, and their words stay out of the SRS. They
	// stay openable, and un-skipping puts them back exactly as they were.
	skipped = $state<Record<string, number>>({});

	constructor() {
		if (browser) {
			try {
				const raw = localStorage.getItem(STORAGE_KEY);
				if (raw) {
					// The scalars are defaulted field by field below; sanitizeProgress
					// rebuilds the five id->number maps, which `??` alone would happily
					// let through as a string. Shared with the backup restore path.
					const s = sanitizeProgress(JSON.parse(raw));
					this.xp = s.xp ?? 0;
					this.streak = s.streak ?? 0;
					this.lastStudy = s.lastStudy ?? '';
					this.stars = s.stars ?? {};
					this.sound = s.sound ?? true;
					this.showRoman = s.showRoman ?? false;
					this.immersion = s.immersion ?? false;
					this.selfReview = s.selfReview ?? false;
					this.theme = s.theme === 'light' || s.theme === 'dark' ? s.theme : 'system';
					this.profile = PROFILES.includes(s.profile as Profile) ? (s.profile ?? null) : null;
					this.voice = isVoiceId(s.voice) ? s.voice : DEFAULT_VOICE;
					this.createdAt = s.createdAt ?? Date.now();
					this.activity = s.activity ?? {};
					this.dailyGoal = s.dailyGoal ?? 20;
					this.achievements = s.achievements ?? {};
					this.freezes = s.freezes ?? 0;
					this.freezeNotice = s.freezeNotice ?? null;
					this.crowns = s.crowns ?? {};
					this.skipped = s.skipped ?? {};
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
					this.freezeNotice = { date: today(), used: missed, streak: this.streak };
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
		const s: ProgressSaved = {
			xp: this.xp,
			streak: this.streak,
			lastStudy: this.lastStudy,
			stars: this.stars,
			sound: this.sound,
			showRoman: this.showRoman,
			immersion: this.immersion,
			selfReview: this.selfReview,
			theme: this.theme,
			profile: this.profile,
			voice: this.voice,
			createdAt: this.createdAt,
			activity: this.activity,
			dailyGoal: this.dailyGoal,
			achievements: this.achievements,
			freezes: this.freezes,
			freezeNotice: this.freezeNotice,
			crowns: this.crowns,
			skipped: this.skipped
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
	}

	/** Records a finished lesson. Returns the XP earned. */
	completeLesson(lessonId: string, earnedStars: number): number {
		// Doing a lesson you'd skipped supersedes the skip.
		this.unskipLesson(lessonId);
		const isFirstTime = !(lessonId in this.stars);
		// The award table lives in $lib/xp so every session kind agrees; this
		// one covers lessons, reader units and stories, which all route here.
		const xpEarned = sessionXp({ kind: 'teach', firstTime: isFirstTime, stars: earnedStars });
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

	isSkipped(lessonId: string): boolean {
		return lessonId in this.skipped;
	}

	/** Waves a lesson through: it stops blocking the path but earns nothing. */
	skipLesson(lessonId: string) {
		if (this.isSkipped(lessonId)) return;
		this.skipped = { ...this.skipped, [lessonId]: Date.now() };
		this.save();
	}

	/** Undoes a skip. Completing the lesson later works exactly as before. */
	unskipLesson(lessonId: string) {
		if (!this.isSkipped(lessonId)) return;
		const { [lessonId]: _, ...rest } = this.skipped;
		this.skipped = rest;
		this.save();
	}

	/**
	 * Whether a lesson stops blocking the ones after it.
	 *
	 * An optional lesson never blocks anything, so it counts as cleared the
	 * moment it exists (see Lesson.optional). That also keeps `currentLesson`
	 * — which is just the first uncleared lesson — from parking the "current"
	 * node on a lesson the learner was never asked to do.
	 */
	private isCleared(lessonId: string): boolean {
		if (optionalLessons.includes(lessonId)) return true;
		return this.isCompleted(lessonId) || this.isSkipped(lessonId);
	}

	/** A lesson is unlocked if it is first, or the previous one is cleared. */
	isUnlocked(lessonId: string): boolean {
		const i = lessonOrder.indexOf(lessonId);
		if (i <= 0) return i === 0;
		return this.isCleared(lessonOrder[i - 1]);
	}

	/** The first lesson still worth doing (the "current" node). */
	get currentLesson(): string | undefined {
		return lessonOrder.find((id) => !this.isCleared(id));
	}

	get completedCount(): number {
		// Only count course lessons — the stars map may hold other keys someday.
		return Object.keys(this.stars).filter((id) => lessonOrder.includes(id)).length;
	}

	/**
	 * How many course lessons count as this learner's course.
	 *
	 * Skipping a unit says "I already know this", so those lessons stop being
	 * part of the ladder — counting them in the denominator forever would leave
	 * a script-reader stuck at 21/24 with no way to reach the end short of
	 * sitting through the very lessons they were invited to skip. An optional
	 * lesson (see Lesson.optional) was never required of anyone, so it is out
	 * for the same reason without the learner having to say anything.
	 *
	 * Either way, doing the lesson anyway puts it back in *both* halves of the
	 * fraction, which is what keeps the count from running past 100%.
	 */
	get courseTotal(): number {
		return lessonOrder.filter((id) => this.countsTowardCourse(id)).length;
	}

	private countsTowardCourse(id: string): boolean {
		if (this.isCompleted(id)) return true;
		return !this.isSkipped(id) && !optionalLessons.includes(id);
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

	toggleSelfReview() {
		this.selfReview = !this.selfReview;
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

	setProfile(profile: Profile) {
		this.profile = profile;
		this.save();
	}

	/** Dismisses the freeze banner once the learner has seen it. */
	acknowledgeFreeze() {
		if (!this.freezeNotice) return;
		this.freezeNotice = null;
		this.save();
	}

	setVoice(voice: VoiceId) {
		this.voice = voice;
		this.save();
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
		this.skipped = {};
		this.profile = null; // re-ask on the next home visit
		this.save();
	}
}

export const progress = new Progress();
