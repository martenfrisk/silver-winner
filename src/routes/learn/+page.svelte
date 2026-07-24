<script lang="ts">
	// The course path, rebuilt as a calm vertical list on a beaded gold spine —
	// not a winding map. Every feature from the old path is here: locking,
	// stars, unit skip, test-out, crowns, and the optional deeper rounds (now
	// full labelled rows instead of tiny +2/+3 chips).
	import { course, lessonSteps, stepStarsKey, type Lesson } from '$lib/data/course';
	import { progress } from '$lib/progress.svelte';
	import { canSkipUnit } from '$lib/tracks';
	import { scriptSheet } from '$lib/script-sheet.svelte';
	import { sfx } from '$lib/audio';
	import { goto } from '$app/navigation';
	import { Lock, Crown, Zap, Search } from '@lucide/svelte';

	const MY_DIGITS = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
	const myDigit = (n: number) => String(n).split('').map((d) => MY_DIGITS[+d]).join('');

	/** How many of a lesson's rounds (core + deeper steps) are done. */
	function roundsDone(lesson: Lesson): number {
		return lessonSteps(lesson).filter((s) => (progress.stars[stepStarsKey(lesson.id, s)] ?? 0) > 0).length;
	}
	const ROUND_LABEL: Record<number, string> = { 2: 'More words', 3: 'Even more' };

	function openLesson(id: string, unlocked: boolean) {
		if (!unlocked) return sfx.wrong();
		sfx.tap();
		goto(`/lesson/${id}`);
	}

	function toggleUnitSkip(lessons: { id: string }[], skipped: boolean) {
		sfx.tap();
		for (const l of lessons) {
			if (progress.isCompleted(l.id)) continue;
			skipped ? progress.unskipLesson(l.id) : progress.skipLesson(l.id);
		}
	}

	// Ring geometry: circumference of r=20.
	const C = 2 * Math.PI * 20;
</script>

<svelte:head><title>Learn · Shwe</title></svelte:head>

