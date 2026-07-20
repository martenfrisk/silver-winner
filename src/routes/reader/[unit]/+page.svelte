<script lang="ts">
	// Reader-track session: one course unit's vocabulary, script-only.
	// Romanization is never shown here — that's the whole point of the track.
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { fly, scale } from 'svelte/transition';
	import { course } from '$lib/data/course';
	import {
		buildReaderQueue,
		readerStarsKey,
		starsFor,
		type ReaderExercise
	} from '$lib/reader-session';
	import { progress } from '$lib/progress.svelte';
	import { ui } from '$lib/i18n.svelte';
	import { sfx, speak } from '$lib/audio';
	import { scriptSheet } from '$lib/script-sheet.svelte';
	import { clickNth, digitOf, isShortcutIgnored } from '$lib/keyboard';
	import Mascot from '$lib/components/Mascot.svelte';
	import Confetti from '$lib/components/Confetti.svelte';
	import ChoiceExercise from '$lib/components/ChoiceExercise.svelte';
	import ListenExercise from '$lib/components/ListenExercise.svelte';
	import AnswerReveal from '$lib/components/AnswerReveal.svelte';
	import { grammarTip } from '$lib/grammar-tips';

	const unit = course.find((u) => u.id === page.params.unit);

	// The queue is built once at mount; requeues append copies.
	let queue = $state<ReaderExercise[]>(unit ? buildReaderQueue(unit) : []);
	let idx = $state(0);
	let status = $state<'answer' | 'correct' | 'wrong'>('answer');
	let done = $state(false);
	let mistakes = $state(0);
	let solved = $state(0);
	let xpEarned = $state(0);
	let stars = $state(0);
	let selected = $state<number | null>(null);

	const ex = $derived(queue[idx]);
	const total = $derived(queue.length);
	const pct = $derived(total === 0 ? 0 : (solved / total) * 100);

	/** The prominent correct-answer reveal — script + meaning, no romanization. */
	const reveal = $derived.by(() => {
		if (!ex) return null;
		if (ex.kind === 'choice') {
			const o = ex.options[ex.correct];
			if (ex.promptMy) return { my: ex.promptMy, en: o.text, speak: ex.promptMy };
			return { my: o.text, speak: o.text };
		}
		return { my: ex.my, en: ex.en, speak: ex.my };
	});

	function check() {
		if (!ex || status !== 'answer') return;
		const ok = selected === ex.correct;
		if (ok) {
			status = 'correct';
			sfx.correct();
			// Reinforce the sound on reading drills, where audio wasn't the prompt.
			if (ex.kind === 'choice') speak(ex.promptMy ?? ex.options[ex.correct].text);
		} else {
			status = 'wrong';
			mistakes++;
			sfx.wrong();
			queue = [...queue, ex]; // read it again at the end
			const answerAudio = reveal?.speak;
			if (answerAudio) setTimeout(() => speak(answerAudio), 600);
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
		xpEarned = progress.completeLesson(readerStarsKey(unit!.id), stars);
		done = true;
		sfx.fanfare();
	}

	function quit() {
		goto('/reader');
	}

	function onkeydown(e: KeyboardEvent) {
		if (isShortcutIgnored(e) || scriptSheet.open) return;
		if (done) {
			if (e.key === 'Enter') quit();
			return;
		}
		if (!ex) return;
		if (e.key === 'Enter') {
			e.preventDefault();
			if (status !== 'answer') advance();
			return;
		}
		if (status !== 'answer') return;
		const d = digitOf(e);
		if (d !== null) clickNth('.options .answer-card', (d === 0 ? 10 : d) - 1);
	}
</script>

<svelte:window {onkeydown} />

<svelte:head>
	<title>{unit ? `Reading: ${unit.title}` : 'Reader track'} · MyanLingo</title>
</svelte:head>

{#if !unit}
	<div class="missing">
		<Mascot mood="sad" />
		<p>Hmm, that unit doesn’t exist.</p>
		<a class="btn" href="/reader">Back to the Reader track</a>
	</div>
{:else if done}
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
				<span class="stat-value">🎯 {Math.max(0, Math.round((100 * (total - mistakes)) / Math.max(total, 1)))}%</span>
			</div>
			<div class="stat">
				<span class="stat-label">{ui('streak').text}</span>
				<span class="stat-value">🔥 {progress.streak}</span>
			</div>
		</div>
		<button class="btn green big" onclick={quit}>{ui('continue').text}</button>
	</div>
{:else if ex}
	<div class="reader">
		<header>
			<button class="quit" onclick={quit} aria-label="Quit session">✕</button>
			<div class="bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
				<div class="fill" style="width: {pct}%"></div>
			</div>
			<button
				class="table-btn my"
				onclick={() => scriptSheet.show()}
				title="Script table"
				aria-label="Open the script reference table"
			>
				က
			</button>
		</header>

		<main>
			{#key idx}
				<div class="stage" in:fly={{ x: 60, duration: 300 }}>
					{#if ex.kind === 'choice'}
						<ChoiceExercise {ex} bind:selected {status} onpick={check} />
					{:else}
						<ListenExercise {ex} bind:selected {status} onpick={check} />
					{/if}
				</div>
			{/key}
		</main>

		<footer class:correct={status === 'correct'} class:wrong={status === 'wrong'}>
			{#if status === 'correct'}
				<div class="feedback" in:fly={{ y: 24, duration: 250 }}>
					<Mascot mood="happy" size={64} />
					<div class="feedback-text">
						<strong>{['ကောင်းတယ်!', 'Nice reading!', 'ဟုတ်ပြီ!'][solved % 3]}</strong>
					</div>
					<button class="btn green" onclick={advance}>{ui('continue').text}</button>
				</div>
			{:else if status === 'wrong'}
				<div class="feedback" in:fly={{ y: 24, duration: 250 }}>
					<Mascot mood="sad" size={64} />
					<div class="feedback-text">
						<strong>{ui('not-quite').text}</strong>
						{#if reveal}
							<AnswerReveal my={reveal.my} en={reveal.en} speakText={reveal.speak} tip={grammarTip(reveal.my)} />
						{/if}
					</div>
					<button class="btn red" onclick={advance}>{ui('got-it').text}</button>
				</div>
			{:else}
				<div class="actions">
					<span class="tap-hint">{ui('tap-answer').text}</span>
				</div>
			{/if}
		</footer>
	</div>
{/if}

<style>
	.reader {
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
	.table-btn {
		font-size: 0.95rem;
		font-weight: 900;
		color: var(--teal-ink);
		padding: 6px 10px;
		border-radius: 10px;
		box-shadow: inset 0 0 0 2px var(--line);
		background: var(--card);
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
		justify-content: center;
		max-width: 680px;
		margin: 0 auto;
	}
	.tap-hint {
		color: var(--ink-soft);
		font-size: 0.9rem;
		font-weight: 700;
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
	.missing .btn {
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
