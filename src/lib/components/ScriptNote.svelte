<script lang="ts">
	import type { UnitNote } from '$lib/data/script';

	let { note }: { note: UnitNote } = $props();
</script>

<div class="script-note">
	<p class="tag">📚 Good to know</p>
	<h2 class="title">{note.title}</h2>
	<p class="body">{note.body}</p>
	{#if note.examples}
		<div class="examples">
			{#each note.examples as ex (ex.my)}
				<div class="example">
					<span class="my ex-my">{ex.my}</span>
					<span class="ex-sub">{ex.sub}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.script-note {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 12px;
		padding: 8px 0;
	}
	.tag {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--gold-dark);
	}
	.title {
		font-size: 1.4rem;
		font-weight: 900;
	}
	.body {
		margin: 0;
		max-width: 440px;
		font-size: 1rem;
		font-weight: 700;
		color: var(--ink-soft);
		background: var(--gold-soft);
		border-radius: 12px;
		padding: 12px 18px;
	}
	.examples {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		justify-content: center;
		padding-top: 6px;
	}
	.example {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 14px 18px;
		min-width: 90px;
	}
	.ex-my {
		font-size: 2.6rem;
		line-height: 1.5;
	}
	.ex-sub {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
</style>
