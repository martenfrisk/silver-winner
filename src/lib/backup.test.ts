import { describe, expect, it } from 'vitest';
import {
	BACKUP_KEYS,
	BACKUP_VERSION,
	CALIBRATION_KEY,
	CUSTOM_KEY,
	PROGRESS_KEY,
	SCRIPT_KEY,
	VOCAB_KEY,
	buildBackup,
	backupFilename,
	describeBackup,
	parseBackup,
	sanitizeCards,
	sanitizeEntries,
	sanitizeNumberMap,
	sanitizeStrings
} from './backup';

const T0 = new Date('2026-07-25T12:00:00Z').getTime();

/** A store shaped like the real thing, for round-tripping. */
function fakeStorage(entries: Record<string, string>) {
	return (key: string) => entries[key] ?? null;
}

const fullBackup = () =>
	buildBackup(
		fakeStorage({
			[PROGRESS_KEY]: JSON.stringify({ xp: 340, stars: { 'u1-l1': 3, 'u1-l2': 2 }, streak: 5 }),
			[SCRIPT_KEY]: JSON.stringify({
				entries: { က: { box: 2, due: 100, seen: 4, lapses: 1 } },
				unitsDone: ['s1']
			}),
			[VOCAB_KEY]: JSON.stringify({
				entries: { မင်္ဂလာပါ: { box: 1, due: 200, seen: 2, lapses: 0 } },
				mistakes: ['မင်္ဂလာပါ']
			}),
			[CUSTOM_KEY]: JSON.stringify([
				{ id: 'a1', front: 'umbrella', back: 'ထီး', box: 1, due: 300, created: 50 }
			]),
			[CALIBRATION_KEY]: JSON.stringify({
				pending: [{ id: 'မင်္ဂလာပါ', said: true, at: 400, box: 2 }],
				history: [{ said: true, ok: false, at: 350 }]
			})
		}),
		T0
	);

describe('buildBackup', () => {
	it('collects every backed-up key, parsed', () => {
		const file = fullBackup();
		expect(file.app).toBe('myanlingo');
		expect(file.version).toBe(BACKUP_VERSION);
		expect(file.exportedAt).toBe(T0);
		expect(Object.keys(file.data).sort()).toEqual([...BACKUP_KEYS].sort());
		expect((file.data[PROGRESS_KEY] as { xp: number }).xp).toBe(340);
	});

	it('omits keys the browser has never written', () => {
		const file = buildBackup(fakeStorage({ [PROGRESS_KEY]: '{"xp":10}' }), T0);
		expect(Object.keys(file.data)).toEqual([PROGRESS_KEY]);
	});

	it('skips an unreadable key rather than failing the whole export', () => {
		const file = buildBackup(
			fakeStorage({ [PROGRESS_KEY]: '{"xp":10}', [VOCAB_KEY]: 'not json{' }),
			T0
		);
		expect(file.data[PROGRESS_KEY]).toEqual({ xp: 10 });
		expect(VOCAB_KEY in file.data).toBe(false);
	});
});

describe('parseBackup round trip', () => {
	it('restores what was exported', () => {
		const res = parseBackup(JSON.stringify(fullBackup()));
		expect(res.ok).toBe(true);
		if (!res.ok) return;

		expect(JSON.parse(res.payloads[PROGRESS_KEY])).toMatchObject({ xp: 340, streak: 5 });
		expect(JSON.parse(res.payloads[SCRIPT_KEY])).toEqual({
			entries: { က: { box: 2, due: 100, seen: 4, lapses: 1 } },
			unitsDone: ['s1']
		});
		expect(JSON.parse(res.payloads[VOCAB_KEY]).mistakes).toEqual(['မင်္ဂလာပါ']);
		expect(JSON.parse(res.payloads[CUSTOM_KEY])).toHaveLength(1);

		expect(res.summary).toMatchObject({ xp: 340, lessons: 2, glyphs: 1, words: 1, cards: 1 });
	});

	it('always returns all four keys, so a restore is a whole snapshot', () => {
		// A learner who never opened Script Studio has no script key at export.
		const file = buildBackup(fakeStorage({ [PROGRESS_KEY]: '{"xp":10}' }), T0);
		const res = parseBackup(JSON.stringify(file));
		expect(res.ok).toBe(true);
		if (!res.ok) return;
		// Restoring must clear whatever script progress this browser has, not merge.
		expect(Object.keys(res.payloads).sort()).toEqual([...BACKUP_KEYS].sort());
		expect(JSON.parse(res.payloads[SCRIPT_KEY])).toEqual({ entries: {}, unitsDone: [] });
		expect(JSON.parse(res.payloads[CUSTOM_KEY])).toEqual([]);
	});
});

describe('parseBackup rejection', () => {
	it('rejects non-JSON', () => {
		const res = parseBackup('nope{');
		expect(res).toMatchObject({ ok: false });
		if (res.ok) return;
		expect(res.error).toMatch(/valid JSON/);
	});

	it("rejects JSON that isn't ours", () => {
		for (const text of ['{"app":"anki","data":{}}', '{"data":{}}', '[]', 'null', '5']) {
			const res = parseBackup(text);
			expect(res.ok, text).toBe(false);
		}
	});

	it('rejects a file from a future version', () => {
		const res = parseBackup(
			JSON.stringify({ app: 'myanlingo', version: BACKUP_VERSION + 1, data: {} })
		);
		expect(res).toMatchObject({ ok: false });
		if (res.ok) return;
		expect(res.error).toMatch(/newer version/);
	});

	it('rejects a file with no data object', () => {
		const res = parseBackup(JSON.stringify({ app: 'myanlingo', version: 1, data: 'stuff' }));
		expect(res.ok).toBe(false);
	});
});

