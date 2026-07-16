<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { fly, scale } from 'svelte/transition';
	import { findLesson, type Exercise } from '$lib/data/course';
	import { progress } from '$lib/progress.svelte';
	import { ui } from '$lib/i18n.svelte';
	import { sfx, speak } from '$lib/audio';
	import Mascot from '$lib/components/Mascot.svelte';
	import Confetti from '$lib/components/Confetti.svelte';
	import LearnCard from '$lib/components/LearnCard.svelte';
	import ChoiceExercise from '$lib/components/ChoiceExercise.svelte';
	import MatchExercise from '$lib/components/MatchExercise.svelte';
	import AssembleExercise from '$lib/components/AssembleExercise.svelte';

	const found = findLesson(page.params.id ?? '');

	// Wrong answers get re-queued at the end, Duolingo-style.
	let queue = $state<Exercise[]>(found ? [...found.lesson.exercises] : []);
	let idx = $state(0);
	let status = $state<'answer' | 'correct' | 'wrong'>('answer');
	let done = $state(false);
	let mistakes = $state(0);
	let solved = $state(0);
	let xpEarned = $state(0);
	let stars = $state(0);
	let matchReady = $state(false);

	// Per-exercise input state (reset on advance).
	let selected = $state<number | null>(null);
	let sequence = $state<string[]>([]);

	const ex = $derived(queue[idx]);
	const total = $derived(queue.length);
	const pct = $derived(total === 0 ? 0 : (solved / total) * 100);

	const canCheck = $derived.by(() => {
		if (!ex) return false;
		if (ex.kind === 'choice') return selected !== null;
		if (ex.kind === 'assemble') return sequence.length > 0;
		return false;
	});

	const correctAnswerText = $derived.by(() => {
		if (!ex) return '';
		if (ex.kind === 'choice') {
			const o = ex.options[ex.correct];
			return o.sub && progress.showRoman ? `${o.text} (${o.sub})` : o.text;
		}
		if (ex.kind === 'assemble') return progress.showRoman ? `${ex.my} — ${ex.roman}` : ex.my;
		return '';
	});

	function check() {
		if (!ex || status !== 'answer') return;
		let ok = false;
		if (ex.kind === 'choice') ok = selected === ex.correct;
		else if (ex.kind === 'assemble')
			ok = sequence.join('') === ex.answer.map((a) => a.t).join('');

		if (ok) {
			status = 'correct';
			sfx.correct();
			if (ex.kind === 'assemble') speak(ex.my);
		} else {
			status = 'wrong';
			mistakes++;
			sfx.wrong();
			// Practice it again at the end of the lesson.
			queue = [...queue, ex];
		}
	}

	function advance() {
		if (!ex) return;
		if (status !== 'wrong') solved++;
		idx++;
		status = 'answer';
		selected = null;
		sequence = [];
		matchReady = false;
		if (idx >= queue.length) finish();
	}

	function finish() {
		stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
		xpEarned = progress.completeLesson(found!.lesson.id, stars);
		done = true;
		sfx.fanfare();
	}

	function quit() {
		goto('/');
	}

	function onkeydown(e: KeyboardEvent) {
		if (done || !ex) return;
		if (e.key === 'Enter') {
			e.preventDefault();
			if (status !== 'answer' || ex.kind === 'learn') advance();
			else if (ex.kind === 'match') {
				if (matchReady) advance();
			} else if (canCheck) check();
		}
		if (ex.kind === 'choice' && status === 'answer') {
			const n = Number(e.key);
			if (n >= 1 && n <= ex.options.length) {
				// Number keys map to displayed order; simplest is first..last as rendered.
				// The component shuffles internally, so map via its DOM order instead:
				const buttons = document.querySelectorAll<HTMLButtonElement>('.options .answer-card');
				buttons[n - 1]?.click();
			}
		}
	}
</script>

<svelte:window {onkeydown} />

<svelte:head>
	<title>{found ? `${found.lesson.title} · MyanLingo` : 'MyanLingo'}</title>
</svelte:head>

