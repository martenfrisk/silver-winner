<script lang="ts">
	import { AUDIO_VOWELS, buildSyllable, glyphById, glyphs } from '$lib/data/script';
	import { srs } from '$lib/srs.svelte';
	import { progress } from '$lib/progress.svelte';
	import { sfx, speak } from '$lib/audio';
	import Mascot from '$lib/components/Mascot.svelte';

	const consonants = glyphs.filter((g) => g.type === 'consonant');

	let base = $state('ma');
	let vowel = $state<string | null>(null);
	let highTone = $state(false);
	// Challenge mode: build the syllable that matches a target sound.
	let target = $state<{ roman: string; consId: string; vowelId: string } | null>(null);
	let challengeWins = $state(0);

	const syl = $derived(
		vowel ? buildSyllable(base, vowel, highTone) : { text: glyphById.get(base)!.char, roman: glyphById.get(base)!.sound === '(glottal) a' ? 'a' : glyphById.get(base)!.sound + 'a', highTone: false }
	);

	let speakTimer: ReturnType<typeof setTimeout>;
	function announce() {
		clearTimeout(speakTimer);
		if (!vowel) return; // bare consonants have no audio file
		speakTimer = setTimeout(() => speak(syl.text), 250);
	}

	function setBase(id: string) {
		sfx.tap();
		base = id;
		announce();
		checkChallenge();
	}

	function setVowel(id: string) {
		sfx.tap();
		vowel = vowel === id ? null : id;
		if (!vowel) highTone = false;
		announce();
		checkChallenge();
	}

	function toggleTone() {
		if (!vowel) return;
		sfx.tap();
		highTone = !highTone;
		announce();
	}

	function newChallenge() {
		const known = consonants.filter((c) => srs.isIntroduced(c.id));
		const pool = known.length >= 3 ? known : consonants.slice(0, 6);
		const c = pool[Math.floor(Math.random() * pool.length)];
		const vs = AUDIO_VOWELS.filter((v) => srs.isIntroduced(v));
		const v = (vs.length > 0 ? vs : AUDIO_VOWELS)[
			Math.floor(Math.random() * (vs.length > 0 ? vs.length : AUDIO_VOWELS.length))
		];
		target = { roman: buildSyllable(c.id, v).roman, consId: c.id, vowelId: v };
		sfx.tap();
	}

	function checkChallenge() {
		if (!target || !vowel) return;
		if (buildSyllable(base, vowel).roman === target.roman) {
			challengeWins++;
			progress.addXp(2);
			sfx.fanfare();
			setTimeout(newChallenge, 900);
		}
	}

	const VOWEL_CHIPS = [
		{ id: 'ay', char: 'ေ', pos: 'left', label: 'ay-' },
		{ id: 'i', char: 'ိ', pos: 'top', label: '-i' },
		{ id: 'aa', char: 'ာ', pos: 'right', label: '-a' },
		{ id: 'u', char: 'ု', pos: 'bottom', label: '-u' },
		{ id: 'io', char: 'ို', pos: 'combo', label: '-o' }
	];
</script>

<svelte:head>
	<title>Syllable builder · Shwe</title>
</svelte:head>

