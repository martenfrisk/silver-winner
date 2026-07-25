// Backup and restore of everything the learner owns.
//
// There is no backend, so the four localStorage keys below *are* the account:
// clearing site data, switching browsers or wiping a phone loses every hour
// spent, with nothing to restore from. This module is the way out of that.
//
// A backup file carries the four payloads verbatim under their real key names.
// Restore therefore writes the keys and reloads the page rather than teaching
// every store to re-hydrate itself mid-session — a reload re-runs the theme
// script in app.html, re-seeds the vocab SRS from progress, and guarantees the
// four stores agree with each other, none of which a live patch would.
//
// Restoring is the one path where untrusted JSON reaches storage, so the
// sanitizers here are also what the stores use on their *normal* load. A
// hand-corrupted key and a doctored backup file are the same problem, and
// before this they were both unhandled: three of the four stores took a bare
// `JSON.parse` result at its declared type, so a stored `"null"` sailed past
// the try/catch and threw later, off in a component.

// Type-only, so this module stays free of the runes file at runtime and the
// two can depend on each other without a cycle.
import type { Profile, Theme } from '$lib/progress.svelte';

/** Bumped only when the file layout changes in a way older readers can't handle. */
export const BACKUP_VERSION = 1;

export const PROGRESS_KEY = 'myanlingo-progress-v1';
export const SCRIPT_KEY = 'myanlingo-script-v1';
export const VOCAB_KEY = 'myanlingo-vocab-v1';
export const CUSTOM_KEY = 'myanlingo-custom-v1';

/** Every key a backup covers. A new persisted key belongs in this list. */
export const BACKUP_KEYS = [PROGRESS_KEY, SCRIPT_KEY, VOCAB_KEY, CUSTOM_KEY] as const;

/** Both SRS ladders and the custom cards share this 5-box shape. */
export interface LeitnerEntry {
	box: number;
	due: number; // epoch ms
	seen: number;
	lapses: number;
}

export interface BackupFile {
	app: 'myanlingo';
	version: number;
	exportedAt: number; // epoch ms
	/** storage key -> that key's parsed payload */
	data: Record<string, unknown>;
}

/** What a restore is about to overwrite the browser with, in plain numbers. */
export interface BackupSummary {
	exportedAt: number;
	xp: number;
	lessons: number;
	glyphs: number;
	words: number;
	cards: number;
}

export type ParseResult =
	| {
			ok: true;
			/** storage key -> serialized payload, ready to hand to setItem */
			payloads: Record<string, string>;
			summary: BackupSummary;
	  }
	| { ok: false; error: string };

// ── Structural sanitizers ─────────────────────────────────────────────
// Every one is total: garbage in, empty-but-valid out. They never throw, so a
// caller can drop them straight into a constructor without a second guard.

function isRecord(u: unknown): u is Record<string, unknown> {
	return typeof u === 'object' && u !== null && !Array.isArray(u);
}

function num(u: unknown, fallback: number): number {
	return typeof u === 'number' && Number.isFinite(u) ? u : fallback;
}

function clamp(n: number, lo: number, hi: number): number {
	return Math.min(hi, Math.max(lo, n));
}

/**
 * A map of Leitner entries. `maxBox` is clamped against because a box past the
 * end of a store's INTERVALS array indexes to undefined, and `now + undefined`
 * is NaN — an item that is then never due again.
 */
export function sanitizeEntries(u: unknown, maxBox: number): Record<string, LeitnerEntry> {
	if (!isRecord(u)) return {};
	const out: Record<string, LeitnerEntry> = {};
	for (const [id, raw] of Object.entries(u)) {
		if (!isRecord(raw)) continue;
		out[id] = {
			box: clamp(Math.round(num(raw.box, 0)), 0, maxBox),
			due: num(raw.due, 0),
			seen: Math.max(0, Math.round(num(raw.seen, 0))),
			lapses: Math.max(0, Math.round(num(raw.lapses, 0)))
		};
	}
	return out;
}

/** A list of ids, deduped, non-strings dropped. */
export function sanitizeStrings(u: unknown, cap = Infinity): string[] {
	if (!Array.isArray(u)) return [];
	const seen = new Set<string>();
	for (const s of u) {
		if (typeof s === 'string' && !seen.has(s)) seen.add(s);
		if (seen.size >= cap) break;
	}
	return [...seen];
}

/** A `Record<string, number>` — progress uses this shape for stars, activity, crowns… */
export function sanitizeNumberMap(u: unknown): Record<string, number> {
	if (!isRecord(u)) return {};
	const out: Record<string, number> = {};
	for (const [k, v] of Object.entries(u)) {
		if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
	}
	return out;
}

/** The progress payload, as persisted. Owned here so export, restore and the store's own loader can't drift apart. */
export interface ProgressSaved {
	xp: number;
	streak: number;
	lastStudy: string; // YYYY-MM-DD
	stars: Record<string, number>; // lessonId -> 1..3
	sound: boolean;
	showRoman: boolean;
	immersion: boolean;
	theme: Theme;
	profile: Profile | null;
	createdAt: number;
	activity: Record<string, number>; // YYYY-MM-DD -> XP earned that day
	dailyGoal: number;
	achievements: Record<string, number>; // achievement id -> epoch ms earned
	freezes: number; // streak freezes held (bought with XP)
	crowns: Record<string, number>; // lessonId -> epoch ms of the perfect hard-mode run
	skipped: Record<string, number>; // lessonId -> epoch ms it was skipped
}

/**
 * The progress payload. Only the map fields are rebuilt here — every scalar is
 * already defaulted field-by-field by the store's own loader, which is also
 * where the `theme`/`profile` enum guards live.
 */
