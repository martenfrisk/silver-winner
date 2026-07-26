// Merge rule for cross-device sync — see docs/supabase.md for the pull/push
// flow this feeds ($lib/sync.svelte.ts). Read this before changing any rule
// below; the whole point of this module is that the rule is written down
// once, on purpose, rather than reverse-engineered from a bug report about
// vanished XP.
//
// The payload synced to Supabase is a full snapshot of the six localStorage
// keys, built and sanitized with the exact functions `$lib/backup` already
// uses for file export/restore, rather than inventing a second format — see
// `sanitizeSyncState` below. A snapshot sync (not a delta/event log) has one
// hard consequence: merging must be *idempotent*. Syncing the
// same device twice in a row, or two devices that already agree, must not
// change the result. That rules out summing counters (xp, per-day activity,
// confusion tallies) on merge — a total that's already been synced once would
// get re-added on every later sync and inflate without bound. Taking the max
// of each counter instead is idempotent and never *loses* a recorded gain.
// The cost: two devices doing genuinely simultaneous, not-yet-synced study
// converge to the higher of the two totals rather than their true sum. That's
// an acceptable trade for a spaced-repetition app that syncs at sign-in and on
// demand, not continuously — the alternative (risking silent data loss on
// every routine re-sync) is worse for the case this module exists to prevent.
//
// The two SRS maps (script glyphs, vocab words) merge per entry, keeping one
// side's whole entry rather than averaging its fields — box, due and lapses
// only make sense together, as a snapshot of one review history. `seen` is
// the tie-break because it is the one field that only ever increases, whether
// the answer was right or wrong (see `grade()` in srs.svelte.ts /
// vocab-srs.svelte.ts); `due` moves *backward* on a wrong answer, so it is a
// weaker signal of "which side has the more complete history" and only
// breaks a tie in `seen`. Custom cards use the same box/due shape and follow
// the same rule (there is no `seen` there, so `box` stands in for it).
//
// Settings (theme, sound, profile, daily goal, voice, romanization,
// immersion) aren't progress — losing a stale preference on one device isn't
// the catastrophic case this module exists to prevent. They resolve by
// recency: the remote row wins when it was pushed after this device's own
// last successful sync (including "never" — a brand-new device inherits
// whatever the account already has), otherwise the local, currently-active
// session wins. `xp`/`streak`/`lastStudy` are the one place recency and
// magnitude are combined: `streak` is meaningless without the `lastStudy` it
// was computed against (see the lapse logic in progress.svelte.ts's
// constructor), so the pair is kept together from whichever side has the
// later `lastStudy` rather than merged field-by-field.
//
// Everything else — achievements, crowns, skipped lessons, custom cards,
// mistake lists, calibration history, units-done — is unioned rather than
// replaced. Two devices independently earning different achievements, or
// authoring different cards, must both survive the merge; dropping either
// side's set is exactly the "silently destroys progress" failure mode to
// avoid.

import {
	sanitizeCalibration,
	sanitizeCards,
	sanitizeConfusions,
	sanitizeEntries,
	sanitizeProgress,
	sanitizeStrings,
	type LeitnerEntry,
	type ProgressSaved
} from '$lib/backup';
import { DEFAULT_VOICE, isVoiceId } from '$lib/voices';
import type { Profile } from '$lib/progress.svelte';

export interface ScriptSaved {
	entries: Record<string, LeitnerEntry>;
	unitsDone: string[];
}

export interface VocabSaved {
	entries: Record<string, LeitnerEntry>;
	mistakes: string[];
}

export interface CardSaved {
	id: string;
	front: string;
	back: string;
	box: number;
	due: number;
	created: number;
}

export interface PendingSaved {
	id: string;
	said: boolean;
	at: number;
	box: number;
}

export interface ResolvedSaved {
	said: boolean;
	ok: boolean;
	at: number;
}

export interface CalibrationSaved {
	pending: PendingSaved[];
	history: ResolvedSaved[];
}

