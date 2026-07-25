// Persistence for retention calibration — see $lib/calibration for what it is
// and why. Pending predictions wait for their item to come back; resolved ones
// accumulate into the trend shown on the account page.
import { browser } from '$app/environment';
import {
	HISTORY_CAP,
	isExpired,
	isResolvable,
	summarize,
	type CalibrationSummary,
	type Pending,
	type Resolved
} from '$lib/calibration';
import { CALIBRATION_KEY as STORAGE_KEY, sanitizeCalibration } from '$lib/backup';

class Calibration {
	pending = $state<Pending[]>([]);
	history = $state<Resolved[]>([]);
	/** Session-only: caps how often the question interrupts one sitting. */
	askedThisSession = $state(0);

	constructor() {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const s = sanitizeCalibration(JSON.parse(raw));
				this.pending = s.pending;
				this.history = s.history;
			}
		} catch {
			/* corrupt storage — start empty */
		}
		this.dropExpired();
	}

	private save() {
		if (!browser) return;
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ pending: this.pending, history: this.history })
		);
	}

	/** Predictions whose item never came back get forgotten, not counted. */
	private dropExpired(now = Date.now()) {
		const kept = this.pending.filter((p) => !isExpired(p, now));
		if (kept.length !== this.pending.length) {
			this.pending = kept;
			this.save();
		}
	}

	hasPending(id: string): boolean {
		return this.pending.some((p) => p.id === id);
	}

	predict(id: string, said: boolean, box: number, now = Date.now()) {
		if (this.hasPending(id)) return;
		this.pending = [...this.pending, { id, said, at: now, box }];
		this.askedThisSession++;
		this.save();
	}

	/**
	 * Grades an item against any prediction riding on it.
	 *
	 * Returns the prediction that just resolved, so the caller can show the
	 * learner what they'd said — the confrontation is the whole mechanism.
	 * Returns null when there was no prediction, or when too little time has
	 * passed for this answer to say anything about overnight retention.
	 */
	resolve(id: string, ok: boolean, now = Date.now()): Resolved | null {
		const p = this.pending.find((x) => x.id === id);
		if (!p || !isResolvable(p, now)) return null;
		const resolved: Resolved = { said: p.said, ok, at: now };
		this.pending = this.pending.filter((x) => x !== p);
		this.history = [...this.history, resolved].slice(-HISTORY_CAP);
		this.save();
		return resolved;
	}

	get summary(): CalibrationSummary {
		return summarize(this.history);
	}

	get pendingCount(): number {
		return this.pending.length;
	}

	reset() {
		this.pending = [];
		this.history = [];
		this.askedThisSession = 0;
		this.save();
	}
}

export const calibration = new Calibration();
