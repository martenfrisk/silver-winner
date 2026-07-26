<script lang="ts">
	// Seven dots for the week, in place of the streak flame. See $lib/week for
	// why: a streak works by making you afraid to lose it, and it tells a
	// learner who studies six days a week that they have nothing.
	import { progress } from '$lib/progress.svelte';
	import { daysStudied, weekDays, weekSummary } from '$lib/week';

	let { compact = false }: { compact?: boolean } = $props();

	const days = $derived(weekDays(progress.activity, progress.dailyGoal));
	const summary = $derived(weekSummary(days));
	const n = $derived(daysStudied(days));
</script>

<div class="week" class:compact>
	<div
		class="dots"
		role="img"
		aria-label="{n} of the last 7 days studied. {summary}."
	>
		{#each days as d (d.date)}
			<span
				class="day"
				class:studied={d.studied}
				class:goal={d.goalMet}
				class:today={d.isToday}
				class:future={d.future}
				title="{d.label}{d.xp > 0 ? `: ${d.xp} XP` : ''}"
			>
				<span class="dot" aria-hidden="true"></span>
				<span class="initial" aria-hidden="true">{d.initial}</span>
			</span>
		{/each}
	</div>
	{#if !compact}<p class="summary">{summary}</p>{/if}
</div>

<style>
	.week {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.dots {
		display: flex;
		gap: 7px;
	}
	/* In a completion screen's stat column, where the label above is centred. */
	.compact .dots {
		justify-content: center;
		gap: 6px;
	}
	.day {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
	}
	.dot {
		width: 13px;
		height: 13px;
		border-radius: 50%;
		background: var(--line);
		transition: background 0.2s ease;
	}
	/* Any activity fills the dot; hitting the daily goal makes it gold. The
	   rhythm is the point, so one exercise still counts for something. */
	.day.studied .dot {
		background: var(--teal);
	}
	.day.goal .dot {
		background: var(--gold);
	}
	/* Days that haven't happened yet are outlined, never drawn as a miss —
	   otherwise Monday shows six failures. */
	.day.future .dot {
		background: transparent;
		box-shadow: inset 0 0 0 1.5px var(--line);
	}
	.day.today .dot {
		box-shadow: 0 0 0 2px var(--bg), 0 0 0 3.5px var(--teal-ink);
	}
	.initial {
		font-size: 0.6rem;
		font-weight: 800;
		color: var(--ink-soft);
		line-height: 1;
	}
	.day.today .initial {
		color: var(--teal-ink);
	}
	.compact .initial {
		display: none;
	}
	.summary {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
</style>