export type ConfusionSaved = Record<string, Record<string, number>>;

/** Everything a sync round trips, mirroring `BACKUP_KEYS` one field each. */
export interface SyncState {
	progress: ProgressSaved;
	script: ScriptSaved;
	vocab: VocabSaved;
	cards: CardSaved[];
	calibration: CalibrationSaved;
	confusions: ConfusionSaved;
}

/** Caps applied post-merge, matching the caps each store enforces on its own. */
const HISTORY_CAP = 100;
const MISTAKE_CAP = 20;

/** Same 5-box ladder every SRS store and custom cards share (see CLAUDE.md). */
const MAX_BOX = 4;

/** Mirrors the `Profile` list in progress.svelte.ts — kept here so this module stays DOM-free. */
const PROFILES: readonly Profile[] = ['beginner', 'script-reader', 'speaker', 'explorer'];

function isRecord(u: unknown): u is Record<string, unknown> {
	return typeof u === 'object' && u !== null && !Array.isArray(u);
}

/**
 * Fully defaults a progress payload exactly like `Progress`'s own constructor
 * does on a normal page load (see progress.svelte.ts). Needed here because a
 * sync merge runs *before* that constructor ever sees the merged data — the
 * comparisons in `mergeProgress` need concrete numbers now, not "whatever the
 * remote row happened to contain, maybe `undefined`". Deliberately mirrors
 * the constructor field-by-field rather than sharing code with it: that file
 * is a runes `.svelte.ts` singleton and this module has to stay pure and
 * DOM-free to unit-test the merge without a browser. If the constructor's
 * defaults change, this needs the same change.
 */
export function defaultProgress(u: unknown): ProgressSaved {
	const s = sanitizeProgress(u);
	return {
		xp: s.xp ?? 0,
		streak: s.streak ?? 0,
		lastStudy: s.lastStudy ?? '',
		stars: s.stars ?? {},
		sound: s.sound ?? true,
		showRoman: s.showRoman ?? false,
		immersion: s.immersion ?? false,
		selfReview: s.selfReview ?? false,
		theme: s.theme === 'light' || s.theme === 'dark' ? s.theme : 'system',
		profile: PROFILES.includes(s.profile as Profile) ? (s.profile ?? null) : null,
		voice: isVoiceId(s.voice) ? s.voice : DEFAULT_VOICE,
		createdAt: s.createdAt ?? Date.now(),
		activity: s.activity ?? {},
		dailyGoal: s.dailyGoal ?? 20,
		achievements: s.achievements ?? {},
		freezes: s.freezes ?? 0,
		freezeNotice: s.freezeNotice ?? null,
		crowns: s.crowns ?? {},
		skipped: s.skipped ?? {}
	};
}

/**
 * Turns a `payload` object — the shape stored in the Supabase row's `payload`
 * jsonb column, keyed by field name (`progress`, `script`, `vocab`, `cards`,
 * `calibration`, `confusions`) rather than by the raw localStorage key
 * strings a file backup uses — into a fully-typed, fully-defaulted
 * `SyncState`. Local and remote data go through this identically, reusing
 * the same sanitizers `$lib/backup` uses for file restore: see the note
 * there about why a row from Supabase gets exactly the same scrutiny as an
 * uploaded file.
 */
export function sanitizeSyncState(data: Record<string, unknown>): SyncState {
	const scriptRaw = isRecord(data.script) ? data.script : {};
	const vocabRaw = isRecord(data.vocab) ? data.vocab : {};
	return {
		progress: defaultProgress(data.progress),
		script: {
			entries: sanitizeEntries(scriptRaw.entries, MAX_BOX),
			unitsDone: sanitizeStrings(scriptRaw.unitsDone)
		},
		vocab: {
			entries: sanitizeEntries(vocabRaw.entries, MAX_BOX),
			mistakes: sanitizeStrings(vocabRaw.mistakes, MISTAKE_CAP)
		},
		cards: sanitizeCards(data.cards, MAX_BOX),
		calibration: sanitizeCalibration(data.calibration),
		confusions: sanitizeConfusions(data.confusions)
	};
}

