<script lang="ts">
	// The self-graded word review, rendered by /practice when the setting is on
	// (progress.selfReview). A separate component rather than another branch
	// inside the practice page: the two sessions share almost nothing — no
	// options to check, no combo, no auto-advance, no retention prediction —
	// and interleaving them in one file would mean every future change to
	// either had to be read against the other.
	import { goto } from '$app/navigation';
	import { fly, scale } from 'svelte/transition';
	import { buildSelfReviewQueue, starsFor, type SelfReviewCard } from '$lib/self-review';
	import { previewGrades, type Grade } from '$lib/sm2';
	import { vocabByMy, vocabSrs } from '$lib/vocab-srs.svelte';
	import { progress } from '$lib/progress.svelte';
	import { sessionXp } from '$lib/xp';
	import { ui } from '$lib/i18n.svelte';
	import { sfx, speak } from '$lib/audio';
	import { scriptSheet } from '$lib/script-sheet.svelte';
	import { isShortcutIgnored } from '$lib/keyboard';
	import Mascot from '$lib/components/Mascot.svelte';
	import Confetti from '$lib/components/Confetti.svelte';
	import HeaderMute from '$lib/components/HeaderMute.svelte';
	import SelfGradeCard from '$lib/components/SelfGradeCard.svelte';

	// Built once at mount. Lapses re-enter the queue, so it grows during a run.
	let queue = $state<SelfReviewCard[]>(
		buildSelfReviewQueue({ dueIds: vocabSrs.dueIds(), byMy: vocabByMy })
	);
	// What the scheduler actually asked for, so a card seen twice doesn't make
	// the session look longer than it was. Reading the initial length is the
	// point — lapses append to `queue` and must not change this.
	// svelte-ignore state_referenced_locally
	const dealt = queue.length;

	let idx = $state(0);
	let revealed = $state(false);
	let lapses = $state(0);
	/** Words already requeued once, so a lapse can't loop for the whole session. */
	const seenTwice = new Set<string>();
	let done = $state(false);
	let xpEarned = $state(0);
	let stars = $state(0);

	const card = $derived(queue[idx]);
	const pct = $derived(queue.length === 0 ? 0 : (idx / queue.length) * 100);

	// Recomputed per card: the intervals on the buttons are this card's, and
	// they move as its ease does.
	const previews = $derived(card ? previewGrades(vocabSrs.sm2(card.my)) : null);

	// {#key idx} rebuilds the stage per card, dropping focus to <body>.
	let stage = $state<HTMLElement>();
	$effect(() => {
		idx;
		stage?.focus({ preventScroll: true });
	});

	function reveal() {
		if (revealed || !card) return;
		revealed = true;
		// The answer side is where the pronunciation belongs: playing it on the
		// front would hand over a prompt the learner is meant to read.
		speak(card.my);
	}

	function grade(g: Grade) {
		if (!card || !revealed) return;
		vocabSrs.gradeSelf(card.my, g);
		if (g === 'again') {
			lapses++;
			sfx.wrong();
			// SM-2 puts a lapse ten minutes out, which is inside this session —
			// so honour that literally and show it again before the end. Once
			// only: a card you keep failing is a card for tomorrow, not one to
			// grind on now (the same argument as MAX_ATTEMPTS in $lib/stuck).
			if (!seenTwice.has(card.my)) {
				seenTwice.add(card.my);
				queue = [...queue, card];
			}
		} else {
			sfx.correct();
		}
		advance();
	}

	function advance() {
		idx++;
		revealed = false;
		if (idx >= queue.length) finish();
	}

	function finish() {
		stars = starsFor(dealt, lapses);
		xpEarned = sessionXp({ kind: 'review', stars });
		progress.addXp(xpEarned);
		done = true;
		sfx.fanfare();
	}

	function quit() {
		goto('/');
	}

	function onkeydown(e: KeyboardEvent) {
		if (isShortcutIgnored(e) || scriptSheet.open) return;
		if (done) {
			if (e.key === 'Enter') quit();
			return;
		}
		if (!card) return;
		if (!revealed) {
			// Space or Enter flips the card, as in every SRS the learner may
			// have come from.
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				reveal();
			}
			return;
		}
		const g = ({ '1': 'again', '2': 'good', '3': 'easy' } as const)[e.key];
		if (g) {
			e.preventDefault();
			grade(g);
		}
	}
</script>

<svelte:window {onkeydown} />

<svelte:head>
	<title>{ui('review').text} · Shwe</title>
</svelte:head>

