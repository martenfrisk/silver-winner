<script lang="ts">
	// One self-graded card: Burmese on the front, English on the back, and the
	// learner reports how the recall went (see $lib/sm2 for what each grade
	// buys). The reverse of RecallCard, which asks for the Burmese and is
	// scheduled by the app; here the app asks nothing it can grade itself.
	import { fly } from 'svelte/transition';
	import { Layers } from '@lucide/svelte';
	import type { SelfReviewCard } from '$lib/self-review';
	import type { Grade } from '$lib/sm2';
	import SpeakButton from './SpeakButton.svelte';
	import { progress } from '$lib/progress.svelte';

	let {
		card,
		previews,
		revealed,
		onreveal,
		ongrade
	}: {
		card: SelfReviewCard;
		/** What each grade would schedule, e.g. { good: '6d' } — see previewGrades. */
		previews: Record<Grade, string>;
		/** Owned by the session, so the keyboard can flip the card too. */
		revealed: boolean;
		onreveal: () => void;
		ongrade: (grade: Grade) => void;
	} = $props();

	// Guards a double tap only; the session remounts this per card, which
	// resets it.
	let graded = $state(false);

	function grade(g: Grade) {
		if (!revealed || graded) return;
		graded = true;
		ongrade(g);
	}

	const buttons: { grade: Grade; label: string; cls: string }[] = [
		{ grade: 'again', label: 'Again', cls: 'red' },
		{ grade: 'good', label: 'Good', cls: '' },
		{ grade: 'easy', label: 'Easy', cls: 'green' }
	];
</script>

<div class="card">
	<p class="tag"><Layers size={14} strokeWidth={2.2} /> Self-graded</p>
	<h2 class="question">What does this mean?</h2>

	<div class="front">
		<SpeakButton text={card.my} />
		<div class="front-text">
			<span class="my prompt">{card.my}</span>
			{#if card.roman && progress.showRoman}<span class="roman">{card.roman}</span>{/if}
		</div>
	</div>

	{#if !revealed}
		<p class="coach">Recall the meaning, then check yourself.</p>
		<button class="btn reveal-btn" onclick={onreveal}>Show answer</button>
	{:else}
		<div class="answer" in:fly={{ y: 12, duration: 250 }}>
			<span class="meaning">{card.en}</span>
		</div>
		{#if !graded}
			<div class="grade" in:fly={{ y: 12, duration: 250, delay: 80 }}>
				<span class="grade-ask">How did that go?</span>
				<div class="grade-row">
					{#each buttons as b, i (b.grade)}
						<button class="btn {b.cls} grade-btn" onclick={() => grade(b.grade)}>
							<span class="grade-label">{b.label}</span>
							<!-- The interval is the point: it is the only way to see what
							     your own honesty costs, which is what keeps Easy from
							     becoming the default tap. -->
							<span class="grade-when">{previews[b.grade]}</span>
							<span class="grade-key">{i + 1}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 18px;
		text-align: center;
	}
	.tag {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin: 0;
		align-self: flex-start;
		font-size: 0.8rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--plum-ink);
	}
	.question {
		align-self: flex-start;
		font-size: 1.3rem;
		font-weight: 800;
		text-align: left;
	}
	.front {
		display: flex;
		align-items: center;
		gap: 14px;
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 22px 34px;
	}
	.front-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		text-align: left;
	}
	.prompt {
		font-size: 2rem;
	}
	.roman {
		font-family: var(--font-ui);
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--teal-ink);
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
		background: var(--teal-soft);
		border-radius: var(--radius);
		padding: 16px 28px;
	}
	.meaning {
		font-size: 1.5rem;
		font-weight: 900;
		color: var(--ink);
	}
	.grade {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		width: 100%;
	}
	.grade-ask {
		font-weight: 800;
		color: var(--ink-soft);
		font-size: 0.9rem;
	}
	.grade-row {
		display: flex;
		gap: 10px;
		width: 100%;
		max-width: 420px;
	}
	.grade-btn {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 12px 8px;
	}
	.grade-label {
		font-weight: 800;
	}
	/* The scheduled interval reads as a caption, not a second label. */
	.grade-when {
		font-size: 0.76rem;
		font-weight: 700;
		opacity: 0.75;
		font-variant-numeric: tabular-nums;
	}
	.grade-key {
		position: absolute;
		top: 4px;
		right: 6px;
		font-size: 0.62rem;
		font-weight: 800;
		opacity: 0.45;
	}
	@media (max-width: 400px) {
		.grade-key {
			display: none;
		}
	}
</style>
