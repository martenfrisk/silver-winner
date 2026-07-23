<script lang="ts">
	// Where the "no headphones?" offer goes once the inline chip has been
	// ignored for a couple of questions: a header toggle, in every session
	// header, plus a one-shot tooltip so the move is explained rather than
	// just happening. See $lib/no-audio-prompt.
	import { fly, scale } from 'svelte/transition';
	import { progress } from '$lib/progress.svelte';
	import { noAudioPromptState } from '$lib/no-audio-prompt.svelte';

	// Only appears after the relocation, and only while the permanent Sound
	// setting is on — with sound off there is nothing to mute.
	const show = $derived(noAudioPromptState.relocated && progress.sound);

	function toggle() {
		noAudioPromptState.hideTooltip();
		progress.toggleTempMute();
	}
</script>

{#if show}
	<div class="wrap" in:scale={{ duration: 260, start: 0.6 }}>
		<button
			class="mute"
			class:muted={progress.tempMute}
			onclick={toggle}
			title={progress.tempMute ? 'Unmute for this session' : 'Mute for this session'}
			aria-pressed={progress.tempMute}
		>
			{progress.tempMute ? '🔇' : '🔊'}
		</button>
		{#if noAudioPromptState.tooltip}
			<span class="tip" role="status" transition:fly={{ y: -6, duration: 220 }}>
				Mute anytime from here
			</span>
		{/if}
	</div>
{/if}

<style>
	.wrap {
		position: relative;
		flex-shrink: 0;
	}
	.mute {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--teal);
		font-size: 0.95rem;
		transition: scale 0.2s var(--pop), box-shadow 0.15s ease;
	}
	.mute:active {
		scale: 0.9;
	}
	.mute.muted {
		box-shadow: inset 0 0 0 2px var(--line);
		opacity: 0.75;
	}
	/* Hangs below the button without joining the header's flex row. */
	.tip {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		z-index: 20;
		padding: 7px 11px;
		border-radius: 10px;
		background: var(--teal);
		color: #fff;
		font-size: 0.78rem;
		font-weight: 800;
		white-space: nowrap;
		/* Lifted off the page: it overlaps the question text for a few seconds,
		   and without the drop shadow the two just look tangled together. */
		box-shadow: 0 3px 0 var(--teal-dark), 0 10px 22px rgb(0 0 0 / 22%);
	}
	.tip::after {
		content: '';
		position: absolute;
		top: -5px;
		right: 13px;
		border: 5px solid transparent;
		border-top: none;
		border-bottom-color: var(--teal);
	}
</style>
