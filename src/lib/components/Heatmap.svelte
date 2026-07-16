<script lang="ts">
	import { progress } from '$lib/progress.svelte';

	const WEEKS = 12;

	function iso(d: Date): string {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	interface Cell {
		date: string;
		label: string;
		xp: number;
		level: number; // 0..4 → --heat-N
		future: boolean;
	}

	// Columns are weeks (Mon–Sun), newest column last, today in the last column.
	const grid = $derived.by(() => {
		const goal = Math.max(1, progress.dailyGoal);
		const today = new Date();
		// Monday of the current week.
		const monday = new Date(today);
		monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

		const weeks: Cell[][] = [];
		const months: { index: number; label: string }[] = [];
		let lastMonth = -1;
		for (let w = WEEKS - 1; w >= 0; w--) {
			const col: Cell[] = [];
			for (let d = 0; d < 7; d++) {
				const day = new Date(monday);
				day.setDate(monday.getDate() - w * 7 + d);
				const xp = progress.activity[iso(day)] ?? 0;
				const level =
					xp === 0 ? 0 : xp < goal / 2 ? 1 : xp < goal ? 2 : xp < goal * 2 ? 3 : 4;
				col.push({
					date: iso(day),
					label: `${day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${xp} XP`,
					xp,
					level,
					future: day > today
				});
			}
			// Month label above the column containing the 1st (or the first column).
			const m = new Date(monday);
			m.setDate(monday.getDate() - w * 7);
			if (m.getMonth() !== lastMonth) {
				lastMonth = m.getMonth();
				months.push({
					index: WEEKS - 1 - w,
					label: m.toLocaleDateString(undefined, { month: 'short' })
				});
			}
			weeks.push(col);
		}
		return { weeks, months };
	});
</script>

<div class="heatmap" role="img" aria-label="Daily activity for the last {WEEKS} weeks">
	<div class="months">
		{#each grid.months as m (m.index)}
			<span style="grid-column: {m.index + 1}">{m.label}</span>
		{/each}
	</div>
	<div class="cells">
		{#each grid.weeks as week, wi (wi)}
			<div class="week">
				{#each week as cell (cell.date)}
					{#if cell.future}
						<span class="cell future" aria-hidden="true"></span>
					{:else}
						<span class="cell" data-level={cell.level} title={cell.label} aria-label={cell.label}
						></span>
					{/if}
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.heatmap {
		display: flex;
		flex-direction: column;
		gap: 6px;
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 14px 16px;
		overflow-x: auto;
	}
	.months {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		gap: 4px;
		font-size: 0.68rem;
		font-weight: 800;
		color: var(--ink-soft);
		min-width: 264px;
	}
	.cells {
		display: flex;
		gap: 4px;
		min-width: 264px;
	}
	.week {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
	}
	.cell {
		aspect-ratio: 1;
		width: 100%;
		min-width: 14px;
		border-radius: 4px;
		background: var(--heat-0);
	}
	.cell[data-level='1'] {
		background: var(--heat-1);
	}
	.cell[data-level='2'] {
		background: var(--heat-2);
	}
	.cell[data-level='3'] {
		background: var(--heat-3);
	}
	.cell[data-level='4'] {
		background: var(--heat-4);
	}
	.cell.future {
		background: transparent;
		box-shadow: inset 0 0 0 1.5px var(--line);
		opacity: 0.5;
	}
</style>
