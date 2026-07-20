<script lang="ts">
	// Story player: lines appear one at a time with audio; every chunk is
	// tap-to-gloss. Ends with one comprehension question — first-try correct
	// earns 3 stars, otherwise 1 (XP via the shared completeLesson path).
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { fly, scale } from 'svelte/transition';
	import { lineMy, storyById, storyStarsKey } from '$lib/data/stories';
	import { progress } from '$lib/progress.svelte';
	import { ui } from '$lib/i18n.svelte';
	import { sfx, speak } from '$lib/audio';
	import Mascot from '$lib/components/Mascot.svelte';
	import Confetti from '$lib/components/Confetti.svelte';

	const story = storyById.get(page.params.id ?? '');

	let shown = $state(1); // lines revealed so far
	let phase = $state<'read' | 'check' | 'done'>('read');
	let picked = $state<number | null>(null);
	let missedCheck = $state(false);
	let stars = $state(0);
	let xpEarned = $state(0);
	/** The chunk whose gloss is open, as `${lineIdx}:${chunkIdx}`. */
	let openGloss = $state<string | null>(null);

	$effect(() => {
		// Speak each line as it appears (also fires for line 0 on mount).
		if (story && phase === 'read') speak(lineMy(story.lines[shown - 1]));
	});

	function next() {
		if (!story) return;
		openGloss = null;
		if (shown < story.lines.length) {
			shown++;
		} else {
			phase = 'check';
		}
	}

	function tapGloss(key: string) {
		openGloss = openGloss === key ? null : key;
	}

	function answer(i: number) {
		if (!story || picked !== null) return;
		picked = i;
		if (i === story.check.correct) {
			sfx.correct();
			finish();
		} else {
			sfx.wrong();
			missedCheck = true;
			// Let them try again: brief red flash, then reset the pick.
			setTimeout(() => (picked = null), 900);
		}
	}

	function finish() {
		if (!story) return;
		stars = missedCheck ? 1 : 3;
		xpEarned = progress.completeLesson(storyStarsKey(story.id), stars);
		phase = 'done';
		sfx.fanfare();
	}

	function replayLine(i: number) {
		if (story) speak(lineMy(story.lines[i]));
	}
</script>

<svelte:head>
	<title>{story ? story.title : 'Stories'} · MyanLingo</title>
</svelte:head>

