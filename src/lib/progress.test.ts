// The store runs headless here: `browser` is false under vitest's node
// environment, so the constructor skips localStorage and save() no-ops.
import { afterEach, describe, expect, it } from 'vitest';
import { progress } from './progress.svelte';

afterEach(() => {
	progress.sound = true;
	progress.tempMute = false;
});

describe('audioOn', () => {
	it('is on when sound is on and not temp-muted', () => {
		expect(progress.audioOn).toBe(true);
	});

	it('temp mute silences audio without touching the permanent Sound setting', () => {
		progress.toggleTempMute();
		expect(progress.tempMute).toBe(true);
		expect(progress.sound).toBe(true); // unaffected
		expect(progress.audioOn).toBe(false);
	});

	it('toggling temp mute again restores audio', () => {
		progress.toggleTempMute();
		progress.toggleTempMute();
		expect(progress.tempMute).toBe(false);
		expect(progress.audioOn).toBe(true);
	});

	it('permanent Sound off silences audio regardless of temp mute', () => {
		progress.toggleSound();
		expect(progress.audioOn).toBe(false);
		progress.toggleTempMute(); // toggling temp mute while sound is off
		expect(progress.audioOn).toBe(false); // still off either way
	});
});
