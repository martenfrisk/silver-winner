<script lang="ts">
	import { goto } from '$app/navigation';
	import { fly, scale } from 'svelte/transition';
	import { buildVocabPracticeQueue, starsFor, type VocabEx } from '$lib/practice-session';
	import { vocabSrs } from '$lib/vocab-srs.svelte';
	import { progress } from '$lib/progress.svelte';
	import { ui } from '$lib/i18n.svelte';
	import { sfx, speak } from '$lib/audio';
	import { clickNth, digitOf, isShortcutIgnored } from '$lib/keyboard';
	import Mascot from '$lib/components/Mascot.svelte';
	import Confetti from '$lib/components/Confetti.svelte';
	import ChoiceExercise from '$lib/components/ChoiceExercise.svelte';
	import ListenExercise from '$lib/components/ListenExercise.svelte';

	// The queue is built once at mount; requeues append copies.
	let queue = $state<VocabEx[]>(buildVocabPracticeQueue());
	let idx = $state(0);
	let status = $state<'answer' | 'correct' | 'wrong'>('answer');
	let done = $state(false);
	let mistakes = $state(0);
	let solved = $state(0);
	let xpEarned = $state(0);
	let stars = $state(0);
	let selected = $state<number | null>(null);
	let combo = $state(0);
	let maxCombo = $state(0);

	const item = $derived(queue[idx]);
	const ex = $derived(item?.ex);
	const total = $derived(queue.length);
	const pct = $derived(total === 0 ? 0 : (solved / total) * 100);
	const canCheck = $derived(selected !== null);

	const correctAnswerText = $derived.by(() => {
		if (!ex) return '';
		if (ex.kind === 'choice') {
			const o = ex.options[ex.correct];
			return o.sub && progress.showRoman ? `${o.text} (${o.sub})` : o.text;
		}
		if (ex.kind === 'listen') {
			const base = progress.showRoman ? `${ex.my} (${ex.roman})` : ex.my;
			return `${base} — ${ex.en}`;
		}
		return '';
	});

	function check() {
		if (!ex || !item || status !== 'answer') return;
		const ok = selected === ex.correct;
		vocabSrs.grade(item.my, ok);
		if (ok) {
			status = 'correct';
			combo++;
			maxCombo = Math.max(maxCombo, combo);
			sfx.correct();
			if (combo > 0 && combo % 5 === 0) sfx.match(); // combo milestone
			// Reinforce the word's sound on my→en drills, where it wasn't the prompt.
			if (ex.kind === 'choice' && ex.promptMy) speak(ex.promptMy);
		} else {
			status = 'wrong';
			mistakes++;
			combo = 0;
			sfx.wrong();
			queue = [...queue, item]; // practice it again at the end
		}
	}

	function advance() {
		if (!ex) return;
		if (status !== 'wrong') solved++;
		idx++;
		status = 'answer';
		selected = null;
		if (idx >= queue.length) finish();
	}

	function finish() {
		stars = starsFor(mistakes);
		xpEarned = 10 + (stars === 3 ? 5 : 0) + (maxCombo >= 5 ? 5 : 0);
		progress.addXp(xpEarned);
		done = true;
		sfx.fanfare();
	}

	function quit() {
		goto('/');
	}

	function onkeydown(e: KeyboardEvent) {
		if (isShortcutIgnored(e)) return;
		if (done) {
			if (e.key === 'Enter') quit();
			return;
		}
		if (!ex) return;
		if (e.key === 'Enter') {
			e.preventDefault();
			if (status !== 'answer') advance();
			else if (canCheck) check();
			return;
		}
		if (status !== 'answer') return;
		const d = digitOf(e);
		if (d !== null) clickNth('.options .answer-card', (d === 0 ? 10 : d) - 1);
	}
</script>

<svelte:window {onkeydown} />

<svelte:head>
	<title>{ui('practice').text} · MyanLingo</title>
</svelte:head>

{#if queue.length === 0}
	<div class="empty">
		<Mascot mood="idle" size={120} />
		<h1>Nothing to practice yet</h1>
		<p>Complete a lesson first — its words come back here for review.</p>
		<a class="btn" href="/">Back home</a>
	</div>
{:else if done}
	<Confetti />
	<div class="complete" in:scale={{ duration: 450, start: 0.7 }}>
		<Mascot mood="celebrate" size={150} />
		<h1>{ui('practice-complete').text}</h1>
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
	<div class="practice">
		<header>
			<button class="quit" onclick={quit} aria-label="Quit practice">✕</button>
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
					{#if ex.kind === 'choice'}
						<ChoiceExercise {ex} bind:selected {status} />
					{:else if ex.kind === 'listen'}
						<ListenExercise {ex} bind:selected {status} />
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
					{#if combo >= 2}
						<span class="combo-chip" class:hot={combo >= 5}>🔥×{combo}</span>
					{/if}
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
			{:else}
				<div class="actions">
					<button class="btn green" onclick={check} disabled={!canCheck} title={ui('check').hint}>
						{ui('check').text}
					</button>
				</div>
			{/if}
		</footer>
	</div>
{/if}

<style>
	.practice {
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
		background: var(--teal);
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
		justify-content: flex-end;
		gap: 12px;
		max-width: 680px;
		margin: 0 auto;
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
	.combo-chip {
		font-weight: 900;
		font-size: 0.95rem;
		color: var(--gold-ink);
		background: var(--gold-soft);
		border-radius: 99px;
		padding: 6px 12px;
		white-space: nowrap;
		animation: pulse-pop 0.4s ease-in-out;
	}
	.combo-chip.hot {
		color: #fff;
		background: var(--coral);
		box-shadow: 0 2px 0 var(--coral-dark);
	}

	.empty,
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
	.empty h1 {
		font-size: 1.5rem;
		font-weight: 900;
	}
	.empty p {
		color: var(--ink-soft);
		font-weight: 700;
		max-width: 380px;
	}
	.empty .btn {
		text-decoration: none;
	}
	.complete h1 {
		font-size: 2rem;
		font-weight: 900;
		color: var(--teal-ink);
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
</style>
