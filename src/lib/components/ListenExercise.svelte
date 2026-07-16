<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { Exercise } from '$lib/data/course';
	import { sfx, speak } from '$lib/audio';
	import { progress } from '$lib/progress.svelte';
	import { ui } from '$lib/i18n.svelte';

	type ListenEx = Extract<Exercise, { kind: 'listen' }>;

	let {
		ex,
		selected = $bindable(null),
		status
	}: {
		ex: ListenEx;
		selected: number | null;
		status: 'answer' | 'correct' | 'wrong';
	} = $props();

	// Options are shown in a shuffled order so the answer isn't always first.
	// The parent remounts this component per exercise, so reading `ex` once is intended.
	// svelte-ignore state_referenced_locally
	const order = ex.options.map((_, i) => i).sort(() => Math.random() - 0.5);

	let playing = $state(false);

	function play() {
		if (!speak(ex.my)) return;
		playing = true;
		setTimeout(() => (playing = false), 900);
	}

	onMount(() => {
		const t = setTimeout(play, 350);
		return () => clearTimeout(t);
	});

	function pick(i: number) {
		if (status !== 'answer') return;
		selected = i;
		sfx.tap();
	}

	function cls(i: number): string {
		if (status === 'answer') return selected === i ? 'selected' : '';
		// After checking: always reveal the correct option; mark a wrong pick red.
		if (i === ex.correct) return 'correct';
		return selected === i ? 'wrong' : '';
	}
</script>

<div class="listen">
	<h2 class="question">🎧 {ui('tap-hear').text}</h2>
	<button class="replay" class:playing onclick={play} aria-label="Play the audio again" title="Play again">
		🔊
	</button>
	<div class="options" role="radiogroup" aria-label="Answer options">
		{#each order as i, n (i)}
			{@const opt = ex.options[i]}
			<button
				class="answer-card {cls(i)}"
				role="radio"
				aria-checked={selected === i}
				onclick={() => pick(i)}
				disabled={status !== 'answer'}
			>
				<span class="key">{n + 1}</span>
				<span class="my main">{opt.text}</span>
				{#if opt.sub && progress.showRoman}<span class="sub">{opt.sub}</span>{/if}
			</button>
		{/each}
	</div>
	{#if status !== 'answer'}
		<p class="reveal" in:fly={{ y: 10, duration: 250 }}>
			<span class="my">{ex.my}</span>
			{#if progress.showRoman}<span class="roman">({ex.roman})</span>{/if}
			<span class="meaning">= {ex.en}</span>
		</p>
	{/if}
</div>

<style>
	.listen {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	.question {
		font-size: 1.3rem;
		font-weight: 900;
	}
	.replay {
		align-self: center;
		width: 96px;
		height: 96px;
		display: grid;
		place-items: center;
		font-size: 2.6rem;
		border-radius: 28px;
		background: var(--teal);
		box-shadow: 0 5px 0 var(--teal-dark);
		transition: translate 0.08s ease, box-shadow 0.08s ease;
	}
	.replay:active {
		translate: 0 5px;
		box-shadow: 0 0 0 var(--teal-dark);
	}
	.replay.playing {
		animation: wiggle 0.45s ease infinite;
	}
	@keyframes wiggle {
		0%,
		100% {
			rotate: 0deg;
		}
		25% {
			rotate: -6deg;
		}
		75% {
			rotate: 6deg;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.replay.playing {
			animation: none;
		}
	}
	.options {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.answer-card {
		position: relative;
	}
	.main {
		font-size: 1.25rem;
	}
	.key {
		position: absolute;
		left: 12px;
		top: 50%;
		translate: 0 -50%;
		width: 24px;
		height: 24px;
		display: grid;
		place-items: center;
		border-radius: 8px;
		box-shadow: inset 0 0 0 2px var(--line);
		font-size: 0.75rem;
		color: var(--ink-soft);
	}
	.reveal {
		margin: 0;
		align-self: center;
		text-align: center;
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 12px 20px;
		font-size: 1.1rem;
		font-weight: 800;
	}
	.reveal .roman {
		color: var(--teal-dark);
		font-family: var(--font-ui);
		font-size: 0.95rem;
	}
	.reveal .meaning {
		color: var(--ink-soft);
		font-family: var(--font-ui);
	}
</style>
