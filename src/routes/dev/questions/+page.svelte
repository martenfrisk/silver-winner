<script lang="ts">
	// Every exercise variant on one page, in every feedback state.
	//
	// Not linked from anywhere and not part of the course — it exists so a
	// rendering problem can be seen all at once instead of played to. Reach
	// it at /dev/questions.
	//
	// The exercises are real component instances with sample data, so what
	// renders here is what a session renders. Audio is left alone: components
	// speak on mount, which is expected on this page too.
	import type { Exercise } from '$lib/data/course';
	import type { RecallEx } from '$lib/practice-session';
	import { progress } from '$lib/progress.svelte';
	import { syllables } from '$lib/burmese';
	import { silentSafe } from '$lib/silent-mode';
	import { grammarTip } from '$lib/grammar-tips';
	import LearnCard from '$lib/components/LearnCard.svelte';
	import ChoiceExercise from '$lib/components/ChoiceExercise.svelte';
	import ListenExercise from '$lib/components/ListenExercise.svelte';
	import AssembleExercise from '$lib/components/AssembleExercise.svelte';
	import MatchExercise from '$lib/components/MatchExercise.svelte';
	import RecallCard from '$lib/components/RecallCard.svelte';
	import AnswerReveal from '$lib/components/AnswerReveal.svelte';
	import Mascot from '$lib/components/Mascot.svelte';

	type Status = 'answer' | 'correct' | 'wrong';
	const STATUSES: Status[] = ['answer', 'correct', 'wrong'];

	// Which feedback state the drills render in. One control drives them all,
	// because comparing the same variant across states is the usual question.
	let status = $state<Status>('answer');
	/** Simulates the header's temporary mute, which rewrites listening drills. */
	let silent = $state(false);

	const learn = {
		word: { my: 'မင်္ဂလာပါ', roman: 'min-ga-la-ba', en: 'Hello', emoji: '👋',
			note: 'The all-purpose Burmese greeting, literally “auspiciousness to you”.' },
		// The case the emoji change is about: a letter has no honest pictogram.
		letter: { my: 'က', roman: 'ka', en: 'The letter “ka”',
			note: 'The first letter of the alphabet, ka-gyi (“big ka”).' },
		noExtras: { my: 'ရေ', roman: 'yei', en: 'Water' }
	};

	const choiceMyEn: Exercise = {
		kind: 'choice',
		question: 'What does this mean?',
		promptMy: 'မဟုတ်ဘူး',
		promptRoman: 'ma-hote-bu',
		options: [{ text: 'No' }, { text: 'Yes' }, { text: 'Hello' }],
		correct: 0
	};

	const choiceEnMy: Exercise = {
		kind: 'choice',
		question: 'How do you say “Thank you”?',
		options: [
			{ text: 'ကျေးဇူးတင်ပါတယ်', sub: 'kyei-zu tin-ba-deh' },
			{ text: 'မင်္ဂလာပါ', sub: 'min-ga-la-ba' },
			{ text: 'တာ့တာ', sub: 'ta-ta' }
		],
		correct: 0
	};

	// The letter drills are audio-first by design — never "which letter is 'ka'?"
	const listenLetter: Exercise = {
		kind: 'listen',
		my: 'က',
		roman: 'ka',
		en: 'The letter “ka”',
		options: [
			{ text: 'က', sub: 'ka' },
			{ text: 'ခ', sub: 'kha' },
			{ text: 'ဂ', sub: 'ga' }
		],
		correct: 0
	};

	const listenWord: Exercise = {
		kind: 'listen',
		my: 'ဟုတ်ကဲ့',
		roman: 'hote-kéh',
		en: 'Yes',
		options: [
			{ text: 'ဟုတ်ကဲ့', sub: 'hote-kéh' },
			{ text: 'မဟုတ်ဘူး', sub: 'ma-hote-bu' },
			{ text: 'မင်္ဂလာပါ', sub: 'min-ga-la-ba' }
		],
		correct: 0
	};

	const assembleSentence: Exercise = {
		kind: 'assemble',
		question: 'Build the sentence: “I’m fine”',
		answer: [
			{ t: 'နေ', sub: 'nei' },
			{ t: 'ကောင်း', sub: 'kaung' },
			{ t: 'ပါ', sub: 'ba' },
			{ t: 'တယ်', sub: 'deh' }
		],
		extras: [
			{ t: 'လား', sub: 'la' },
			{ t: 'ဘူး', sub: 'bu' }
		],
		my: 'နေကောင်းပါတယ်',
		roman: 'nei-kaung-ba-deh'
	};

	/** Practice builds its tiles by syllable — the mark-tile bug lives here. */
	function buildFrom(my: string, en: string, extras: string[]): Exercise {
		return {
			kind: 'assemble',
			question: `Build “${en.replace(/[“”"]/g, '')}”`,
			answer: syllables(my).map((t) => ({ t })),
			extras: extras.map((t) => ({ t })),
			my,
			roman: ''
		};
	}

	// Words whose tiles used to come out as stranded marks (ာ, း, ်).
	const markWords = [
		buildFrom('ကျောင်း', 'School', ['ရေ', 'ဒါ']),
		buildFrom('ဈေး', 'Market', ['လာ', 'ပါ']),
		buildFrom('မင်္ဂလာပါ', 'Hello', ['ရေ', 'မည်'])
	];

	const match: Exercise = {
		kind: 'match',
		pairs: [
			{ l: 'မင်္ဂလာပါ', lSub: 'min-ga-la-ba', r: 'Hello' },
			{ l: 'ကျေးဇူးတင်ပါတယ်', lSub: 'kyei-zu tin-ba-deh', r: 'Thank you' },
			{ l: 'ဟုတ်ကဲ့', lSub: 'hote-kéh', r: 'Yes' },
			{ l: 'မဟုတ်ဘူး', lSub: 'ma-hote-bu', r: 'No' }
		]
	};

	const recall: RecallEx = { kind: 'recall', my: 'ကျောင်း', roman: 'kyaung', en: 'School' };

	// Drills re-key on these so a state change remounts them cleanly.
	let generation = $state(0);
	const drillKey = $derived(`${status}-${silent}-${generation}`);

	const drills: { title: string; note: string; ex: Exercise }[] = $derived(
		[
			{ title: 'Choice · Burmese → English', note: 'Big speakable prompt above the options', ex: choiceMyEn },
			{ title: 'Choice · English → Burmese', note: 'No prompt; the question carries the meaning', ex: choiceEnMy },
			{ title: 'Listen · letter', note: 'Replaces the old “Which letter is ‘ka’?”', ex: listenLetter },
			{ title: 'Listen · word', note: 'Tap what you hear', ex: listenWord },
			{ title: 'Assemble · sentence', note: 'Tiles from the course data', ex: assembleSentence },
			{ title: 'Assemble · ကျောင်း', note: 'One syllable, not ကျေ + ာ + င် + း', ex: markWords[0] },
			{ title: 'Assemble · ဈေး', note: 'Tone mark stays attached', ex: markWords[1] },
			{ title: 'Assemble · မင်္ဂလာပါ', note: 'Stacked consonant stays whole', ex: markWords[2] }
		].map((d) => ({ ...d, ex: silent ? (silentSafe(d.ex, false) as Exercise) : d.ex }))
	);

	/**
	 * Which option the learner "tapped": nothing while unanswered, the right
	 * one when correct, and a wrong neighbour when wrong.
	 */
	function pickFor(ex: Exercise): number | null {
		if (status === 'answer') return null;
		if (ex.kind !== 'choice' && ex.kind !== 'listen') return null;
		if (status === 'correct') return ex.correct;
		return ex.options.findIndex((_, i) => i !== ex.correct);
	}

	/** The footer a session would show for this drill, so states can be compared. */
	function revealOf(ex: Exercise) {
		if (ex.kind === 'listen') return { my: ex.my, en: ex.en, speak: ex.my };
		if (ex.kind === 'assemble') return { my: ex.my, speak: ex.my };
		if (ex.kind === 'choice') {
			const o = ex.options[ex.correct];
			if (/[က-႟]/.test(o.text)) return { my: o.text, speak: o.text };
			if (ex.promptMy) return { my: ex.promptMy, en: o.text, speak: ex.promptMy };
			return { my: o.text };
		}
		return null;
	}
