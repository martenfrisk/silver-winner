<script lang="ts">
	import { buildPracticeQueue } from '$lib/script-session';
	import { srs } from '$lib/srs.svelte';
	import { progress } from '$lib/progress.svelte';
	import ScriptSession from '$lib/components/ScriptSession.svelte';
	import Mascot from '$lib/components/Mascot.svelte';

	// svelte-ignore state_referenced_locally
	const { queue } = buildPracticeQueue(progress.audioOn);

	function onfinish({ stars }: { stars: number }) {
		const xp = 10 + (stars === 3 ? 5 : 0);
		progress.addXp(xp);
		return xp;
	}

	function ongrade(glyphId: string, ok: boolean) {
		srs.grade(glyphId, ok);
	}
</script>

{#if queue.length === 0}
	<div class="empty">
		<Mascot mood="idle" size={120} />
		<h1>Nothing to practice yet</h1>
		<p>Finish your first Script Studio lesson and come back!</p>
		<a class="btn" href="/script">Back to Script Studio</a>
	</div>
{:else}
	<ScriptSession initialQueue={queue} title="Practice" xpBase={10} {ongrade} {onfinish} />
{/if}

<style>
	.empty {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 14px;
		text-align: center;
		padding: 24px;
	}
	.empty h1 {
		font-size: 1.5rem;
		font-weight: 900;
	}
	.empty p {
		margin: 0;
		color: var(--ink-soft);
		font-weight: 700;
	}
	.empty .btn {
		text-decoration: none;
		margin-top: 8px;
	}
</style>
