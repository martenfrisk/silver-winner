<script lang="ts">
	// Quick-access script table: a read-only reference overlay, openable from
	// any header via `scriptSheet.show()`. Tap a glyph to hear its name.
	import { fade, fly } from 'svelte/transition';
	import { chartSections, glyphById } from '$lib/data/script';
	import { scriptSheet } from '$lib/script-sheet.svelte';
	import { srs } from '$lib/srs.svelte';
	import { speak } from '$lib/audio';

	function onkeydown(e: KeyboardEvent) {
		if (scriptSheet.open && e.key === 'Escape') {
			e.stopPropagation();
			scriptSheet.hide();
		}
	}

	function heat(id: string): number | null {
		return srs.isIntroduced(id) ? srs.box(id) : null;
	}
</script>

<svelte:window {onkeydown} />

{#if scriptSheet.open}
	<div
		class="backdrop"
		role="presentation"
		transition:fade={{ duration: 150 }}
		onclick={(e) => {
			if (e.target === e.currentTarget) scriptSheet.hide();
		}}
	>
		<div
			class="sheet"
			role="dialog"
			aria-modal="true"
			aria-label="Script reference table"
			transition:fly={{ y: 40, duration: 250 }}
		>
			<header>
				<h2>အ Script table</h2>
				<p class="hint">Tap a letter to hear its name</p>
				<!-- svelte-ignore a11y_autofocus -->
				<button class="close" onclick={() => scriptSheet.hide()} aria-label="Close" autofocus>✕</button>
			</header>
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
									title="{g.name} — {g.sound}"
								>
									<span class="my char">{g.char}</span>
									<span class="sound">{g.sound}</span>
								</button>
							{/each}
						</div>
					</section>
				{/each}
			</div>
			<footer>
				<a href="/script" onclick={() => scriptSheet.hide()}>Open Script Studio →</a>
			</footer>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: rgb(0 0 0 / 45%);
		display: grid;
		place-items: center;
		padding: 20px;
	}
	.sheet {
		width: min(600px, 100%);
		max-height: min(85dvh, 780px);
		display: flex;
		flex-direction: column;
		background: var(--bg);
		border-radius: 20px;
		box-shadow: 0 12px 40px rgb(0 0 0 / 30%);
		overflow: hidden;
	}
	header {
		display: flex;
		align-items: baseline;
		gap: 12px;
		padding: 16px 20px 12px;
		border-bottom: 2px solid var(--line);
	}
	header h2 {
		font-size: 1.15rem;
		font-weight: 900;
		color: var(--plum-ink);
	}
	.hint {
		flex: 1;
		margin: 0;
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.close {
		font-size: 1.1rem;
		color: var(--ink-soft);
		width: 32px;
		height: 32px;
		border-radius: 10px;
		flex-shrink: 0;
		align-self: center;
	}
	.close:hover {
		background: var(--line);
	}
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
	footer {
		padding: 10px 20px calc(12px + env(safe-area-inset-bottom));
		border-top: 2px solid var(--line);
		text-align: center;
	}
	footer a {
		font-size: 0.9rem;
		font-weight: 800;
		color: var(--plum-ink);
		text-decoration: none;
	}
</style>
