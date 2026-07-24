<script lang="ts">
	import { course } from '$lib/data/course';
	import { unitVocab, readerStarsKey } from '$lib/reader-session';
	import { progress } from '$lib/progress.svelte';
	import { srs } from '$lib/srs.svelte';
	import Mascot from '$lib/components/Mascot.svelte';
	import { BookOpenText, Lightbulb, ArrowLeft } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Reader track · Shwe</title>
</svelte:head>

<div class="reader-home">
	<header>
		<a class="back" href="/" aria-label="Back home"><ArrowLeft size={22} strokeWidth={2} /></a>
		<h1><BookOpenText size={24} strokeWidth={2} /> Reader track</h1>
	</header>

	<div class="intro">
		<Mascot mood="idle" size={84} />
		<p>
			Already know the script but not the words? Read the whole course in
			<strong>Burmese script only</strong>, no romanization, ever. Audio and
			meaning carry you.
		</p>
	</div>

	{#if srs.introducedCount < 10}
		<p class="warmup">
			<Lightbulb size={16} strokeWidth={2} /> This track assumes you can read the letters. New to the script? Start in the
			<a href="/script">Script Studio</a> first.
		</p>
	{/if}

	<div class="units">
		{#each course as unit (unit.id)}
			{@const words = unitVocab(unit)}
			{@const stars = progress.stars[readerStarsKey(unit.id)] ?? 0}
			<a class="unit-card" href="/reader/{unit.id}" style="--unit-color: {unit.color}">
				<span class="unit-mark my">{unit.my.slice(0, 1)}</span>
				<span class="unit-text">
					<span class="unit-title">{unit.title}</span>
					<span class="unit-sub">{words.length} words to read</span>
				</span>
				{#if stars > 0}
					<span class="unit-stars">{'★'.repeat(stars)}<span class="dim">{'★'.repeat(3 - stars)}</span></span>
				{:else}
					<span class="unit-arrow">→</span>
				{/if}
			</a>
		{/each}
	</div>
</div>

<style>
	.reader-home {
		max-width: 560px;
		margin: 0 auto;
		padding: 0 20px calc(96px + env(safe-area-inset-bottom));
	}
	header {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 18px 0 6px;
	}
	.back {
		font-size: 1.3rem;
		font-weight: 900;
		color: var(--ink-soft);
		text-decoration: none;
		width: 36px;
		height: 36px;
		display: grid;
		place-items: center;
		border-radius: 10px;
	}
	.back:hover {
		background: var(--line);
	}
	h1 {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 400;
		font-size: 1.6rem;
		color: var(--ink);
	}
	h1 :global(svg) {
		color: var(--teal-ink);
	}
	.warmup :global(svg) {
		vertical-align: -3px;
		color: var(--gold-ink);
	}
	.intro {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 10px 0 6px;
	}
	.intro p {
		font-weight: 700;
		color: var(--ink-soft);
	}
	.intro strong {
		color: var(--ink);
	}
	.warmup {
		margin: 8px 0 0;
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--ink-soft);
		background: var(--card);
		border-radius: 12px;
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 10px 14px;
	}
	.warmup a {
		color: var(--plum-ink);
	}
	.units {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding-top: 18px;
	}
	.unit-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 18px;
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: 0 4px 0 color-mix(in srgb, var(--unit-color) 60%, black), inset 0 0 0 2px var(--unit-color);
		text-decoration: none;
		color: var(--ink);
		transition: translate 0.1s ease, box-shadow 0.1s ease;
	}
	.unit-card:active {
		translate: 0 4px;
		box-shadow: 0 0 0 color-mix(in srgb, var(--unit-color) 60%, black), inset 0 0 0 2px var(--unit-color);
	}
	.unit-mark {
		width: 48px;
		height: 48px;
		display: grid;
		place-items: center;
		font-size: 1.5rem;
		border-radius: 14px;
		background: color-mix(in srgb, var(--unit-color) 18%, transparent);
		flex-shrink: 0;
	}
	.unit-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.unit-title {
		font-weight: 900;
	}
	.unit-sub {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.unit-stars {
		font-size: 0.95rem;
		color: var(--gold-ink);
	}
	.unit-stars .dim {
		color: var(--star-dim);
	}
	.unit-arrow {
		font-size: 1.2rem;
		font-weight: 900;
		color: var(--ink-soft);
	}
</style>
