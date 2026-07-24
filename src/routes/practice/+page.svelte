<script lang="ts">
	import { goto } from '$app/navigation';
	import { fly, scale } from 'svelte/transition';
	import { buildVocabPracticeQueue, starsFor, type VocabEx } from '$lib/practice-session';
	import { vocabSrs } from '$lib/vocab-srs.svelte';
	import { progress } from '$lib/progress.svelte';
	import { ui } from '$lib/i18n.svelte';
	import { prefetch, sfx, speak } from '$lib/audio';
	import { scriptSheet } from '$lib/script-sheet.svelte';
	import { clickNth, digitOf, isShortcutIgnored } from '$lib/keyboard';
	import Mascot from '$lib/components/Mascot.svelte';
	import Confetti from '$lib/components/Confetti.svelte';
	import ChoiceExercise from '$lib/components/ChoiceExercise.svelte';
	import ListenExercise from '$lib/components/ListenExercise.svelte';
	import AssembleExercise from '$lib/components/AssembleExercise.svelte';
	import RecallCard from '$lib/components/RecallCard.svelte';
	import AnswerReveal from '$lib/components/AnswerReveal.svelte';
	import NoAudioPrompt from '$lib/components/NoAudioPrompt.svelte';
	import VerdictAnnouncer from '$lib/components/VerdictAnnouncer.svelte';
	import HeaderMute from '$lib/components/HeaderMute.svelte';
	import { grammarTip } from '$lib/grammar-tips';
	import { silentSafe } from '$lib/silent-mode';
	import { AttemptTracker, MAX_ATTEMPTS } from '$lib/stuck';
	import { AutoAdvance } from '$lib/auto-advance.svelte';
	import { noAudioPromptState } from '$lib/no-audio-prompt.svelte';

	// The queue is built once at mount; requeues append copies.
	let queue = $state<VocabEx[]>(buildVocabPracticeQueue(progress.profile));
	let idx = $state(0);
	let status = $state<'answer' | 'correct' | 'wrong'>('answer');
	let done = $state(false);
	let mistakes = $state(0);
	let solved = $state(0);
	let xpEarned = $state(0);
	let stars = $state(0);
	let selected = $state<number | null>(null);
	let sequence = $state<string[]>([]);
	let combo = $state(0);
	let maxCombo = $state(0);

	// Misses per word, so a review can't trap you on one item (see $lib/stuck).
	const attempts = new AttemptTracker();
	let retired = $state(false);

	// Correct answers move on by themselves after a beat.
	const auto = new AutoAdvance();

	const item = $derived(queue[idx]);

	// Warm the next step's clip while this one is on screen. Every step type,
	// recall cards included, speaks the vocab word itself.
	$effect(() => {
		prefetch([queue[idx + 1]?.my]);
	});

	// {#key idx} rebuilds the stage per question, dropping focus to <body>.
	// Put it on the new card so keyboard users don't re-tab from the top.
	let stage = $state<HTMLElement>();
	$effect(() => {
		idx;
		stage?.focus({ preventScroll: true });
	});
	// Listening drills become reading drills while audio is off.
	const ex = $derived(item && silentSafe(item.ex, progress.audioOn));
	const total = $derived(queue.length);
	const pct = $derived(total === 0 ? 0 : (solved / total) * 100);
	// Only assemble still needs a Check step; choice/listen check on tap and
	// recall grades itself.
	const canCheck = $derived(ex?.kind === 'assemble' && sequence.length > 0);

	const HAS_MY = /[က-႟]/;

	/** The prominent correct-answer reveal shown after a wrong answer. */
	const reveal = $derived.by(() => {
		if (!ex) return null;
		if (ex.kind === 'recall') return null; // the card does its own reveal
		if (ex.kind === 'assemble')
			return { my: ex.my, sub: progress.showRoman ? ex.roman : undefined, speak: ex.my };
		if (ex.kind === 'choice') {
			const o = ex.options[ex.correct];
			if (HAS_MY.test(o.text))
				return { my: o.text, sub: progress.showRoman ? o.sub : undefined, speak: o.text };
			// English options: anchor (and speak) the Burmese prompt instead.
			if (ex.promptMy)
				return {
					my: ex.promptMy,
					sub: progress.showRoman ? ex.promptRoman : undefined,
					en: o.text,
					speak: ex.promptMy
				};
			return { my: o.text };
		}
		return { my: ex.my, sub: progress.showRoman ? ex.roman : undefined, en: ex.en, speak: ex.my };
	});

	function applyResult(ok: boolean, { autoSpeak = true } = {}) {
		if (!item) return;
		noAudioPromptState.noteAnswer();
		vocabSrs.grade(item.my, ok);
		if (ok) {
			status = 'correct';
			combo++;
			maxCombo = Math.max(maxCombo, combo);
			sfx.correct();
			if (combo > 0 && combo % 5 === 0) sfx.match(); // combo milestone
			auto.start(advance);
		} else {
			status = 'wrong';
			mistakes++;
			combo = 0;
			sfx.wrong();
			// Practice it again at the end — unless it has already come back too
			// many times, in which case defer it to a later session instead of
			// looping on it for the rest of this one.
			retired = !attempts.miss(item.my);
			if (retired) vocabSrs.defer(item.my);
			else queue = [...queue, item];
			// Hear the right answer while the reveal shows it.
			const answerAudio = reveal?.speak;
			if (autoSpeak && answerAudio) setTimeout(() => speak(answerAudio), 600);
		}
	}

	function check() {
		if (!ex || !item || status !== 'answer') return;
		let ok = false;
		if (ex.kind === 'choice' || ex.kind === 'listen') ok = selected === ex.correct;
		else if (ex.kind === 'assemble') ok = sequence.join('') === ex.answer.map((a) => a.t).join('');
		else return; // recall grades itself via onresult
		applyResult(ok);
		// Always hear the word after a right answer, whatever the drill was.
		if (ok && reveal?.speak) speak(reveal.speak);
	}

	/**
	 * Escape hatch: drop the current item without grading it. Nothing is
	 * penalised, it simply stops being this session's problem.
	 */
	function skip() {
		if (!ex || !item || status !== 'answer') return;
		vocabSrs.defer(item.my);
		sfx.tap();
		advance();
	}

	function recallResult(ok: boolean) {
		if (status !== 'answer') return;
		// The card already revealed and spoke the answer — no double audio.
		applyResult(ok, { autoSpeak: false });
	}

	function advance() {
		if (!ex) return;
		auto.cancel();
		if (status !== 'wrong') solved++;
		idx++;
		status = 'answer';
		selected = null;
		sequence = [];
		retired = false;
		if (idx >= queue.length) finish();
	}

	function finish() {
		auto.cancel();
		stars = starsFor(mistakes);
		xpEarned = 10 + (stars === 3 ? 5 : 0) + (maxCombo >= 5 ? 5 : 0);
		progress.addXp(xpEarned);
		done = true;
		sfx.fanfare();
	}

	function quit() {
		auto.cancel();
		goto('/');
	}

	function onkeydown(e: KeyboardEvent) {
		if (isShortcutIgnored(e) || scriptSheet.open) return;
		if (done) {
			if (e.key === 'Enter') quit();
			return;
		}
		if (!ex) return;
		auto.cancel(); // any keypress means "I'm still here" — stop the countdown
		if (e.key === 'Enter') {
			e.preventDefault();
			if (status !== 'answer') advance();
			else if (canCheck) check();
			return;
		}
		if (status !== 'answer') return;
		if (e.key === 'Backspace' && ex.kind === 'assemble') {
			e.preventDefault();
			const placed = document.querySelectorAll<HTMLButtonElement>('.slots .placed-tile');
			placed[placed.length - 1]?.click();
			return;
		}
		const d = digitOf(e);
		if (d === null) return;
		const n = (d === 0 ? 10 : d) - 1;
		if (ex.kind === 'assemble') clickNth('.bank .tile', n);
		else clickNth('.options .answer-card', n);
	}
