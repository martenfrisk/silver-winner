<script lang="ts">
	// The Confusion Lab: drills the contrasts this learner actually mixes up,
	// and shows them the map of it. See $lib/confusion for why sorting beats
	// a two-option "which did you hear?" and why the wrong answer is worth
	// recording in the first place.
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { srs } from '$lib/srs.svelte';
	import { progress } from '$lib/progress.svelte';
	import { confusions } from '$lib/confusion.svelte';
	import { scoreSort } from '$lib/confusion';
	import { buildLabSession, availablePairs, type LabTrial } from '$lib/confusion-session';
	import { AUDIO_VOWELS, glyphById } from '$lib/data/script';
	import { VOICE_IDS } from '$lib/voices';
	import { sfx, speak } from '$lib/audio';
	import Mascot from '$lib/components/Mascot.svelte';
	import NoAudioPrompt from '$lib/components/NoAudioPrompt.svelte';
	import HeaderMute from '$lib/components/HeaderMute.svelte';
	import { ArrowLeft, Volume2, RotateCcw } from '@lucide/svelte';

	const learnedVowels = AUDIO_VOWELS.filter((v) => srs.isIntroduced(v));
	const pairs = availablePairs((id) => srs.isIntroduced(id));

	let trials = $state<LabTrial[]>(
		buildLabSession(confusions.matrix, (id) => srs.isIntroduced(id), learnedVowels)
	);
	let idx = $state(0);
	let placed = $state<Record<string, string>>({});
	let selected = $state<string | null>(null);
	let checked = $state(false);
	let done = $state(false);
	let totalRight = $state(0);
	let totalChips = $state(0);

	const trial = $derived(trials[idx]);
	const pool = $derived(trial ? trial.chips.filter((c) => !placed[c.text]) : []);
	const allPlaced = $derived(pool.length === 0 && !!trial);
	const result = $derived(
		trial && checked ? scoreSort(trial, new Map(Object.entries(placed))) : null
	);

	/**
	 * Each chip gets its own talker, drawn once when it's played. Varying the
	 * voice is the point here more than anywhere else in the app (see
	 * $lib/voices) — but a chip must keep its voice across replays, or the
	 * learner is comparing two different recordings rather than reconsidering
	 * one.
	 */
	const chipVoice = new Map<string, (typeof VOICE_IDS)[number]>();
	function playChip(text: string) {
		let v = chipVoice.get(text);
		if (!v) {
			v = VOICE_IDS[Math.floor(Math.random() * VOICE_IDS.length)];
			chipVoice.set(text, v);
		}
		speak(text, v);
	}

	function tapChip(text: string) {
		if (checked) {
			playChip(text);
			return;
		}
		selected = selected === text ? null : text;
		playChip(text);
	}

	function tapBin(binId: string) {
		if (checked || !selected) return;
		placed = { ...placed, [selected]: binId };
		selected = null;
		sfx.tap();
	}

	/** Pull a placed chip back out to reconsider it. */
	function unplace(text: string) {
		if (checked) {
			playChip(text);
			return;
		}
		const { [text]: _, ...rest } = placed;
		placed = rest;
		selected = text;
		playChip(text);
	}

	function check() {
		if (!trial || !allPlaced || checked) return;
		checked = true;
		const s = scoreSort(trial, new Map(Object.entries(placed)));
		totalRight += s.correct;
		totalChips += s.total;
		if (s.wrong.length === 0) sfx.correct();
		else sfx.wrong();

		for (const chip of trial.chips) {
			const landed = placed[chip.text];
			const ok = landed === chip.binId;
			// Grade the glyph the chip actually belongs to, and record the
			// mis-sort as a confusion in the direction it happened.
			srs.grade(chip.binId, ok);
			if (!ok && landed) confusions.note(chip.binId, landed);
		}
	}

	function next() {
		if (idx + 1 >= trials.length) {
			done = true;
			// A lab session is short and diagnostic, so the XP is a nod, not a wage.
			progress.addXp(10);
			return;
		}
		idx++;
		placed = {};
		selected = null;
		checked = false;
	}

	function restart() {
		trials = buildLabSession(confusions.matrix, (id) => srs.isIntroduced(id), learnedVowels);
		idx = 0;
		placed = {};
		selected = null;
		checked = false;
		done = false;
		totalRight = 0;
		totalChips = 0;
	}

	function labelFor(id: string): string {
		return glyphById.get(id)?.sound ?? id;
	}
	function charFor(id: string): string {
		return glyphById.get(id)?.char ?? id;
	}
</script>

