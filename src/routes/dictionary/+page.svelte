<script lang="ts">
	// A searchable list of every word the course teaches — for "I know I learned
	// the word for water, what was it again?" moments, offline, no Google. Built
	// straight from allVocab (the deduped course vocabulary); each row plays its
	// audio and shows whether you've met it yet.
	import { page } from '$app/state';
	import { allVocab } from '$lib/vocab-srs.svelte';
	import { vocabSrs } from '$lib/vocab-srs.svelte';
	import { progress } from '$lib/progress.svelte';
	import { morphology } from '$lib/data/morphology';
	import SpeakButton from '$lib/components/SpeakButton.svelte';
	import HubHeader from '$lib/components/HubHeader.svelte';
	import { Search, X } from '@lucide/svelte';

	// Prefilled when arriving from a wrong-answer reveal's "Look it up", so the
	// word you just missed is already the search.
	let query = $state(page.url.searchParams.get('q') ?? '');

	// Searching a part should surface the words built from it: type "ten" and
	// get ဆယ့်တစ် and နှစ်ဆယ်, which is where compounding stops being trivia
	// and starts being a way to find things.
	function partsMatch(my: string, q: string): boolean {
		const parts = morphology[my];
		if (!parts) return false;
		return parts.some((p) => p.gloss.toLowerCase().includes(q) || p.my.includes(q));
	}

	// Sorted A–Z by meaning so it reads like a dictionary; search matches the
	// meaning, the romanization, or the Burmese itself.
	const sorted = [...allVocab].sort((a, b) => a.en.localeCompare(b.en));

	const results = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return sorted;
		return sorted.filter(
			(v) =>
				v.en.toLowerCase().includes(q) ||
				v.roman.toLowerCase().includes(q) ||
				v.my.includes(query.trim()) ||
				partsMatch(v.my, q)
		);
	});
</script>

<svelte:head><title>Dictionary · Shwe</title></svelte:head>

<div class="dict">
	<HubHeader title="Dictionary" />

	<div class="searchbar">
		<Search size={18} strokeWidth={2} />
		<input
			type="search"
			bind:value={query}
			placeholder="Search meaning, sound or script…"
			aria-label="Search the dictionary"
			autocomplete="off"
			autocapitalize="off"
			spellcheck="false"
		/>
		{#if query}
			<button class="clear" onclick={() => (query = '')} aria-label="Clear search"><X size={16} strokeWidth={2.5} /></button>
		{/if}
	</div>
	<p class="scope">
		{#if query}
			{results.length} of {allVocab.length} words
		{:else}
			Every one of the {allVocab.length} words the course teaches
		{/if}
	</p>

	{#if results.length === 0}
		<p class="empty">No word matches “{query}”. Try its meaning, like “water”.</p>
	{:else}
		<ul class="list">
			{#each results as v (v.my)}
				{@const learned = vocabSrs.isIntroduced(v.my)}
				{@const parts = morphology[v.my]}
				<li class="row" class:new={!learned}>
					<span class="dot" class:on={learned} title={learned ? 'Learned' : 'Not learned yet'}></span>
					<div class="text">
						<span class="my word">{v.my}</span>
						<span class="meaning">{v.en}{#if progress.showRoman}<span class="roman"> · {v.roman}</span>{/if}</span>
						{#if parts}
							<!-- The word taken apart: each piece is one you can learn once
							     and then recognise everywhere else it turns up. -->
							<span class="parts">
								{#each parts.filter((p) => p.my.trim()) as p, i (i)}
									{#if i > 0}<span class="plus" aria-hidden="true">+</span>{/if}
									<span class="part">
										<span class="my part-my">{p.my}</span>
										<span class="part-gloss">{p.gloss}</span>
									</span>
								{/each}
							</span>
						{/if}
					</div>
					<SpeakButton text={v.my} />
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.dict {
		max-width: 620px;
		margin: 0 auto;
		padding: var(--s4) var(--s5) calc(96px + env(safe-area-inset-bottom));
	}

	.searchbar {
		display: flex;
		align-items: center;
		gap: var(--s2);
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 1.5px var(--line);
		padding: 0 var(--s4);
		color: var(--ink-soft);
		position: sticky;
		top: var(--s2);
		z-index: 2;
	}
	.searchbar:focus-within {
		box-shadow: inset 0 0 0 2px var(--teal);
	}
	.searchbar input {
		flex: 1;
		border: none;
		background: none;
		padding: 14px 0;
		font-family: var(--font-ui);
		font-size: 1rem;
		font-weight: 600;
		color: var(--ink);
	}
	.searchbar input:focus {
		outline: none;
	}
	.searchbar input::placeholder {
		color: var(--ink-soft);
		font-weight: 500;
	}
	.clear {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 999px;
		color: var(--ink-soft);
		background: var(--sink);
	}

	.empty {
		margin-top: var(--s6);
		text-align: center;
		color: var(--ink-soft);
		font-weight: 600;
	}

	.list {
		list-style: none;
		margin: var(--s4) 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--s3);
		padding: var(--s3) 2px;
		border-top: 1px solid var(--line);
	}
	.row:first-child {
		border-top: none;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex: 0 0 auto;
		background: var(--line);
	}
	.dot.on {
		background: linear-gradient(var(--gold), var(--gold-bright, #f6c445));
	}
	.text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.word {
		font-size: 1.4rem;
		line-height: 1.35;
		color: var(--ink);
	}
	.meaning {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--ink-soft);
	}
	.roman {
		color: var(--teal-ink);
	}
	/* The breakdown sits under the meaning, quieter than it: useful when you
	   look for it, never competing with the word itself. */
	.parts {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 4px 6px;
		margin-top: 6px;
	}
	.part {
		display: inline-flex;
		align-items: baseline;
		gap: 4px;
		padding: 2px 7px;
		border-radius: 8px;
		background: var(--card-sunken, var(--line));
	}
	.part-my {
		font-size: 0.9rem;
		font-weight: 700;
	}
	.part-gloss {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.plus {
		font-size: 0.72rem;
		font-weight: 900;
		color: var(--ink-soft);
	}
	.row.new .word {
		color: var(--ink);
	}
</style>
