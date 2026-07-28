// The store runs headless here: `browser` is false under vitest's node
// environment, so the constructor skips localStorage and save() no-ops.
import { afterEach, describe, expect, it } from 'vitest';
import { lessonOrder, optionalLessons } from './data/lesson-order';
import { progress } from './progress.svelte';

afterEach(() => {
	progress.sound = true;
	progress.tempMute = false;
	progress.profile = null;
	progress.stars = {};
	progress.skipped = {};
	progress.opened = {};
	progress.xp = 0;
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

describe('opening a lesson early from its preview', () => {
	const [first, second, third] = lessonOrder;

	it('unlocks that lesson without touching the ones before it', () => {
		expect(progress.isUnlocked(third)).toBe(false);
		progress.openLessonEarly(third);
		expect(progress.isUnlocked(third)).toBe(true);
		// The path is unchanged behind it: nothing was marked done or skipped.
		expect(progress.isUnlocked(second)).toBe(false);
		expect(progress.isCompleted(first)).toBe(false);
		expect(progress.isSkipped(first)).toBe(false);
		expect(progress.currentLesson).toBe(first);
	});

	it('earns nothing by itself', () => {
		progress.openLessonEarly(third);
		expect(progress.isCompleted(third)).toBe(false);
		expect(progress.completedCount).toBe(0);
		expect(progress.xp).toBe(0);
	});

	it('is idempotent and ignores ids that are not lessons', () => {
		progress.openLessonEarly(third);
		const at = progress.opened[third];
		progress.openLessonEarly(third);
		expect(progress.opened[third]).toBe(at);
		progress.openLessonEarly('not-a-lesson');
		expect(progress.opened['not-a-lesson']).toBeUndefined();
	});

	it('reset clears it', () => {
		progress.openLessonEarly(third);
		progress.reset();
		expect(progress.isOpenedEarly(third)).toBe(false);
		expect(progress.isUnlocked(third)).toBe(false);
	});
});

describe('optional lessons', () => {
	const optional = optionalLessons[0];
	const after = lessonOrder[lessonOrder.indexOf(optional) + 1];

	it('the course has one, so the rest of this block means something', () => {
		expect(optional).toBeDefined();
		expect(after).toBeDefined();
	});

	it('never blocks the lesson after it, with nothing done', () => {
		expect(progress.isUnlocked(after)).toBe(true);
	});

	it('is left out of the course total until it is actually done', () => {
		const withoutIt = progress.courseTotal;
		expect(withoutIt).toBe(lessonOrder.length - optionalLessons.length);
		progress.completeLesson(optional, 3);
		// Doing it puts it back in both halves, so the fraction can't exceed 1.
		expect(progress.courseTotal).toBe(withoutIt + 1);
		expect(progress.completedCount).toBe(1);
	});

	it('does not become the current lesson', () => {
		expect(progress.currentLesson).not.toBe(optional);
	});

	// It is off the ladder, not out of the course: a learner who wants it
	// must still be able to open it once they have reached that far.
	it('is still unlocked by the lesson before it', () => {
		const before = lessonOrder[lessonOrder.indexOf(optional) - 1];
		expect(progress.isUnlocked(optional)).toBe(false);
		progress.completeLesson(before, 3);
		expect(progress.isUnlocked(optional)).toBe(true);
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
