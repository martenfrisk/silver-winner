<script lang="ts">
	import { onMount } from 'svelte';
	import type { Exercise } from '$lib/data/course';
	import SpeakButton from './SpeakButton.svelte';
	import { sfx, speak } from '$lib/audio';
	import { progress } from '$lib/progress.svelte';

	type ChoiceEx = Extract<Exercise, { kind: 'choice' }>;

	let {
		ex,
		selected = $bindable(null),
		status
	}: {
		ex: ChoiceEx;
		selected: number | null;
		status: 'answer' | 'correct' | 'wrong';
	} = $props();

	// Options are shown in a shuffled order so the answer isn't always first.
	// The parent remounts this component per exercise, so reading `ex` once is intended.
	// svelte-ignore state_referenced_locally
	const order = ex.options.map((_, i) => i).sort(() => Math.random() - 0.5);

	onMount(() => {
		if (!ex.promptMy) return;
		const t = setTimeout(() => speak(ex.promptMy!), 350);
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

<div class="choice">
	<h2 class="question">{ex.question}</h2>
	{#if ex.promptMy}
		<div class="prompt">
			<SpeakButton text={ex.promptMy} />
			<div>
				<div class="my prompt-word">{ex.promptMy}</div>
				{#if ex.promptRoman && progress.showRoman}<div class="prompt-roman">{ex.promptRoman}</div>{/if}
			</div>
		</div>
	{/if}
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
</div>

<style>
	.choice {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	.question {
		font-size: 1.3rem;
		font-weight: 900;
	}
	.prompt {
		display: flex;
		align-items: center;
		gap: 14px;
		align-self: flex-start;
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 14px 20px;
	}
	.prompt-word {
		font-size: 1.9rem;
	}
	.prompt-roman {
		color: var(--teal-ink);
		font-weight: 800;
		font-size: 0.95rem;
	}
	.options {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.main {
		font-size: 1.25rem;
	}
</style>
