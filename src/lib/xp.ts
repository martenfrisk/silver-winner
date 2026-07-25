// What a finished session is worth.
//
// Nine places used to award XP, each with its own arithmetic: 20/10 plus a
// three-star bonus for a lesson, a flat 15 for the Loanword Lab, a flat 10 for
// the Confusion Lab, 10 plus a bonus for a glyph drill, and — the one that was
// actually a bug — 2 XP per correct build in the syllable builder, uncapped and
// with no cooldown, so the builder was a faucet you could sit on. Nothing tied
// those numbers together, so "is this worth doing?" had no consistent answer
// and the exploit was invisible until someone went looking.
//
// One table instead. The kind of session sets the base, and the bonuses are
// uniform across all of them:
//
//   teach   20 first time, 10 on a replay   (lessons, script units, reader units, stories)
//   review  10                              (word and glyph drills)
//   lab     10                              (Loanword Lab, Confusion Lab, builder run)
//
//   +5  a three-star finish
//   +5  a combo of five or more
//   +10 a crown (a perfect hard-mode run)
//
// Teaching pays double the first time because meeting material is the scarce
// event; everything after is maintenance, and maintenance should not out-earn
// progress. The Loanword Lab drops from 15 to 10 to match the other labs,
// which is a wash in practice since most runs three-star.

export type SessionKind = 'teach' | 'review' | 'lab';

export interface SessionResult {
	kind: SessionKind;
	/** First time this particular thing has been finished. Only affects `teach`. */
	firstTime?: boolean;
	/** Stars earned, 0-3. */
	stars?: number;
	/** Longest correct streak in the session. */
	maxCombo?: number;
	/** A perfect hard-mode run that earned the crown. */
	crowned?: boolean;
}

const BASE: Record<SessionKind, number> = { teach: 10, review: 10, lab: 10 };

/** Stars needed for the perfect-run bonus. */
export const STAR_BONUS_AT = 3;
/** Consecutive correct answers needed for the combo bonus. */
export const COMBO_BONUS_AT = 5;

export const FIRST_TIME_BONUS = 10;
export const STAR_BONUS = 5;
export const COMBO_BONUS = 5;
export const CROWN_BONUS = 10;

export function sessionXp(o: SessionResult): number {
	let xp = BASE[o.kind];
	if (o.kind === 'teach' && o.firstTime) xp += FIRST_TIME_BONUS;
	if ((o.stars ?? 0) >= STAR_BONUS_AT) xp += STAR_BONUS;
	if ((o.maxCombo ?? 0) >= COMBO_BONUS_AT) xp += COMBO_BONUS;
	if (o.crowned) xp += CROWN_BONUS;
	return xp;
}

/**
 * Correct builds needed before the syllable builder pays out.
 *
 * The builder is a sandbox you can sit in indefinitely, so it cannot pay per
 * action. Awarding once per visit, after a run of builds, keeps it worth
 * opening without making it the cheapest XP in the app.
 */
export const BUILDER_RUN = 10;
