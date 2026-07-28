<script lang="ts">
	// A one-time, non-blocking nudge shown entering a scriptOnly lesson (see
	// Lesson.scriptOnly) when the learner still has romanization switched on —
	// the signal that they haven't leaned on Script Studio yet, and this
	// lesson won't have romanization to fall back on. Dismissible and never a
	// gate: skipping it still works, since script + audio + meaning is the
	// whole point of the lesson, not a trap.
	import { fly } from 'svelte/transition';
	import { progress } from '$lib/progress.svelte';
	import { scriptOnlyPromptState } from '$lib/script-only-prompt.svelte';
	import { BookOpenText, X } from '@lucide/svelte';

	const showPrompt = $derived(progress.showRoman && !scriptOnlyPromptState.seen);

	function dismiss() {
		scriptOnlyPromptState.markSeen();
	}
</script>

{#if showPrompt}
	<div class="chip prompt" in:fly={{ y: -8, duration: 180 }} out:fly={{ y: -8, duration: 160 }} role="status">
		<span class="lbl">
			<BookOpenText size={16} strokeWidth={2} /> No romanization from here on
			<span class="detail">Script Studio gets you reading it cold.</span>
		</span>
		<div class="actions">
			<a class="link-btn" href="/script">Script Studio</a>
			<button class="dismiss" onclick={dismiss} aria-label="Dismiss">
				<X size={15} strokeWidth={2.5} />
			</button>
		</div>
	</div>
{/if}

<style>
	.chip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		flex-wrap: wrap;
		max-width: 680px;
		margin: 0 auto 12px;
		padding: 10px 14px;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 700;
	}
	@media (max-width: 559px) {
		.detail {
			display: none;
		}
		.chip {
			gap: 8px;
			margin-bottom: 8px;
			padding: 7px 11px;
			font-size: 0.8rem;
		}
	}
	.lbl {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.chip.prompt {
		background: var(--gold-soft);
		color: var(--gold-ink);
		box-shadow: inset 0 0 0 2px var(--gold);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.link-btn {
		font-weight: 900;
		color: inherit;
		text-decoration: underline;
		white-space: nowrap;
	}
	.dismiss {
		width: 22px;
		height: 22px;
		display: grid;
		place-items: center;
		border-radius: 6px;
		opacity: 0.7;
	}
	.dismiss:hover {
		background: rgb(0 0 0 / 8%);
	}
</style>
