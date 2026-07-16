<script lang="ts">
	import { fly } from 'svelte/transition';
	import { newlyEarned, type AchievementDef } from '$lib/achievements';
	import { progress } from '$lib/progress.svelte';
	import { sfx } from '$lib/audio';

	// Watches the stores; when an achievement condition flips true, persist it
	// and show a toast. Awarding adds the id to progress.achievements, so the
	// effect settles after one extra pass.
	let toasts = $state<AchievementDef[]>([]);

	$effect(() => {
		const fresh = newlyEarned();
		if (fresh.length === 0) return;
		for (const a of fresh) progress.award(a.id);
		toasts = [...toasts, ...fresh];
		sfx.match();
		setTimeout(() => (toasts = toasts.slice(fresh.length)), 3600);
	});
</script>

{#if toasts.length > 0}
	<div class="toasts" role="status">
		{#each toasts.slice(0, 2) as a (a.id)}
			<div class="toast" in:fly={{ y: 24, duration: 350 }} out:fly={{ y: 24, duration: 250 }}>
				<span class="emoji">{a.emoji}</span>
				<span class="text">
					<strong>Achievement: {a.name}</strong>
					<small>{a.desc}</small>
				</span>
			</div>
		{/each}
	</div>
{/if}

<style>
	.toasts {
		position: fixed;
		bottom: calc(18px + env(safe-area-inset-bottom));
		left: 50%;
		translate: -50% 0;
		z-index: 100;
		display: flex;
		flex-direction: column;
		gap: 8px;
		pointer-events: none;
	}
	.toast {
		display: flex;
		align-items: center;
		gap: 12px;
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: 0 4px 0 var(--gold-dark), inset 0 0 0 2px var(--gold);
		padding: 10px 18px;
		white-space: nowrap;
	}
	.emoji {
		font-size: 1.6rem;
	}
	.text {
		display: flex;
		flex-direction: column;
	}
	.text strong {
		font-weight: 900;
		color: var(--gold-ink);
		font-size: 0.95rem;
	}
	.text small {
		color: var(--ink-soft);
		font-weight: 700;
		font-size: 0.8rem;
	}
</style>