describe('parseBackup sanitizing', () => {
	it('survives every payload being the wrong type', () => {
		const res = parseBackup(
			JSON.stringify({
				app: 'myanlingo',
				version: 1,
				exportedAt: T0,
				data: {
					[PROGRESS_KEY]: null,
					[SCRIPT_KEY]: 'nope',
					[VOCAB_KEY]: 42,
					[CUSTOM_KEY]: { not: 'an array' }
				}
			})
		);
		expect(res.ok).toBe(true);
		if (!res.ok) return;
		expect(JSON.parse(res.payloads[PROGRESS_KEY])).toEqual({
			stars: {},
			activity: {},
			achievements: {},
			crowns: {},
			skipped: {}
		});
		expect(JSON.parse(res.payloads[CUSTOM_KEY])).toEqual([]);
		expect(res.summary).toMatchObject({ xp: 0, lessons: 0, glyphs: 0, words: 0, cards: 0 });
	});

	it('drops a doctored box rather than letting it poison scheduling', () => {
		// box 99 would index past INTERVALS, and `now + undefined` is NaN — an
		// item that is never due again.
		const res = parseBackup(
			JSON.stringify({
				app: 'myanlingo',
				version: 1,
				data: { [SCRIPT_KEY]: { entries: { က: { box: 99, due: 1, seen: 1, lapses: 0 } } } }
			})
		);
		expect(res.ok).toBe(true);
		if (!res.ok) return;
		expect(JSON.parse(res.payloads[SCRIPT_KEY]).entries['က'].box).toBe(4);
	});
});

describe('sanitizers', () => {
	it('sanitizeEntries keeps well-formed entries and drops the rest', () => {
		const out = sanitizeEntries(
			{
				ok: { box: 2, due: 10, seen: 3, lapses: 1 },
				nested: 'string',
				nullish: null,
				partial: { box: 1 }
			},
			4
		);
		expect(out.ok).toEqual({ box: 2, due: 10, seen: 3, lapses: 1 });
		expect(out.partial).toEqual({ box: 1, due: 0, seen: 0, lapses: 0 });
		expect('nested' in out).toBe(false);
		expect('nullish' in out).toBe(false);
	});

	it('sanitizeEntries rejects non-objects entirely', () => {
		for (const bad of [null, undefined, 'x', 5, []]) {
			expect(sanitizeEntries(bad, 4)).toEqual({});
		}
	});

	it('sanitizeEntries clamps the box into the ladder and refuses NaN', () => {
		const out = sanitizeEntries(
			{ high: { box: 9 }, low: { box: -3 }, nan: { box: NaN, due: NaN } },
			4
		);
		expect(out.high.box).toBe(4);
		expect(out.low.box).toBe(0);
		expect(out.nan.box).toBe(0);
		expect(out.nan.due).toBe(0);
	});

	it('sanitizeStrings drops non-strings and dedupes', () => {
		expect(sanitizeStrings(['a', 'b', 'a', 3, null, 'c'])).toEqual(['a', 'b', 'c']);
		expect(sanitizeStrings('not an array')).toEqual([]);
		expect(sanitizeStrings(['a', 'b', 'c'], 2)).toEqual(['a', 'b']);
	});

	it('sanitizeNumberMap keeps only finite numbers', () => {
		expect(sanitizeNumberMap({ a: 1, b: '2', c: NaN, d: Infinity, e: 0 })).toEqual({ a: 1, e: 0 });
		expect(sanitizeNumberMap([])).toEqual({});
	});

	it('sanitizeCards requires an id, a front and a back', () => {
		const out = sanitizeCards(
			[
				{ id: 'a', front: 'x', back: 'y', box: 1, due: 5, created: 1 },
				{ id: 'b', front: '   ', back: 'y' },
				{ id: '', front: 'x', back: 'y' },
				{ front: 'x', back: 'y' },
				'not a card'
			],
			4
		);
		expect(out).toHaveLength(1);
		expect(out[0]).toEqual({ id: 'a', front: 'x', back: 'y', box: 1, due: 5, created: 1 });
	});

	it('sanitizeCards trims and defaults a partial card', () => {
		const out = sanitizeCards([{ id: 'a', front: '  hi  ', back: ' there ' }], 4);
		expect(out[0]).toEqual({ id: 'a', front: 'hi', back: 'there', box: 0, due: 0, created: 0 });
	});
});

describe('presentation helpers', () => {
	it('backupFilename is dated', () => {
		expect(backupFilename(T0)).toBe('myanlingo-backup-2026-07-25.json');
	});

	it('describeBackup pluralizes and hides an empty card count', () => {
		expect(describeBackup({ exportedAt: 0, xp: 5, lessons: 1, glyphs: 1, words: 2, cards: 0 })).toBe(
			'From an unknown date: 5 XP · 1 lesson · 1 glyph · 2 words'
		);
		const withCards = describeBackup({
			exportedAt: T0,
			xp: 5,
			lessons: 2,
			glyphs: 0,
			words: 0,
			cards: 3
		});
		expect(withCards).toMatch(/2 lessons · 0 glyphs · 0 words · 3 cards$/);
	});
});
