<script lang="ts">
	// Prominent correct-answer card shown after a wrong answer, with a replay
	// button. The parent auto-plays the audio once; this lets the learner
	// replay it while reading the reveal.
	import SpeakButton from './SpeakButton.svelte';

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
</script>

<div class="reveal-card" role="status">
	{#if speakText}<SpeakButton text={speakText} />{/if}
	<div class="reveal-text">
		<span class="my reveal-main">{my}</span>
		<span class="reveal-meta">
			{#if sub}<span class="reveal-sub">{sub}</span>{/if}
			{#if en}<span class="reveal-en">{en}</span>{/if}
		</span>
		{#if tip}<span class="reveal-tip">💡 {tip}</span>{/if}
	</div>
</div>

<style>
	.reveal-card {
		display: flex;
		/* Top-aligned so the speaker button sits beside the word it speaks,
		   not floating next to the meaning or the tip below it. */
		align-items: flex-start;
		gap: 12px;
		background: var(--card);
		border-radius: 14px;
		box-shadow: inset 0 0 0 2px var(--green);
		padding: 10px 14px;
		/* Fills its row — the parent decides the width. Shrink-wrapping here
		   used to squeeze the card into a narrow column on phones. */
		align-self: stretch;
	}
	.reveal-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}
	.reveal-main {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--ink);
		line-height: 1.5;
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
	.reveal-tip {
		margin-top: 4px;
		font-family: var(--font-ui);
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--teal-ink);
		line-height: 1.4;
		text-wrap: pretty;
	}
</style>
