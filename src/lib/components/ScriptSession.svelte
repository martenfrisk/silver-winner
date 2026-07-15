<script lang="ts">
	import { goto } from '$app/navigation';
	import { fly, scale } from 'svelte/transition';
	import type { ScriptEx } from '$lib/script-session';
	import { starsFor } from '$lib/script-session';
	import { sfx } from '$lib/audio';
	import { progress } from '$lib/progress.svelte';
	import { ui } from '$lib/i18n.svelte';
	import Mascot from './Mascot.svelte';
	import Confetti from './Confetti.svelte';
	import GlyphIntro from './GlyphIntro.svelte';
	import TraceExercise from './TraceExercise.svelte';
	import ScriptChoice from './ScriptChoice.svelte';
	import WordRead from './WordRead.svelte';

	let {
		initialQueue,
		title,
		xpBase,
		ongrade,
		onfinish
	}: {
		initialQueue: ScriptEx[];
		title: string;
		xpBase: number;
		/** Called once per answered drill (not intros/traces). */
		ongrade?: (glyphId: string, ok: boolean) => void;
		/** Called once when the session completes; returns XP to display. */
		onfinish: (stats: { total: number; mistakes: number; stars: number }) => number;
	} = $props();

	// The queue is fixed at mount; requeues append copies. Intended one-time read.
	// svelte-ignore state_referenced_locally
	let queue = $state<ScriptEx[]>([...initialQueue]);
	let idx = $state(0);
	let mistakes = $state(0);
	let solved = $state(0);
	let answered = $state<null | boolean>(null); // for choice/word
	let traced = $state(false);
	let done = $state(false);
	let stars = $state(0);
	let xpEarned = $state(0);

	const ex = $derived(queue[idx]);
	const pct = $derived(queue.length === 0 ? 0 : (solved / queue.length) * 100);

	function grade(ok: boolean) {
		answered = ok;
		const g = ex && 'glyph' in ex ? ex.glyph.id : ex?.kind === 'choice' ? ex.glyphId : undefined;
		if (ex?.kind === 'choice' || ex?.kind === 'word') {
			if (g) ongrade?.(g, ok);
			if (!ok) {
				mistakes++;
				queue = [...queue, ex]; // practice it again at the end
			}
		}
	}

	const canContinue = $derived.by(() => {
		if (!ex) return false;
		if (ex.kind === 'intro') return true;
		if (ex.kind === 'trace') return traced;
		return answered !== null;
	});

	function advance() {
		if (!canContinue) return;
		if (answered !== false) solved++;
		idx++;
		answered = null;
		traced = false;
		if (idx >= queue.length) finish();
	}

	function finish() {
		stars = starsFor(mistakes);
		xpEarned = onfinish({ total: queue.length, mistakes, stars });
		done = true;
		sfx.fanfare();
	}

	function quit() {
		goto('/script');
	}
</script>

<svelte:head>
	<title>{title} · MyanLingo</title>
</svelte:head>

