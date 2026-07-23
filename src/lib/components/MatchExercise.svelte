<script lang="ts">
	import type { Exercise } from '$lib/data/course';
	import { sfx, speak } from '$lib/audio';
	import { progress } from '$lib/progress.svelte';
	import { ui } from '$lib/i18n.svelte';
	import { shuffle } from '$lib/shuffle';

	type MatchEx = Extract<Exercise, { kind: 'match' }>;

	let {
		ex,
		oncomplete,
		onmiss
	}: {
		ex: MatchEx;
		oncomplete: () => void;
		onmiss: () => void;
	} = $props();

	// The parent remounts this component per exercise, so reading `ex` once is intended.
	// svelte-ignore state_referenced_locally
	const leftOrder = shuffle(ex.pairs.map((_, i) => i));
	// svelte-ignore state_referenced_locally
	const rightOrder = shuffle(ex.pairs.map((_, i) => i));

	let selLeft = $state<number | null>(null);
	let selRight = $state<number | null>(null);
	let matched = $state<Set<number>>(new Set());
	let missLeft = $state<number | null>(null);
	let missRight = $state<number | null>(null);

	function pick(side: 'l' | 'r', i: number) {
		if (matched.has(i)) return;
		sfx.tap();
		if (side === 'l') {
			speak(ex.pairs[i].l);
			selLeft = selLeft === i ? null : i;
		} else {
			selRight = selRight === i ? null : i;
		}
		if (selLeft !== null && selRight !== null) {
			if (selLeft === selRight) {
				matched = new Set([...matched, selLeft]);
				sfx.match();
				selLeft = selRight = null;
				if (matched.size === ex.pairs.length) {
					setTimeout(oncomplete, 350);
				}
			} else {
				missLeft = selLeft;
				missRight = selRight;
				sfx.wrong();
				onmiss();
				selLeft = selRight = null;
				setTimeout(() => {
					missLeft = missRight = null;
				}, 450);
			}
		}
	}
</script>

<div class="match">
	<h2 class="question">{ui('match-pairs').text}</h2>
	<div class="cols">
		<div class="col">
			{#each leftOrder as i (i)}
				<button
					class="answer-card {selLeft === i ? 'selected' : ''} {matched.has(i) ? 'done' : ''} {missLeft === i ? 'wrong' : ''}"
					onclick={() => pick('l', i)}
					disabled={matched.has(i)}
				>
					<span class="my main">{ex.pairs[i].l}</span>
					{#if ex.pairs[i].lSub && progress.showRoman}<span class="sub">{ex.pairs[i].lSub}</span>{/if}
				</button>
			{/each}
		</div>
		<div class="col">
			{#each rightOrder as i (i)}
				<button
					class="answer-card {selRight === i ? 'selected' : ''} {matched.has(i) ? 'done' : ''} {missRight === i ? 'wrong' : ''}"
					onclick={() => pick('r', i)}
					disabled={matched.has(i)}
				>
					<span class="main">{ex.pairs[i].r}</span>
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.match {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	.question {
		font-size: 1.3rem;
		font-weight: 900;
	}
	.cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	.col {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.main {
		font-size: 1.05rem;
	}
	.answer-card.done {
		opacity: 0.35;
		background: var(--green-soft);
		box-shadow: 0 3px 0 var(--line), inset 0 0 0 2px var(--green);
		animation: pulse-pop 0.4s ease-in-out;
	}
</style>
