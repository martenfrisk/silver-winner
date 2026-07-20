<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { fly, scale } from 'svelte/transition';
	import { findLesson, type Exercise } from '$lib/data/course';
	import { progress } from '$lib/progress.svelte';
	import { vocabSrs } from '$lib/vocab-srs.svelte';
	import { ui } from '$lib/i18n.svelte';
	import { sfx, speak } from '$lib/audio';
	import { scriptSheet } from '$lib/script-sheet.svelte';
	import { clickNth, digitOf, isShortcutIgnored } from '$lib/keyboard';
	import Mascot from '$lib/components/Mascot.svelte';
	import Confetti from '$lib/components/Confetti.svelte';
	import LearnCard from '$lib/components/LearnCard.svelte';
	import ChoiceExercise from '$lib/components/ChoiceExercise.svelte';
	import MatchExercise from '$lib/components/MatchExercise.svelte';
	import AssembleExercise from '$lib/components/AssembleExercise.svelte';
	import ListenExercise from '$lib/components/ListenExercise.svelte';
	import AnswerReveal from '$lib/components/AnswerReveal.svelte';
	import NoAudioPrompt from '$lib/components/NoAudioPrompt.svelte';
	import { grammarTip } from '$lib/grammar-tips';
	import { silentSafe } from '$lib/silent-mode';

	const found = findLesson(page.params.id ?? '');

	// Hard mode (crown run): drills only — no learn cards — and a perfect
	// run earns the lesson's crown. Entered from the 👑 chip on completed nodes.
	const hard = page.url.searchParams.get('mode') === 'hard';

	// Wrong answers get re-queued at the end, Duolingo-style.
	let queue = $state<Exercise[]>(
		found
			? hard
				? found.lesson.exercises.filter((e) => e.kind !== 'learn')
				: [...found.lesson.exercises]
			: []
	);
	let idx = $state(0);
	let status = $state<'answer' | 'correct' | 'wrong'>('answer');
	let done = $state(false);
	let mistakes = $state(0);
	let solved = $state(0);
	let xpEarned = $state(0);
	let stars = $state(0);
	let matchReady = $state(false);
	let crowned = $state(false);
	let testedOut = $state(false);

	// Combo: consecutive correct answers. ≥5 at any point earns bonus XP.
	let combo = $state(0);
	let maxCombo = $state(0);

	// Per-exercise input state (reset on advance).
	let selected = $state<number | null>(null);
	let sequence = $state<string[]>([]);

	// Listening drills become reading drills while audio is off, so muting
	// mid-lesson never strands the learner on a question they can't hear.
	const ex = $derived(silentSafe(queue[idx], progress.audioOn));
	const total = $derived(queue.length);
	const pct = $derived(total === 0 ? 0 : (solved / total) * 100);

	// Choice/listen answers check on tap; only assemble still needs Check.
	const canCheck = $derived(ex?.kind === 'assemble' && sequence.length > 0);

	const HAS_MY = /[က-႟]/;

	/** The prominent correct-answer reveal shown after a wrong answer. */
	const reveal = $derived.by(() => {
		if (!ex) return null;
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
		if (ex.kind === 'assemble')
			return { my: ex.my, sub: progress.showRoman ? ex.roman : undefined, speak: ex.my };
		if (ex.kind === 'listen')
			return { my: ex.my, sub: progress.showRoman ? ex.roman : undefined, en: ex.en, speak: ex.my };
		return null;
	});

	function check() {
		if (!ex || status !== 'answer') return;
		let ok = false;
		if (ex.kind === 'choice' || ex.kind === 'listen') ok = selected === ex.correct;
		else if (ex.kind === 'assemble')
			ok = sequence.join('') === ex.answer.map((a) => a.t).join('');

		if (ok) {
			status = 'correct';
			combo++;
			maxCombo = Math.max(maxCombo, combo);
			sfx.correct();
			if (combo > 0 && combo % 5 === 0) sfx.match(); // combo milestone
			if (ex.kind === 'assemble') speak(ex.my);
		} else {
			status = 'wrong';
			mistakes++;
			combo = 0;
			sfx.wrong();
			// Practice it again at the end of the lesson, and remember the word
			// for the /practice review queue (skipped if it maps to no vocab).
			if (ex.kind === 'listen' || ex.kind === 'assemble') vocabSrs.recordMistake(ex.my);
			else if (ex.kind === 'choice')
				vocabSrs.recordMistake(ex.promptMy ?? ex.options[ex.correct].text);
			queue = [...queue, ex];
			// Hear the right answer while the reveal shows it.
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
		sequence = [];
		matchReady = false;
		if (idx >= queue.length) finish();
	}

	function finish() {
		stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
		const comboBonus = maxCombo >= 5 ? 5 : 0;
		if (hard) {
			crowned = mistakes === 0;
			if (crowned) progress.awardCrown(found!.lesson.id);
			if (crowned && !progress.isCompleted(found!.lesson.id)) {
				// Test-out: a perfect hard run on a lesson never done normally
				// completes it too (and so unlocks the next one) — for learners
				// who already speak Burmese and shouldn't have to sit through
				// vocabulary they know.
				testedOut = true;
				xpEarned = progress.completeLesson(found!.lesson.id, 3) + 10 + comboBonus;
				progress.addXp(10 + comboBonus); // crown bonus on top of the completion XP
			} else {
				xpEarned = 15 + (crowned ? 10 : 0) + comboBonus;
				progress.addXp(xpEarned);
			}
		} else {
			xpEarned = progress.completeLesson(found!.lesson.id, stars) + comboBonus;
			if (comboBonus > 0) progress.addXp(comboBonus);
			vocabSrs.introduceLesson(found!.lesson.id);
		}
		done = true;
		sfx.fanfare();
	}

	function quit() {
		goto('/');
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
			if (status !== 'answer' || ex.kind === 'learn') advance();
			else if (ex.kind === 'match') {
				if (matchReady) advance();
			} else if (canCheck) check();
			return;
		}
		if (status !== 'answer') return;
		if (e.key === 'Backspace' && ex.kind === 'assemble') {
			e.preventDefault();
			const placed = document.querySelectorAll<HTMLButtonElement>('.slots .placed-tile');
			placed[placed.length - 1]?.click();
			return;
		}
		// Number keys map to displayed order (components shuffle internally),
		// so dispatch via DOM order; 0 means the 10th card.
		const d = digitOf(e);
		if (d === null) return;
		const n = d === 0 ? 10 : d;
		if (ex.kind === 'choice' || ex.kind === 'listen') clickNth('.options .answer-card', n - 1);
		else if (ex.kind === 'match') clickNth('.cols .answer-card', n - 1);
		else if (ex.kind === 'assemble') clickNth('.bank .tile', n - 1);
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
		{#if hard}
			<p class="crown-result" class:won={crowned}>
				{#if testedOut}
					⚡👑 Tested out — lesson complete, crown earned!
				{:else if crowned}
					👑 Crown earned — a perfect run!
				{:else}
					👑 No crown this time — a crown needs a mistake-free run.
				{/if}
			</p>
		{/if}
		{#if maxCombo >= 5}
			<p class="combo-bonus">🔥 Best combo ×{maxCombo} — +5 XP</p>
		{/if}
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
			{#if hard}
				<span class="hard-badge" title="Hard mode — perfect run earns the crown">👑</span>
			{/if}
			<div class="bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
				<div class="fill" style="width: {pct}%"></div>
			</div>
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

		<main>
			{#key idx}
				<div class="stage" in:fly={{ x: 60, duration: 300 }}>
					{#if ex.kind === 'learn'}
						<LearnCard my={ex.my} roman={ex.roman} en={ex.en} emoji={ex.emoji} note={ex.note} />
					{:else if ex.kind === 'choice'}
						<ChoiceExercise {ex} bind:selected {status} onpick={check} />
					{:else if ex.kind === 'listen'}
						<ListenExercise {ex} bind:selected {status} onpick={check} />
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
						{#if reveal}
							<AnswerReveal
								my={reveal.my}
								sub={reveal.sub}
								en={reveal.en}
								speakText={reveal.speak}
								tip={grammarTip(reveal.my)}
							/>
						{/if}
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
					{#if ex.kind === 'assemble'}
						<button class="btn green" onclick={check} disabled={!canCheck} title={ui('check').hint}>
							{ui('check').text}
						</button>
					{:else}
						<span class="tap-hint">{ui('tap-answer').text}</span>
					{/if}
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
	.tap-hint {
		align-self: center;
		color: var(--ink-soft);
		font-size: 0.9rem;
		font-weight: 700;
	}
	.hard-badge {
		font-size: 1.15rem;
		filter: drop-shadow(0 1px 0 var(--gold-dark));
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
	.crown-result {
		margin: 0;
		font-weight: 800;
		color: var(--ink-soft);
		background: var(--card);
		border-radius: 12px;
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 10px 18px;
	}
	.crown-result.won {
		color: var(--gold-ink);
		box-shadow: inset 0 0 0 2px var(--gold);
	}
	.combo-bonus {
		margin: 0;
		font-weight: 800;
		font-size: 0.95rem;
		color: var(--coral-ink);
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
