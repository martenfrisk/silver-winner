<script lang="ts">
	// The chart body of the script sheet, split out of ScriptSheet.svelte so the
	// glyph dataset is fetched when the sheet is first opened rather than on
	// every page load — the sheet lives in the root layout but starts closed.
	import { chartSections, glyphById } from '$lib/data/script';
	import { srs } from '$lib/srs.svelte';
	import { speak } from '$lib/audio';

	function heat(id: string): number | null {
		return srs.isIntroduced(id) ? srs.box(id) : null;
	}
</script>

<div class="sections">
	{#each chartSections as section (section.title)}
		<section>
			<h3>{section.title}</h3>
			<div class="cells">
				{#each section.ids as id (id)}
					{@const g = glyphById.get(id)!}
					{@const box = heat(id)}
					<button
						class="cell"
						style={box === null ? '' : `background: var(--heat-${box})`}
						onclick={() => speak(g.speak)}
						title="{g.name}: {g.sound}"
					>
						<span class="my char">{g.char}</span>
						<span class="sound">{g.sound}</span>
					</button>
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.sections {
		overflow-y: auto;
		padding: 12px 20px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	section h3 {
		font-size: 0.72rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--ink-soft);
		margin-bottom: 6px;
	}
	.cells {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
		gap: 6px;
	}
	.cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		padding: 6px 2px;
		border-radius: 12px;
		background: var(--card);
		box-shadow: inset 0 0 0 1.5px var(--line);
		transition: scale 0.12s var(--pop);
	}
	.cell:active {
		scale: 0.93;
	}
	.char {
		font-size: 1.5rem;
		line-height: 1.4;
	}
	.sound {
		font-size: 0.68rem;
		font-weight: 800;
		color: var(--ink-soft);
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