{#if done}
	<Confetti />
	<div class="complete" in:scale={{ duration: 450, start: 0.7 }}>
		<Mascot mood="celebrate" size={150} />
		<h1>{ui('lesson-complete').text}</h1>
		<div class="stars" aria-label="{stars} of 3 stars">
			{#each [1, 2, 3] as s (s)}
				<span class="star {s <= stars ? 'lit' : ''}" style="animation-delay: {s * 0.18}s">★</span>
			{/each}
		</div>
		<div class="stats">
			<div class="stat">
				<span class="stat-label">{ui('xp-earned').text}</span>
				<span class="stat-value">⚡ {xpEarned}</span>
			</div>
			<div class="stat">
				<span class="stat-label">{ui('accuracy').text}</span>
				<span class="stat-value">🎯 {Math.max(0, Math.round((100 * (queue.length - mistakes)) / Math.max(queue.length, 1)))}%</span>
			</div>
			<div class="stat">
				<span class="stat-label">{ui('streak').text}</span>
				<span class="stat-value">🔥 {progress.streak}</span>
			</div>
		</div>
		<button class="btn green big" onclick={quit}>{ui('continue').text}</button>
	</div>
{:else if ex}
	<div class="session">
		<header>
			<button class="quit" onclick={quit} aria-label="Quit session">✕</button>
			<div class="bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
				<div class="fill" style="width: {pct}%"></div>
			</div>
		</header>

		<main>
			{#key idx}
				<div class="stage" in:fly={{ x: 60, duration: 300 }}>
					{#if ex.kind === 'intro'}
						<GlyphIntro glyph={ex.glyph} />
					{:else if ex.kind === 'trace'}
						<TraceExercise char={ex.glyph.char} oncomplete={() => (traced = true)} />
					{:else if ex.kind === 'choice'}
						<ScriptChoice
							question={ex.question}
							questionKey={ex.questionKey}
							promptBig={ex.promptBig}
							promptSpeak={ex.promptSpeak}
							options={ex.options}
							correct={ex.correct}
							timed={ex.timed}
							onanswer={grade}
						/>
					{:else if ex.kind === 'word'}
						<WordRead word={ex.word} options={ex.options} correct={ex.correct} onanswer={grade} />
					{/if}
				</div>
			{/key}
		</main>

		<footer class:correct={answered === true} class:wrong={answered === false}>
			<div class="actions">
				{#if answered === true}
					<span class="verdict good"><Mascot mood="happy" size={48} /> {['ကောင်းတယ်!', 'Nice!', 'ဟုတ်ပြီ!'][solved % 3]}</span>
				{:else if answered === false}
					<span class="verdict bad"><Mascot mood="sad" size={48} /> {ui('not-quite').text}</span>
				{:else}
					<span></span>
				{/if}
				<button
					class="btn {answered === false ? 'red' : 'green'}"
					onclick={advance}
					disabled={!canContinue}
					title={ui('continue').hint}
				>
					{answered === false ? ui('got-it').text : ui('continue').text}
				</button>
			</div>
		</footer>
	</div>
{/if}

<style>
	.session {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		max-width: 680px;
		margin: 0 auto;
		padding: 0 20px;
	}
	header {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 18px 0;
	}
	.quit {
		font-size: 1.2rem;
		color: var(--ink-soft);
		width: 36px;
		height: 36px;
		border-radius: 10px;
	}
	.quit:hover {
		background: var(--line);
	}
	.bar {
		flex: 1;
		height: 16px;
		border-radius: 99px;
		background: var(--line);
		overflow: hidden;
	}
	.fill {
		height: 100%;
		border-radius: 99px;
		background: var(--plum);
		transition: width 0.5s var(--pop);
	}
	main {
		flex: 1;
		display: grid;
		padding: 12px 0 24px;
	}
	.stage {
		grid-area: 1 / 1;
	}
	footer {
		position: sticky;
		bottom: 0;
		margin: 0 -20px;
		padding: 14px 20px calc(14px + env(safe-area-inset-bottom));
		border-top: 2px solid var(--line);
		background: var(--bg);
		transition: background 0.25s ease;
	}
	footer.correct {
		background: var(--green-soft);
		border-top-color: transparent;
	}
	footer.wrong {
		background: var(--red-soft);
		border-top-color: transparent;
	}
	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		max-width: 680px;
		margin: 0 auto;
	}
	.verdict {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		font-size: 1.1rem;
		font-weight: 900;
	}
	.verdict.good {
		color: var(--green-dark);
	}
	.verdict.bad {
		color: var(--red-dark);
	}

	/* completion */
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
	.complete h1 {
		font-size: 2rem;
		font-weight: 900;
		color: var(--gold-dark);
	}
	.stars {
		display: flex;
		gap: 10px;
		font-size: 3rem;
	}
	.star {
		color: #e3d9c3;
		scale: 0;
		animation: star-in 0.5s var(--spring) forwards;
	}
	.star.lit {
		color: var(--gold);
		text-shadow: 0 2px 0 var(--gold-dark);
	}
	@keyframes star-in {
		to { scale: 1; }
	}
	.stats {
		display: flex;
		gap: 14px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.stat {
		display: flex;
		flex-direction: column;
		gap: 4px;
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 12px 20px;
		min-width: 110px;
	}
	.stat-label {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--ink-soft);
	}
	.stat-value {
		font-size: 1.25rem;
		font-weight: 900;
	}
	.big {
		padding: 16px 48px;
		font-size: 1.1rem;
		margin-top: 8px;
	}
</style>
