import { describe, expect, it } from 'vitest';
import type { Exercise } from '$lib/data/course';
import { glyphById } from '$lib/data/script';
import { buildLoanwordQueue, g2s, pairListen, s2g } from './script-session';
import { scriptNeedsAudio, silentSafe } from './silent-mode';
import { srs } from './srs.svelte';

const listenEx: Exercise = {
	kind: 'listen',
	my: 'မင်္ဂလာပါ',
	roman: 'min-ga-la-ba',
	en: 'Hello',
	options: [{ text: 'မင်္ဂလာပါ' }, { text: 'တာ့တာ' }, { text: 'ဟုတ်ကဲ့' }],
	correct: 0
};

describe('silentSafe', () => {
	it('leaves everything alone while audio is on', () => {
		expect(silentSafe(listenEx, true)).toBe(listenEx);
	});

	it('turns a listening drill into a readable question with the same answer', () => {
		const ex = silentSafe(listenEx, false);
		expect(ex.kind).toBe('choice');
		if (ex.kind !== 'choice') return;
		// "Tap what you hear" is unanswerable in silence; asking for the meaning
		// keeps the same options and the same correct index, so grading is intact.
		expect(ex.question).toContain('Hello');
		expect(ex.options).toEqual(listenEx.options);
		expect(ex.correct).toBe(listenEx.correct);
		expect(ex.options[ex.correct].text).toBe(listenEx.my);
	});

	it('leaves non-listening exercises untouched when muted', () => {
		const choice: Exercise = {
			kind: 'choice',
			question: 'What does this mean?',
			promptMy: 'မင်္ဂလာပါ',
			options: [{ text: 'Hello' }, { text: 'Bye' }],
			correct: 0
		};
		expect(silentSafe(choice, false)).toBe(choice);
	});
});

describe('scriptNeedsAudio', () => {
	it('flags drills whose only prompt is sound', () => {
		srs.reset();
		srs.introduce(['ka', 'kha', 'aa']);
		const listen = pairListen(glyphById.get('ka')!);
		expect(listen).not.toBeNull();
		if (listen) expect(scriptNeedsAudio(listen)).toBe(true);
		srs.reset();
	});

	it('clears drills that show the glyph and can be answered in silence', () => {
		// The muted form of glyph→sound: the shape is the prompt, the options
		// are written, so nothing depends on hearing anything.
		expect(scriptNeedsAudio(g2s(glyphById.get('ka')!, undefined, false))).toBe(false);
	});

	it('drops read-aloud recall when muted — the audio is the answer key', () => {
		expect(scriptNeedsAudio(g2s(glyphById.get('ka')!))).toBe(true);
	});
});

describe('audio-off Script Studio fallbacks', () => {
	const ka = glyphById.get('ka')!;

	it('s2g falls back to a written prompt when muted', () => {
		const heard = s2g(ka, true);
		const silent = s2g(ka, false);
		expect(scriptNeedsAudio(heard)).toBe(true);
		expect(scriptNeedsAudio(silent)).toBe(false);
		if (silent.kind !== 'choice') return;
		expect(silent.question).toContain(ka.sound);
		// Still the same drill: tap the right shape.
		expect(silent.options[silent.correct].label).toBe(ka.char);
	});

	it('the Loanword Lab drops its listening pass when muted', () => {
		const silent = buildLoanwordQueue(false);
		expect(silent.length).toBeGreaterThan(0);
		expect(silent.every((ex) => !scriptNeedsAudio(ex))).toBe(true);
		// The decode pass survives — it's visual by design.
		expect(silent.every((ex) => ex.kind === 'choice' && ex.speakAfter)).toBe(true);
		expect(buildLoanwordQueue(true).some(scriptNeedsAudio)).toBe(true);
	});
});
