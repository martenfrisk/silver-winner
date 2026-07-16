<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import AchievementToast from '$lib/components/AchievementToast.svelte';

	let { children } = $props();

	// Marks the app as hydrated so tests (and tooling) can wait for
	// interactivity instead of clicking server-rendered, inert markup.
	onMount(() => {
		document.body.dataset.hydrated = 'true';
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
<AchievementToast />
