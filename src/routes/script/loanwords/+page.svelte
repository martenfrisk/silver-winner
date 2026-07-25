<script lang="ts">
	// Loanword Lab: decode familiar borrowed words from script alone.
	// No romanization — recognition ("oh, it says coffee!") is the reward.
	import { buildLoanwordQueue } from '$lib/script-session';
	import { progress } from '$lib/progress.svelte';
	import { sessionXp } from '$lib/xp';
	import ScriptSession from '$lib/components/ScriptSession.svelte';

	const queue = buildLoanwordQueue(progress.audioOn);

	function onfinish({ stars }: { stars: number }) {
		const xp = sessionXp({ kind: 'lab', stars });
		progress.addXp(xp);
		return xp;
	}
</script>

<ScriptSession initialQueue={queue} title="Loanword Lab" xpBase={15} {onfinish} />
