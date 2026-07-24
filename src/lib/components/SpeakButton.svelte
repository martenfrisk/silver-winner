<script lang="ts">
	import { onMount } from 'svelte';
	import { canSpeak, speak } from '$lib/audio';
	import { sfx } from '$lib/audio';
	import { progress } from '$lib/progress.svelte';
	import { Volume2 } from '@lucide/svelte';

	let { text, size = 'md' }: { text: string; size?: 'md' | 'lg' } = $props();
	let hasAudio = $state(false);
	// Hidden while audio is off — a speaker button that can't make a sound is
	// worse than no button.
	const available = $derived(hasAudio && progress.audioOn);

	onMount(() => {
		hasAudio = canSpeak(text);
		if (hasAudio) return;
		// No audio file for this text — a platform voice may still appear.
		const update = () => (hasAudio = canSpeak(text));
		speechSynthesis?.addEventListener?.('voiceschanged', update);
		return () => speechSynthesis?.removeEventListener?.('voiceschanged', update);
	});

	function onclick(e: MouseEvent) {
		e.stopPropagation();
		if (!speak(text)) sfx.tap();
	}
</script>

{#if available}
	<button class="speak {size}" {onclick} aria-label="Listen to pronunciation" title="Listen">
		<Volume2 size={size === 'lg' ? 26 : 20} strokeWidth={2} />
	</button>
{/if}

<style>
	.speak {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		/* Round: it's a single icon action, and the squircle read as a cropped
		   card next to the answer reveal it sits in. */
		border-radius: 50%;
		/* Keep it circular inside flex rows, which would otherwise squeeze the
		   width below the height and turn the circle into an ellipse. */
		flex: 0 0 auto;
		color: var(--on-primary);
		background: var(--teal);
		box-shadow: 0 6px 16px -8px rgba(11, 110, 110, 0.6);
		transition: translate 0.1s var(--pop), filter 0.15s ease;
	}
	.speak.lg {
		width: 52px;
		height: 52px;
	}
	.speak:active {
		translate: 0 1px;
		filter: brightness(0.95);
	}
</style>
