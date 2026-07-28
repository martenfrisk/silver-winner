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
	import { page } from '$app/state';
	import { HUB_TITLES, isHubShell } from '$lib/nav';
	import { ui } from '$lib/i18n.svelte';
	import AchievementToast from '$lib/components/AchievementToast.svelte';
	import ScriptSheet from '$lib/components/ScriptSheet.svelte';
	import WordSheet from '$lib/components/WordSheet.svelte';
	import LessonPreview from '$lib/components/LessonPreview.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import HubHeader from '$lib/components/HubHeader.svelte';

	let { children } = $props();

	// The hub shell lives here, not in each page. Because this layout stays
	// mounted across navigation, the wrapper and header are never rebuilt when
	// moving from one hub to another — the header cannot shift, rather than
	// merely being configured not to. It also means a new hub gets the right
	// geometry by being listed in $lib/nav, not by remembering a class.
	const path = $derived(page.url.pathname);
	const shell = $derived(isHubShell(path));
	const hubTitle = $derived.by(() => {
		const meta = HUB_TITLES[path];
		if (!meta) return null;
		return meta.i18nKey ? ui(meta.i18nKey).text : meta.title;
	});

	// Marks the app as hydrated so tests (and tooling) can wait for
	// interactivity instead of clicking server-rendered, inert markup.
	onMount(() => {
		document.body.dataset.hydrated = 'true';
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if shell}
	<div class="hub-page">
		{#if hubTitle}<HubHeader title={hubTitle} />{/if}
		{@render children()}
	</div>
{:else}
	{@render children()}
{/if}
<AchievementToast />
<ScriptSheet />
<WordSheet />
<LessonPreview />
<BottomNav />
