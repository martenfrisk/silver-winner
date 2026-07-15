<script lang="ts">
	import { page } from '$app/state';
	import { scriptUnitById } from '$lib/data/script';
	import { buildIntroQueue } from '$lib/script-session';
	import { srs } from '$lib/srs.svelte';
	import { progress } from '$lib/progress.svelte';
	import ScriptSession from '$lib/components/ScriptSession.svelte';
	import Mascot from '$lib/components/Mascot.svelte';

	const unit = scriptUnitById.get(page.params.unit ?? '');
	// svelte-ignore state_referenced_locally
	const queue = unit ? buildIntroQueue(unit) : [];

	function onfinish({ stars }: { stars: number }) {
		const firstTime = !srs.isUnitDone(unit!.id);
		srs.introduce(unit!.glyphIds);
		srs.markUnitDone(unit!.id);
		const xp = (firstTime ? 20 : 10) + (stars === 3 ? 5 : 0);
		progress.addXp(xp);
		return xp;
	}

	function ongrade(glyphId: string, ok: boolean) {
		// During an intro, only grade glyphs that are already in the SRS pool
		// (reviews of earlier material); new ones get seeded at the end.
		if (srs.isIntroduced(glyphId)) srs.grade(glyphId, ok);
	}
</script>

{#if !unit}
	<div class="missing">
		<Mascot mood="sad" />
		<p>That unit doesn’t exist.</p>
		<a class="btn" href="/script">Back to Script Studio</a>
	</div>
{:else}
	<ScriptSession initialQueue={queue} title={unit.title} xpBase={20} {ongrade} {onfinish} />
{/if}

<style>
	.missing {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
	}
	.missing .btn {
		text-decoration: none;
	}
</style>
