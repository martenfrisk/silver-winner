<script lang="ts">
	import { onMount } from 'svelte';
	import type { ChoiceOption } from '$lib/script-session';
	import SpeakButton from './SpeakButton.svelte';
	import { sfx, speak } from '$lib/audio';
	import { ui } from '$lib/i18n.svelte';

	let {
		question,
		questionKey,
		promptBig,
		promptSpeak,
		options,
		correct,
		timed,
		onanswer
	}: {
		question: string;
		questionKey?: 'what-sound' | 'what-say';
		promptBig?: string;
		promptSpeak?: string;
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
		if (promptSpeak && !timed) {
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
		if (ok) sfx.correct();
		else sfx.wrong();
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
	<h2 class="question">{#if timed}⚡ {/if}{shownQuestion}</h2>
	{#if promptBig}
		<div class="prompt">
			<span class="my big">{promptBig}</span>
			{#if promptSpeak && answered !== null}
				<SpeakButton text={promptSpeak} />
			{/if}
		</div>
	{/if}
	<div class="options" class:glyph-grid={options.some((o) => o.my)}>
		{#each options as opt, i (i)}
			<button
				class="answer-card {cls(i)}"
				onclick={() => tap(i)}
				disabled={answered !== null}
			>
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
		font-size: 1.3rem;
		font-weight: 900;
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