export function sanitizeProgress(u: unknown): Partial<ProgressSaved> {
	const src = (isRecord(u) ? u : {}) as Partial<ProgressSaved>;
	return {
		...src,
		stars: sanitizeNumberMap(src.stars),
		activity: sanitizeNumberMap(src.activity),
		achievements: sanitizeNumberMap(src.achievements),
		crowns: sanitizeNumberMap(src.crowns),
		skipped: sanitizeNumberMap(src.skipped)
	};
}

/** Mirrors CustomCard in custom-cards.svelte.ts, kept here so this module stays runes-free. */
interface CardShape {
	id: string;
	front: string;
	back: string;
	box: number;
	due: number;
	created: number;
}

/** Learner-authored cards. A card with no front or back is not a card. */
export function sanitizeCards(u: unknown, maxBox: number): CardShape[] {
	if (!Array.isArray(u)) return [];
	const out: CardShape[] = [];
	for (const raw of u) {
		if (!isRecord(raw)) continue;
		const front = typeof raw.front === 'string' ? raw.front.trim() : '';
		const back = typeof raw.back === 'string' ? raw.back.trim() : '';
		const id = typeof raw.id === 'string' && raw.id ? raw.id : '';
		if (!front || !back || !id) continue;
		out.push({
			id,
			front,
			back,
			box: clamp(Math.round(num(raw.box, 0)), 0, maxBox),
			due: num(raw.due, 0),
			created: num(raw.created, 0)
		});
	}
	return out;
}

// ── Export ────────────────────────────────────────────────────────────

/**
 * Collects the four keys into a backup file. Takes a reader rather than
 * touching localStorage directly so it stays testable without a DOM.
 */
export function buildBackup(read: (key: string) => string | null, now = Date.now()): BackupFile {
	const data: Record<string, unknown> = {};
	for (const key of BACKUP_KEYS) {
		const raw = read(key);
		if (raw === null) continue;
		try {
			data[key] = JSON.parse(raw);
		} catch {
			// An unreadable key is left out rather than failing the whole export —
			// a corrupt vocab box shouldn't cost the learner their XP and streak.
		}
	}
	return { app: 'myanlingo', version: BACKUP_VERSION, exportedAt: now, data };
}

/** Filename for a downloaded backup: dated, so successive ones don't collide. */
export function backupFilename(now = Date.now()): string {
	return `myanlingo-backup-${new Date(now).toISOString().slice(0, 10)}.json`;
}

// ── Import ────────────────────────────────────────────────────────────

/**
 * Validates and sanitizes a backup file, returning payloads ready to write.
 *
 * All four keys are always present in the result, empty when the file omits
 * them: a backup is a whole snapshot, so restoring one must land the browser
 * exactly where the exporting browser was, not merge into whatever is here.
 */
export function parseBackup(text: string, maxBox = 4): ParseResult {
	let file: unknown;
	try {
		file = JSON.parse(text);
	} catch {
		return { ok: false, error: "That file isn't valid JSON." };
	}
	if (!isRecord(file) || file.app !== 'myanlingo') {
		return { ok: false, error: "That doesn't look like a MyanLingo backup." };
	}
	const version = num(file.version, 0);
	if (version > BACKUP_VERSION) {
		return {
			ok: false,
			error: `That backup is from a newer version of MyanLingo (v${version}). Update the app first.`
		};
	}
	if (!isRecord(file.data)) {
		return { ok: false, error: 'That backup has no data in it.' };
	}

	const d = file.data;
	const progress = sanitizeProgress(d[PROGRESS_KEY]);
	const scriptRaw = isRecord(d[SCRIPT_KEY]) ? d[SCRIPT_KEY] : {};
	const vocabRaw = isRecord(d[VOCAB_KEY]) ? d[VOCAB_KEY] : {};
	const script = {
		entries: sanitizeEntries(scriptRaw.entries, maxBox),
		unitsDone: sanitizeStrings(scriptRaw.unitsDone)
	};
	const vocab = {
		entries: sanitizeEntries(vocabRaw.entries, maxBox),
		mistakes: sanitizeStrings(vocabRaw.mistakes)
	};
	const cards = sanitizeCards(d[CUSTOM_KEY], maxBox);

	return {
		ok: true,
		payloads: {
			[PROGRESS_KEY]: JSON.stringify(progress),
			[SCRIPT_KEY]: JSON.stringify(script),
			[VOCAB_KEY]: JSON.stringify(vocab),
			[CUSTOM_KEY]: JSON.stringify(cards)
		},
		summary: {
			exportedAt: num(file.exportedAt, 0),
			xp: Math.max(0, Math.round(num(progress.xp, 0))),
			lessons: Object.keys(sanitizeNumberMap(progress.stars)).length,
			glyphs: Object.keys(script.entries).length,
			words: Object.keys(vocab.entries).length,
			cards: cards.length
		}
	};
}

/** One-line "what you're about to restore", for the confirm dialog. */
export function describeBackup(s: BackupSummary): string {
	const when = s.exportedAt ? new Date(s.exportedAt).toLocaleDateString() : 'an unknown date';
	const parts = [
		`${s.xp} XP`,
		`${s.lessons} ${s.lessons === 1 ? 'lesson' : 'lessons'}`,
		`${s.glyphs} ${s.glyphs === 1 ? 'glyph' : 'glyphs'}`,
		`${s.words} ${s.words === 1 ? 'word' : 'words'}`
	];
	if (s.cards > 0) parts.push(`${s.cards} ${s.cards === 1 ? 'card' : 'cards'}`);
	return `From ${when}: ${parts.join(' · ')}`;
}
