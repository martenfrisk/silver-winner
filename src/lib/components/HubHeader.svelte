<script lang="ts">
	// The header every hub shares: a title and the same three tools.
	//
	// Before this, each hub invented its own. /learn had the only link to the
	// dictionary anywhere in the app, hidden behind a bare magnifier; the script
	// sheet was on three screens out of six; and four hubs had a back arrow to
	// "/" even though they are tab roots, which teaches the wrong model of where
	// you are. Putting the tools in one component is what takes the dictionary
	// from one entry point to six.
	import { progress } from '$lib/progress.svelte';
	import { scriptSheet } from '$lib/script-sheet.svelte';
	import { Search } from '@lucide/svelte';

	let {
		title,
		/** Render the title in the Burmese font (used by Script Studio). */
		my = false,
		/** Extra controls for this hub, placed before the shared tools. */
		extra
	}: {
		title: string;
		my?: boolean;
		extra?: import('svelte').Snippet;
	} = $props();
</script>

<header class="hub-head">
	<h1 class:my>{title}</h1>
	<div class="tools">
		{@render extra?.()}
		<a class="tool" href="/dictionary" aria-label="Dictionary: look up any word">
			<Search size={19} strokeWidth={2} />
		</a>
		<button
			class="tool"
			class:off={!progress.showRoman}
			onclick={() => progress.toggleRoman()}
			aria-pressed={progress.showRoman}
			title={progress.showRoman ? 'Hide romanization' : 'Show romanization'}>Aa</button
		>
		<button class="tool my" onclick={() => scriptSheet.show()} aria-label="Open the script table">
			က
		</button>
	</div>
</header>

<style>
	.hub-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--s3);
		margin-bottom: var(--s5);
	}
	/* The house style for a hub title: five of the six hubs already used this
	   display italic; /account was the lone holdout at 1.35rem/900. */
	h1 {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 400;
		font-size: 1.7rem;
		color: var(--ink);
		min-width: 0;
	}
	h1.my {
		font-style: normal;
		font-weight: 700;
	}
	.tools {
		display: flex;
		gap: var(--s2);
		flex-shrink: 0;
	}
	.tool {
		width: 40px;
		height: 40px;
		display: grid;
		place-items: center;
		border-radius: var(--radius-sm);
		background: var(--card);
		box-shadow: inset 0 0 0 1px var(--line);
		color: var(--ink);
		font-weight: 700;
		font-size: 0.9rem;
		text-decoration: none;
	}
	.tool.my {
		font-size: 1.1rem;
		color: var(--teal-ink);
	}
	.tool.off {
		color: var(--ink-soft);
	}
</style>
