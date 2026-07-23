import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { glyphById, scriptUnits } from '$lib/data/script';
import { srs } from './srs.svelte';
import {
	buildIntroQueue,
	buildLoanwordQueue,
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
	it('g2s asks the learner to read the glyph aloud, not to pick a romanization', () => {
		const ex = g2s(ka);
		// Romanized options would teach the letter as a spelling of "ka".
		expect(ex.kind).toBe('recall');
		if (ex.kind !== 'recall') return;
		expect(ex.my).toBe(ka.char);
		expect(ex.speak).toBe(ka.speak);
		expect(ex.glyphId).toBe('ka');
	});

	it('g2s falls back to romanized choices only without audio to check against', () => {
		const ex = g2s(ka, undefined, false);
		expectValidChoice(ex);
		if (ex.kind !== 'choice') return;
		expect(ex.promptBig).toBe(ka.char);
		expect(ex.options[ex.correct].label).toBe(ka.sound);
	});

	it('g2s speed rounds stay multiple choice — no time to listen', () => {
		const ex = g2s(ka, 5);
		expect(ex.kind).toBe('choice');
		if (ex.kind !== 'choice') return;
		expect(ex.timed).toBe(5);
	});

	it('g2s prefers confusables as distractors in its fallback form', () => {
		const ex = g2s(ma, undefined, false);
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

	it('s2g is audio-first for letters, written for digits', () => {
		const ex = s2g(ka);
		if (ex.kind !== 'choice') return;
		// The prompt is the spoken letter name — no romanized "sounds like k".
		expect(ex.promptSpeak).toBe(ka.speak);
		expect(ex.questionKey).toBe('which-hear');
		const d5 = glyphById.get('d5')!;
		const dEx = s2g(d5);
		if (dEx.kind !== 'choice') return;
		expect(dEx.promptSpeak).toBeUndefined();
		expect(dEx.question).toContain('5');
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
			// The quiz is a read-aloud recall while audio is on, a choice without.
			expect(
				queue.some((ex) => (ex.kind === 'choice' || ex.kind === 'recall') && ex.glyphId === id)
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

	// Tracing is gated off (see TRACING_ENABLED in script-session.ts).
	it('queues no trace exercises in any unit while tracing is gated off', () => {
		for (const unit of scriptUnits) {
			const queue = buildIntroQueue(unit);
			expect(queue.some((ex) => ex.kind === 'trace')).toBe(false);
			// The lesson must still be worth doing without the pad.
			expect(queue.length).toBeGreaterThanOrEqual(4);
		}
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
		// Box-1 items drill glyph→sound, which is now a read-aloud recall.
		const drills = queue.filter((ex) => ex.kind === 'recall' && ex.glyphId);
		expect(drills.length).toBe(5);
		for (const d of drills) {
			if (d.kind === 'recall') expect(d.speak).toBeTruthy();
		}
	});

	it('drills stay romanization-free while audio is on', () => {
		srs.introduce(['ka', 'ma', 'na', 'a', 'aa']);
		const { queue } = buildPracticeQueue(true);
		const sounds = new Set(['ka', 'ma', 'na', 'a', 'aa'].map((id) => glyphById.get(id)!.sound));
		for (const ex of queue) {
			if (ex.kind !== 'choice') continue;
			// No drill may offer a romanized spelling as something to pick.
			for (const o of ex.options) expect(sounds.has(o.label)).toBe(false);
		}
	});

	it('serves mastered items as timed speed rounds when no listen drill rolls', () => {
		srs.introduce(['ma']);
		for (let i = 0; i < 4; i++) srs.grade('ma', true); // box 4 (no aspiration mate → no listen)
		vi.spyOn(Math, 'random').mockReturnValue(0.9);
		const { queue } = buildPracticeQueue();
		vi.restoreAllMocks();
		const drill = queue.find((ex) => ex.kind === 'choice' && ex.glyphId === 'ma');
		expect(drill).toBeDefined();
		if (drill?.kind === 'choice') expect(drill.timed).toBe(5);
	});

	// The tracing pad is gated off (TRACING_ENABLED) because its coverage-based
	// grading passed any scribble. Mastered traceable glyphs must therefore fall
	// through to a speed round rather than a write-from-memory trace, whatever
	// the random roll. Flip these expectations when tracing is reinstated.
	it('never queues a trace drill while tracing is gated off', () => {
		srs.introduce(['ma']);
		for (let i = 0; i < 4; i++) srs.grade('ma', true);
		vi.spyOn(Math, 'random').mockReturnValue(0.1); // would have rolled a memory trace
		const { queue } = buildPracticeQueue();
		vi.restoreAllMocks();
		expect(queue.some((ex) => ex.kind === 'trace')).toBe(false);
		const drill = queue.find((ex) => ex.kind === 'choice' && ex.glyphId === 'ma');
		expect(drill).toBeDefined();
	});
});

describe('buildLoanwordQueue', () => {
	it('runs a decode pass (audio held back) then a listening pass', () => {
		const queue = buildLoanwordQueue();
		const decodes = queue.filter((ex) => ex.kind === 'choice' && ex.speakAfter);
		const listens = queue.filter((ex) => ex.kind === 'choice' && !ex.speakAfter);
		expect(decodes.length).toBe(8);
		expect(listens.length).toBe(4);
		for (const ex of queue) {
			if (ex.kind !== 'choice') continue;
			expect(ex.correct).toBeGreaterThanOrEqual(0);
			expect(ex.correct).toBeLessThan(ex.options.length);
			expect(ex.promptSpeak).toBeDefined();
			// No romanization: option labels are either script or plain English.
			const labels = ex.options.map((o) => o.label);
			expect(new Set(labels).size).toBe(labels.length);
			if (ex.speakAfter) expect(ex.promptBig).toBeDefined();
		}
	});
});

describe('starsFor', () => {
	it('3 for perfect, 2 for ≤2 mistakes, else 1', () => {
		expect(starsFor(0)).toBe(3);
		expect(starsFor(2)).toBe(2);
		expect(starsFor(3)).toBe(1);
	});
});
