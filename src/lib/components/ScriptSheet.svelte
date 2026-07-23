<script lang="ts">
	// Quick-access script table: a read-only reference overlay, openable from
	// any header via `scriptSheet.show()`. Tap a glyph to hear its name.
	import { fade, fly } from 'svelte/transition';
	import { scriptSheet } from '$lib/script-sheet.svelte';

	function onkeydown(e: KeyboardEvent) {
		if (scriptSheet.open && e.key === 'Escape') {
			e.stopPropagation();
			scriptSheet.hide();
		}
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
			<!-- Loaded on first open, so the glyph dataset stays off every other
			     page. The module cache makes reopening instant. -->
			{#await import('./ScriptSheetTable.svelte')}
				<p class="loading">Loading the table…</p>
			{:then { default: Table }}
				<Table />
			{/await}
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
	.loading {
		padding: 28px 20px;
		text-align: center;
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--ink-soft);
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
