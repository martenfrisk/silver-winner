import { describe, expect, it } from 'vitest';
import { defaultProgress, mergeState, sanitizeSyncState, type SyncState } from './sync-merge';
import type { ProgressSaved } from './backup';

function progress(overrides: Partial<ProgressSaved> = {}): ProgressSaved {
	return {
		xp: 0,
		streak: 0,
		lastStudy: '',
		stars: {},
		sound: true,
		showRoman: false,
		immersion: false,
		selfReview: false,
		theme: 'system',
		profile: null,
		voice: 'f',
		createdAt: 1_000,
		activity: {},
		dailyGoal: 20,
		achievements: {},
		freezes: 0,
		freezeNotice: null,
		crowns: {},
		skipped: {},
		...overrides
	};
}

function state(overrides: Partial<SyncState> = {}): SyncState {
	return {
		progress: progress(),
		script: { entries: {}, unitsDone: [] },
		vocab: { entries: {}, mistakes: [] },
		cards: [],
		calibration: { pending: [], history: [] },
		confusions: {},
		...overrides
	};
}

describe('mergeState: no remote row', () => {
	it('returns local untouched on a first-ever sync (nothing to reconcile)', () => {
		const local = state({ progress: progress({ xp: 340 }) });
		expect(mergeState(local, null, 0, null)).toBe(local);
	});
});

describe('mergeState: SRS entry maps', () => {
	it('keeps the entry with the higher seen, whole, rather than averaging fields', () => {
		const local = state({
			script: {
				entries: { က: { box: 4, due: 500, seen: 10, lapses: 0 } },
				unitsDone: []
			}
		});
		const remote = state({
			script: {
				entries: { က: { box: 1, due: 999_999, seen: 3, lapses: 5 } },
				unitsDone: []
			}
		});
		const merged = mergeState(local, remote, 0, 1);
		// The higher-seen (local) entry wins outright — box/due/lapses travel
		// together, not field-by-field, so remote's later `due` does not leak in.
		expect(merged.script.entries['က']).toEqual({ box: 4, due: 500, seen: 10, lapses: 0 });
	});

	it('falls back to the later due when seen ties', () => {
		const local = state({
			vocab: {
				entries: { မင်္ဂလာပါ: { box: 2, due: 100, seen: 4, lapses: 0 } },
				mistakes: []
			}
		});
		const remote = state({
			vocab: {
				entries: { မင်္ဂလာပါ: { box: 3, due: 200, seen: 4, lapses: 0 } },
				mistakes: []
			}
		});
		const merged = mergeState(local, remote, 0, 1);
		expect(merged.vocab.entries['မင်္ဂလာပါ'].due).toBe(200);
		expect(merged.vocab.entries['မင်္ဂလာပါ'].box).toBe(3);
	});

	it('unions entries introduced on only one side', () => {
		const local = state({
			script: { entries: { က: { box: 1, due: 1, seen: 1, lapses: 0 } }, unitsDone: [] }
		});
		const remote = state({
			script: { entries: { ခ: { box: 1, due: 1, seen: 1, lapses: 0 } }, unitsDone: [] }
		});
		const merged = mergeState(local, remote, 0, 1);
		expect(Object.keys(merged.script.entries).sort()).toEqual(['က', 'ခ']);
	});

	it('is idempotent: merging a device with its own already-synced state changes nothing', () => {
		const local = state({
			vocab: {
				entries: { hi: { box: 2, due: 500, seen: 6, lapses: 1 } },
				mistakes: ['hi']
			}
		});
		// The remote row is exactly what this device pushed last time.
		const merged = mergeState(local, local, 1_000, 1_000);
		expect(merged.vocab.entries).toEqual(local.vocab.entries);
		expect(merged.vocab.mistakes).toEqual(local.vocab.mistakes);
	});
});

