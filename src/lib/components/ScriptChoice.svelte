<script lang="ts">
	import { onMount } from 'svelte';
	import type { ChoiceOption } from '$lib/script-session';
	import SpeakButton from './SpeakButton.svelte';
	import { sfx, speak } from '$lib/audio';
	import { ui } from '$lib/i18n.svelte';
	import { Zap, Ear } from '@lucide/svelte';

	let {
		question,
		questionKey,
		promptBig,
		promptSpeak,
		speakAfter = false,
		options,
		correct,
		timed,
		onanswer
	}: {
		question: string;
		questionKey?: 'what-sound' | 'what-say' | 'which-hear';
		promptBig?: string;
		promptSpeak?: string;
		/** Hold the audio until after answering (decode-it-yourself drills). */
		speakAfter?: boolean;
		options: ChoiceOption[];
		correct: number;
		timed?: number;
		onanswer: (ok: boolean) => void;
	} = $props();

	let answered = $state<number | null>(null); // -1 = timed out
	let timer: ReturnType<typeof setTimeout>;
	let running = $state(false);

	const shownQuestion = $derived(questionKey ? ui(questionKey).text : question);

	onMount(() => {
		if (promptSpeak && !timed && !speakAfter) {
			const t = setTimeout(() => speak(promptSpeak!), 350);
			return () => clearTimeout(t);
		}
		if (timed) {
			running = true;
			timer = setTimeout(() => {
				if (answered === null) {
					answered = -1;
					sfx.wrong();
					onanswer(false);
				}
			}, timed * 1000);
			return () => clearTimeout(timer);
		}
	});

	function tap(i: number) {
		if (answered !== null) return;
		clearTimeout(timer);
		running = false;
		answered = i;
		const ok = i === correct;
		if (ok) {
			sfx.correct();
			// Always hear the answer, not just on the decode drills that held
			// the audio back: a right answer is the best moment to attach the
			// sound to the shape.
			if (promptSpeak) setTimeout(() => speak(promptSpeak!), 250);
		} else {
			sfx.wrong();
			// Hear what was asked while the correct option is highlighted.
			if (promptSpeak) setTimeout(() => speak(promptSpeak!), 500);
		}
		onanswer(ok);
	}

	function cls(i: number): string {
		if (answered === null) return '';
		if (i === correct) return 'correct';
		return answered === i ? 'wrong' : '';
	}
</script>

<div class="script-choice">
	{#if timed}
		<div class="timer" aria-hidden="true">
			<div class="timer-fill" class:running style="--t: {timed}s"></div>
		</div>
	{/if}
	<h2 class="question">{#if timed}<Zap size={18} strokeWidth={2.2} /> {/if}{shownQuestion}</h2>
	{#if promptBig}
		<div class="prompt">
			<span class="my big" class:word={promptBig.length > 2}>{promptBig}</span>
			{#if promptSpeak && answered !== null}
				<SpeakButton text={promptSpeak} />
			{/if}
		</div>
	{:else if promptSpeak}
		<!-- Listening drill: audio-only prompt, tap to replay. -->
		<div class="prompt listen">
			<span class="listen-ear" aria-hidden="true"><Ear size={22} strokeWidth={2} /></span>
			<SpeakButton text={promptSpeak} size="lg" />
		</div>
	{/if}
	<div class="options" class:glyph-grid={options.some((o) => o.my)}>
		{#each options as opt, i (i)}
			<button
				class="answer-card {cls(i)}"
				onclick={() => tap(i)}
				disabled={answered !== null}
			>
				<span class="key">{i + 1}</span>
				<span class="{opt.my ? 'my glyph-label' : 'label'}">{opt.label}</span>
				{#if opt.sub}<span class="sub">{opt.sub}</span>{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.script-choice {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.timer {
		height: 8px;
		border-radius: 99px;
		background: var(--line);
		overflow: hidden;
	}
	.timer-fill {
		height: 100%;
		width: 100%;
		background: var(--coral);
		border-radius: 99px;
	}
	.timer-fill.running {
		animation: drain var(--t) linear forwards;
	}
	@keyframes drain {
		from { width: 100%; }
		to { width: 0%; }
	}
	.question {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 1.3rem;
		font-weight: 800;
	}
	.question :global(svg) {
		color: var(--gold-ink);
	}
	.prompt {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
	}
	.big {
		font-size: 4.2rem;
		line-height: 1.4;
	}
	.big.word {
		font-size: 2.4rem;
		line-height: 1.6;
		word-break: keep-all;
	}
	.prompt.listen {
		padding: 18px 0;
	}
	.listen-ear {
		display: grid;
		place-items: center;
		color: var(--teal-ink);
	}
	.options {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.options.glyph-grid {
		flex-direction: row;
	}
	.options.glyph-grid .answer-card {
		flex: 1;
	}
	.label {
		font-size: 1.2rem;
		font-weight: 800;
	}
	.glyph-label {
		font-size: 2.4rem;
		line-height: 1.4;
	}
</style>
