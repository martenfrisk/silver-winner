// Achievement definitions. Conditions are computed live from the stores;
// earning is one-way — progress.award() persists the id so a badge never
// un-earns when the underlying stat drops (e.g. after a streak lapse).
import { lessonOrder } from '$lib/data/course';
import { scriptUnits } from '$lib/data/script';
import { progress } from '$lib/progress.svelte';
import { srs } from '$lib/srs.svelte';

export interface AchievementDef {
	id: string;
	emoji: string;
	name: string;
	desc: string;
	earned: () => boolean;
}

export const achievements: AchievementDef[] = [
	{
		id: 'first-lesson',
		emoji: '🌱',
		name: 'First steps',
		desc: 'Complete your first lesson',
		earned: () => progress.completedCount >= 1
	},
	{
		id: 'perfect-lesson',
		emoji: '🎯',
		name: 'Flawless',
		desc: 'Finish a lesson with 3 stars',
		earned: () => Object.entries(progress.stars).some(([id, s]) => s === 3 && lessonOrder.includes(id))
	},
	{
		id: 'five-lessons',
		emoji: '📚',
		name: 'Bookworm',
		desc: 'Complete 5 lessons',
		earned: () => progress.completedCount >= 5
	},
	{
		id: 'course-complete',
		emoji: '🏆',
		name: 'Graduate',
		desc: 'Complete every course lesson',
		earned: () => progress.completedCount >= lessonOrder.length
	},
	{
		id: 'glyphs-10',
		emoji: '🔤',
		name: 'Letter collector',
		desc: 'Learn 10 glyphs in the Script Studio',
		earned: () => srs.introducedCount >= 10
	},
	{
		id: 'unit-master',
		emoji: '✍️',
		name: 'Script scholar',
		desc: 'Finish a Script Studio unit',
		earned: () => scriptUnits.some((u) => srs.isUnitDone(u.id))
	},
	{
		id: 'glyphs-25',
		emoji: '📜',
		name: 'Alphabet adept',
		desc: 'Learn 25 glyphs',
		earned: () => srs.introducedCount >= 25
	},
	{
		id: 'streak-7',
		emoji: '🔥',
		name: 'One hot week',
		desc: 'Keep a 7-day streak',
		earned: () => progress.streak >= 7
	},
	{
		id: 'streak-30',
		emoji: '🌋',
		name: 'Unstoppable',
		desc: 'Keep a 30-day streak',
		earned: () => progress.streak >= 30
	},
	{
		id: 'xp-500',
		emoji: '⚡',
		name: 'Charged up',
		desc: 'Earn 500 XP',
		earned: () => progress.xp >= 500
	},
	{
		id: 'xp-2000',
		emoji: '🌟',
		name: 'Shwe status',
		desc: 'Earn 2000 XP',
		earned: () => progress.xp >= 2000
	},
	{
		id: 'goal-7',
		emoji: '🎖️',
		name: 'Habit formed',
		desc: 'Hit your daily goal on 7 days',
		earned: () => progress.goalDaysCount >= 7
	}
];

/** Definitions whose condition is met but aren't persisted as earned yet. */
export function newlyEarned(): AchievementDef[] {
	return achievements.filter((a) => !(a.id in progress.achievements) && a.earned());
}
