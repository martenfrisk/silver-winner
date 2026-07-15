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

	onMount(() => {
		// Say the new word as the card appears (after the fly-in settles).
		const t = setTimeout(() => speak(my), 350);
		return () => clearTimeout(t);
	});
</script>

<div class="learn">
	<p class="new-word-tag">✨ New word</p>
	{#if emoji}<div class="emoji">{emoji}</div>{/if}
	<div class="word-row">
		<span class="my word">{my}</span>
		<SpeakButton text={my} size="lg" />
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
		color: var(--gold-dark);
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
		color: var(--teal-dark);
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
