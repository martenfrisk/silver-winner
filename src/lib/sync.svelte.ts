// Optional cross-device sync, layered on top of the localStorage stores
// rather than replacing them — see the header of $lib/sync-merge for the
// merge rule this applies. This file owns *when* a sync happens and the
// Supabase calls; the actual merge math lives in the pure module so it can
// be unit-tested without a browser.
//
// Sync only ever runs at two moments: right after a genuine sign-in (the
// magic-link redirect landing) and when the learner taps "Sync now" on
// /account. It deliberately does not run on every page load of an
// already-authenticated session (Supabase's own `INITIAL_SESSION` event is
// ignored below) — reacting to that would sync on every visit, and since a
// sync ends by reloading the page (see runSync), reacting to the reload's
// own session restore would loop forever.
//
// A failed pull or push degrades silently to local-only: nothing here may
// block the UI or throw past its own boundary, because every byte of
// progress already lives safely in localStorage regardless of whether sync
// ever succeeds. Signing out clears only this device's sync bookkeeping
// (`SYNC_META_KEY`), never the six learner-state keys.
import { browser } from '$app/environment';
import { supabase, syncConfigured } from '$lib/supabase';
import {
	buildBackup,
	CALIBRATION_KEY,
	CONFUSION_KEY,
	CUSTOM_KEY,
	PROGRESS_KEY,
	SCRIPT_KEY,
	VOCAB_KEY
} from '$lib/backup';
import { mergeState, sanitizeSyncState, type SyncState } from '$lib/sync-merge';
import type { User } from '@supabase/supabase-js';

const TABLE = 'learner_sync';
/** This device's own sync bookkeeping — not learner progress, so it stays out of BACKUP_KEYS and file backups. */
const SYNC_META_KEY = 'myanlingo-sync-v1';

interface SyncMeta {
	lastSyncedAt: number;
}

function readMeta(): SyncMeta {
	try {
		const raw = localStorage.getItem(SYNC_META_KEY);
		if (!raw) return { lastSyncedAt: 0 };
		const parsed = JSON.parse(raw);
		const n = typeof parsed?.lastSyncedAt === 'number' ? parsed.lastSyncedAt : 0;
		return { lastSyncedAt: n };
	} catch {
		return { lastSyncedAt: 0 };
	}
}

function writeMeta(meta: SyncMeta) {
	localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
}

/** Reads and sanitizes the six localStorage keys into a `SyncState`, same treatment as a file export. */
function readLocalState(): SyncState {
	const file = buildBackup((key) => localStorage.getItem(key));
	return sanitizeSyncState({
		progress: file.data[PROGRESS_KEY],
		script: file.data[SCRIPT_KEY],
		vocab: file.data[VOCAB_KEY],
		cards: file.data[CUSTOM_KEY],
		calibration: file.data[CALIBRATION_KEY],
		confusions: file.data[CONFUSION_KEY]
	});
}

/** Writes a merged `SyncState` back to the real localStorage keys, matching each store's own save() shape. */
function writeLocalState(state: SyncState) {
	localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
	localStorage.setItem(SCRIPT_KEY, JSON.stringify(state.script));
	localStorage.setItem(VOCAB_KEY, JSON.stringify(state.vocab));
	localStorage.setItem(CUSTOM_KEY, JSON.stringify(state.cards));
	localStorage.setItem(CALIBRATION_KEY, JSON.stringify(state.calibration));
	localStorage.setItem(CONFUSION_KEY, JSON.stringify(state.confusions));
}

type Status = 'idle' | 'sending-link' | 'link-sent' | 'syncing' | 'synced' | 'offline' | 'error';

class Sync {
	user = $state<User | null>(null);
	status = $state<Status>('idle');
	message = $state('');
	lastSyncedAt = $state<number | null>(null);

	/** Whether the whole feature has anything to show — no env vars means no UI, not broken UI. */
	enabled = syncConfigured;

	constructor() {
		if (!browser || !supabase) return;
		this.lastSyncedAt = readMeta().lastSyncedAt || null;

		supabase.auth.getSession().then(({ data }) => {
			this.user = data.session?.user ?? null;
		});

		supabase.auth.onAuthStateChange((event, session) => {
			this.user = session?.user ?? null;
			// See the header comment: only a *fresh* sign-in triggers a sync.
			if (event === 'SIGNED_IN') this.runSync();
			if (event === 'SIGNED_OUT') {
				this.status = 'idle';
				this.lastSyncedAt = null;
			}
		});
	}

	async sendMagicLink(email: string): Promise<void> {
		if (!supabase) return;
		this.status = 'sending-link';
		this.message = '';
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: { emailRedirectTo: `${location.origin}/account` }
		});
		if (error) {
			this.status = 'error';
			this.message = error.message;
			return;
		}
		this.status = 'link-sent';
	}

	async signOut(): Promise<void> {
		if (!supabase) return;
		await supabase.auth.signOut();
		// This device's sync bookkeeping only — the six learner-state keys are
		// untouched, so progress made while signed in stays right where it is.
		localStorage.removeItem(SYNC_META_KEY);
		this.status = 'idle';
		this.lastSyncedAt = null;
	}

	/** Manual re-sync — same flow a fresh sign-in triggers automatically. */
	syncNow(): void {
		this.runSync();
	}

	/**
	 * Pull → merge → push, then reload.
	 *
	 * Reloading rather than patching the six live store singletons in place
	 * mirrors backup.ts's restore path exactly, and for the same reason: it
	 * re-runs the pre-paint theme script, re-seeds the vocab SRS from the
	 * merged progress, and leaves no window where two stores disagree about
	 * which learner they belong to. Any failure along the way — network down,
	 * a Supabase error, a corrupt row — leaves localStorage exactly as it was
	 * and reports `offline`/`error` rather than touching anything.
	 */
	private async runSync(): Promise<void> {
		if (!supabase || !this.user) return;
		this.status = 'syncing';
		this.message = '';
		try {
			const { data: row, error } = await supabase
				.from(TABLE)
				.select('payload, updated_at')
				.eq('user_id', this.user.id)
				.maybeSingle();
			if (error) throw error;

			const local = readLocalState();
			const meta = readMeta();
			const remoteState = row ? sanitizeSyncState(row.payload as Record<string, unknown>) : null;
			const remoteUpdatedAt = row ? new Date(row.updated_at).getTime() : null;
			const merged = mergeState(local, remoteState, meta.lastSyncedAt, remoteUpdatedAt);

			const now = Date.now();
			const { error: upsertError } = await supabase.from(TABLE).upsert({
				user_id: this.user.id,
				payload: {
					progress: merged.progress,
					script: merged.script,
					vocab: merged.vocab,
					cards: merged.cards,
					calibration: merged.calibration,
					confusions: merged.confusions
				},
				updated_at: new Date(now).toISOString()
			});
			if (upsertError) throw upsertError;

			writeLocalState(merged);
			writeMeta({ lastSyncedAt: now });
			this.status = 'synced';
			this.lastSyncedAt = now;
			location.reload();
		} catch (e) {
			// Silent degrade to local-only, per the module header — never block
			// or throw past this boundary. `message` is shown, not surfaced as
			// an error the learner has to dismiss.
			this.status = navigator.onLine === false ? 'offline' : 'error';
			this.message = e instanceof Error ? e.message : 'Sync failed';
		}
	}
}

export const sync = new Sync();
