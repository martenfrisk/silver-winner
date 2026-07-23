<script lang="ts">
	import type { Exercise } from '$lib/data/course';
	import { sfx } from '$lib/audio';
	import { progress } from '$lib/progress.svelte';
	import { flip } from 'svelte/animate';
	import { scale } from 'svelte/transition';
	import { shuffle } from '$lib/shuffle';

	type AssembleEx = Extract<Exercise, { kind: 'assemble' }>;

	let {
		ex,
		sequence = $bindable([]),
		status
	}: {
		ex: AssembleEx;
		sequence: string[];
		status: 'answer' | 'correct' | 'wrong';
	} = $props();

	interface Tile {
		id: number;
		t: string;
		sub?: string;
	}

	// The parent remounts this component per exercise, so reading `ex` once is intended.
	// svelte-ignore state_referenced_locally
	const bank: Tile[] = shuffle([...ex.answer, ...ex.extras].map((x, id) => ({ id, ...x })));

	let placed = $state<Tile[]>([]);

	function sync() {
		sequence = placed.map((p) => p.t);
	}

	function add(tile: Tile) {
		if (status !== 'answer' || placed.some((p) => p.id === tile.id)) return;
		sfx.tap();
		placed = [...placed, tile];
		sync();
	}

	function remove(tile: Tile) {
		if (status !== 'answer') return;
		sfx.tap();
		placed = placed.filter((p) => p.id !== tile.id);
		sync();
	}
</script>

<div class="assemble">
	<h2 class="question">{ex.question}</h2>

	<div class="slots {status}" aria-label="Your answer">
		{#each placed as tile (tile.id)}
			<button
				class="tile placed-tile"
				onclick={() => remove(tile)}
				animate:flip={{ duration: 200 }}
				in:scale={{ duration: 200, start: 0.6 }}
			>
				<span class="my t">{tile.t}</span>
				{#if tile.sub && progress.showRoman}<span class="sub">{tile.sub}</span>{/if}
			</button>
		{/each}
		{#if placed.length === 0}
			<span class="hint">Tap the tiles below…</span>
		{/if}
	</div>

	<div class="bank">
		{#each bank as tile (tile.id)}
			{@const used = placed.some((p) => p.id === tile.id)}
			<button class="tile {used ? 'used' : ''}" onclick={() => add(tile)} disabled={used}>
				<span class="my t">{tile.t}</span>
				{#if tile.sub && progress.showRoman}<span class="sub">{tile.sub}</span>{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.assemble {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	.question {
		font-size: 1.3rem;
		font-weight: 900;
	}
	.slots {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		align-content: flex-start;
		gap: 10px;
		min-height: 92px;
		padding: 14px;
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--line);
		transition: box-shadow 0.25s ease;
	}
	.slots.correct {
		box-shadow: inset 0 0 0 2.5px var(--green);
		animation: pulse-pop 0.4s ease-in-out;
	}
	.slots.wrong {
		box-shadow: inset 0 0 0 2.5px var(--red);
		animation: shake 0.4s ease;
	}
	.hint {
		color: var(--ink-soft);
		font-weight: 700;
		align-self: center;
		padding: 12px 4px;
	}
	.bank {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	.tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 8px 16px;
		border-radius: 14px;
		background: var(--card);
		box-shadow: 0 3px 0 var(--line), inset 0 0 0 2px var(--line);
		transition: translate 0.08s ease, box-shadow 0.08s ease, opacity 0.15s ease;
	}
	.tile:active:not(:disabled) {
		translate: 0 3px;
		box-shadow: 0 0 0 var(--line), inset 0 0 0 2px var(--line);
	}
	.placed-tile {
		background: var(--gold-soft);
		box-shadow: 0 3px 0 var(--gold-dark), inset 0 0 0 2px var(--gold);
	}
	.tile.used {
		opacity: 0.25;
	}
	.t {
		font-size: 1.2rem;
	}
	.sub {
		font-size: 0.75rem;
		color: var(--ink-soft);
	}
</style>