{#if !story}
	<div class="missing">
		<Mascot mood="sad" />
		<p>Hmm, that story doesn’t exist.</p>
		<a class="btn" href="/stories">Back to stories</a>
	</div>
{:else if phase === 'done'}
	<Confetti />
	<div class="complete" in:scale={{ duration: 450, start: 0.7 }}>
		<Mascot mood="celebrate" size={150} />
		<h1>Story complete!</h1>
		<div class="stars" aria-label="{stars} of 3 stars">
			{#each [1, 2, 3] as s (s)}
				<span class="star {s <= stars ? 'lit' : ''}" style="animation-delay: {s * 0.18}s">★</span>
			{/each}
		</div>
		<p class="earned">⚡ {xpEarned} {ui('xp-earned').text}</p>
		<a class="btn green big" href="/stories">{ui('continue').text}</a>
	</div>
{:else}
	<div class="story">
		<header>
			<a class="quit" href="/stories" aria-label="Quit story">✕</a>
			<span class="story-name">{story.emoji} {story.title}</span>
			<span class="counter">{Math.min(shown, story.lines.length)}/{story.lines.length}</span>
		</header>

		<main>
			<div class="lines">
				{#each story.lines.slice(0, shown) as line, li (li)}
					<div class="line {line.speaker}" in:fly={{ y: 16, duration: 250 }}>
						{#if line.speaker === 'a'}<span class="avatar">🐱</span>{/if}
						<div class="bubble">
							<div class="chunks">
								{#each line.chunks as chunk, ci (ci)}
									{@const key = `${li}:${ci}`}
									<button
										class="chunk my"
										class:open={openGloss === key}
										onclick={() => tapGloss(key)}
									>
										{chunk.my}{#if chunk.isNew}<span class="new-dot" title="New word">•</span>{/if}
									</button>
								{/each}
								<button class="replay" onclick={() => replayLine(li)} aria-label="Replay line">🔊</button>
							</div>
							{#if openGloss?.startsWith(`${li}:`)}
								{@const chunk = line.chunks[Number(openGloss.split(':')[1])]}
								<p class="gloss" in:fly={{ y: 6, duration: 150 }}>
									<span class="my gloss-my">{chunk.my}</span> = {chunk.en}
								</p>
							{/if}
							{#if progress.showRoman}<p class="roman">{line.roman}</p>{/if}
							<p class="line-en">{line.en}</p>
						</div>
						{#if line.speaker === 'b'}<span class="avatar">🧑</span>{/if}
					</div>
				{/each}

				{#if phase === 'check'}
					<div class="check" in:fly={{ y: 16, duration: 250 }}>
						<h2>{story.check.question}</h2>
						<div class="options">
							{#each story.check.options as opt, i (i)}
								<button
									class="answer-card {picked === i ? (i === story.check.correct ? 'correct' : 'wrong') : ''}"
									onclick={() => answer(i)}
								>
									<span class="key">{i + 1}</span>
									{opt}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</main>

		{#if phase === 'read'}
			<footer>
				<button class="btn green wide" onclick={next}>
					{shown < story.lines.length ? ui('continue').text : 'Got it — quick question!'}
				</button>
			</footer>
		{/if}
	</div>
{/if}

<style>
	.story {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		max-width: 620px;
		margin: 0 auto;
		padding: 0 20px;
	}
	header {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 18px 0;
	}
	.quit {
		font-size: 1.2rem;
		color: var(--ink-soft);
		text-decoration: none;
		width: 36px;
		height: 36px;
		display: grid;
		place-items: center;
		border-radius: 10px;
	}
	.quit:hover {
		background: var(--line);
	}
	.story-name {
		flex: 1;
		font-weight: 900;
	}
	.counter {
		font-weight: 800;
		font-size: 0.85rem;
		color: var(--ink-soft);
	}
	main {
		flex: 1;
		padding-bottom: 24px;
	}
	.lines {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.line {
		display: flex;
		align-items: flex-end;
		gap: 10px;
	}
	.line.b {
		justify-content: flex-end;
	}
	.avatar {
		font-size: 1.5rem;
	}
	.bubble {
		max-width: 82%;
		background: var(--card);
		border-radius: 18px;
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 12px 16px;
	}
	.line.a .bubble {
		border-bottom-left-radius: 6px;
	}
	.line.b .bubble {
		border-bottom-right-radius: 6px;
		background: var(--gold-soft);
		box-shadow: inset 0 0 0 2px var(--gold);
	}
	.chunks {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}
	.chunk {
		font-size: 1.25rem;
		line-height: 1.6;
		padding: 2px 6px;
		border-radius: 8px;
		transition: background 0.12s ease;
	}
	.chunk:hover,
	.chunk.open {
		background: var(--teal-soft);
	}
	.new-dot {
		color: var(--coral);
		font-weight: 900;
		margin-left: 2px;
	}
	.replay {
		font-size: 0.95rem;
		opacity: 0.7;
		padding: 2px 4px;
	}
	.gloss {
		margin: 6px 0 0;
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--teal-ink);
		background: var(--teal-soft);
		border-radius: 8px;
		padding: 5px 10px;
		display: inline-block;
	}
	.gloss-my {
		font-size: 1rem;
	}
	.roman {
		margin: 6px 0 0;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--teal-dark);
	}
	.line-en {
		margin: 4px 0 0;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.check {
		margin-top: 10px;
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 18px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.check h2 {
		font-size: 1.15rem;
		font-weight: 900;
	}
	.options {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	footer {
		position: sticky;
		bottom: 0;
		margin: 0 -20px;
		padding: 14px 20px calc(14px + env(safe-area-inset-bottom));
		border-top: 2px solid var(--line);
		background: var(--bg);
	}
	.wide {
		width: 100%;
	}

	.missing,
	.complete {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 18px;
		text-align: center;
		padding: 24px;
	}
	.missing .btn,
	.complete .btn {
		text-decoration: none;
	}
	.complete h1 {
		font-size: 2rem;
		font-weight: 900;
		color: var(--coral-ink);
	}
	.earned {
		font-weight: 900;
		font-size: 1.1rem;
	}
	.stars {
		display: flex;
		gap: 10px;
		font-size: 3rem;
	}
	.star {
		color: var(--star-dim);
		scale: 0;
		animation: star-in 0.5s var(--spring) forwards;
	}
	.star.lit {
		color: var(--gold);
		text-shadow: 0 2px 0 var(--gold-dark);
	}
	@keyframes star-in {
		to {
			scale: 1;
		}
	}
	.big {
		padding: 16px 48px;
		font-size: 1.1rem;
	}
</style>