</script>

<!-- Any touch or click interrupts the auto-advance countdown. -->
<svelte:window {onkeydown} onpointerdown={() => auto.cancel()} />

<svelte:head>
	<title>{ui('practice').text} · Shwe</title>
</svelte:head>

{#if queue.length === 0}
	<div class="empty">
		<Mascot mood="idle" size={120} />
		<h1>Nothing to practice yet</h1>
		<p>Complete a lesson first. Its words come back here for review.</p>
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
			<HeaderMute />
			<button
				class="roman-toggle my"
				onclick={() => scriptSheet.show()}
				title="Script table"
				aria-label="Open the script reference table"
			>
				က
			</button>
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

		<NoAudioPrompt />
		<VerdictAnnouncer {status} answer={reveal?.my} meaning={reveal?.en} />

		<main>
			{#key idx}
				<!-- tabindex -1: a focus target for the new question, not a control. -->
				<div
					class="stage"
					data-stage
					tabindex="-1"
					bind:this={stage}
					in:fly={{ x: 60, duration: 300 }}
				>
					{#if ex.kind === 'choice'}
						<ChoiceExercise {ex} bind:selected {status} onpick={check} />
					{:else if ex.kind === 'listen'}
						<ListenExercise {ex} bind:selected {status} onpick={check} />
					{:else if ex.kind === 'assemble'}
						<AssembleExercise {ex} bind:sequence {status} />
					{:else if ex.kind === 'recall'}
						<RecallCard {ex} onresult={recallResult} />
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
					<button class="btn green" onclick={advance}>
						{ui('continue').text}{#if auto.left > 0}<span class="count">{auto.left}</span>{/if}
					</button>
				</div>
			{:else if status === 'wrong'}
				<div class="feedback stacked" in:fly={{ y: 24, duration: 250 }}>
					<div class="verdict-row">
						<Mascot mood="sad" size={52} />
						<strong>{ui('not-quite').text}</strong>
					</div>
					{#if reveal}
						<AnswerReveal
							my={reveal.my}
							sub={reveal.sub}
							en={reveal.en}
							speakText={reveal.speak}
							tip={grammarTip(reveal.my)}
						/>
					{/if}
					{#if retired}
						<p class="retired">
							That's {MAX_ATTEMPTS} tries. Moving on, this one comes back another day.
						</p>
					{/if}
					<button class="btn red" onclick={advance}>{ui('got-it').text}</button>
				</div>
			{:else}
				<!-- Skip is always available: a review you can't leave is a trap,
				     and skipping just defers the word instead of grading it. -->
				<div class="actions">
					<button class="btn ghost" onclick={skip} title="Come back to this one another day">
						{ui('skip').text}
					</button>
					{#if ex.kind === 'assemble'}
						<button class="btn green" onclick={check} disabled={!canCheck} title={ui('check').hint}>
							{ui('check').text}
						</button>
					{:else if ex.kind === 'recall'}
						<span class="tap-hint">Grade yourself honestly, it drives the schedule</span>
					{:else}
						<span class="tap-hint">{ui('tap-answer').text}</span>
					{/if}
				</div>
			{/if}
		</footer>
	</div>
{/if}

<style>
	/* Fixed-height column so footer state changes never reflow the exercise
	   above (see the note in the lesson player). */
	.practice {
		display: flex;
		flex-direction: column;
		height: 100dvh;
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
		min-height: 0;
		display: grid;
		/* A gutter for animations, not for layout: the correct-answer pop
		   scales a card and the wrong-answer shake slides it sideways, and
		   with overflow-x hidden flush to the card edge both got sliced off
		   on phones, where cards run the full width. The negative margin
		   gives the motion room while keeping the cards the same size. */
		padding: 12px 10px 24px;
		margin: 0 -10px;
		overflow-y: auto;
		overflow-x: hidden;
		overscroll-behavior: contain;
	}
	.stage {
		grid-area: 1 / 1;
	}
	footer {
		flex-shrink: 0;
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
		align-items: center;
		justify-content: space-between;
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
	/* Wrong answers stack so the reveal card gets the full width — see the
	   note in the lesson player. */
	.feedback.stacked {
		flex-direction: column;
		align-items: stretch;
		gap: 10px;
	}
	.verdict-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.feedback.stacked .btn {
		align-self: stretch;
	}
	@media (min-width: 560px) {
		.feedback.stacked .btn {
			align-self: flex-end;
			min-width: 170px;
		}
	}
	/* Phones: fewer pixels on chrome so the panel leaves room for the drill. */
	@media (max-width: 559px) {
		footer {
			padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
		}
		.feedback.stacked,
		.verdict-row {
			gap: 8px;
		}
		.verdict-row :global(.shwe) {
			width: 38px;
			height: 38px;
		}
	}
	footer.correct strong {
		color: var(--green-ink);
		font-size: 1.15rem;
	}
	footer.wrong strong {
		color: var(--red-ink);
		font-size: 1.15rem;
	}
	.tap-hint {
		color: var(--ink-soft);
		font-size: 0.9rem;
		font-weight: 700;
		text-align: right;
	}
	/* Seconds left before the answer moves on by itself (see the lesson player). */
	.count {
		display: inline-grid;
		place-items: center;
		width: 1.35em;
		height: 1.35em;
		margin-left: 8px;
		border-radius: 50%;
		background: rgb(255 255 255 / 30%);
		font-size: 0.8em;
		font-variant-numeric: tabular-nums;
	}
	.retired {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-soft);
		text-wrap: pretty;
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
