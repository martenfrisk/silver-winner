<script lang="ts">
	// The dictionary entry for one word, over the top of whatever the learner is
	// doing. Opened by "Look it up" on a wrong-answer reveal.
	//
	// It used to be a link to /dictionary?q=<word>, which cost the learner their
	// place: the players rebuild their queue on mount, so returning via the
	// browser's Back button — the only way back, and not an obvious one — landed
	// them on a different question than the one they had just missed. A reveal is
	// mid-session by definition, so the answer had to come to the session.
	import { fade, fly } from 'svelte/transition';
	import { wordSheet } from '$lib/word-sheet.svelte';
	import { allVocab, vocabByMy, vocabSrs, VOCAB_MAX_BOX } from '$lib/vocab-srs.svelte';
	import { lookupWord } from '$lib/word-lookup';
	import { progress } from '$lib/progress.svelte';
	import SpeakButton from './SpeakButton.svelte';

	const entry = $derived(
		wordSheet.word === null ? null : lookupWord(wordSheet.word, allVocab, vocabByMy)
	);

	function onkeydown(e: KeyboardEvent) {
		if (wordSheet.open && e.key === 'Escape') {
			// Stopped here so the player underneath doesn't also treat Escape as
			// its own (it is the quit key in some sessions).
			e.stopPropagation();
			wordSheet.hide();
		}
	}
</script>

<svelte:window {onkeydown} />

{#if entry}
	<div
		class="backdrop"
		role="presentation"
		transition:fade={{ duration: 150 }}
		onclick={(e) => {
			if (e.target === e.currentTarget) wordSheet.hide();
		}}
	>
		<div
			class="sheet"
			role="dialog"
			aria-modal="true"
			aria-label="Dictionary entry for {entry.my}"
			transition:fly={{ y: 40, duration: 250 }}
		>
			<header>
				<SpeakButton text={entry.my} />
				<div class="head-text">
					<span class="my word">{entry.my}</span>
					<span class="gloss">
						{#if entry.known}
							{#if progress.showRoman}<span class="roman">{entry.roman}</span>{/if}
							<span class="en">{entry.en}</span>
						{:else}
							<!-- Phrases reach this sheet too, and they have no headword. -->
							<span class="en muted">Not a dictionary entry on its own</span>
						{/if}
					</span>
				</div>
				<!-- svelte-ignore a11y_autofocus -->
				<button class="close" onclick={() => wordSheet.hide()} aria-label="Close" autofocus>✕</button>
			</header>

			<div class="body">
				{#if entry.known}
					{@const box = vocabSrs.box(entry.my)}
					<p class="status">
						{#if box < 0}
							You haven't met this one yet.
						{:else if box >= VOCAB_MAX_BOX}
							Mastered.
						{:else}
							In review &middot; strength {box} of {VOCAB_MAX_BOX}
						{/if}
					</p>
				{/if}

				{#if entry.parts.length > 0}
					<section>
						<h3>Built from</h3>
						<div class="parts">
							{#each entry.parts as p, i (i)}
								{#if i > 0}<span class="plus" aria-hidden="true">+</span>{/if}
								<span class="part">
									<span class="my part-my">{p.my}</span>
									<span class="part-gloss">{p.gloss}</span>
								</span>
							{/each}
						</div>
					</section>
				{/if}

				{#if entry.related.length > 0}
					<section>
						<h3>Related words</h3>
						<ul class="related">
							{#each entry.related as r (r.my)}
								<li>
									<!-- Stays in the sheet: following a relative is browsing, and
									     browsing must not cost the session either. -->
									<button class="rel" onclick={() => wordSheet.show(r.my)}>
										<span class="my rel-my">{r.my}</span>
										<span class="rel-en">
											{r.en}{#if progress.showRoman}<span class="rel-roman"> &middot; {r.roman}</span>{/if}
										</span>
									</button>
								</li>
							{/each}
						</ul>
					</section>
				{/if}
			</div>

			<footer>
				<!-- The full dictionary is still one tap away, but it is now a
				     deliberate exit rather than the only way to read a definition. -->
				<a href="/dictionary?q={encodeURIComponent(entry.my)}" onclick={() => wordSheet.hide()}>
					Open in the dictionary
				</a>
				<button class="btn done" onclick={() => wordSheet.hide()}>Back to the question</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 60; /* above the script sheet, which can be open behind it */
		background: rgb(0 0 0 / 45%);
		display: grid;
		place-items: center;
		padding: 20px;
	}
	.sheet {
		width: min(460px, 100%);
		max-height: min(85dvh, 640px);
		display: flex;
		flex-direction: column;
		background: var(--bg);
		border-radius: 20px;
		box-shadow: 0 12px 40px rgb(0 0 0 / 30%);
		overflow: hidden;
	}

	header {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 18px 18px 14px;
		border-bottom: 1.5px solid var(--line);
	}
	.head-text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.word {
		font-size: 1.6rem;
		font-weight: 800;
		color: var(--ink);
		line-height: 1.3;
	}
	.gloss {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		font-family: var(--font-ui);
		font-size: 0.92rem;
		font-weight: 700;
	}
	.roman {
		color: var(--teal-ink);
	}
	.en {
		color: var(--ink);
	}
	.muted {
		color: var(--ink-soft);
		font-weight: 700;
	}
	.close {
		flex: 0 0 auto;
		width: 32px;
		height: 32px;
		border-radius: 10px;
		color: var(--ink-soft);
		font-size: 1rem;
	}
	.close:hover {
		background: var(--line);
	}

	.body {
		padding: 14px 18px;
		overflow-y: auto;
		overscroll-behavior: contain;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.status {
		margin: 0;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	h3 {
		margin: 0 0 7px;
		font-size: 0.68rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		font-weight: 800;
		color: var(--ink-soft);
	}

	.parts {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 4px 8px;
		font-family: var(--font-ui);
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.part-my {
		font-size: 1rem;
		color: var(--ink);
		margin-right: 4px;
	}
	.plus {
		font-weight: 900;
		color: var(--ink-soft);
	}

	.related {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.rel {
		width: 100%;
		display: flex;
		align-items: baseline;
		gap: 10px;
		text-align: left;
		padding: 8px 12px;
		border-radius: var(--radius-sm, 12px);
		background: var(--card);
		box-shadow: inset 0 0 0 1.5px var(--line);
	}
	.rel:hover {
		box-shadow: inset 0 0 0 1.5px var(--teal);
	}
	.rel-my {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--ink);
	}
	.rel-en {
		flex: 1;
		min-width: 0;
		font-family: var(--font-ui);
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.rel-roman {
		color: var(--teal-ink);
	}

	footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 18px calc(14px + env(safe-area-inset-bottom));
		border-top: 1.5px solid var(--line);
	}
	footer a {
		font-family: var(--font-ui);
		font-size: 0.82rem;
		font-weight: 800;
		color: var(--teal-ink);
	}
	.done {
		padding: 9px 16px;
		font-size: 0.85rem;
	}
</style>
