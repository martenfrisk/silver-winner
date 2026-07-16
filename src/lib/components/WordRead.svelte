<script lang="ts">
	import type { DecodableWord } from '$lib/data/script';
	import SpeakButton from './SpeakButton.svelte';
	import { sfx, speak } from '$lib/audio';
	import { ui } from '$lib/i18n.svelte';

	let {
		word,
		options,
		correct,
		onanswer
	}: {
		word: DecodableWord;
		options: string[];
		correct: number;
		onanswer: (ok: boolean) => void;
	} = $props();

	let answered = $state<number | null>(null);

	function tap(i: number) {
		if (answered !== null) return;
		answered = i;
		const ok = i === correct;
		if (ok) {
			sfx.correct();
			// The reveal: hear the word you just read.
			setTimeout(() => speak(word.my), 250);
		} else sfx.wrong();
		onanswer(ok);
	}

	function cls(i: number): string {
		if (answered === null) return '';
		if (i === correct) return 'correct';
		return answered === i ? 'wrong' : '';
	}
</script>

<div class="word-read">
	<p class="tag">📖 Real reading</p>
	<h2 class="question">{ui('what-say').text}</h2>
	<div class="word-row">
		<span class="my word">{word.my}</span>
		{#if answered !== null}
			<SpeakButton text={word.my} />
		{/if}
	</div>
	<div class="options">
		{#each options as opt, i (i)}
			<button class="answer-card {cls(i)}" onclick={() => tap(i)} disabled={answered !== null}>
				<span class="label">{opt}</span>
			</button>
		{/each}
	</div>
	{#if answered !== null}
		<p class="meaning" class:won={answered === correct}>
			<strong>{word.my}</strong> ({word.roman}) = {word.en}
		</p>
	{/if}
</div>

<style>
	.word-read {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.tag {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--teal-ink);
	}
	.question {
		font-size: 1.3rem;
		font-weight: 900;
	}
	.word-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
	}
	.word {
		font-size: 3.6rem;
		line-height: 1.5;
	}
	.options {
		display: flex;
		gap: 12px;
	}
	.options .answer-card {
		flex: 1;
	}
	.label {
		font-size: 1.15rem;
		font-weight: 800;
	}
	.meaning {
		margin: 0;
		text-align: center;
		font-weight: 800;
		color: var(--ink-soft);
		background: var(--card);
		border-radius: 12px;
		padding: 10px 16px;
		box-shadow: inset 0 0 0 2px var(--line);
	}
	.meaning.won {
		color: var(--green-ink);
		box-shadow: inset 0 0 0 2px var(--green);
		animation: pulse-pop 0.4s ease-in-out;
	}
</style>
