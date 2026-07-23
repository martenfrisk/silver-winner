<script lang="ts">
	// "Read this aloud, then check yourself."
	//
	// The replacement for asking what sound a letter makes via romanized
	// options — see the 'recall' case in $lib/script-session for why. The
	// retrieval attempt happens in the learner's head; the audio is the answer
	// key; they grade themselves. Same shape as the vocabulary RecallCard.
	import { fly } from 'svelte/transition';
	import { speak } from '$lib/audio';
	import SpeakButton from './SpeakButton.svelte';

	let {
		my,
		hint,
		speakText,
		onanswer
	}: {
		/** The written form to read. */
		my: string;
		/** Romanization, revealed only after the attempt. */
		hint?: string;
		/** Burmese text to play as the answer. */
		speakText: string;
		onanswer: (ok: boolean) => void;
	} = $props();

	let revealed = $state(false);

	function reveal() {
		if (revealed) return;
		revealed = true;
		speak(speakText);
	}
</script>

<div class="recall">
	<h2 class="question">Say it out loud</h2>

	<div class="card">
		<span class="my big">{my}</span>
	</div>

	{#if !revealed}
		<p class="nudge">Sound it out, then check yourself.</p>
		<button class="btn wide" onclick={reveal}>Hear it</button>
	{:else}
		<div class="answer" in:fly={{ y: 10, duration: 220 }}>
			<div class="answer-row">
				<SpeakButton text={speakText} size="lg" />
				<!-- The romanization appears only now, as a check on an attempt
				     already made — never as something to answer from. -->
				{#if hint}<span class="hint">{hint}</span>{/if}
			</div>
			<p class="grade-q">Did you get it?</p>
			<div class="grades">
				<button class="btn red" onclick={() => onanswer(false)}>Not yet</button>
				<button class="btn green" onclick={() => onanswer(true)}>I got it</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.recall {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		text-align: center;
	}
	.question {
		font-size: 1.3rem;
		font-weight: 900;
	}
	.card {
		display: grid;
		place-items: center;
		min-width: 180px;
		padding: 22px 36px;
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--line);
	}
	.big {
		font-size: 4rem;
		line-height: 1.4;
	}
	.nudge {
		margin: 0;
		color: var(--ink-soft);
		font-weight: 700;
		font-size: 0.9rem;
	}
	.wide {
		min-width: 200px;
	}
	.answer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	.answer-row {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.hint {
		font-size: 1.3rem;
		font-weight: 900;
		color: var(--teal-ink);
	}
	.grade-q {
		margin: 0;
		font-weight: 800;
		color: var(--ink-soft);
		font-size: 0.9rem;
	}
	.grades {
		display: flex;
		gap: 12px;
	}
</style>
