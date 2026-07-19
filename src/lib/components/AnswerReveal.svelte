<script lang="ts">
	// Prominent correct-answer card shown after a wrong answer, with a replay
	// button. The parent auto-plays the audio once; this lets the learner
	// replay it while reading the reveal.
	import SpeakButton from './SpeakButton.svelte';

	let {
		my,
		sub,
		en,
		speakText
	}: {
		/** The correct answer, front and center (usually Burmese). */
		my: string;
		/** Romanization, when the roman toggle is on. */
		sub?: string;
		/** English meaning, when it isn't already implied by the question. */
		en?: string;
		/** Burmese text to (re)play; omit to hide the speaker button. */
		speakText?: string;
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
	</div>
</div>

<style>
	.reveal-card {
		display: flex;
		align-items: center;
		gap: 12px;
		background: var(--card);
		border-radius: 14px;
		box-shadow: inset 0 0 0 2px var(--green);
		padding: 10px 14px;
		margin-top: 6px;
		align-self: flex-start;
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
</style>