<div class="learn">
	<header class="head">
		<h1>Learn</h1>
		<div class="tools">
			<a class="tool" href="/dictionary" aria-label="Dictionary: look up any word"><Search size={19} strokeWidth={2} /></a>
			<button
				class="tool"
				class:off={!progress.showRoman}
				onclick={() => progress.toggleRoman()}
				aria-pressed={progress.showRoman}
				title={progress.showRoman ? 'Hide romanization' : 'Show romanization'}>Aa</button>
			<button class="tool my" onclick={() => scriptSheet.show()} aria-label="Open the script table">က</button>
		</div>
	</header>

	{#each course as unit (unit.id)}
		{@const pending = unit.lessons.filter((l) => !progress.isCompleted(l.id))}
		{@const unitSkipped = pending.length > 0 && pending.every((l) => progress.isSkipped(l.id))}
		{@const done = unit.lessons.filter((l) => progress.isCompleted(l.id)).length}
		<section class="unit">
			<div class="uh">
				<span class="ut">{unit.title}</span>
				<span class="um my">{unit.my}</span>
				<span class="prog">{done}/{unit.lessons.length}</span>
			</div>
			{#if pending.length > 0 && canSkipUnit(progress.profile, unit.id)}
				<button
					class="skip"
					class:active={unitSkipped}
					onclick={() => toggleUnitSkip(pending, unitSkipped)}
					title={unitSkipped ? 'Put these lessons back on the path' : 'Unlock what comes after without doing these lessons'}>
					{unitSkipped ? 'Un-skip' : 'I know this'}
				</button>
			{/if}

			<div class="spine">
				{#each unit.lessons as lesson, i (lesson.id)}
					{@const unlocked = progress.isUnlocked(lesson.id)}
					{@const stars = progress.stars[lesson.id] ?? 0}
					{@const isCurrent = progress.currentLesson === lesson.id}
					{@const skipped = stars === 0 && progress.isSkipped(lesson.id)}
					{@const steps = lessonSteps(lesson)}
					{@const rdone = roundsDone(lesson)}
					{@const pct = rdone / steps.length}
					<div class="lrow" class:locked={!unlocked && !skipped}>
						<button
							class="node"
							class:done={stars > 0}
							class:current={isCurrent}
							onclick={() => openLesson(lesson.id, unlocked)}
							disabled={!unlocked}
							aria-label="{lesson.title}{unlocked ? '' : ' (locked)'}">
							<svg viewBox="0 0 46 46" aria-hidden="true">
								<circle cx="23" cy="23" r="20" fill="none" stroke="var(--line)" stroke-width="3.5" />
								{#if pct > 0}
									<circle
										cx="23" cy="23" r="20" fill="none" stroke="var(--gold)" stroke-width="3.5"
										stroke-linecap="round"
										stroke-dasharray={C}
										stroke-dashoffset={C * (1 - pct)}
										transform="rotate(-90 23 23)" />
								{/if}
							</svg>
							<span class="face">
								{#if !unlocked && !skipped}
									<Lock size={16} strokeWidth={2} />
								{:else}
									<span class="my">{myDigit(i + 1)}</span>
								{/if}
							</span>
						</button>

						<div class="txt">
							<span class="t">{lesson.title}</span>
							<span class="meta">
								{#if stars > 0}
									<span class="stars">{'★'.repeat(stars)}<span class="dim">{'★'.repeat(3 - stars)}</span></span>
								{:else if isCurrent}
									<span class="tag">Start here</span>
								{:else if skipped}
									<span class="muted">Skipped &middot; tap to learn anyway</span>
								{:else if !unlocked}
									<span class="muted">Locked</span>
								{/if}
							</span>
							{#if stars > 0 && steps.length > 1}
								<div class="rounds">
									{#each steps.slice(1) as s (s)}
										{@const rdoneStep = (progress.stars[stepStarsKey(lesson.id, s)] ?? 0) > 0}
										<a class="round" class:done={rdoneStep} href="/lesson/{lesson.id}?step={s}">
											{rdoneStep ? '✓' : '+'} {ROUND_LABEL[s]}
										</a>
									{/each}
								</div>
							{/if}
						</div>

						<div class="chips">
							{#if stars > 0}
								<a
									class="chip crown"
									class:crowned={progress.isCrowned(lesson.id)}
									href="/lesson/{lesson.id}?mode=hard"
									aria-label="Hard mode for {lesson.title}"
									title={progress.isCrowned(lesson.id) ? 'Crowned! Replay hard mode anytime' : 'Hard mode: a perfect run earns the crown'}>
									<Crown size={16} strokeWidth={2} />
								</a>
							{/if}
							{#if !unlocked && progress.profile === 'speaker'}
								<a
									class="chip test"
									href="/lesson/{lesson.id}?mode=hard"
									aria-label="Test out of {lesson.title}"
									title="Test out: a perfect drills-only run completes this lesson">
									<Zap size={16} strokeWidth={2} />
								</a>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.learn {
		max-width: 620px;
		margin: 0 auto;
		padding: var(--s5) var(--s5) calc(96px + env(safe-area-inset-bottom));
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--s5);
	}
	.head h1 {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 400;
		font-size: 2rem;
		color: var(--ink);
	}
	.tools { display: flex; gap: var(--s2); }
	.tool {
		width: 40px;
		height: 40px;
		display: grid;
		place-items: center;
		border-radius: var(--radius-sm);
		background: var(--card);
		box-shadow: inset 0 0 0 1px var(--line);
		color: var(--ink);
		font-weight: 700;
		font-size: 0.9rem;
		text-decoration: none;
	}
	.tool.my { font-size: 1.1rem; color: var(--teal-ink); }
	.tool.off { color: var(--ink-soft); }

	.unit { margin-bottom: var(--s6); position: relative; }
	.uh {
		display: flex;
		align-items: baseline;
		gap: var(--s3);
		margin-bottom: var(--s3);
	}
	.ut { font-family: var(--font-display); font-style: italic; font-size: 1.35rem; color: var(--ink); }
	.um { font-size: 1rem; color: var(--teal-ink); }
	.prog {
		margin-left: auto;
		font-size: 0.78rem;
		font-weight: 800;
		color: var(--ink-soft);
		font-variant-numeric: tabular-nums;
	}
	.skip {
		display: inline-block;
		margin-bottom: var(--s3);
		padding: 6px 14px;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--teal-ink);
		background: var(--teal-soft);
	}
	.skip.active { color: var(--ink-soft); background: var(--sink); }

	/* Beaded gold spine down the nodes. */
	.spine { position: relative; }
	.spine::before {
		content: '';
		position: absolute;
		left: 22px;
		top: 24px;
		bottom: 24px;
		width: 2px;
		background-image: radial-gradient(circle, var(--gold) 0 1.5px, transparent 2.1px);
		background-size: 2px 9px;
		opacity: 0.55;
	}

	.lrow {
		display: flex;
		align-items: center;
		gap: var(--s4);
		padding: var(--s2) 0;
		position: relative;
	}
	.lrow.locked { opacity: 0.65; }

	.node {
		position: relative;
		width: 46px;
		height: 46px;
		flex: 0 0 auto;
		background: var(--bg);
		border-radius: 50%;
	}
	.node svg { position: absolute; inset: 0; }
	.node .face {
		position: absolute;
		inset: 6px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--sink);
		color: var(--teal-ink);
	}
	.node .face .my { font-size: 1.2rem; line-height: 1; }
	.node.done .face { background: var(--teal-deep); color: var(--gold-ink); }
	.node.current .face { box-shadow: 0 0 0 2px var(--gold); }
	.node:disabled .face { color: var(--ink-soft); }

	.txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
	.txt .t { font-weight: 700; font-size: 0.98rem; color: var(--ink); }
	.txt .meta { font-size: 0.76rem; line-height: 1.2; }
	.stars { color: var(--gold-ink); letter-spacing: 0.12em; font-size: 0.72rem; }
	.stars .dim { color: var(--star-dim); }
	.tag { color: var(--teal-ink); font-weight: 800; letter-spacing: 0.02em; }
	.muted { color: var(--ink-soft); }

	.rounds { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
	.round {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 11px;
		border-radius: 999px;
		font-size: 0.74rem;
		font-weight: 700;
		text-decoration: none;
		color: var(--teal-ink);
		background: var(--sink);
	}
	.round.done { color: var(--gold-ink); }

	.chips { display: flex; gap: 6px; flex: 0 0 auto; }
	.chip {
		width: 32px;
		height: 32px;
		border-radius: 10px;
		display: grid;
		place-items: center;
		color: var(--ink-soft);
		background: var(--card);
		box-shadow: inset 0 0 0 1px var(--line);
	}
	.chip.crown.crowned { color: var(--gold-ink); background: var(--gold-wash); }
	.chip.test { color: var(--teal-ink); }
</style>
