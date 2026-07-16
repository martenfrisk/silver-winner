<script lang="ts">
	import type { Glyph } from '$lib/data/script';
	import { glyphById } from '$lib/data/script';
	import SpeakButton from './SpeakButton.svelte';
	import { srs, MAX_BOX } from '$lib/srs.svelte';

	let { glyph, onclose, onjump }: { glyph: Glyph; onclose: () => void; onjump: (g: Glyph) => void } =
		$props();

	const BOX_LABEL = ['just learned', 'learning', 'getting there', 'strong', 'mastered'];
	const box = $derived(srs.box(glyph.id));
</script>

<div
	class="backdrop"
	onclick={onclose}
	onkeydown={(e) => e.key === 'Escape' && onclose()}
	role="button"
	tabindex="-1"
	aria-label="Close"
></div>
<div class="sheet" role="dialog" aria-label="{glyph.name} details">
	<button class="close" onclick={onclose} aria-label="Close">✕</button>
	<div class="char-row">
		<span class="my char">{glyph.char}</span>
		<SpeakButton text={glyph.speak} size="lg" />
	</div>
	<p class="name">{glyph.name} <span class="meaning">· “{glyph.nameMeaning}”</span></p>
	<p class="sound">sounds like <strong>{glyph.sound}</strong></p>
	<p class="mnemonic">💡 {glyph.mnemonic}</p>

	<div class="mastery">
		{#if box < 0}
			<span class="dot new"></span> not learned yet
		{:else}
			{#each Array(MAX_BOX + 1) as _, i (i)}
				<span class="dot" class:lit={i <= box}></span>
			{/each}
			{BOX_LABEL[box]}
		{/if}
	</div>

	{#if glyph.confusables.length > 0}
		<div class="confusables">
			<span class="c-label">Lookalikes:</span>
			{#each glyph.confusables as id (id)}
				{@const g = glyphById.get(id)}
				{#if g}
					<button class="c-chip" onclick={() => onjump(g)}>
						<span class="my">{g.char}</span>
						<span class="c-sound">{g.sound}</span>
					</button>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: var(--backdrop);
		z-index: 40;
		animation: fade-in 0.15s ease;
	}
	.sheet {
		position: fixed;
		left: 50%;
		top: 50%;
		translate: -50% -50%;
		z-index: 41;
		width: min(420px, calc(100vw - 32px));
		background: var(--bg);
		border-radius: 20px;
		box-shadow: var(--shadow-pop);
		padding: 28px 24px 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 10px;
		animation: sheet-in 0.25s var(--pop);
	}
	@keyframes fade-in {
		from { opacity: 0; }
	}
	@keyframes sheet-in {
		from { scale: 0.9; opacity: 0; }
	}
	.close {
		position: absolute;
		right: 12px;
		top: 12px;
		width: 32px;
		height: 32px;
		border-radius: 10px;
		color: var(--ink-soft);
	}
	.close:hover {
		background: var(--line);
	}
	.char-row {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.char {
		font-size: 4rem;
		line-height: 1.3;
	}
	.name {
		margin: 0;
		font-weight: 900;
		font-size: 1.15rem;
	}
	.meaning {
		color: var(--ink-soft);
		font-weight: 700;
		font-size: 0.95rem;
	}
	.sound {
		margin: 0;
		color: var(--teal-ink);
		font-weight: 800;
	}
	.mnemonic {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--ink-soft);
		background: var(--gold-soft);
		border-radius: 12px;
		padding: 8px 14px;
	}
	.mastery {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--ink-soft);
	}
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--line);
	}
	.dot.lit {
		background: var(--gold);
	}
	.dot.new {
		background: var(--line);
	}
	.confusables {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		margin-top: 4px;
	}
	.c-label {
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--ink-soft);
	}
	.c-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border-radius: 10px;
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--line);
		font-size: 1.1rem;
	}
	.c-sound {
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--ink-soft);
	}
</style>