describe('mergeState: progress running totals', () => {
	it('takes the max of xp rather than summing (sync is idempotent, not additive)', () => {
		const local = state({ progress: progress({ xp: 340 }) });
		const remote = state({ progress: progress({ xp: 500 }) });
		expect(mergeState(local, remote, 0, 1).progress.xp).toBe(500);
		// Merging the other direction gives the same total either way.
		expect(mergeState(remote, local, 0, 1).progress.xp).toBe(500);
	});

	it('takes the max stars per lesson (stars only ever increase)', () => {
		const local = state({ progress: progress({ stars: { 'u1-l1': 3, 'u1-l2': 1 } }) });
		const remote = state({ progress: progress({ stars: { 'u1-l2': 2, 'u1-l3': 3 } }) });
		expect(mergeState(local, remote, 0, 1).progress.stars).toEqual({
			'u1-l1': 3,
			'u1-l2': 2,
			'u1-l3': 3
		});
	});

	it('takes the max per-day activity so repeat syncs never double-count', () => {
		const local = state({ progress: progress({ activity: { '2026-07-25': 30 } }) });
		const remote = state({ progress: progress({ activity: { '2026-07-25': 45 } }) });
		expect(mergeState(local, remote, 0, 1).progress.activity).toEqual({ '2026-07-25': 45 });
	});

	it('unions achievements and crowns, keeping the earliest epoch on a clash', () => {
		const local = state({
			progress: progress({ achievements: { streak7: 5_000, firstWord: 1_000 } })
		});
		const remote = state({ progress: progress({ achievements: { streak7: 2_000 } }) });
		expect(mergeState(local, remote, 0, 1).progress.achievements).toEqual({
			streak7: 2_000, // earlier of 5000/2000
			firstWord: 1_000
		});
	});

	it('unions skipped lessons rather than letting either side re-lock a path', () => {
		const local = state({ progress: progress({ skipped: { 'u2-l1': 10 } }) });
		const remote = state({ progress: progress({ skipped: {} }) }); // remote never saw the skip
		const merged = mergeState(local, remote, 0, 1);
		expect(merged.progress.skipped).toEqual({ 'u2-l1': 10 });
	});

	it('keeps streak and lastStudy together from whichever side studied more recently', () => {
		const local = state({ progress: progress({ streak: 12, lastStudy: '2026-07-20' }) });
		const remote = state({ progress: progress({ streak: 1, lastStudy: '2026-07-25' }) });
		const merged = mergeState(local, remote, 0, 1);
		// Remote studied later, so its (lower) streak travels with its date —
		// not a max of the two streak numbers, which would resurrect a stale run.
		expect(merged.progress.streak).toBe(1);
		expect(merged.progress.lastStudy).toBe('2026-07-25');
	});

	it('keeps the earlier createdAt (the true "learning since" date)', () => {
		const local = state({ progress: progress({ createdAt: 5_000 }) });
		const remote = state({ progress: progress({ createdAt: 1_000 }) });
		expect(mergeState(local, remote, 0, 1).progress.createdAt).toBe(1_000);
	});
});

describe('mergeState: preferences', () => {
	it('prefers remote when it was pushed after this device last synced', () => {
		const local = state({ progress: progress({ theme: 'dark', dailyGoal: 20 }) });
		const remote = state({ progress: progress({ theme: 'light', dailyGoal: 50 }) });
		const merged = mergeState(local, remote, /* localSyncedAt */ 1_000, /* remoteUpdatedAt */ 2_000);
		expect(merged.progress.theme).toBe('light');
		expect(merged.progress.dailyGoal).toBe(50);
	});

	it('prefers the local session when this device already has the latest sync', () => {
		const local = state({ progress: progress({ theme: 'dark' }) });
		const remote = state({ progress: progress({ theme: 'light' }) });
		const merged = mergeState(local, remote, /* localSyncedAt */ 5_000, /* remoteUpdatedAt */ 2_000);
		expect(merged.progress.theme).toBe('dark');
	});

	it('a device syncing for the first time inherits the account settings, not its own defaults', () => {
		const local = state({ progress: progress({ theme: 'system', profile: null }) }); // fresh device
		const remote = state({ progress: progress({ theme: 'dark', profile: 'speaker' }) });
		const merged = mergeState(local, remote, /* localSyncedAt */ 0, /* remoteUpdatedAt */ 999);
		expect(merged.progress.theme).toBe('dark');
		expect(merged.progress.profile).toBe('speaker');
	});
});

