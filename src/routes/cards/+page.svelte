<script lang="ts">
	// Your own review cards: add a prompt + answer, then review them by
	// self-grading on the shared Leitner ladder. The hybrid-SRS prototype.
	import { customCards, type CustomCard } from '$lib/custom-cards.svelte';
	import { sfx } from '$lib/audio';
	import { ArrowLeft, Plus, Trash2, Check, RotateCcw } from '@lucide/svelte';

	let mode = $state<'manage' | 'review'>('manage');
	let front = $state('');
	let back = $state('');

	// Review state
	let queue = $state<CustomCard[]>([]);
	let idx = $state(0);
	let revealed = $state(false);
	let reviewed = $state(0);

	const current = $derived(queue[idx]);

	function addCard() {
		if (!front.trim() || !back.trim()) return;
		customCards.add(front, back);
		front = '';
		back = '';
		sfx.tap();
	}

	function startReview() {
		queue = customCards.dueCards();
		if (queue.length === 0) return;
		idx = 0;
		revealed = false;
		reviewed = 0;
		mode = 'review';
	}

	function grade(ok: boolean) {
		if (!current) return;
		customCards.grade(current.id, ok);
		ok ? sfx.correct() : sfx.wrong();
		reviewed++;
		idx++;
		revealed = false;
		if (idx >= queue.length) mode = 'manage';
	}
</script>

<svelte:head><title>My cards · Shwe</title></svelte:head>

