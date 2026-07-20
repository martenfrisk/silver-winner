<script lang="ts">
	// Free recall (top of the ladder): see the meaning, produce the Burmese in
	// your head, reveal, then grade yourself honestly. Self-graded recall is
	// still recall — the retrieval attempt is what strengthens the memory.
	import { fly } from 'svelte/transition';
	import type { RecallEx } from '$lib/practice-session';
	import SpeakButton from './SpeakButton.svelte';
	import { speak } from '$lib/audio';
	import { progress } from '$lib/progress.svelte';

	let {
		ex,
		onresult
	}: {
		ex: RecallEx;
		/** Called once with the learner's self-grade. */
		onresult: (ok: boolean) => void;
	} = $props();

	let revealed = $state(false);
	let graded = $state(false);

	function reveal() {
		if (revealed) return;
		revealed = true;
		speak(ex.my);
	}

	function grade(ok: boolean) {
		if (graded) return;
		graded = true;
		onresult(ok);
	}
</script>

<div class="recall">
	<p class="tag">🧠 From memory</p>
	<h2 class="question">How do you say this in Burmese?</h2>
	<div class="meaning-card">
		<span class="meaning">{ex.en}</span>
	</div>

	{#if !revealed}
		<p class="coach">Say it out loud (or in your head), then check yourself.</p>
		<button class="btn reveal-btn" onclick={reveal}>Reveal</button>
	{:else}
		<div class="answer" in:fly={{ y: 12, duration: 250 }}>
			<SpeakButton text={ex.my} />
			<div class="answer-text">
				<span class="my answer-my">{ex.my}</span>
				{#if progress.showRoman}<span class="answer-roman">{ex.roman}</span>{/if}
			</div>
		</div>
		{#if !graded}
			<div class="grade" in:fly={{ y: 12, duration: 250, delay: 80 }}>
				<span class="grade-ask">Did you get it?</span>
				<button class="btn red" onclick={() => grade(false)}>Not yet</button>
				<button class="btn green" onclick={() => grade(true)}>I knew it</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.recall {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 18px;
		text-align: center;
	}
	.tag {
		margin: 0;
		align-self: flex-start;
		font-size: 0.8rem;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--plum-ink);
	}
	.question {
		align-self: flex-start;
		font-size: 1.3rem;
		font-weight: 900;
		text-align: left;
	}
	.meaning-card {
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 22px 34px;
	}
	.meaning {
		font-size: 1.6rem;
		font-weight: 900;
	}
	.coach {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.reveal-btn {
		padding: 12px 36px;
	}
	.answer {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.answer-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		text-align: left;
	}
	.answer-my {
		font-size: 1.9rem;
	}
	.answer-roman {
		font-family: var(--font-ui);
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--teal-ink);
	}
	.grade {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.grade-ask {
		font-weight: 800;
		color: var(--ink-soft);
	}
</style>
