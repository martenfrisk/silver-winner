<script lang="ts">
	// Prominent correct-answer card shown after a wrong answer, with a replay
	// button. The parent auto-plays the audio once; this lets the learner
	// replay it while reading the reveal.
	import SpeakButton from './SpeakButton.svelte';
	import { morphology } from '$lib/data/morphology';
	import { Lightbulb } from '@lucide/svelte';

	let {
		my,
		sub,
		en,
		speakText,
		tip = null
	}: {
		/** The correct answer, front and center (usually Burmese). */
		my: string;
		/** Romanization, when the roman toggle is on. */
		sub?: string;
		/** English meaning, when it isn't already implied by the question. */
		en?: string;
		/** Burmese text to (re)play; omit to hide the speaker button. */
		speakText?: string;
		/** One-line grammar tip for the pattern the learner just missed. */
		tip?: string | null;
	} = $props();

	// A missed compound is the best moment to show it isn't one lump: the
	// learner already knows they didn't have it, and the pieces are usually
	// words they do have.
	const parts = $derived(morphology[my]?.filter((p) => p.my.trim()) ?? null);
</script>

<div class="reveal-card" role="status">
	{#if speakText}<SpeakButton text={speakText} />{/if}
	<div class="reveal-text">
		<span class="my reveal-main">{my}</span>
		<span class="reveal-meta">
			{#if sub}<span class="reveal-sub">{sub}</span>{/if}
			{#if en}<span class="reveal-en">{en}</span>{/if}
		</span>
		{#if parts}
			<span class="reveal-parts">
				{#each parts as p, i (i)}
					{#if i > 0}<span class="reveal-plus" aria-hidden="true">+</span>{/if}
					<span class="reveal-part"><span class="my">{p.my}</span> {p.gloss}</span>
				{/each}
			</span>
		{/if}
		{#if tip}<span class="reveal-tip"><Lightbulb size={15} strokeWidth={2} /> {tip}</span>{/if}
		<!-- Missing a word is the moment someone actually wants the dictionary,
		     and it used to be reachable only from a magnifier on /learn. -->
		<a class="reveal-look" href="/dictionary?q={encodeURIComponent(my)}">Look it up</a>
	</div>
</div>

<style>
	.reveal-card {
		display: flex;
		/* Top-aligned so the speaker button sits beside the word it speaks,
		   not floating next to the meaning or the tip below it. */
		align-items: flex-start;
		gap: 12px;
		background: var(--green-soft);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 1.5px var(--green);
		padding: 12px 14px;
		/* Fills its row — the parent decides the width. Shrink-wrapping here
		   used to squeeze the card into a narrow column on phones. */
		align-self: stretch;
		/* Hard ceiling: a long tip must never push the feedback panel over
		   the exercise. Past this the card scrolls instead of growing. */
		max-height: 26dvh;
		overflow-y: auto;
		overscroll-behavior: contain;
	}
	.reveal-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}
	.reveal-main {
		font-size: 1.3rem;
		font-weight: 800;
		color: var(--ink);
		/* Tighter than the global Burmese line-height (1.7), which wastes
		   vertical space in a compact card. */
		line-height: 1.35;
	}
	.reveal-meta {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		font-family: var(--font-ui);
		font-size: 0.88rem;
		font-weight: 700;
	}
	.reveal-sub {
		color: var(--teal-ink);
	}
	.reveal-en {
		color: var(--ink-soft);
	}
	.reveal-parts {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 3px 6px;
		margin-top: 5px;
		font-family: var(--font-ui);
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.reveal-part .my {
		font-size: 0.9rem;
		color: var(--ink);
	}
	.reveal-plus {
		font-weight: 900;
	}
	.reveal-look {
		align-self: flex-start;
		margin-top: 6px;
		font-family: var(--font-ui);
		font-size: 0.78rem;
		font-weight: 800;
		color: var(--teal-ink);
	}
	.reveal-tip {
		margin-top: 4px;
		display: inline-flex;
		align-items: baseline;
		gap: 5px;
		font-family: var(--font-ui);
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--teal-ink);
		line-height: 1.4;
		text-wrap: pretty;
	}
</style>
