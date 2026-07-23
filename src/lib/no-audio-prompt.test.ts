import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ANSWERS_BEFORE_RELOCATE, noAudioPromptState } from './no-audio-prompt.svelte';

beforeEach(() => {
	vi.useFakeTimers();
	noAudioPromptState.reset(); // singleton — isolate each test
});

afterEach(() => {
	vi.useRealTimers();
});

function answer(n: number) {
	for (let i = 0; i < n; i++) noAudioPromptState.noteAnswer();
}

describe('noteAnswer', () => {
	it('leaves the inline prompt alone for the first question', () => {
		answer(ANSWERS_BEFORE_RELOCATE - 1);
		expect(noAudioPromptState.relocated).toBe(false);
	});

	it('moves the offer to the header once a couple go by unanswered', () => {
		answer(ANSWERS_BEFORE_RELOCATE);
		expect(noAudioPromptState.relocated).toBe(true);
		expect(noAudioPromptState.tooltip).toBe(true);
	});

	it('retires the tooltip on its own', () => {
		answer(ANSWERS_BEFORE_RELOCATE);
		expect(noAudioPromptState.tooltip).toBe(true);
		vi.advanceTimersByTime(5000);
		expect(noAudioPromptState.tooltip).toBe(false);
		// The control itself stays — only the explanation is one-shot.
		expect(noAudioPromptState.relocated).toBe(true);
	});

	it('never relocates once the learner has engaged with the prompt', () => {
		noAudioPromptState.markSeen();
		answer(ANSWERS_BEFORE_RELOCATE + 3);
		expect(noAudioPromptState.relocated).toBe(false);
	});

	it('markSeen takes the tooltip down with it', () => {
		answer(ANSWERS_BEFORE_RELOCATE);
		noAudioPromptState.markSeen();
		expect(noAudioPromptState.tooltip).toBe(false);
	});
});