describe('mergeState: custom cards', () => {
	it('unions cards by id and keeps the higher-box side on a clash', () => {
		const local = state({
			cards: [{ id: 'a', front: 'x', back: 'y', box: 1, due: 10, created: 1 }]
		});
		const remote = state({
			cards: [
				{ id: 'a', front: 'x', back: 'y', box: 3, due: 999, created: 1 },
				{ id: 'b', front: 'p', back: 'q', box: 0, due: 5, created: 2 }
			]
		});
		const merged = mergeState(local, remote, 0, 1);
		expect(merged.cards).toHaveLength(2);
		expect(merged.cards.find((c) => c.id === 'a')?.box).toBe(3);
		expect(merged.cards.some((c) => c.id === 'b')).toBe(true);
	});
});

describe('mergeState: calibration', () => {
	it('keeps the earlier pending prediction when both sides predicted the same item', () => {
		const local = state({
			calibration: { pending: [{ id: 'w1', said: true, at: 2_000, box: 1 }], history: [] }
		});
		const remote = state({
			calibration: { pending: [{ id: 'w1', said: false, at: 1_000, box: 1 }], history: [] }
		});
		const merged = mergeState(local, remote, 0, 1);
		expect(merged.calibration.pending).toEqual([{ id: 'w1', said: false, at: 1_000, box: 1 }]);
	});

	it('unions history without duplicating identical entries', () => {
		const shared = { said: true, ok: true, at: 500 };
		const local = state({ calibration: { pending: [], history: [shared] } });
		const remote = state({
			calibration: { pending: [], history: [shared, { said: false, ok: false, at: 600 }] }
		});
		const merged = mergeState(local, remote, 0, 1);
		expect(merged.calibration.history).toHaveLength(2);
	});
});

describe('defaultProgress', () => {
	it('defaults every scalar exactly like the store constructor does on garbage input', () => {
		// createdAt falls back to Date.now(), which is not itself under test here.
		expect(defaultProgress(null)).toMatchObject(progress({ createdAt: expect.any(Number) }));
		expect(defaultProgress({ theme: 'purple', profile: 'wizard', voice: 'z' })).toMatchObject({
			theme: 'system',
			profile: null,
			voice: 'f'
		});
	});

	it('keeps well-formed values as-is', () => {
		const p = progress({ xp: 99, theme: 'dark', profile: 'speaker', voice: 'm' });
		expect(defaultProgress(p)).toEqual(p);
	});
});

describe('sanitizeSyncState', () => {
	it('survives a completely empty payload (a brand-new account row)', () => {
		const s = sanitizeSyncState({});
		expect(s.progress).toMatchObject({ xp: 0, theme: 'system', profile: null });
		expect(s.script).toEqual({ entries: {}, unitsDone: [] });
		expect(s.vocab).toEqual({ entries: {}, mistakes: [] });
		expect(s.cards).toEqual([]);
		expect(s.calibration).toEqual({ pending: [], history: [] });
		expect(s.confusions).toEqual({});
	});

	it('round-trips a well-formed payload', () => {
		const raw = {
			progress: progress({ xp: 50 }),
			script: { entries: { က: { box: 1, due: 1, seen: 1, lapses: 0 } }, unitsDone: ['s1'] },
			vocab: { entries: {}, mistakes: ['hi'] },
			cards: [{ id: 'a', front: 'x', back: 'y', box: 0, due: 0, created: 0 }],
			calibration: { pending: [], history: [] },
			confusions: { kha: { ga: 2 } }
		};
		const s = sanitizeSyncState(raw);
		expect(s.progress.xp).toBe(50);
		expect(s.script.unitsDone).toEqual(['s1']);
		expect(s.vocab.mistakes).toEqual(['hi']);
		expect(s.cards).toHaveLength(1);
		expect(s.confusions).toEqual({ kha: { ga: 2 } });
	});
});

describe('mergeState: confusions', () => {
	it('takes the max count per cell instead of summing, so repeat syncs stay idempotent', () => {
		const local = state({ confusions: { kha: { ga: 3, ka: 1 } } });
		const remote = state({ confusions: { kha: { ga: 5 }, nga: { ka: 2 } } });
		const merged = mergeState(local, remote, 0, 1);
		expect(merged.confusions).toEqual({ kha: { ga: 5, ka: 1 }, nga: { ka: 2 } });
	});
});

