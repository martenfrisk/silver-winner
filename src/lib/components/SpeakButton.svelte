<script lang="ts">
	import { onMount } from 'svelte';
	import { canSpeak, speak } from '$lib/audio';
	import { sfx } from '$lib/audio';

	let { text, size = 'md' }: { text: string; size?: 'md' | 'lg' } = $props();
	let available = $state(false);

	onMount(() => {
		available = canSpeak(text);
		if (available) return;
		// No audio file for this text — a platform voice may still appear.
		const update = () => (available = canSpeak(text));
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
		🔊
	</button>
{/if}

<style>
	.speak {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 12px;
		background: var(--teal);
		box-shadow: 0 3px 0 var(--teal-dark);
		font-size: 1.1rem;
		transition: translate 0.08s ease, box-shadow 0.08s ease;
	}
	.speak.lg {
		width: 52px;
		height: 52px;
		font-size: 1.5rem;
	}
	.speak:active {
		translate: 0 3px;
		box-shadow: 0 0 0 var(--teal-dark);
	}
</style>