function numberMapMax(
	a: Record<string, number>,
	b: Record<string, number>
): Record<string, number> {
	const out: Record<string, number> = { ...a };
	for (const [k, v] of Object.entries(b)) out[k] = Math.max(out[k] ?? -Infinity, v);
	return out;
}

/** For "first happened at" facts (achievements, crowns, skipped): earliest wins. */
function numberMapMin(
	a: Record<string, number>,
	b: Record<string, number>
): Record<string, number> {
	const out: Record<string, number> = { ...a };
	for (const [k, v] of Object.entries(b)) out[k] = k in out ? Math.min(out[k], v) : v;
	return out;
}

function union(a: string[], b: string[]): string[] {
	return [...new Set([...a, ...b])];
}

/** Newest-first mistake lists: local's ordering leads, remote fills in the rest. */
function mergeMistakes(a: string[], b: string[]): string[] {
	return [...new Set([...a, ...b])].slice(0, MISTAKE_CAP);
}

/**
 * Leitner entry maps (script glyphs / vocab words): union of ids, and for an
 * id present on both sides, keep the whole entry with the higher `seen`
 * (falling back to the later `due` on a tie) rather than averaging fields.
 * See the header comment for why `seen` is the primary signal.
 */
function mergeEntries(
	a: Record<string, LeitnerEntry>,
	b: Record<string, LeitnerEntry>
): Record<string, LeitnerEntry> {
	const out: Record<string, LeitnerEntry> = { ...a };
	for (const [id, be] of Object.entries(b)) {
		const ae = out[id];
		if (!ae) {
			out[id] = be;
			continue;
		}
		out[id] = be.seen > ae.seen || (be.seen === ae.seen && be.due > ae.due) ? be : ae;
	}
	return out;
}

function mergeCards(a: CardSaved[], b: CardSaved[]): CardSaved[] {
	const byId = new Map<string, CardSaved>();
	for (const c of a) byId.set(c.id, c);
	for (const c of b) {
		const existing = byId.get(c.id);
		if (!existing) {
			byId.set(c.id, c);
			continue;
		}
		byId.set(c.id, c.box > existing.box || (c.box === existing.box && c.due > existing.due) ? c : existing);
	}
	return [...byId.values()];
}

function mergeCalibration(a: CalibrationSaved, b: CalibrationSaved): CalibrationSaved {
	const pendingById = new Map<string, PendingSaved>();
	for (const p of a.pending) pendingById.set(p.id, p);
	for (const p of b.pending) {
		const existing = pendingById.get(p.id);
		// A prediction is only made once per item (predict() no-ops if already
		// pending) — on a genuine clash, keep the earlier one, since it's closer
		// to the original moment the learner committed to an answer.
		if (!existing || p.at < existing.at) pendingById.set(p.id, p);
	}
	// History is an append-only log; union by exact content (a real duplicate
	// only happens after an already-synced entry meets itself again) then cap.
	const seen = new Set<string>();
	const history: ResolvedSaved[] = [];
	for (const r of [...a.history, ...b.history]) {
		const key = `${r.said}:${r.ok}:${r.at}`;
		if (seen.has(key)) continue;
		seen.add(key);
		history.push(r);
	}
	history.sort((x, y) => x.at - y.at);
	return {
		pending: [...pendingById.values()],
		history: history.slice(-HISTORY_CAP)
	};
}

/**
 * Confusion tallies are counts, but the payload is a full snapshot re-synced
 * on every call — summing would double the count on every repeat sync (see
 * the header comment). Max keeps the merge idempotent without ever losing a
 * recorded confusion.
 */