describe('mergeState: whole-state idempotency', () => {
	// The individual rules are each tested for idempotency above, but the
	// property that actually matters is the composite one: pushing a merged
	// result and merging again must be a no-op. If it isn't, every routine
	// re-sync drifts, and the drift compounds silently across devices. This is
	// the guarantee that makes a snapshot sync safe to run repeatedly.
	const rich = (): { local: SyncState; remote: SyncState } => ({
		local: state({
			progress: progress({
				xp: 400,
				streak: 5,
				lastStudy: '2026-07-20',
				stars: { 'first-words': 3, 'how-are-you': 1 },
				activity: { '2026-07-19': 30, '2026-07-20': 25 },
				achievements: { 'first-10': 111 },
				crowns: { 'first-words': 222 },
				skipped: { 'ka-row': 333 }
			}),
			script: {
				entries: { ka: { box: 2, due: 900, seen: 5, lapses: 1 } },
				unitsDone: ['first-letters']
			},
			vocab: { entries: { ရေ: { box: 1, due: 800, seen: 3, lapses: 0 } }, mistakes: ['ရေ'] },
			cards: [{ id: 'a', front: 'x', back: 'y', box: 2, due: 700, created: 10 }],
			calibration: {
				pending: [{ id: 'ရေ', said: true, at: 500, box: 2 }],
				history: [{ said: true, ok: false, at: 400 }]
			},
			confusions: { kha: { ga: 3 } }
		}),
		remote: state({
			progress: progress({
				xp: 380,
				streak: 7,
				lastStudy: '2026-07-21',
				stars: { 'first-words': 2, 'polite-talk': 3 },
				activity: { '2026-07-20': 40, '2026-07-21': 15 },
				achievements: { 'seven-day': 555 },
				crowns: { 'how-are-you': 666 },
				skipped: {}
			}),
			script: {
				entries: { ka: { box: 3, due: 950, seen: 8, lapses: 2 }, kha: { box: 1, due: 100, seen: 1, lapses: 0 } },
				unitsDone: ['first-letters', 'hooks-and-tails']
			},
			vocab: { entries: { ထမင်း: { box: 2, due: 850, seen: 4, lapses: 1 } }, mistakes: ['ထမင်း'] },
			cards: [{ id: 'b', front: 'p', back: 'q', box: 0, due: 600, created: 20 }],
			calibration: {
				pending: [{ id: 'ထမင်း', said: false, at: 450, box: 1 }],
				history: [{ said: false, ok: true, at: 300 }]
			},
			confusions: { kha: { ga: 5 }, sa: { hsa: 2 } }
		})
	});

	it('merging the merged result against the same remote changes nothing', () => {
		const { local, remote } = rich();
		const once = mergeState(local, remote, 100, 200);
		const twice = mergeState(once, remote, 100, 200);
		expect(twice).toEqual(once);
	});

	it('stays stable when the merged result becomes the remote too', () => {
		// The realistic loop: merge, push, then another device pulls what we
		// pushed. Nothing may grow on that round trip.
		const { local, remote } = rich();
		const once = mergeState(local, remote, 100, 200);
		expect(mergeState(once, once, 100, 200)).toEqual(once);
	});

	it('never loses a recorded gain from either side', () => {
		const { local, remote } = rich();
		const m = mergeState(local, remote, 100, 200);
		expect(m.progress.xp).toBe(400); // max, not 780
		expect(m.progress.stars['first-words']).toBe(3);
		expect(m.progress.stars['polite-talk']).toBe(3);
		expect(m.progress.activity['2026-07-20']).toBe(40); // max, not 65
		expect(Object.keys(m.progress.achievements).sort()).toEqual(['first-10', 'seven-day']);
		expect(Object.keys(m.script.entries).sort()).toEqual(['ka', 'kha']);
		expect(m.script.entries.ka.seen).toBe(8); // the fuller history won
		expect(m.script.unitsDone.sort()).toEqual(['first-letters', 'hooks-and-tails']);
		expect(m.cards.map((c) => c.id).sort()).toEqual(['a', 'b']);
		expect(m.confusions.kha.ga).toBe(5);
	});

	it('is order independent for the fields that are pure unions or maxima', () => {
		const { local, remote } = rich();
		const ab = mergeState(local, remote, 100, 200);
		const ba = mergeState(remote, local, 100, 200);
		expect(ba.progress.xp).toBe(ab.progress.xp);
		expect(ba.script.entries).toEqual(ab.script.entries);
		expect([...ba.script.unitsDone].sort()).toEqual([...ab.script.unitsDone].sort());
		expect(ba.confusions).toEqual(ab.confusions);
	});
});