<div class="cards">
	{#if mode === 'review' && current}
		<header class="head">
			<button class="back" onclick={() => (mode = 'manage')} aria-label="End review"><ArrowLeft size={22} strokeWidth={2} /></button>
			<h1>Review</h1>
			<span class="count">{idx + 1}/{queue.length}</span>
		</header>

		<div class="flip">
			<p class="face-label">Prompt</p>
			<p class="face front">{current.front}</p>
			{#if revealed}
				<div class="answer">
					<p class="face-label">Answer</p>
					<p class="face back">{current.back}</p>
				</div>
			{/if}
		</div>

		<footer class="review-actions">
			{#if !revealed}
				<button class="btn" onclick={() => (revealed = true)}>Show answer</button>
			{:else}
				<button class="btn ghost grade" onclick={() => grade(false)}><RotateCcw size={18} strokeWidth={2} /> Again</button>
				<button class="btn green grade" onclick={() => grade(true)}><Check size={18} strokeWidth={2} /> Got it</button>
			{/if}
		</footer>
	{:else}
		<header class="head">
			<a class="back" href="/" aria-label="Back to Today"><ArrowLeft size={22} strokeWidth={2} /></a>
			<h1>My cards</h1>
			<span class="count">{customCards.count}</span>
		</header>

		{#if customCards.dueCount > 0}
			<button class="review-cta" onclick={startReview}>
				<span>Review {customCards.dueCount} due</span>
				<span class="arrow">→</span>
			</button>
		{/if}

		<section class="add">
			<h2>Add a card</h2>
			<input class="field" bind:value={front} placeholder="Prompt — e.g. “water”" aria-label="Prompt" />
			<input class="field" bind:value={back} placeholder="Answer — e.g. ရေ (yei)" aria-label="Answer" />
			<button class="btn add-btn" onclick={addCard} disabled={!front.trim() || !back.trim()}>
				<Plus size={18} strokeWidth={2.4} /> Add card
			</button>
		</section>

		{#if customCards.count > 0}
			<section class="list">
				<h2>Your cards <span class="muted">· {customCards.count}</span></h2>
				{#each customCards.all() as c (c.id)}
					<div class="crow">
						<div class="ctext">
							<span class="cfront">{c.front}</span>
							<span class="cback">{c.back}</span>
						</div>
						<button class="del" onclick={() => customCards.remove(c.id)} aria-label="Delete card"><Trash2 size={17} strokeWidth={2} /></button>
					</div>
				{/each}
			</section>
		{:else}
			<p class="empty">No cards yet. Add anything you want to remember — a word, a phrase, a fact. They’ll come back for review on a spaced schedule.</p>
		{/if}
	{/if}
</div>

<style>
	.cards {
		max-width: 560px;
		margin: 0 auto;
		padding: var(--s4) var(--s5) calc(96px + env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		gap: var(--s4);
	}
	.head {
		display: flex;
		align-items: center;
		gap: var(--s3);
		padding: var(--s2) 0 0;
	}
	.back {
		width: 38px;
		height: 38px;
		display: grid;
		place-items: center;
		border-radius: var(--radius-sm);
		color: var(--ink-soft);
		background: var(--card);
		box-shadow: inset 0 0 0 1px var(--line);
		text-decoration: none;
	}
	.head h1 {
		flex: 1;
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 400;
		font-size: 1.7rem;
		color: var(--ink);
	}
	.count {
		font-size: 0.78rem;
		font-weight: 800;
		color: var(--ink-soft);
		font-variant-numeric: tabular-nums;
	}

	.review-cta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--teal-deep);
		color: var(--on-primary);
		border-radius: var(--radius-lg);
		padding: var(--s5);
		font-family: var(--font-display);
		font-style: italic;
		font-size: 1.35rem;
	}
	.review-cta .arrow {
		font-family: var(--font-ui);
		font-size: 1.4rem;
	}

	.add,
	.list {
		display: flex;
		flex-direction: column;
		gap: var(--s2);
	}
	h2 {
		font-size: 0.72rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		font-weight: 800;
		color: var(--ink-soft);
		margin-bottom: var(--s1);
	}
	.muted {
		color: var(--ink-soft);
		opacity: 0.7;
	}
	.field {
		border: none;
		background: var(--card);
		box-shadow: inset 0 0 0 1.5px var(--line);
		border-radius: var(--radius);
		padding: 14px 16px;
		font-family: var(--font-ui);
		font-size: 1rem;
		font-weight: 600;
		color: var(--ink);
	}
	.field:focus {
		outline: none;
		box-shadow: inset 0 0 0 2px var(--teal);
	}
	.field::placeholder {
		color: var(--ink-soft);
		font-weight: 500;
	}
	.add-btn {
		align-self: flex-start;
		margin-top: var(--s1);
	}

	.crow {
		display: flex;
		align-items: center;
		gap: var(--s3);
		padding: var(--s3) 2px;
		border-top: 1px solid var(--line);
	}
	.crow:first-of-type {
		border-top: none;
	}
	.ctext {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.cfront {
		font-weight: 700;
		color: var(--ink);
	}
	.cback {
		font-size: 0.9rem;
		color: var(--ink-soft);
	}
	.del {
		width: 34px;
		height: 34px;
		display: grid;
		place-items: center;
		border-radius: 10px;
		color: var(--ink-soft);
		flex: 0 0 auto;
	}
	.del:hover {
		color: var(--coral-ink);
		background: var(--coral-soft);
	}
	.empty {
		color: var(--ink-soft);
		font-weight: 600;
		line-height: 1.6;
	}

	/* Review */
	.flip {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: var(--s3);
		min-height: 46dvh;
	}
	.face-label {
		font-size: 0.68rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		font-weight: 800;
		color: var(--ink-soft);
		margin: 0;
	}
	.face {
		margin: 0;
		font-size: 1.9rem;
		font-weight: 700;
		color: var(--ink);
		max-width: 30ch;
	}
	.answer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--s3);
		margin-top: var(--s4);
		padding-top: var(--s4);
		border-top: 1px solid var(--line);
	}
	.face.back {
		color: var(--teal-ink);
	}
	.review-actions {
		display: flex;
		gap: var(--s3);
		padding-bottom: env(safe-area-inset-bottom);
	}
	.review-actions .btn {
		flex: 1;
	}
	.grade {
		gap: 8px;
	}
</style>
