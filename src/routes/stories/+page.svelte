<script lang="ts">
	import { stories, storyStarsKey } from '$lib/data/stories';
	import { allLessons } from '$lib/data/course';
	import { progress } from '$lib/progress.svelte';
	import Mascot from '$lib/components/Mascot.svelte';
	import { BookOpen, Lock, ArrowLeft } from '@lucide/svelte';

	const lessonTitle = (id: string) =>
		allLessons.find((l) => l.lesson.id === id)?.lesson.title ?? id;

	function unlocked(requires: string[]): boolean {
		return requires.every((id) => progress.isCompleted(id));
	}

	function missing(requires: string[]): string[] {
		return requires.filter((id) => !progress.isCompleted(id)).map(lessonTitle);
	}
</script>

<svelte:head>
	<title>Stories · Shwe</title>
</svelte:head>

<div class="stories-home">
	<header>
		<a class="back" href="/" aria-label="Back home"><ArrowLeft size={22} strokeWidth={2} /></a>
		<h1><BookOpen size={24} strokeWidth={2} /> Stories</h1>
	</header>

	<div class="intro">
		<Mascot mood="idle" size={84} />
		<p>
			Tiny real conversations made of <strong>words you've already learned</strong>.
			Listen line by line, tap any word you've forgotten.
		</p>
	</div>

	<div class="list">
		{#each stories as story (story.id)}
			{@const isOpen = unlocked(story.requires)}
			{@const done = storyStarsKey(story.id) in progress.stars}
			{#if isOpen}
				<a class="story-card" href="/stories/{story.id}">
					<span class="story-emoji">{story.emoji}</span>
					<span class="story-text">
						<span class="story-title">{story.title}</span>
						<span class="story-sub">{story.blurb} · {story.lines.length} lines</span>
					</span>
					<span class="story-state">{done ? '★' : '→'}</span>
				</a>
			{:else}
				<div class="story-card locked">
					<span class="story-emoji"><Lock size={20} strokeWidth={2} /></span>
					<span class="story-text">
						<span class="story-title">{story.title}</span>
						<span class="story-sub">Finish {missing(story.requires).join(' + ')} first</span>
					</span>
				</div>
			{/if}
		{/each}
	</div>
</div>

<style>
	.stories-home {
		max-width: 560px;
		margin: 0 auto;
		padding: 0 20px 60px;
	}
	header {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 18px 0 6px;
	}
	.back {
		font-size: 1.3rem;
		font-weight: 900;
		color: var(--ink-soft);
		text-decoration: none;
		width: 36px;
		height: 36px;
		display: grid;
		place-items: center;
		border-radius: 10px;
	}
	.back:hover {
		background: var(--line);
	}
	h1 {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 400;
		font-size: 1.6rem;
		color: var(--ink);
	}
	h1 :global(svg) {
		color: var(--coral-ink);
	}
	.intro {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 10px 0 6px;
	}
	.intro p {
		font-weight: 700;
		color: var(--ink-soft);
	}
	.intro strong {
		color: var(--ink);
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding-top: 18px;
	}
	.story-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 18px;
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: 0 4px 0 var(--coral-dark), inset 0 0 0 2px var(--coral);
		text-decoration: none;
		color: var(--ink);
		transition: translate 0.1s ease, box-shadow 0.1s ease;
	}
	a.story-card:active {
		translate: 0 4px;
		box-shadow: 0 0 0 var(--coral-dark), inset 0 0 0 2px var(--coral);
	}
	.story-card.locked {
		box-shadow: inset 0 0 0 2px var(--line);
		opacity: 0.75;
	}
	.story-emoji {
		width: 48px;
		height: 48px;
		display: grid;
		place-items: center;
		font-size: 1.6rem;
		border-radius: 14px;
		background: var(--coral-soft, var(--line));
		flex-shrink: 0;
	}
	.story-card.locked .story-emoji {
		background: var(--line);
	}
	.story-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.story-title {
		font-weight: 900;
	}
	.story-sub {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.story-state {
		font-size: 1.15rem;
		font-weight: 900;
		color: var(--gold-ink);
	}
</style>