function mergeConfusions(a: ConfusionSaved, b: ConfusionSaved): ConfusionSaved {
	const out: ConfusionSaved = {};
	for (const target of new Set([...Object.keys(a), ...Object.keys(b)])) {
		out[target] = numberMapMax(a[target] ?? {}, b[target] ?? {});
	}
	return out;
}

/**
 * Merges the progress payload. `xp`, `stars`, `activity`, `achievements`,
 * `crowns` and `skipped` are progress facts and merge as described in the
 * header comment (max for running totals, union-with-earliest-epoch for
 * "first happened at" maps). `streak`/`lastStudy` are kept together from
 * whichever side is more recently active. Everything else is a preference
 * and follows `preferRemote`.
 */
/** The later of two freeze notices by date; null when neither is live. */
function laterNotice(
	a: ProgressSaved['freezeNotice'],
	b: ProgressSaved['freezeNotice']
): ProgressSaved['freezeNotice'] {
	if (!a) return b;
	if (!b) return a;
	return b.date > a.date ? b : a;
}

function mergeProgress(
	local: ProgressSaved,
	remote: ProgressSaved,
	preferRemote: boolean
): ProgressSaved {
	const useRemoteStreak = remote.lastStudy > local.lastStudy;
	const prefs = preferRemote ? remote : local;
	return {
		...prefs,
		xp: Math.max(local.xp, remote.xp),
		streak: useRemoteStreak ? remote.streak : local.streak,
		lastStudy: useRemoteStreak ? remote.lastStudy : local.lastStudy,
		stars: numberMapMax(local.stars, remote.stars),
		activity: numberMapMax(local.activity, remote.activity),
		achievements: numberMapMin(local.achievements, remote.achievements),
		crowns: numberMapMin(local.crowns, remote.crowns),
		skipped: numberMapMin(local.skipped, remote.skipped),
		freezes: Math.max(local.freezes, remote.freezes),
		// The most recent unacknowledged notice, so a streak saved on one device
		// is still reported on another. An acknowledged one is null and loses to
		// any live notice, which is right: dismissing it here shouldn't re-show
		// it there, but a *newer* save should still be announced.
		freezeNotice: laterNotice(local.freezeNotice, remote.freezeNotice),
		createdAt: Math.min(local.createdAt || Date.now(), remote.createdAt || Date.now())
	};
}

/**
 * Combines this device's local state with the row pulled from Supabase.
 *
 * @param remoteUpdatedAt epoch ms the remote row was last pushed, or `null`
 *   when there was no row yet (first-ever sync for this account — local wins
 *   everything, nothing to reconcile).
 * @param localSyncedAt epoch ms this device last completed a successful
 *   sync, or `0` if it never has. Drives which side's preferences win: a
 *   remote push newer than this device's last sync means *another* device
 *   changed something since, so it wins; otherwise this session's live
 *   settings win. A device syncing for the first time always has
 *   `localSyncedAt === 0`, so it correctly inherits the account's existing
 *   settings rather than clobbering them with its own defaults.
 */
export function mergeState(
	local: SyncState,
	remote: SyncState | null,
	localSyncedAt: number,
	remoteUpdatedAt: number | null
): SyncState {
	if (!remote || remoteUpdatedAt === null) return local;
	const preferRemote = remoteUpdatedAt > localSyncedAt;
	return {
		progress: mergeProgress(local.progress, remote.progress, preferRemote),
		script: {
			entries: mergeEntries(local.script.entries, remote.script.entries),
			unitsDone: union(local.script.unitsDone, remote.script.unitsDone)
		},
		vocab: {
			entries: mergeEntries(local.vocab.entries, remote.vocab.entries),
			mistakes: mergeMistakes(local.vocab.mistakes, remote.vocab.mistakes)
		},
		cards: mergeCards(local.cards, remote.cards),
		calibration: mergeCalibration(local.calibration, remote.calibration),
		confusions: mergeConfusions(local.confusions, remote.confusions)
	};
}
