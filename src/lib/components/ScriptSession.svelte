<script lang="ts">
	import { goto } from '$app/navigation';
	import { fly, scale } from 'svelte/transition';
	import type { ScriptEx } from '$lib/script-session';
	import { starsFor } from '$lib/script-session';
	import { strokeData } from '$lib/data/script';
	import { sfx } from '$lib/audio';
	import { scriptSheet } from '$lib/script-sheet.svelte';
	import { scriptNeedsAudio } from '$lib/silent-mode';
	import { AttemptTracker, MAX_ATTEMPTS } from '$lib/stuck';
	import { noAudioPromptState } from '$lib/no-audio-prompt.svelte';
	import { clickNth, digitOf, isShortcutIgnored } from '$lib/keyboard';
	import { progress } from '$lib/progress.svelte';
	import { ui } from '$lib/i18n.svelte';
	import Mascot from './Mascot.svelte';
	import Confetti from './Confetti.svelte';
	import GlyphIntro from './GlyphIntro.svelte';
	import TraceExercise from './TraceExercise.svelte';
	import ScriptChoice from './ScriptChoice.svelte';
	import ScriptNote from './ScriptNote.svelte';
	import WordRead from './WordRead.svelte';
	import SentenceRead from './SentenceRead.svelte';
	import NoAudioPrompt from './NoAudioPrompt.svelte';
	import HeaderMute from './HeaderMute.svelte';

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
	let peeked = $state(false); // memory-trace: peeking counts as a lapse
	let done = $state(false);
	let stars = $state(0);
	let xpEarned = $state(0);

	// Misses per drill, so a glyph you can't place doesn't loop forever
	// (see $lib/stuck). The SRS still has it; it comes back another day.
	const attempts = new AttemptTracker();
	let retired = $state(false);

	const ex = $derived(queue[idx]);
	const pct = $derived(queue.length === 0 ? 0 : (solved / queue.length) * 100);

	// Muting mid-session (the in-session prompt sits right above this) can
	// leave the learner on a drill whose prompt is audio only. "Which one did
	// you hear?" has no silent form — both options are written syllables — so
	// drop it from the queue instead of trapping them on it. Removing rather
	// than skipping keeps the progress bar's denominator honest.
	$effect(() => {
		if (progress.audioOn || !ex || !scriptNeedsAudio(ex)) return;
		queue = queue.filter((_, i) => i !== idx);
		if (idx >= queue.length) finish();
	});

	/** Stable identity for a drill across re-queues. */
	function keyOf(e: ScriptEx): string {
		if (e.kind === 'word') return `word:${e.word.my}`;
		if (e.kind === 'sentence') return `sentence:${e.sentence.my}`;
		if (e.kind === 'choice') return `choice:${e.glyphId}:${e.questionKey ?? e.question}`;
		return `${e.kind}:${'glyph' in e ? e.glyph.id : ''}`;
	}

	function grade(ok: boolean) {
		answered = ok;
		noAudioPromptState.noteAnswer();
		const g = ex && 'glyph' in ex ? ex.glyph.id : ex?.kind === 'choice' ? ex.glyphId : undefined;
		if (ex?.kind === 'choice' || ex?.kind === 'word' || ex?.kind === 'sentence') {
			if (g) ongrade?.(g, ok);
			if (!ok) {
				mistakes++;
				// Practice it again at the end — unless it has already come back
				// too many times, in which case let it go for this session.
				retired = !attempts.miss(keyOf(ex));
				if (!retired) queue = [...queue, ex];
			}
		}
	}

	const canContinue = $derived.by(() => {
		if (!ex) return false;
		if (ex.kind === 'intro' || ex.kind === 'note') return true;
		if (ex.kind === 'trace') return traced;
		return answered !== null;
	});

	function advance() {
		if (!canContinue) return;
		if (answered !== false) solved++;
		idx++;
		answered = null;
		traced = false;
		peeked = false;
		retired = false;
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

	function onkeydown(e: KeyboardEvent) {
		if (isShortcutIgnored(e) || scriptSheet.open) return;
		if (done) {
			if (e.key === 'Enter') quit();
			return;
		}
		if (e.key === 'Enter') {
			e.preventDefault();
			advance(); // no-ops unless canContinue
			return;
		}
		// Number keys tap option cards on choice/word/sentence drills
		// (components shuffle internally, so dispatch via DOM order).
		if (answered !== null) return;
		const d = digitOf(e);
		if (d !== null) clickNth('.options .answer-card', (d === 0 ? 10 : d) - 1);
	}
</script>

<svelte:window {onkeydown} />

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
			<HeaderMute />
		</header>

		<NoAudioPrompt />

		<main>
			{#key idx}
				<div class="stage" in:fly={{ x: 60, duration: 300 }}>
					{#if ex.kind === 'intro'}
						<GlyphIntro glyph={ex.glyph} />
					{:else if ex.kind === 'trace'}
						<TraceExercise
							char={ex.glyph.char}
							label={ex.glyph.sound}
							fromMemory={ex.fromMemory ?? false}
							strokes={strokeData[ex.glyph.id]}
							onpeek={() => (peeked = true)}
							oncomplete={() => {
								traced = true;
								// Memory traces are SRS-graded: clean recall passes,
								// peeking or skipping counts as a lapse.
								if (ex.kind === 'trace' && ex.fromMemory) ongrade?.(ex.glyph.id, !peeked);
							}}
						/>
					{:else if ex.kind === 'choice'}
						<ScriptChoice
							question={ex.question}
							questionKey={ex.questionKey}
							promptBig={ex.promptBig}
							promptSpeak={ex.promptSpeak}
							speakAfter={ex.speakAfter}
							options={ex.options}
							correct={ex.correct}
							timed={ex.timed}
							onanswer={grade}
						/>
					{:else if ex.kind === 'word'}
						<WordRead word={ex.word} options={ex.options} correct={ex.correct} onanswer={grade} />
					{:else if ex.kind === 'sentence'}
						<SentenceRead sentence={ex.sentence} options={ex.options} correct={ex.correct} onanswer={grade} />
					{:else if ex.kind === 'note'}
						<ScriptNote note={ex.note} />
					{/if}
				</div>
			{/key}
		</main>

		<footer class:correct={answered === true} class:wrong={answered === false}>
			<div class="actions">
				{#if answered === true}
					<span class="verdict good"><Mascot mood="happy" size={48} /> {['ကောင်းတယ်!', 'Nice!', 'ဟုတ်ပြီ!'][solved % 3]}</span>
				{:else if answered === false}
					<span class="verdict bad">
						<Mascot mood="sad" size={48} />
						{retired ? `That's ${MAX_ATTEMPTS} tries, moving on` : ui('not-quite').text}
					</span>
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
	/* Fixed-height column so footer state changes never reflow the drill
	   above (see the note in the lesson player). */
	.session {
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
		color: var(--green-ink);
	}
	.verdict.bad {
		color: var(--red-ink);
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
		color: var(--gold-ink);
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
