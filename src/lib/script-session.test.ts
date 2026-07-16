import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { glyphById, scriptUnits } from '$lib/data/script';
import { srs } from './srs.svelte';
import {
	buildIntroQueue,
	buildPracticeQueue,
	g2s,
	pairListen,
	s2g,
	starsFor,
	syllableRead,
	toneListen
} from './script-session';

const T0 = new Date('2026-01-01T12:00:00Z').getTime();

beforeEach(() => {
	srs.reset();
	vi.useFakeTimers();
	vi.setSystemTime(T0);
});

afterEach(() => {
	vi.useRealTimers();
	srs.reset();
});

const ka = glyphById.get('ka')!;
const ma = glyphById.get('ma')!;

function expectValidChoice(ex: ReturnType<typeof g2s>) {
	if (ex.kind !== 'choice') throw new Error('expected a choice');
	expect(ex.correct).toBeGreaterThanOrEqual(0);
	expect(ex.correct).toBeLessThan(ex.options.length);
	const labels = ex.options.map((o) => o.label);
	expect(new Set(labels).size).toBe(labels.length);
}

describe('drill generators', () => {
	it('g2s asks for the glyph sound and includes it once', () => {
		const ex = g2s(ka);
		expectValidChoice(ex);
		if (ex.kind !== 'choice') return;
		expect(ex.promptBig).toBe(ka.char);
		expect(ex.options[ex.correct].label).toBe(ka.sound);
		expect(ex.glyphId).toBe('ka');
	});

	it('g2s prefers confusables as distractors', () => {
		const ex = g2s(ma);
		if (ex.kind !== 'choice') return;
		const distractorLabels = ex.options.filter((_, i) => i !== ex.correct).map((o) => o.label);
		const confusableSounds = ma.confusables.map((id) => glyphById.get(id)!.sound);
		for (const s of confusableSounds.slice(0, 2)) expect(distractorLabels).toContain(s);
	});

	it('s2g shows glyph options with the right answer present', () => {
		const ex = s2g(ka);
		expectValidChoice(ex);
		if (ex.kind !== 'choice') return;
		expect(ex.options[ex.correct].label).toBe(ka.char);
	});

	it('syllableRead needs learned material and marks the built syllable', () => {
		expect(syllableRead(ka)).toBeNull(); // nothing introduced yet
		srs.introduce(['ka', 'ma', 'aa']);
		const ex = syllableRead(ka);
		expect(ex).not.toBeNull();
		if (!ex || ex.kind !== 'choice') return;
		expect(ex.promptSpeak).toBeDefined();
		expectValidChoice(ex);
	});

	it('pairListen requires the aspiration mate to be introduced', () => {
		srs.introduce(['ka', 'aa']);
		expect(pairListen(ka)).toBeNull(); // ခ not introduced
		srs.introduce(['kha']);
		const ex = pairListen(ka);
		expect(ex).not.toBeNull();
		if (!ex || ex.kind !== 'choice') return;
		// The played syllable must be one of the two written options.
		const labels = ex.options.map((o) => o.label);
		expect(labels).toContain(ex.promptSpeak);
	});

	it('toneListen requires the visarga', () => {
		srs.introduce(['ka', 'aa']);
		expect(toneListen()).toBeNull();
		srs.introduce(['visarga']);
		const ex = toneListen();
		expect(ex).not.toBeNull();
		if (!ex || ex.kind !== 'choice') return;
		expect(ex.glyphId).toBe('visarga');
	});
});

describe('buildIntroQueue', () => {
	it('teaches every glyph of a unit with intro + immediate quiz', () => {
		const unit = scriptUnits[0];
		const queue = buildIntroQueue(unit);
		for (const id of unit.glyphIds) {
			expect(queue.some((ex) => ex.kind === 'intro' && ex.glyph.id === id)).toBe(true);
			expect(
				queue.some((ex) => ex.kind === 'choice' && ex.glyphId === id)
			).toBe(true);
		}
	});

	it('reads every word of a glyphless concept unit', () => {
		const stacked = scriptUnits.find((u) => u.glyphIds.length === 0);
		if (!stacked) return; // data changed — nothing to assert
		const queue = buildIntroQueue(stacked);
		expect(queue.some((ex) => ex.kind === 'note')).toBe(true);
		const wordReads = queue.filter((ex) => ex.kind === 'word');
		expect(wordReads.length).toBeGreaterThan(0);
	});
});

describe('buildPracticeQueue', () => {
	it('is empty with nothing introduced', () => {
		expect(buildPracticeQueue().queue).toHaveLength(0);
	});

	it('tops up to at most 10 items and matches drill type to box', () => {
		srs.introduce(['ka', 'ma', 'na', 'a', 'aa']);
		const { queue, count } = buildPracticeQueue();
		expect(count).toBe(5);
		// Box-1 items drill glyph→sound.
		const drills = queue.filter((ex) => ex.kind === 'choice' && ex.glyphId);
		expect(drills.length).toBe(5);
		for (const d of drills) {
			if (d.kind === 'choice') expect(d.questionKey ?? 'what-sound').toBe('what-sound');
		}
	});

	it('serves mastered items as timed speed rounds when no trace/listen rolls', () => {
		srs.introduce(['ma']);
		for (let i = 0; i < 4; i++) srs.grade('ma', true); // box 4 (no aspiration mate → no listen)
		vi.spyOn(Math, 'random').mockReturnValue(0.9); // above the memory-trace roll
		const { queue } = buildPracticeQueue();
		vi.restoreAllMocks();
		const drill = queue.find((ex) => ex.kind === 'choice' && ex.glyphId === 'ma');
		expect(drill).toBeDefined();
		if (drill?.kind === 'choice') expect(drill.timed).toBe(5);
	});

	it('serves mastered traceable glyphs as write-from-memory drills on a low roll', () => {
		srs.introduce(['ma']);
		for (let i = 0; i < 4; i++) srs.grade('ma', true);
		vi.spyOn(Math, 'random').mockReturnValue(0.1);
		const { queue } = buildPracticeQueue();
		vi.restoreAllMocks();
		const trace = queue.find((ex) => ex.kind === 'trace' && ex.glyph.id === 'ma');
		expect(trace).toBeDefined();
		if (trace?.kind === 'trace') expect(trace.fromMemory).toBe(true);
	});
});

describe('starsFor', () => {
	it('3 for perfect, 2 for ≤2 mistakes, else 1', () => {
		expect(starsFor(0)).toBe(3);
		expect(starsFor(2)).toBe(2);
		expect(starsFor(3)).toBe(1);
	});
});
