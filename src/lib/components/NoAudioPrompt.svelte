<script lang="ts">
	// A "no headphones?" nudge inside exercise sessions (lesson, practice,
	// Script Studio, reader, stories) — right where audio would actually
	// play. Distinct from the permanent Sound setting on the account page:
	// this mutes only for the current app session, framed as a prompt rather
	// than a settings switch since that's the natural moment to ask.
	import { fly } from 'svelte/transition';
	import { progress } from '$lib/progress.svelte';
	import { noAudioPromptState } from '$lib/no-audio-prompt.svelte';
	import { Headphones, VolumeX, X } from '@lucide/svelte';

	// Once the offer has moved to the header (HeaderMute), the chip stops
	// competing for the exercise's space.
	const showPrompt = $derived(
		progress.sound &&
			!progress.tempMute &&
			!noAudioPromptState.seen &&
			!noAudioPromptState.relocated
	);

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

{#if progress.tempMute && !noAudioPromptState.relocated}
	<!-- After relocation the header toggle already shows the muted state, so a
	     chip here would just say the same thing twice, over the exercise. -->
	<div class="chip muted" in:fly={{ y: -8, duration: 180 }} role="status">
		<span class="lbl">
			<VolumeX size={16} strokeWidth={2} /> Muted
			<span class="detail">for this session</span>
		</span>
		<button class="link-btn" onclick={unmute}>Turn back on</button>
	</div>
{:else if showPrompt}
	<!-- Exits upward, toward the header control it turns into. -->
	<div
		class="chip prompt"
		in:fly={{ y: -8, duration: 180 }}
		out:fly={{ y: -28, duration: 260 }}
		role="status"
	>
		<!-- The detail sentence is dropped on phones, where it would wrap the
		     chip to three rows and eat the exercise's space. "No headphones?"
		     next to "Mute for now" carries the meaning on its own. -->
		<span class="lbl">
			<Headphones size={16} strokeWidth={2} /> No headphones?
			<span class="detail">This plays pronunciation out loud.</span>
		</span>
		<div class="actions">
			<button class="link-btn" onclick={muteForNow}>Mute for now</button>
			<button class="dismiss" onclick={dismiss} aria-label="Dismiss"><X size={15} strokeWidth={2.5} /></button>
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