{#if !found}
	<div class="missing">
		<Mascot mood="sad" />
		<p>Hmm, that lesson doesn’t exist.</p>
		<a class="btn" href="/">Back home</a>
	</div>
{:else if done}
	<Confetti />
	<div class="complete" in:scale={{ duration: 450, start: 0.7 }}>
		<Mascot mood="celebrate" size={150} />
		<h1>{ui('lesson-complete').text}</h1>
		<p class="my complete-my">အရမ်းကောင်းတယ်! <span class="complete-roman">(a-yan kaung-deh — awesome!)</span></p>
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
				<span class="stat-value">🎯 {Math.max(0, Math.round((100 * (total - mistakes)) / Math.max(total, 1)))}%</span>
			</div>
			<div class="stat">
				<span class="stat-label">{ui('streak').text}</span>
				<span class="stat-value">🔥 {progress.streak}</span>
			</div>
		</div>
		<button class="btn green big" onclick={quit}>{ui('continue').text}</button>
	</div>
{:else}
	<div class="lesson">
		<header>
			<button class="quit" onclick={quit} aria-label="Quit lesson">✕</button>
			<div class="bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
				<div class="fill" style="width: {pct}%"></div>
			</div>
			<button
				class="roman-toggle"
				class:off={!progress.showRoman}
				onclick={() => progress.toggleRoman()}
				title={progress.showRoman ? 'Hide romanization' : 'Show romanization'}
				aria-pressed={progress.showRoman}
			>
				Aa
			</button>
		</header>

		<main>
			{#key idx}
				<div class="stage" in:fly={{ x: 60, duration: 300 }}>
					{#if ex.kind === 'learn'}
						<LearnCard my={ex.my} roman={ex.roman} en={ex.en} emoji={ex.emoji} note={ex.note} />
					{:else if ex.kind === 'choice'}
						<ChoiceExercise {ex} bind:selected {status} />
					{:else if ex.kind === 'assemble'}
						<AssembleExercise {ex} bind:sequence {status} />
					{:else if ex.kind === 'match'}
						<MatchExercise {ex} oncomplete={() => (matchReady = true)} onmiss={() => mistakes++} />
					{/if}
				</div>
			{/key}
		</main>

		<footer class:correct={status === 'correct'} class:wrong={status === 'wrong'}>
			{#if status === 'correct'}
				<div class="feedback" in:fly={{ y: 24, duration: 250 }}>
					<Mascot mood="happy" size={64} />
					<div class="feedback-text">
						<strong>{['ကောင်းတယ်! Nice!', 'Great job!', 'ဟုတ်ပြီ! Correct!'][solved % 3]}</strong>
					</div>
					<button class="btn green" onclick={advance}>{ui('continue').text}</button>
				</div>
			{:else if status === 'wrong'}
				<div class="feedback" in:fly={{ y: 24, duration: 250 }}>
					<Mascot mood="sad" size={64} />
					<div class="feedback-text">
						<strong>{ui('not-quite').text}</strong>
						{#if correctAnswerText}<span class="answer my">{ui('answer').text}: {correctAnswerText}</span>{/if}
					</div>
					<button class="btn red" onclick={advance}>{ui('got-it').text}</button>
				</div>
			{:else if ex.kind === 'learn'}
				<div class="actions">
					<button class="btn" onclick={advance}>{ui('continue').text}</button>
				</div>
			{:else if ex.kind === 'match'}
				<div class="actions">
					<button class="btn green" onclick={advance} disabled={!matchReady}>
						{matchReady ? ui('continue').text : ui('match-pairs').text}
					</button>
				</div>
			{:else}
				<div class="actions">
					<button class="btn ghost" onclick={advance} title={ui('skip').hint}>{ui('skip').text}</button>
					<button class="btn green" onclick={check} disabled={!canCheck} title={ui('check').hint}>
						{ui('check').text}
					</button>
				</div>
			{/if}
		</footer>
	</div>
{/if}

<style>
	.lesson {
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
		transition: background 0.15s ease;
	}
	.quit:hover {
		background: var(--line);
	}
	.roman-toggle {
		font-size: 0.9rem;
		font-weight: 900;
		color: var(--teal-ink);
		padding: 6px 10px;
		border-radius: 10px;
		box-shadow: inset 0 0 0 2px var(--line);
		background: var(--card);
		transition: opacity 0.15s ease;
	}
	.roman-toggle.off {
		color: var(--ink-soft);
		text-decoration: line-through;
		opacity: 0.6;
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
		background: var(--gold);
		transition: width 0.5s var(--pop);
		position: relative;
	}
	.fill::after {
		content: '';
		position: absolute;
		inset: 3px 6px auto;
		height: 4px;
		border-radius: 99px;
		background: rgb(255 255 255 / 40%);
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
		padding: 16px 20px calc(16px + env(safe-area-inset-bottom));
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
		justify-content: space-between;
		gap: 12px;
		max-width: 680px;
		margin: 0 auto;
	}
	.actions .btn:only-child {
		margin-left: auto;
	}
	.feedback {
		display: flex;
		align-items: center;
		gap: 14px;
		max-width: 680px;
		margin: 0 auto;
	}
	.feedback-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	footer.correct strong {
		color: var(--green-ink);
		font-size: 1.15rem;
	}
	footer.wrong strong {
		color: var(--red-ink);
		font-size: 1.15rem;
	}
	.answer {
		color: var(--red-ink);
		font-size: 0.95rem;
	}

	/* completion screen */
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
		color: var(--gold-ink);
	}
	.complete-my {
		margin: 0;
		font-size: 1.2rem;
	}
	.complete-roman {
		font-family: var(--font-ui);
		font-size: 0.9rem;
		color: var(--ink-soft);
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
