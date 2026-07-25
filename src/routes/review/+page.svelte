<script lang="ts">
	// Review: the one place to revisit what you already know.
	//
	// The four decks each still have their own runner at their own URL — this
	// hub does not replace them, it stops them being four separate destinations
	// a learner has to remember. See $lib/review for what the combined count
	// does and does not include.
	import { vocabSrs } from '$lib/vocab-srs.svelte';
	import { srs } from '$lib/srs.svelte';
	import { customCards } from '$lib/custom-cards.svelte';
	import { confusions } from '$lib/confusion.svelte';
	import { glyphById, totalGlyphs } from '$lib/data/script';
	import { activeDecks, combinedDue, deckSummaries, hasAnyDeck, type ReviewSnapshot } from '$lib/review';
	import Mascot from '$lib/components/Mascot.svelte';
	import HubHeader from '$lib/components/HubHeader.svelte';
	import { ArrowRight } from '@lucide/svelte';

	const worst = $derived(confusions.worst[0]);
	const snapshot = $derived<ReviewSnapshot>({
		vocab: {
			due: vocabSrs.dueCount,
			known: vocabSrs.introducedCount,
			mastered: vocabSrs.masteredCount
		},
		glyphs: { due: srs.dueCount, known: srs.introducedCount, total: totalGlyphs },
		cards: { due: customCards.dueCount, count: customCards.count },
		pairs: {
			total: confusions.total,
			worst: worst
				? {
						a: glyphById.get(worst.target)?.char ?? worst.target,
						b: glyphById.get(worst.picked)?.char ?? worst.picked
					}
				: undefined
		}
	});

	const due = $derived(combinedDue(snapshot));
	const decks = $derived(hasAnyDeck(snapshot) ? activeDecks(snapshot) : deckSummaries(snapshot));
	const started = $derived(hasAnyDeck(snapshot));

	/** Where the big button goes: the fullest scheduled deck. */
	const leadDeck = $derived(
		deckSummaries(snapshot)
			.filter((d) => d.scheduled && d.due > 0)
			.sort((a, b) => b.due - a.due)[0]
	);
</script>

<svelte:head><title>Review · Shwe</title></svelte:head>

<div class="review">
	<HubHeader title="Review" />

	{#if !started}
		<div class="empty-state">
			<Mascot mood="happy" size={72} />
			<h2>Nothing to review yet</h2>
			<p>
				Finish a lesson or learn some letters, and they'll start showing up here when it's time to
				see them again.
			</p>
			<a class="btn green" href="/learn">Go to the course</a>
		</div>
	{:else}
		<div class="lead">
			{#if leadDeck}
				<a class="btn green lead-btn" href={leadDeck.href}>
					Review {due}
					<ArrowRight size={20} strokeWidth={2.2} />
				</a>
				<p class="lead-sub">
					{#each decks.filter((d) => d.scheduled && d.due > 0) as d, i (d.id)}{i > 0
							? ' · '
							: ''}{d.due}
						{d.due === 1 ? d.noun.replace(/s$/, '') : d.noun}{/each}
				</p>
			{:else}
				<p class="all-clear"><strong>All caught up.</strong> Nothing is due right now.</p>
			{/if}
		</div>

		<h2 class="decks-title">Decks</h2>
		<ul class="decks">
			{#each decks as deck (deck.id)}
				<li>
					<a class="deck" href={deck.href}>
						<span class="deck-text">
							<span class="deck-title">{deck.title}</span>
							<span class="deck-sub">{deck.note ?? deck.stock}</span>
						</span>
						{#if deck.due > 0}
							<span class="deck-due">{deck.due} due</span>
						{:else if deck.scheduled}
							<span class="deck-clear">clear</span>
						{/if}
						<ArrowRight size={18} strokeWidth={2} />
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.review {
		max-width: 560px;
		margin: 0 auto;
		padding: 0 var(--s5) calc(96px + env(safe-area-inset-bottom));
	}
	.lead-btn {
		width: 100%;
		font-size: 1.1rem;
		font-weight: 800;
	}
	.lead-sub {
		margin: 8px 0 0;
		text-align: center;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.all-clear {
		margin: 0;
		padding: 18px;
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--line);
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--ink-soft);
		text-align: center;
	}
	.all-clear strong {
		color: var(--ink);
		font-weight: 900;
	}
	.decks-title {
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-soft);
		padding: 26px 0 10px;
	}
	.decks {
		display: flex;
		flex-direction: column;
		gap: 10px;
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.deck {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 16px;
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--line);
		color: var(--ink);
		text-decoration: none;
	}
	.deck-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}
	.deck-title {
		font-weight: 900;
	}
	.deck-sub {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.deck-due {
		flex-shrink: 0;
		padding: 3px 10px;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 800;
		color: #fff;
		background: var(--coral);
	}
	.deck-clear {
		flex-shrink: 0;
		font-size: 0.78rem;
		font-weight: 800;
		color: var(--ink-soft);
	}
	.deck :global(svg) {
		flex-shrink: 0;
		color: var(--ink-soft);
	}
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 10px;
		padding: 32px 8px;
	}
	.empty-state h2 {
		font-size: 1.2rem;
		font-weight: 900;
	}
	.empty-state p {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--ink-soft);
		text-wrap: pretty;
	}
</style>
