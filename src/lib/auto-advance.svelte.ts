// Interruptible countdown that moves a session on after a correct answer.
//
// Tapping Continue after every single correct answer is a lot of taps for no
// decision — the learner already knows they were right. So the players start a
// short countdown instead and advance themselves, while any interaction
// (including tapping Continue, which just advances immediately) cancels it.
//
// Deliberately *not* started for people who ask for reduced motion: a timer
// that takes the screen away is exactly the kind of thing that setting asks us
// to stop doing, and the Continue button is still right there.

export const AUTO_ADVANCE_SECONDS = 3;

function reducedMotion(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export class AutoAdvance {
	/** Whole seconds left, or 0 when no countdown is running. */
	left = $state(0);

	#timer: ReturnType<typeof setInterval> | null = null;
	#action: (() => void) | null = null;

	get running(): boolean {
		return this.#timer !== null;
	}

	/** Starts the countdown. A no-op under reduced motion. */
	start(action: () => void, seconds: number = AUTO_ADVANCE_SECONDS) {
		this.cancel();
		if (reducedMotion()) return;
		this.#action = action;
		this.left = seconds;
		this.#timer = setInterval(() => {
			this.left--;
			if (this.left > 0) return;
			const run = this.#action;
			this.cancel();
			run?.();
		}, 1000);
	}

	/** Stops the countdown without running the action. Safe to call anytime. */
	cancel() {
		if (this.#timer !== null) clearInterval(this.#timer);
		this.#timer = null;
		this.#action = null;
		this.left = 0;
	}
}
