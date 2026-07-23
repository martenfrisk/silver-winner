// The store runs headless here: `browser` is false under vitest's node
// environment, so the constructor skips localStorage and save() no-ops.
import { afterEach, describe, expect, it } from 'vitest';
import { lessonOrder } from './data/lesson-order';
import { progress } from './progress.svelte';

afterEach(() => {
	progress.sound = true;
	progress.tempMute = false;
	progress.profile = null;
	progress.stars = {};
	progress.skipped = {};
});

describe('skipping lessons', () => {
	const [first, second, third] = lessonOrder;

	it('a skipped lesson unlocks the next one', () => {
		expect(progress.isUnlocked(second)).toBe(false);
		progress.skipLesson(first);
		expect(progress.isUnlocked(second)).toBe(true);
	});

	it('skipping earns nothing — no stars, and it does not count as completed', () => {
		progress.skipLesson(first);
		expect(progress.isCompleted(first)).toBe(false);
		expect(progress.stars[first]).toBeUndefined();
		expect(progress.completedCount).toBe(0);
	});

	it('moves the current lesson past the skipped ones', () => {
		progress.skipLesson(first);
		progress.skipLesson(second);
		expect(progress.currentLesson).toBe(third);
	});

	it('un-skipping locks the path back up', () => {
		progress.skipLesson(first);
		progress.unskipLesson(first);
		expect(progress.isSkipped(first)).toBe(false);
		expect(progress.isUnlocked(second)).toBe(false);
		expect(progress.currentLesson).toBe(first);
	});

	it('doing a skipped lesson supersedes the skip', () => {
		progress.skipLesson(first);
		progress.completeLesson(first, 3);
		expect(progress.isSkipped(first)).toBe(false);
		expect(progress.isCompleted(first)).toBe(true);
	});

	it('reset clears skips', () => {
		progress.skipLesson(first);
		progress.reset();
		expect(progress.isSkipped(first)).toBe(false);
	});
});

describe('profile', () => {
	it('starts unset so the home hero asks', () => {
		expect(progress.profile).toBeNull();
	});

	it('setProfile stores the choice; reset clears it for re-asking', () => {
		progress.setProfile('speaker');
		expect(progress.profile).toBe('speaker');
		progress.reset();
		expect(progress.profile).toBeNull();
	});
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
