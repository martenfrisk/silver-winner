<script lang="ts">
	// Loanword Lab: decode familiar borrowed words from script alone.
	// No romanization — recognition ("oh, it says coffee!") is the reward.
	import { buildLoanwordQueue } from '$lib/script-session';
	import { progress } from '$lib/progress.svelte';
	import ScriptSession from '$lib/components/ScriptSession.svelte';

	const queue = buildLoanwordQueue(progress.audioOn);

	function onfinish({ stars }: { stars: number }) {
		const xp = 15 + (stars === 3 ? 5 : 0);
		progress.addXp(xp);
		return xp;
	}
</script>

<ScriptSession initialQueue={queue} title="Loanword Lab" xpBase={15} {onfinish} />
