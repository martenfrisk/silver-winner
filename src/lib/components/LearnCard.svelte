<script lang="ts">
	import { onMount } from 'svelte';
	import SpeakButton from './SpeakButton.svelte';
	import { speak } from '$lib/audio';
	import { progress } from '$lib/progress.svelte';

	let {
		my,
		roman,
		en,
		emoji,
		note
	}: { my: string; roman: string; en: string; emoji?: string; note?: string } = $props();

	// Every card gets a colour, so none of them needs an emoji to look like
	// something. Not every word has an honest pictogram — a letter certainly
	// doesn't — and reaching for one anyway (🎸 for "ga") teaches nothing and
	// reads as filler. The halo gives the same lift without pretending to mean
	// anything, and it lets the script itself be the thing you look at.
	const ACCENTS = ['gold', 'teal', 'plum', 'coral'];

	// Same word, same colour, every time — so a word you've met before looks
	// familiar rather than randomly repainted.
	const accent = $derived.by(() => {
		let h = 0;
		for (const ch of my) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
		return ACCENTS[h % ACCENTS.length];
	});

	onMount(() => {
		// Say the new word as the card appears (after the fly-in settles).
		const t = setTimeout(() => speak(my), 350);
		return () => clearTimeout(t);
	});
</script>

<div class="learn" style="--accent-soft: var(--{accent}-soft)">
	<p class="new-word-tag">✨ New word</p>
	<div class="stage">
		<!-- Decorative: the card's visual interest lives here, not in an emoji. -->
		<span class="halo" aria-hidden="true"></span>
		{#if emoji}<div class="emoji">{emoji}</div>{/if}
		<div class="word-row">
			<span class="my word">{my}</span>
			<SpeakButton text={my} size="lg" />
		</div>
	</div>
	{#if progress.showRoman}
		<p class="roman">{roman}</p>
	{/if}
	<p class="en">{en}</p>
	{#if note}
		<p class="note">💡 {note}</p>
	{/if}
</div>

<style>
	.learn {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 10px;
		padding: 12px 0;
	}
	.new-word-tag {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--gold-ink);
	}
	.stage {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 18px 28px;
		isolation: isolate;
	}
	/* A soft disc of the card's accent colour, sitting behind the word. */
	.halo {
		position: absolute;
		z-index: -1;
		inset: 0;
		border-radius: 50%;
		background: radial-gradient(
			circle at 50% 45%,
			var(--accent-soft) 0%,
			color-mix(in srgb, var(--accent-soft) 45%, transparent) 55%,
			transparent 72%
		);
		animation: breathe 6s ease-in-out infinite;
	}
	@media (prefers-reduced-motion: reduce) {
		.halo {
			animation: none;
		}
	}
	@keyframes breathe {
		0%,
		100% {
			scale: 1;
			opacity: 0.9;
		}
		50% {
			scale: 1.06;
			opacity: 1;
		}
	}
	.emoji {
		font-size: 3.4rem;
		animation: float 3s ease-in-out infinite;
	}
	.word-row {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.word {
		font-size: 2.6rem;
		color: var(--ink);
	}
	.roman {
		margin: 0;
		font-size: 1.15rem;
		color: var(--teal-ink);
		font-weight: 800;
	}
	.en {
		margin: 0;
		font-size: 1.35rem;
		font-weight: 900;
	}
	.note {
		margin: 8px 0 0;
		max-width: 420px;
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--ink-soft);
		background: var(--gold-soft);
		border-radius: 12px;
		padding: 10px 16px;
	}
</style>
