// The life cycle of the "no headphones?" nudge inside a session.
//
// Deliberately not persisted — it resets on reload so the nudge can surface
// again next real session, matching the temporary, situational nature of
// progress.tempMute.
//
// Three states, in order:
//   1. inline prompt — a chip above the exercise, right where audio plays
//   2. relocated     — the learner answered a couple of questions without
//                      engaging, so the chip gives the exercise its space back
//                      and the mute lives in the header from then on
//   3. seen          — they muted or dismissed it; stop nudging entirely
//
// Ignoring a prompt is not the same as refusing it: the offer is usually still
// wanted (they may put headphones on, or not), it just shouldn't keep sitting
// on top of the lesson. So it shrinks to a header control instead of vanishing,
// and says so once on the way.

/** Questions answered with the prompt ignored before it moves to the header. */
export const ANSWERS_BEFORE_RELOCATE = 2;

/** How long the "mute from here" tooltip stays up, in ms. */
const TOOLTIP_MS = 5000;

class NoAudioPromptState {
	/** Muted or dismissed — the learner engaged, so stop offering. */
	seen = $state(false);
	/** The offer now lives in the session header rather than inline. */
	relocated = $state(false);
	/** One-shot tooltip pointing at the header control. */
	tooltip = $state(false);

	#answered = 0;
	#timer: ReturnType<typeof setTimeout> | null = null;

	markSeen() {
		this.seen = true;
		this.hideTooltip();
	}

	/**
	 * Called by a session once per answered question. After a couple of them
	 * with the prompt still untouched, the offer moves up to the header.
	 */
	noteAnswer() {
		if (this.seen || this.relocated) return;
		if (++this.#answered < ANSWERS_BEFORE_RELOCATE) return;
		this.relocated = true;
		this.tooltip = true;
		this.#timer = setTimeout(() => this.hideTooltip(), TOOLTIP_MS);
	}

	hideTooltip() {
		if (this.#timer !== null) clearTimeout(this.#timer);
		this.#timer = null;
		this.tooltip = false;
	}

	/** Back to square one. The store is a singleton, so tests need this. */
	reset() {
		this.hideTooltip();
		this.seen = false;
		this.relocated = false;
		this.#answered = 0;
	}
}

export const noAudioPromptState = new NoAudioPromptState();
