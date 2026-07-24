<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { Exercise } from '$lib/data/course';
	import { sfx, speak } from '$lib/audio';
	import { progress } from '$lib/progress.svelte';
	import { srs } from '$lib/srs.svelte';
	import { ui } from '$lib/i18n.svelte';
	import { shuffle } from '$lib/shuffle';
	import { Headphones, Volume2 } from '@lucide/svelte';

	type ListenEx = Extract<Exercise, { kind: 'listen' }>;

	let {
		ex,
		selected = $bindable(null),
		status,
		onpick
	}: {
		ex: ListenEx;
		selected: number | null;
		status: 'answer' | 'correct' | 'wrong';
		/** Called right after a tap selects an option (one-tap checking). */
		onpick?: () => void;
	} = $props();

	// Options are shown in a shuffled order so the answer isn't always first.
	// The parent remounts this component per exercise, so reading `ex` once is intended.
	// svelte-ignore state_referenced_locally
	const order = shuffle(ex.options.map((_, i) => i));

	let playing = $state(false);

	// Comprehension variant: the options are English meanings, so this asks
	// what the word means rather than which shape it is.
	const meaningMode = $derived(ex.optionLang === 'en');

	// Absolute beginners can't read the script yet, so bare Burmese options
	// reduce this drill to shape-matching. Force romanization under the
	// options until they've picked up some letters, whatever the global
	// roman toggle says. Never needed in meaning mode — English options carry
	// no script to decode.
	const forceRoman = $derived(
		!meaningMode && progress.profile === 'beginner' && srs.introducedCount < 10
	);
	const showSub = $derived(progress.showRoman || forceRoman);

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
		// One tap answers: the parent checks immediately (and plays the
		// correct/wrong sound), so no tap blip of our own.
		onpick?.();
		if (!onpick) sfx.tap();
	}

	function cls(i: number): string {
		if (status === 'answer') return selected === i ? 'selected' : '';
		// After checking: always reveal the correct option; mark a wrong pick red.
		if (i === ex.correct) return 'correct';
		return selected === i ? 'wrong' : '';
	}

	let root = $state<HTMLElement>();

	// The feedback footer grows over the options on short screens, and the
	// correct answer is exactly what the learner needs to see. Bring it into
	// view once it's revealed.
	$effect(() => {
		if (status === 'answer') return;
		const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		root?.querySelector('.answer-card.correct')?.scrollIntoView({
			block: 'nearest',
			behavior: smooth ? 'smooth' : 'auto'
		});
	});
</script>

<div class="listen" bind:this={root}>
	<h2 class="question"><Headphones size={20} strokeWidth={2} /> {meaningMode ? ui('tap-hear-meaning').text : ui('tap-hear').text}</h2>
	<button class="replay" class:playing onclick={play} aria-label="Play the audio again" title="Play again">
		<Volume2 size={26} strokeWidth={2} />
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
				<span class="main" class:my={!meaningMode}>{opt.text}</span>
				{#if opt.sub && showSub}<span class="sub">{opt.sub}</span>{/if}
			</button>
		{/each}
	</div>
	{#if forceRoman}
		<p class="roman-note">Romanization shown until you’ve learned some letters. See the Script Studio.</p>
	{/if}
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
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 1.3rem;
		font-weight: 800;
	}
	.replay {
		align-self: center;
		width: 96px;
		height: 96px;
		display: grid;
		place-items: center;
		color: var(--on-primary);
		border-radius: 50%;
		background: var(--teal-deep);
		box-shadow: 0 12px 28px -10px rgba(15, 63, 58, 0.65);
		transition: translate 0.1s var(--pop), filter 0.15s ease;
	}
	.replay::after {
		content: '';
		position: absolute;
		inset: -8px;
		border-radius: 50%;
		border: 2px solid var(--gold);
		opacity: 0.35;
	}
	.replay { position: relative; }
	.replay:active {
		translate: 0 1px;
		filter: brightness(0.96);
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
	.main {
		font-size: 1.25rem;
	}
	.roman-note {
		margin: 0;
		text-align: center;
		font-size: 0.78rem;
		font-weight: 700;
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
