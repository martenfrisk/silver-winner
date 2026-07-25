// Retention calibration: ask the learner to predict, then show them the answer.
//
// Learners are systematically bad at judging what they've actually learned —
// fluency during study reads as durable knowledge, and the illusion is what
// makes blocked practice and re-reading feel so effective. Judgments of
// learning are trainable, though: making a prediction and then being confronted
// with the outcome improves how well people regulate their own study.
//
// So after a correct answer the app occasionally asks "will you still know
// this tomorrow?", and when the word comes back it says what happened. The
// second half is the part that does the work — a prediction nobody checks
// teaches nothing.
//
// This also turns the SRS from something that happens *to* the learner into
// evidence they can read: `seen` and `lapses` were already stored, but nothing
// ever showed them.

/** A prediction waiting for the item to come back around. */
export interface Pending {
	/** Vocab key (Burmese text) or glyph id. */
	id: string;
	/** True = "yes, I'll still know it". */
	said: boolean;
	at: number; // epoch ms
	box: number; // SRS box when asked, for context
}

/** A prediction that met reality. */
export interface Resolved {
	said: boolean;
	ok: boolean; // what actually happened
	at: number; // epoch ms resolved
}

export interface CalibrationSummary {
	resolved: number;
	/** Predictions that matched what happened. */
	right: number;
	/** Said yes, then missed it. */
	overshoot: number;
	/** Said no, then knew it. */
	undershoot: number;
	/** 0..1 share of predictions that matched; 0 when there's nothing resolved. */
	accuracy: number;
	lean: 'overconfident' | 'underconfident' | 'calibrated' | 'unknown';
}

/** Box range worth asking about. */
export const ASK_MIN_BOX = 1;
export const ASK_MAX_BOX = 3;
/** Roughly one item in four, so the question stays a surprise rather than a toll. */
export const ASK_CHANCE = 0.25;
export const MAX_ASKS_PER_SESSION = 3;

/**
 * "Tomorrow" taken literally enough to mean something. Grading the item again
 * twenty minutes later says nothing about overnight retention, so an early
 * review leaves the prediction pending rather than resolving it wrongly.
 */
export const RESOLVE_AFTER_MS = 20 * 3600_000;

/** Predictions the learner never came back to are dropped rather than kept forever. */
export const EXPIRE_AFTER_MS = 14 * 24 * 3600_000;

/** How many resolved predictions before the lean is worth stating. */
export const MIN_FOR_LEAN = 5;

/** Most resolved predictions kept — enough for a trend, bounded for storage. */
export const HISTORY_CAP = 100;

/**
 * Whether to ask about this item now.
 *
 * Only after a *correct* answer: "will you still know this tomorrow?" presumes
 * you know it today, and asking it after a miss is just rubbing it in. Only in
 * the middle boxes, where the honest answer is genuinely uncertain — a brand
 * new word (box 0) and a mastered one (box 4) both make the question rhetorical.
 */
export function shouldAsk(o: {
	correct: boolean;
	box: number;
	hasPending: boolean;
	askedThisSession: number;
	rand?: number;
}): boolean {
	if (!o.correct || o.hasPending) return false;
	if (o.askedThisSession >= MAX_ASKS_PER_SESSION) return false;
	if (o.box < ASK_MIN_BOX || o.box > ASK_MAX_BOX) return false;
	return (o.rand ?? Math.random()) < ASK_CHANCE;
}

/** Whether enough time has passed for an answer to be evidence about "tomorrow". */
export function isResolvable(p: Pending, now = Date.now()): boolean {
	return now - p.at >= RESOLVE_AFTER_MS;
}

export function isExpired(p: Pending, now = Date.now()): boolean {
	return now - p.at >= EXPIRE_AFTER_MS;
}

export function summarize(history: readonly Resolved[]): CalibrationSummary {
	let right = 0;
	let overshoot = 0;
	let undershoot = 0;
	for (const r of history) {
		if (r.said === r.ok) right++;
		else if (r.said) overshoot++;
		else undershoot++;
	}
	const resolved = history.length;
	return {
		resolved,
		right,
		overshoot,
		undershoot,
		accuracy: resolved === 0 ? 0 : right / resolved,
		lean: leanOf(resolved, overshoot, undershoot)
	};
}

function leanOf(
	resolved: number,
	overshoot: number,
	undershoot: number
): CalibrationSummary['lean'] {
	if (resolved < MIN_FOR_LEAN) return 'unknown';
	// A lean needs the misses to be lopsided, not merely unequal. Both a ratio
	// and an absolute margin, because either alone misfires at this sample
	// size: 2-vs-1 clears the ratio on one extra miss, and 6-vs-4 clears a
	// margin while being nearly even.
	const margin = 2;
	if (overshoot - undershoot >= margin && overshoot >= undershoot * 2) return 'overconfident';
	if (undershoot - overshoot >= margin && undershoot >= overshoot * 2) return 'underconfident';
	return 'calibrated';
}

/** One sentence for the learner. Plain about the gap, not scolding about it. */
export function describeLean(s: CalibrationSummary): string {
	switch (s.lean) {
		case 'overconfident':
			return 'You tend to think words have stuck before they have. Worth reviewing the ones you feel surest about.';
		case 'underconfident':
			return 'You know more than you give yourself credit for. Words you doubt tend to come back anyway.';
		case 'calibrated':
			return 'Your sense of what has stuck is close to what actually sticks.';
		case 'unknown':
			return `Answer ${MIN_FOR_LEAN - s.resolved} more prediction${
				MIN_FOR_LEAN - s.resolved === 1 ? '' : 's'
			} to see how well you read yourself.`;
	}
}

/** The line shown when a prediction meets reality. */
export function verdictLine(said: boolean, ok: boolean): string {
	if (said && ok) return 'You said you would remember this. You did.';
	if (said && !ok) return 'You thought this one had stuck. Not yet.';
	if (!said && ok) return 'You doubted this one. You knew it.';
	return 'You thought this would slip. It did.';
}