<div class="builder">
	<header class="topbar">
		<a class="back" href="/script" aria-label="Back to Script Studio">←</a>
		<div class="title">
			<h1>Syllable builder</h1>
			<p class="hint-text">Vowels snap around the letter. Tap them and listen.</p>
		</div>
	</header>

	{#if target}
		<div class="challenge">
			🎯 Build: <strong>{target.roman}</strong>
			<span class="wins">{challengeWins} solved</span>
			<button class="mini" onclick={() => (target = null)}>stop</button>
		</div>
	{:else}
		<div class="challenge idle">
			<Mascot mood="idle" size={44} />
			<span>Play freely, or…</span>
			<button class="mini go" onclick={newChallenge}>🎯 Challenge me</button>
		</div>
	{/if}

	<section class="stage-area">
		<div class="frame">
			<!-- vowel slots around the base -->
			{#each VOWEL_CHIPS as chip (chip.id)}
				<button
					class="dia {chip.pos} {vowel === chip.id ? 'active' : ''}"
					onclick={() => setVowel(chip.id)}
					title="{chip.label}"
				>
					<span class="my dia-char">{chip.char}</span>
					<span class="dia-label">{chip.label}</span>
				</button>
			{/each}
			<div class="base-cell">
				<span class="my composed">{syl.text}</span>
			</div>
			<button
				class="dia tone {highTone ? 'active' : ''}"
				class:disabled={!vowel}
				onclick={toggleTone}
				title="high tone"
			>
				<span class="my dia-char">း</span>
				<span class="dia-label">high</span>
			</button>
		</div>
		<div class="readout">
			<span class="roman">{syl.roman}{highTone && vowel ? 'ː' : ''}</span>
			<button
				class="speak-big"
				onclick={() => vowel && speak(syl.text)}
				disabled={!vowel}
				title={vowel ? 'Listen' : 'Pick a vowel to hear it'}
			>
				🔊
			</button>
		</div>
		{#if !vowel}
			<p class="inherent-note">No vowel sign = the built-in “a”. Every letter carries it.</p>
		{/if}
	</section>

	<section class="cons-picker">
		<h2>Base letter</h2>
		<div class="cons-grid">
			{#each consonants as c (c.id)}
				<button
					class="cons {base === c.id ? 'active' : ''} {srs.isIntroduced(c.id) ? 'known' : ''}"
					onclick={() => setBase(c.id)}
				>
					<span class="my">{c.char}</span>
				</button>
			{/each}
		</div>
		<p class="legend-note">Gold ring = letters you’ve learned.</p>
	</section>
</div>

<style>
	.builder {
		max-width: 560px;
		margin: 0 auto;
		padding: 0 20px 60px;
	}
	.topbar {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 0;
	}
	.back {
		width: 36px;
		height: 36px;
		display: grid;
		place-items: center;
		border-radius: 10px;
		text-decoration: none;
		color: var(--ink-soft);
		font-size: 1.3rem;
		font-weight: 900;
		box-shadow: inset 0 0 0 2px var(--line);
		background: var(--card);
	}
	.title h1 {
		font-size: 1.35rem;
		font-weight: 900;
		color: var(--teal-ink);
	}
	.hint-text {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.challenge {
		display: flex;
		align-items: center;
		gap: 10px;
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 2px var(--gold);
		padding: 10px 16px;
		font-weight: 800;
		margin-bottom: 14px;
	}
	.challenge.idle {
		box-shadow: inset 0 0 0 2px var(--line);
		color: var(--ink-soft);
	}
	.challenge strong {
		font-size: 1.2rem;
		color: var(--gold-ink);
	}
	.wins {
		margin-left: auto;
		font-size: 0.8rem;
		color: var(--ink-soft);
	}
	.mini {
		font-size: 0.8rem;
		font-weight: 800;
		color: var(--teal-ink);
		padding: 5px 10px;
		border-radius: 10px;
		box-shadow: inset 0 0 0 2px var(--line);
		background: var(--bg);
	}
	.mini.go {
		margin-left: auto;
		color: var(--gold-ink);
	}

	.stage-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 10px 0 22px;
	}
	.frame {
		display: grid;
		grid-template-columns: 72px 130px 72px 72px;
		grid-template-rows: 64px 130px 64px;
		grid-template-areas:
			'. top combo .'
			'left base right tone'
			'. bottom . .';
		gap: 10px;
		align-items: center;
		justify-items: center;
	}
	.base-cell {
		grid-area: base;
		width: 130px;
		height: 130px;
		display: grid;
		place-items: center;
		border-radius: 22px;
		background: var(--card);
		box-shadow: inset 0 0 0 2.5px var(--line);
	}
	.composed {
		font-size: 3.6rem;
		line-height: 1.3;
	}
	.dia {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 66px;
		height: 60px;
		border-radius: 14px;
		background: var(--card);
		box-shadow: 0 3px 0 var(--line), inset 0 0 0 2px var(--line);
		transition: translate 0.08s ease, box-shadow 0.15s ease, background 0.2s ease;
	}
	.dia:active {
		translate: 0 3px;
		box-shadow: 0 0 0 var(--line), inset 0 0 0 2px var(--line);
	}
	.dia.active {
		background: var(--teal-soft);
		box-shadow: 0 3px 0 var(--teal-dark), inset 0 0 0 2px var(--teal);
	}
	.dia.disabled {
		opacity: 0.45;
	}
	.dia.left { grid-area: left; }
	.dia.top { grid-area: top; }
	.dia.right { grid-area: right; }
	.dia.bottom { grid-area: bottom; }
	.dia.combo { grid-area: combo; }
	.dia.tone { grid-area: tone; }
	.dia-char {
		font-size: 1.5rem;
		line-height: 1.2;
	}
	.dia-label {
		font-size: 0.7rem;
		font-weight: 800;
		color: var(--ink-soft);
	}
	.readout {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.roman {
		font-size: 1.6rem;
		font-weight: 900;
		color: var(--teal-ink);
		min-width: 80px;
		text-align: center;
	}
	.speak-big {
		width: 52px;
		height: 52px;
		display: grid;
		place-items: center;
		border-radius: 14px;
		background: var(--teal);
		box-shadow: 0 4px 0 var(--teal-dark);
		font-size: 1.4rem;
	}
	.speak-big:disabled {
		background: var(--disabled-bg);
		box-shadow: 0 4px 0 var(--disabled-shadow);
	}
	.speak-big:active:not(:disabled) {
		translate: 0 4px;
		box-shadow: 0 0 0 var(--teal-dark);
	}
	.inherent-note {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-soft);
		background: var(--gold-soft);
		border-radius: 10px;
		padding: 6px 12px;
	}

	.cons-picker h2 {
		font-size: 1rem;
		font-weight: 900;
		padding-bottom: 10px;
	}
	.cons-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
		gap: 8px;
	}
	.cons {
		height: 52px;
		display: grid;
		place-items: center;
		font-size: 1.4rem;
		border-radius: 12px;
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--line);
		opacity: 0.75;
	}
	.cons.known {
		opacity: 1;
		box-shadow: inset 0 0 0 2px var(--gold);
	}
	.cons.active {
		background: var(--gold-soft);
		box-shadow: inset 0 0 0 2.5px var(--gold-dark);
		opacity: 1;
	}
	.legend-note {
		margin: 10px 0 0;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
</style>
