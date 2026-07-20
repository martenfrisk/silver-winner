<script lang="ts">
	// First-visit hero: Shwe asks where the learner is starting from. Inline —
	// no modal, no gate — and skippable ("Just exploring" → 'explorer', which
	// keeps the neutral layout and never re-asks). Changeable in settings.
	import { fly } from 'svelte/transition';
	import { progress, type Profile } from '$lib/progress.svelte';
	import { sfx } from '$lib/audio';
	import Mascot from './Mascot.svelte';

	const options: { profile: Profile; emoji: string; label: string; sub: string }[] = [
		{
			profile: 'beginner',
			emoji: '🌱',
			label: 'I’m new to Burmese',
			sub: 'Start speaking from lesson one'
		},
		{
			profile: 'script-reader',
			emoji: '📖',
			label: 'I can read the script, but know few words',
			sub: 'Learn the course through reading'
		},
		{
			profile: 'speaker',
			emoji: '💬',
			label: 'I speak it, but can’t read it',
			sub: 'Crack the script — the words will follow'
		}
	];

	function choose(p: Profile) {
		sfx.tap();
		progress.setProfile(p);
	}
</script>

<section class="chooser" in:fly={{ y: 12, duration: 250 }}>
	<div class="ask">
		<Mascot mood="idle" size={96} />
		<div class="ask-text">
			<h1>မင်္ဂလာပါ! What’s your Burmese like today?</h1>
			<p>I’ll put the right starting point up front — everything stays open, and you can change this anytime in settings.</p>
		</div>
	</div>
	<div class="choices">
		{#each options as opt (opt.profile)}
			<button class="choice" onclick={() => choose(opt.profile)}>
				<span class="choice-emoji">{opt.emoji}</span>
				<span class="choice-text">
					<span class="choice-label">{opt.label}</span>
					<span class="choice-sub">{opt.sub}</span>
				</span>
			</button>
		{/each}
	</div>
	<button class="skip" onclick={() => choose('explorer')}>Just exploring — show me everything</button>
</section>

<style>
	.chooser {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 18px 0 8px;
	}
	.ask {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.ask h1 {
		font-size: 1.3rem;
		font-weight: 900;
	}
	.ask p {
		margin: 4px 0 0;
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.choices {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.choice {
		display: flex;
		align-items: center;
		gap: 14px;
		text-align: left;
		padding: 14px 18px;
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: 0 4px 0 var(--gold-dark), inset 0 0 0 2px var(--gold);
		transition: translate 0.1s ease, box-shadow 0.1s ease;
	}
	.choice:active {
		translate: 0 4px;
		box-shadow: 0 0 0 var(--gold-dark), inset 0 0 0 2px var(--gold);
	}
	.choice-emoji {
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		font-size: 1.5rem;
		border-radius: 13px;
		background: var(--gold-soft);
		flex-shrink: 0;
	}
	.choice-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.choice-label {
		font-weight: 900;
	}
	.choice-sub {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.skip {
		align-self: center;
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--ink-soft);
		text-decoration: underline;
		padding: 6px 10px;
	}
</style>
