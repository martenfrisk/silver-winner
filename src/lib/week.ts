// The week as a rhythm, which is what replaced the streak counter on Today.
//
// A streak is one number that only ever goes to zero, and it does its work by
// making you afraid to lose it. That is effective and it is unpleasant, and it
// punishes exactly the wrong thing: a learner who studies six days a week for
// a year has a "streak" of 1 as often as not, and is told they have nothing.
//
// Seven dots say the same thing without the cliff. Missing a day costs one
// dot, the week refills on its own, and the pull to fill today's dot is still
// there — it just doesn't come with a threat. `progress.streak` stays behind
// the scenes for freezes and its two achievements; it is only off the home
// screen.
//
// Pure, and takes `now`, so the week boundary and "today" are testable rather
// than dependent on when the suite runs.

export interface DayCell {
	/** YYYY-MM-DD, the key `progress.activity` uses. */
	date: string;
	/** Single-letter label for the column: M T W T F S S. */
	initial: string;
	/** Full label for assistive text. */
	label: string;
	xp: number;
	/** Any activity at all — one exercise counts, this is a rhythm not a quota. */
	studied: boolean;
	/** The daily XP goal was reached. */
	goalMet: boolean;
	isToday: boolean;
	/** Later this week — drawn as an outline, never as a miss. */
	future: boolean;
}

/**
 * Local-date key. Deliberately not `toISOString`, which converts to UTC and so
 * reports yesterday for anyone west of Greenwich for part of their day — the
 * same trap `progress.today()` avoids.
 */
function iso(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Monday of `now`'s week, at local midnight.
 *
 * Dates are stepped with setDate, which handles month ends and DST shifts
 * (a day is not always 86,400,000ms, so arithmetic on timestamps drifts).
 */
export function mondayOf(now: Date): Date {
	const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
	return d;
}

/** The seven days of the current week, Monday first. */
export function weekDays(
	activity: Record<string, number>,
	dailyGoal: number,
	now: Date = new Date()
): DayCell[] {
	const goal = Math.max(1, dailyGoal);
	const today = iso(now);
	const monday = mondayOf(now);

	return INITIALS.map((initial, i) => {
		const day = new Date(monday);
		day.setDate(monday.getDate() + i);
		const date = iso(day);
		const xp = activity[date] ?? 0;
		return {
			date,
			initial,
			label: day.toLocaleDateString(undefined, { weekday: 'long' }),
			xp,
			studied: xp > 0,
			goalMet: xp >= goal,
			isToday: date === today,
			future: date > today
		};
	});
}

/** Days studied so far this week — the number under the dots. */
export function daysStudied(days: readonly DayCell[]): number {
	return days.filter((d) => d.studied).length;
}

/**
 * The line under the dots.
 *
 * Never scolds. A blank week reads as an invitation, and a week with one day
 * in it is a week that has started, not a week that is behind.
 */
export function weekSummary(days: readonly DayCell[]): string {
	const n = daysStudied(days);
	const todayDone = days.some((d) => d.isToday && d.studied);
	if (n === 0) return 'Nothing yet this week';
	if (todayDone && n === 1) return 'Studied today';
	if (todayDone) return `${n} days this week`;
	return `${n} ${n === 1 ? 'day' : 'days'} this week`;
}