<svelte:head><title>Confusion Lab · Shwe</title></svelte:head>

<div class="lab">
	<header class="head">
		<a class="back" href="/script" aria-label="Back to Script Studio">
			<ArrowLeft size={22} strokeWidth={2} />
		</a>
		<h1>Confusion Lab</h1>
		<HeaderMute />
	</header>

	<NoAudioPrompt />

	{#if pairs.length === 0}
		<div class="empty-state">
			<Mascot mood="happy" size={72} />
			<h2>Not yet</h2>
			<p>
				The lab drills sounds that are easy to mix up, like က against ခ. Learn both halves of a
				pair in Script Studio and it opens up.
			</p>
			<a class="btn green" href="/script">Go to Script Studio</a>
		</div>
	{:else if !progress.audioOn}
		<div class="empty-state">
			<Mascot mood="sad" size={72} />
			<h2>This one needs sound</h2>
			<p>
				Every trial here is a listening trial: the whole point is telling apart sounds that look
				different on the page. There's no honest silent version.
			</p>
		</div>
	{:else if trials.length === 0}
		<div class="empty-state">
			<Mascot mood="happy" size={72} />
			<h2>Nothing to build from</h2>
			<p>Learn a few more vowels in Script Studio and the lab can make trials from them.</p>
			<a class="btn green" href="/script">Go to Script Studio</a>
		</div>
	{:else if done}
		<div class="empty-state" in:fly={{ y: 20, duration: 250 }}>
			<Mascot mood="happy" size={80} />
			<h2>{totalRight} of {totalChips} sorted right</h2>
			<p>Every mis-sort went into your map below, so the next session leads with it.</p>
			<div class="end-actions">
				<button class="btn green" onclick={restart}>Again</button>
				<button class="btn ghost" onclick={() => goto('/script')}>Done</button>
			</div>
		</div>
	{:else if trial}
		<p class="progress-line">Trial {idx + 1} of {trials.length}</p>
		<h2 class="prompt">Which sound is each one?</h2>
		<p class="hint">Tap a chip to hear it, then tap a bin. Tap a placed chip to move it back.</p>

		<div class="pool" class:empty={pool.length === 0}>
			{#each pool as chip (chip.text)}
				<button
					class="chip"
					class:selected={selected === chip.text}
					onclick={() => tapChip(chip.text)}
				>
					<Volume2 size={18} strokeWidth={2.2} />
				</button>
			{/each}
			{#if pool.length === 0 && !checked}
				<span class="pool-done">All placed. Check them?</span>
			{/if}
		</div>

		<div class="bins">
			{#each trial.bins as binId, i (binId)}
				<div class="bin">
					<button
						class="bin-head"
						class:armed={!!selected && !checked}
						onclick={() => tapBin(binId)}
						disabled={checked || !selected}
					>
						<span class="my bin-char">{trial.binChars[i]}</span>
						<span class="bin-label">{trial.binLabels[i]}</span>
					</button>
					<div class="bin-body">
						{#each trial.chips.filter((c) => placed[c.text] === binId) as chip (chip.text)}
							{@const ok = chip.binId === binId}
							<button
								class="chip placed"
								class:right={checked && ok}
								class:wrong={checked && !ok}
								onclick={() => unplace(chip.text)}
							>
								{#if checked}
									<span class="my chip-text">{chip.text}</span>
								{:else}
									<Volume2 size={16} strokeWidth={2.2} />
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<footer class="lab-foot">
			{#if checked && result}
				<div class="verdict" in:fly={{ y: 16, duration: 200 }}>
					<strong>{result.correct} of {result.total} right</strong>
					{#if result.wrong.length > 0}
						<span class="verdict-sub">
							Tap any chip to hear it again — the misses are marked.
						</span>
					{/if}
					<button class="btn green" onclick={next}>
						{idx + 1 >= trials.length ? 'Finish' : 'Next contrast'}
					</button>
				</div>
			{:else}
				<button class="btn green" onclick={check} disabled={!allPlaced}>Check</button>
			{/if}
		</footer>
	{/if}

	{#if confusions.worst.length > 0}
		<section class="map">
			<h2>Your confusion map</h2>
			<p class="map-note">
				What you reach for when you're wrong. Built from every drill you've done, not just this
				lab.
			</p>
			<ul class="map-list">
				{#each confusions.worst.slice(0, 8) as pair (pair.target + pair.picked)}
					<li class="map-row">
						<span class="my map-pair">
							{charFor(pair.target)}<span class="vs">↔</span>{charFor(pair.picked)}
						</span>
						<span class="map-sounds">{labelFor(pair.target)} / {labelFor(pair.picked)}</span>
						<span class="map-bar" style="--n: {pair.count}"></span>
						<span class="map-count">{pair.count}×</span>
					</li>
				{/each}
			</ul>
			<button class="clear-map" onclick={() => confusions.reset()}>
				<RotateCcw size={14} strokeWidth={2.2} /> Clear the map
			</button>
		</section>
	{/if}
</div>

<style>
	.lab {
		max-width: 560px;
		margin: 0 auto;
		padding: var(--s4) var(--s5) calc(96px + env(safe-area-inset-bottom));
	}
	.head {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 8px;
	}
	.head h1 {
		flex: 1;
		font-size: 1.15rem;
		font-weight: 900;
	}
	.back {
		display: inline-flex;
		color: var(--ink-soft);
	}
	.progress-line {
		margin: 12px 0 0;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-soft);
	}
	.prompt {
		margin: 4px 0 2px;
		font-size: 1.25rem;
		font-weight: 900;
	}
	.hint {
		margin: 0 0 16px;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	/* The pool empties as chips are placed; it keeps its height so the bins
	   below don't walk up the screen mid-trial. */
	.pool {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		min-height: 64px;
		padding: 10px;
		border-radius: var(--radius);
		background: var(--card-sunken, var(--line));
		margin-bottom: 16px;
	}
	.pool-done {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-width: 52px;
		height: 44px;
		padding: 0 12px;
		border-radius: 12px;
		color: var(--on-primary);
		background: var(--teal);
		box-shadow: 0 6px 16px -8px rgba(11, 110, 110, 0.6);
	}
	.chip.selected {
		background: var(--teal-deep);
		outline: 3px solid var(--gold);
		outline-offset: 2px;
	}
	.chip.placed {
		background: var(--card);
		color: var(--ink);
		box-shadow: inset 0 0 0 2px var(--line);
	}
	.chip.placed.right {
		box-shadow: inset 0 0 0 2px var(--green);
		background: var(--green-soft);
	}
	.chip.placed.wrong {
		box-shadow: inset 0 0 0 2px var(--coral-line);
		background: var(--card);
		color: var(--coral-ink);
	}
	.chip-text {
		font-size: 1.1rem;
		font-weight: 700;
	}
	.bins {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	.bin {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.bin-head {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 12px 8px;
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--line);
	}
	/* Only looks tappable once a chip is waiting to go somewhere. */
	.bin-head.armed {
		box-shadow: inset 0 0 0 2px var(--gold);
	}
	.bin-head:disabled {
		cursor: default;
	}
	.bin-char {
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.1;
	}
	.bin-label {
		font-size: 0.8rem;
		font-weight: 800;
		color: var(--ink-soft);
	}
	.bin-body {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		min-height: 60px;
		padding: 8px;
		border-radius: var(--radius);
		background: var(--card-sunken, var(--line));
	}
	.lab-foot {
		margin-top: 20px;
	}
	.lab-foot .btn {
		width: 100%;
	}
	.verdict {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.verdict strong {
		font-size: 1.05rem;
		font-weight: 900;
	}
	.verdict-sub {
		font-size: 0.85rem;
		font-weight: 700;
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
	.end-actions {
		display: flex;
		gap: 10px;
		margin-top: 6px;
	}
	.map {
		margin-top: 36px;
		padding-top: 20px;
		border-top: 2px solid var(--line);
	}
	.map h2 {
		font-size: 1.05rem;
		font-weight: 900;
	}
	.map-note {
		margin: 4px 0 12px;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--ink-soft);
		text-wrap: pretty;
	}
	.map-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.map-row {
		display: grid;
		grid-template-columns: auto 1fr auto auto;
		align-items: center;
		gap: 10px;
	}
	.map-pair {
		font-size: 1.15rem;
		font-weight: 700;
	}
	.vs {
		margin: 0 4px;
		font-size: 0.8rem;
		color: var(--ink-soft);
	}
	.map-sounds {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	/* Width tracks the count so the worst confusion is obvious at a glance. */
	.map-bar {
		width: calc(8px + var(--n) * 10px);
		max-width: 90px;
		height: 8px;
		border-radius: 4px;
		background: var(--coral);
	}
	.map-count {
		font-size: 0.78rem;
		font-weight: 800;
		color: var(--ink-soft);
		min-width: 26px;
		text-align: right;
	}
	.clear-map {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 14px;
		font-size: 0.8rem;
		font-weight: 800;
		color: var(--ink-soft);
	}
</style>