{#if queue.length === 0}
	<div class="empty">
		<Mascot mood="happy" size={120} />
		<h1>Nothing due right now</h1>
		<!-- Deliberately not topped up with early cards: see the header note in
		     $lib/self-review on why an SRS that invents work isn't one. -->
		<p>
			{#if vocabSrs.introducedCount === 0}
				Complete a lesson first. Its words come back here when it's time to see them again.
			{:else}
				Your words are all scheduled for later. Come back when some fall due.
			{/if}
		</p>
		<a class="btn" href="/">Back home</a>
	</div>
{:else if done}
	<Confetti />
	<div class="complete" in:scale={{ duration: 450, start: 0.7 }}>
		<Mascot mood="celebrate" size={150} />
		<h1>{ui('practice-complete').text}</h1>
		<div class="stars" aria-label="{stars} of 3 stars">
			{#each [1, 2, 3] as s (s)}
				<span class="star {s <= stars ? 'lit' : ''}" style="animation-delay: {s * 0.18}s">★</span>
			{/each}
		</div>
		<div class="stats">
			<div class="stat">
				<span class="stat-label">{ui('xp-earned').text}</span>
				<span class="stat-value">⚡ {xpEarned}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Reviewed</span>
				<span class="stat-value">🗂️ {dealt}</span>
			</div>
			<div class="stat">
				<span class="stat-label">{ui('streak').text}</span>
				<span class="stat-value">🔥 {progress.streak}</span>
			</div>
		</div>
		<button class="btn green big" onclick={quit}>{ui('continue').text}</button>
	</div>
{:else}
	<div class="session">
		<header>
			<button class="quit" onclick={quit} aria-label="Quit review">✕</button>
			<div
				class="bar"
				role="progressbar"
				aria-valuenow={Math.round(pct)}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<div class="fill" style="width: {pct}%"></div>
			</div>
			<HeaderMute />
			<button
				class="tool my"
				onclick={() => scriptSheet.show()}
				title="Script table"
				aria-label="Open the script reference table"
			>
				က
			</button>
			<button
				class="tool"
				class:off={!progress.showRoman}
				onclick={() => progress.toggleRoman()}
				title={progress.showRoman ? 'Hide romanization' : 'Show romanization'}
				aria-pressed={progress.showRoman}
			>
				Aa
			</button>
		</header>

		<main>
			{#key idx}
				<!-- tabindex -1: a focus target for the new card, not a control. -->
				<div class="stage" tabindex="-1" bind:this={stage} in:fly={{ x: 60, duration: 300 }}>
					{#if card && previews}
						<SelfGradeCard {card} {previews} {revealed} onreveal={reveal} ongrade={grade} />
					{/if}
				</div>
			{/key}
		</main>

		<footer>
			<span class="hint">
				{#if revealed}Grade yourself honestly. The interval is what it buys.
				{:else}Space to show the answer.{/if}
			</span>
		</footer>
	</div>
{/if}

<style>
	.session {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		max-width: 680px;
		margin: 0 auto;
		padding: 0 20px;
	}
	header {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 18px 0;
	}
	.quit {
		font-size: 1.2rem;
		color: var(--ink-soft);
		width: 36px;
		height: 36px;
		border-radius: 10px;
		transition: background 0.15s ease;
	}
	.quit:hover {
		background: var(--line);
	}
	.tool {
		font-size: 0.95rem;
		font-weight: 900;
		color: var(--teal-ink);
		padding: 6px 10px;
		border-radius: 10px;
		box-shadow: inset 0 0 0 2px var(--line);
		background: var(--card);
	}
	.tool.off {
		color: var(--ink-soft);
	}
	.bar {
		flex: 1;
		height: 16px;
		border-radius: 99px;
		background: var(--line);
		overflow: hidden;
	}
	.fill {
		height: 100%;
		border-radius: 99px;
		background: var(--teal);
		transition: width 0.5s var(--pop);
	}
	main {
		flex: 1;
		min-height: 0;
		display: grid;
		padding: 12px 10px 24px;
		margin: 0 -10px;
		overflow-y: auto;
		overflow-x: hidden;
		overscroll-behavior: contain;
	}
	.stage {
		grid-area: 1 / 1;
	}
	footer {
		flex-shrink: 0;
		margin: 0 -20px;
		padding: 16px 20px calc(16px + env(safe-area-inset-bottom));
		border-top: 2px solid var(--line);
		background: var(--bg);
		text-align: center;
	}
	.hint {
		color: var(--ink-soft);
		font-size: 0.85rem;
		font-weight: 700;
	}

	.empty,
	.complete {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 18px;
		text-align: center;
		padding: 24px;
	}
	.empty h1,
	.complete h1 {
		font-size: 1.8rem;
		font-weight: 900;
		color: var(--teal-ink);
	}
	.empty p {
		max-width: 34ch;
		color: var(--ink-soft);
		font-weight: 700;
		text-wrap: pretty;
	}
	.empty .btn {
		text-decoration: none;
	}
	.stars {
		display: flex;
		gap: 10px;
		font-size: 3rem;
	}
	.star {
		color: var(--star-dim);
		scale: 0;
		animation: star-in 0.5s var(--spring) forwards;
	}
	.star.lit {
		color: var(--gold);
		text-shadow: 0 2px 0 var(--gold-dark);
	}
	@keyframes star-in {
		to {
			scale: 1;
		}
	}
	.stats {
		display: flex;
		gap: 14px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.stat {
		display: flex;
		flex-direction: column;
		gap: 4px;
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 12px 20px;
		min-width: 110px;
	}
	.stat-label {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--ink-soft);
	}
	.stat-value {
		font-size: 1.25rem;
		font-weight: 900;
	}
	.big {
		padding: 16px 48px;
		font-size: 1.1rem;
		margin-top: 8px;
	}
</style>
