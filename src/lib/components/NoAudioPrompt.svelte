<script lang="ts">
	// A "no headphones?" nudge inside exercise sessions (lesson, practice,
	// Script Studio, reader, stories) — right where audio would actually
	// play. Distinct from the permanent Sound setting on the account page:
	// this mutes only for the current app session, framed as a prompt rather
	// than a settings switch since that's the natural moment to ask.
	import { fly } from 'svelte/transition';
	import { progress } from '$lib/progress.svelte';
	import { noAudioPromptState } from '$lib/no-audio-prompt.svelte';

	const showPrompt = $derived(progress.sound && !progress.tempMute && !noAudioPromptState.seen);

	function muteForNow() {
		progress.toggleTempMute();
		noAudioPromptState.markSeen();
	}

	function dismiss() {
		noAudioPromptState.markSeen();
	}

	function unmute() {
		progress.toggleTempMute();
	}
</script>

{#if progress.tempMute}
	<div class="chip muted" in:fly={{ y: -8, duration: 180 }} role="status">
		<span>
			🔇 Muted
			<span class="detail">for this session</span>
		</span>
		<button class="link-btn" onclick={unmute}>Turn back on</button>
	</div>
{:else if showPrompt}
	<div class="chip prompt" in:fly={{ y: -8, duration: 180 }} role="status">
		<!-- The detail sentence is dropped on phones, where it would wrap the
		     chip to three rows and eat the exercise's space. "No headphones?"
		     next to "Mute for now" carries the meaning on its own. -->
		<span>
			🎧 No headphones?
			<span class="detail">This plays pronunciation out loud.</span>
		</span>
		<div class="actions">
			<button class="link-btn" onclick={muteForNow}>Mute for now</button>
			<button class="dismiss" onclick={dismiss} aria-label="Dismiss">✕</button>
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
	.chip.prompt {
		background: var(--teal-soft);
		color: var(--teal-ink);
		box-shadow: inset 0 0 0 2px var(--teal);
	}
	.chip.muted {
		background: var(--line);
		color: var(--ink-soft);
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
