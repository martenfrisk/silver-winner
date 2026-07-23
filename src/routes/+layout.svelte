<script lang="ts">
	import { onMount } from 'svelte';
	// Self-hosted rather than fetched from Google Fonts: the old <link> in
	// app.html was render-blocking and cost two extra DNS+TLS handshakes
	// (googleapis, then gstatic) before any text could paint. Bundling them
	// also means the offline shell renders in the right faces — Padauk has no
	// sane system fallback for Burmese. Imported before app.css so the tokens
	// there win. See fonts.css for why Nunito is declared by hand.
	import '../fonts.css';
	import '@fontsource/padauk/myanmar-400.css';
	import '@fontsource/padauk/myanmar-700.css';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import AchievementToast from '$lib/components/AchievementToast.svelte';
	import ScriptSheet from '$lib/components/ScriptSheet.svelte';

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
<ScriptSheet />