</script>

<svelte:head>
	<title>Question variants · MyanLingo dev</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="dev">
	<header>
		<div>
			<h1>Question variants</h1>
			<p class="sub">Every exercise type on one page. Not part of the course.</p>
		</div>
		<a class="home" href="/">← Home</a>
	</header>

	<div class="controls">
		<div class="group" role="group" aria-label="Feedback state">
			<span class="label">State</span>
			{#each STATUSES as s (s)}
				<button class="toggle" class:on={status === s} onclick={() => (status = s)}>{s}</button>
			{/each}
		</div>
		<div class="group">
			<span class="label">Options</span>
			<button class="toggle" class:on={progress.showRoman} onclick={() => progress.toggleRoman()}>
				romanization
			</button>
			<button class="toggle" class:on={silent} onclick={() => (silent = !silent)}>
				muted (listening → reading)
			</button>
			<button class="toggle" onclick={() => generation++}>reshuffle</button>
		</div>
	</div>

	<section class="block">
		<h2>New-word cards</h2>
		<p class="note">
			Visual interest comes from the accent halo, so a word without a natural emoji still
			looks deliberate.
		</p>
		<div class="grid">
			<div class="card"><span class="tag">with emoji</span><LearnCard {...learn.word} /></div>
			<div class="card"><span class="tag">letter, no emoji</span><LearnCard {...learn.letter} /></div>
			<div class="card"><span class="tag">no emoji, no note</span><LearnCard {...learn.noExtras} /></div>
		</div>
	</section>

	<section class="block">
		<h2>Drills</h2>
		<p class="note">All rendered in the <strong>{status}</strong> state{silent ? ', muted' : ''}.</p>
		<div class="grid">
			{#each drills as d (d.title)}
				{@const reveal = revealOf(d.ex)}
				<div class="card">
					<span class="tag">{d.title}</span>
					<span class="tag-note">{d.note}</span>
					{#key drillKey}
						{#if d.ex.kind === 'choice'}
							<ChoiceExercise ex={d.ex} selected={pickFor(d.ex)} {status} />
						{:else if d.ex.kind === 'listen'}
							<ListenExercise ex={d.ex} selected={pickFor(d.ex)} {status} />
						{:else if d.ex.kind === 'assemble'}
							<AssembleExercise ex={d.ex} sequence={[]} {status} />
						{/if}
					{/key}
					{#if status === 'wrong' && reveal}
						<div class="footer-preview">
							<div class="verdict"><Mascot mood="sad" size={40} /> <strong>Not quite…</strong></div>
							<AnswerReveal
								my={reveal.my}
								en={reveal.en}
								speakText={reveal.speak}
								tip={grammarTip(reveal.my)}
							/>
						</div>
					{/if}
				</div>
			{/each}

			<div class="card">
				<span class="tag">Match pairs</span>
				<span class="tag-note">Grades itself; state toggle does not apply</span>
				{#key drillKey}
					<MatchExercise ex={match} oncomplete={() => {}} onmiss={() => {}} />
				{/key}
			</div>

			<div class="card">
				<span class="tag">Free recall (practice, box 4)</span>
				<span class="tag-note">Self-graded; long phrases land here instead of assemble</span>
				{#key drillKey}
					<RecallCard ex={recall} onresult={() => {}} />
				{/key}
			</div>
		</div>
	</section>
</div>

<style>
	.dev {
		max-width: 1200px;
		margin: 0 auto;
		padding: 24px 20px 80px;
	}
	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}
	h1 {
		font-size: 1.6rem;
		font-weight: 900;
	}
	.sub {
		margin: 2px 0 0;
		color: var(--ink-soft);
		font-weight: 700;
		font-size: 0.9rem;
	}
	.home {
		color: var(--teal-ink);
		font-weight: 800;
		text-decoration: none;
	}
	.controls {
		position: sticky;
		top: 0;
		z-index: 5;
		display: flex;
		flex-wrap: wrap;
		gap: 18px;
		margin: 18px 0 8px;
		padding: 12px 0;
		background: color-mix(in srgb, var(--bg) 92%, transparent);
		backdrop-filter: blur(8px);
	}
	.group {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.label {
		font-size: 0.7rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--ink-soft);
	}
	.toggle {
		padding: 6px 12px;
		border-radius: 99px;
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--line);
		font-size: 0.82rem;
		font-weight: 800;
	}
	.toggle.on {
		background: var(--teal-soft);
		color: var(--teal-ink);
		box-shadow: inset 0 0 0 2px var(--teal);
	}
	.block {
		margin-top: 28px;
	}
	h2 {
		font-size: 1.1rem;
		font-weight: 900;
	}
	.note {
		margin: 4px 0 14px;
		color: var(--ink-soft);
		font-weight: 700;
		font-size: 0.88rem;
		max-width: 60ch;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: 18px;
		align-items: start;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 16px;
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--line);
		/* Same gutter the players give animations, so a pop or shake at the
		   card edge is not clipped here either. */
		overflow: hidden;
	}
	.tag {
		font-size: 0.72rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--plum-ink);
	}
	.tag-note {
		margin-top: -8px;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.footer-preview {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 4px;
		padding: 12px;
		border-radius: 14px;
		background: var(--red-soft);
	}
	.verdict {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--red-ink);
		font-size: 0.95rem;
	}
</style>
