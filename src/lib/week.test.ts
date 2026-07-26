import { describe, expect, it } from 'vitest';
import { daysStudied, mondayOf, weekDays, weekSummary } from './week';

/** Local noon, so a timezone offset can never tip these into another day. */
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12, 0, 0);

describe('mondayOf', () => {
	it('anchors mid-week to the Monday before', () => {
		// 2026-07-30 is a Thursday.
		expect(mondayOf(at(2026, 7, 30)).getDate()).toBe(27);
	});

	it('leaves Monday where it is', () => {
		expect(mondayOf(at(2026, 7, 27)).getDate()).toBe(27);
	});

	it('treats Sunday as the end of the week, not the start', () => {
		// 2026-08-02 is a Sunday; its week began Monday 2026-07-27.
		const monday = mondayOf(at(2026, 8, 2));
		expect([monday.getMonth() + 1, monday.getDate()]).toEqual([7, 27]);
	});

	it('crosses a month boundary', () => {
		// Wednesday 2026-07-01 belongs to the week starting Monday 2026-06-29.
		const monday = mondayOf(at(2026, 7, 1));
		expect([monday.getMonth() + 1, monday.getDate()]).toEqual([6, 29]);
	});

	it('returns local midnight, not a time-of-day copy', () => {
		const monday = mondayOf(at(2026, 7, 30));
		expect([monday.getHours(), monday.getMinutes()]).toEqual([0, 0]);
	});
});

describe('weekDays', () => {
	const now = at(2026, 7, 30); // Thursday

	it('returns Monday to Sunday', () => {
		const days = weekDays({}, 20, now);
		expect(days).toHaveLength(7);
		expect(days.map((d) => d.initial)).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
		expect(days[0].date).toBe('2026-07-27');
		expect(days[6].date).toBe('2026-08-02');
	});

	it('marks today and only today', () => {
		const days = weekDays({}, 20, now);
		expect(days.filter((d) => d.isToday).map((d) => d.date)).toEqual(['2026-07-30']);
	});

	// The distinction that keeps the strip from reading as four misses on a
	// Monday: days that haven't happened yet are not days you skipped.
	it('marks the rest of the week future, and today is not future', () => {
		const days = weekDays({}, 20, now);
		expect(days.filter((d) => d.future).map((d) => d.date)).toEqual([
			'2026-07-31',
			'2026-08-01',
			'2026-08-02'
		]);
		expect(days.find((d) => d.isToday)!.future).toBe(false);
	});

	it('reads activity onto the right days', () => {
		const days = weekDays({ '2026-07-27': 30, '2026-07-29': 5 }, 20, now);
		expect(days.map((d) => d.studied)).toEqual([true, false, true, false, false, false, false]);
		expect(days[0].xp).toBe(30);
	});

	it('counts any activity as studied but tracks the goal separately', () => {
		const days = weekDays({ '2026-07-27': 30, '2026-07-28': 5 }, 20, now);
		expect(days[0]).toMatchObject({ studied: true, goalMet: true });
		expect(days[1]).toMatchObject({ studied: true, goalMet: false });
	});

	it('never divides by a zero goal', () => {
		const days = weekDays({ '2026-07-27': 1 }, 0, now);
		expect(days[0].goalMet).toBe(true);
	});

	it('ignores activity from other weeks', () => {
		const days = weekDays({ '2026-07-20': 99, '2026-08-10': 99 }, 20, now);
		expect(daysStudied(days)).toBe(0);
	});

	// A day is not always 86,400,000ms. Stepping with setDate rather than
	// timestamp arithmetic is what keeps the strip correct across a shift.
	it('produces seven distinct consecutive dates across a DST change', () => {
		// Europe/Stockholm springs forward on 2026-03-29 (a Sunday).
		const days = weekDays({}, 20, at(2026, 3, 25));
		expect(new Set(days.map((d) => d.date)).size).toBe(7);
		expect(days[0].date).toBe('2026-03-23');
		expect(days[6].date).toBe('2026-03-29');
	});
});

describe('weekSummary', () => {
	const now = at(2026, 7, 30);
	const summary = (activity: Record<string, number>) =>
		weekSummary(weekDays(activity, 20, now));

	it('invites rather than scolds on an empty week', () => {
		expect(summary({})).toBe('Nothing yet this week');
	});

	it('leads with today when today is the only day', () => {
		expect(summary({ '2026-07-30': 10 })).toBe('Studied today');
	});

	it('counts the days otherwise', () => {
		expect(summary({ '2026-07-27': 10, '2026-07-29': 10 })).toBe('2 days this week');
		expect(summary({ '2026-07-27': 10 })).toBe('1 day this week');
	});

	it('has no scolding or streak language anywhere', () => {
		const all = [
			summary({}),
			summary({ '2026-07-30': 10 }),
			summary({ '2026-07-27': 10, '2026-07-30': 10 })
		].join(' ');
		expect(all).not.toMatch(/streak|lost|broke|missed|don't|failed/i);
	});
});
