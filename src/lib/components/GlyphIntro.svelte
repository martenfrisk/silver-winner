<script lang="ts">
	import { onMount } from 'svelte';
	import type { Glyph } from '$lib/data/script';
	import SpeakButton from './SpeakButton.svelte';
	import { speak } from '$lib/audio';
	import { srs } from '$lib/srs.svelte';
	import { glyphById } from '$lib/data/script';

	let { glyph }: { glyph: Glyph } = $props();

	const TYPE_LABEL: Record<string, string> = {
		consonant: 'New letter',
		vowel: 'New vowel sign',
		tone: 'New tone mark',
		medial: 'New medial',
		digit: 'New digit'
	};

	// Warn about already-known lookalikes. The session remounts this component
	// per exercise, so reading `glyph` once is intended.
	// svelte-ignore state_referenced_locally
	const knownConfusables = glyph.confusables
		.map((id) => glyphById.get(id))
		.filter((g) => g && srs.isIntroduced(g.id)) as Glyph[];

	onMount(() => {
		const t = setTimeout(() => speak(glyph.speak), 350);
		return () => clearTimeout(t);
	});
</script>

<div class="glyph-intro">
	<p class="tag">✨ {TYPE_LABEL[glyph.type]}</p>
	<div class="char-row">
		<span class="my char">{glyph.char}</span>
		<SpeakButton text={glyph.speak} size="lg" />
	</div>
	<p class="name">{glyph.name} <span class="meaning">· “{glyph.nameMeaning}”</span></p>
	<p class="sound">sounds like <strong>{glyph.sound}</strong></p>
	<p class="mnemonic">💡 {glyph.mnemonic}</p>
	{#if knownConfusables.length > 0}
		<p class="confuse">
			⚠️ Don’t mix it up with
			{#each knownConfusables as c, i (c.id)}
				{#if i > 0}{' or '}{/if}
				<span class="my c-char">{c.char}</span> ({c.sound})
			{/each}
		</p>
	{/if}
</div>

<style>
	.glyph-intro {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 10px;
		padding: 8px 0;
	}
	.tag {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--gold-ink);
	}
	.char-row {
		display: flex;
		align-items: center;
		gap: 18px;
	}
	.char {
		font-size: 5rem;
		line-height: 1.3;
		color: var(--ink);
	}
	.name {
		margin: 0;
		font-size: 1.3rem;
		font-weight: 900;
	}
	.meaning {
		color: var(--ink-soft);
		font-weight: 700;
		font-size: 1rem;
	}
	.sound {
		margin: 0;
		font-size: 1.05rem;
		color: var(--teal-ink);
		font-weight: 800;
	}
	.mnemonic {
		margin: 6px 0 0;
		max-width: 420px;
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--ink-soft);
		background: var(--gold-soft);
		border-radius: 12px;
		padding: 10px 16px;
	}
	.confuse {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--coral-ink);
		background: var(--coral-soft);
		border-radius: 12px;
		padding: 8px 14px;
	}
	.c-char {
		font-size: 1.3rem;
	}
</style>
