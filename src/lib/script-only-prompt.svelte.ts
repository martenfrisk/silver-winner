// Session life cycle for the "no romanization here" nudge shown entering a
// scriptOnly lesson (see Lesson.scriptOnly in $lib/data/course).
//
// Deliberately not persisted — resets on reload, same as no-audio-prompt.svelte.ts
// — so the nudge can surface again next real session rather than being
// silenced forever by one dismissal.
class ScriptOnlyPromptState {
	/** Dismissed for this session — stop offering. */
	seen = $state(false);

	markSeen() {
		this.seen = true;
	}

	/** Back to square one. The store is a singleton, so tests need this. */
	reset() {
		this.seen = false;
	}
}

export const scriptOnlyPromptState = new ScriptOnlyPromptState();
