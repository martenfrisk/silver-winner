<script lang="ts">
	import type { DecodableSentence } from '$lib/data/script';
	import SpeakButton from './SpeakButton.svelte';
	import { sfx, speak } from '$lib/audio';
	import { ui } from '$lib/i18n.svelte';

	let {
		sentence,
		options,
		correct,
		onanswer
	}: {
		sentence: DecodableSentence;
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
			// The reveal: hear the sentence you just read.
			setTimeout(() => speak(sentence.my), 250);
		} else sfx.wrong();
		onanswer(ok);
	}

	function cls(i: number): string {
		if (answered === null) return '';
		if (i === correct) return 'correct';
		return answered === i ? 'wrong' : '';
	}
</script>

<div class="sentence-read">
	<p class="tag">📜 Real reading</p>
	<h2 class="question">{ui('what-mean').text}</h2>
	<div class="sentence-row">
		<span class="my sentence">{sentence.my}</span>
		{#if answered !== null}
			<SpeakButton text={sentence.my} />
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
			<strong class="my">{sentence.my}</strong> ({sentence.roman}) = {sentence.en}
		</p>
	{/if}
</div>

<style>
	.sentence-read {
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
		color: var(--teal-dark);
	}
	.question {
		font-size: 1.3rem;
		font-weight: 900;
	}
	.sentence-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
		flex-wrap: wrap;
	}
	.sentence {
		font-size: 2.4rem;
		line-height: 1.7;
		text-align: center;
	}
	.options {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.label {
		font-size: 1.1rem;
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
		color: var(--green-dark);
		box-shadow: inset 0 0 0 2px var(--green);
		animation: pulse-pop 0.4s ease-in-out;
	}
</style>
