<script lang="ts">
	// The course path, rebuilt as a calm vertical list on a beaded gold spine —
	// not a winding map. Every feature from the old path is here: locking,
	// stars, unit skip, test-out, crowns, and the optional deeper rounds (now
	// full labelled rows instead of tiny +2/+3 chips).
	import { course, lessonSteps, stepStarsKey, type Lesson, type Unit } from '$lib/data/course';
	import { lessonOrder } from '$lib/data/lesson-order';
	import { storiesForUnit, storyStarsKey } from '$lib/data/stories';
	import { readerStarsKey, unitVocab } from '$lib/reader-session';
	import { progress } from '$lib/progress.svelte';
	import { vocabSrs } from '$lib/vocab-srs.svelte';
	import { canSkipUnit, primaryMode } from '$lib/tracks';
	import { sfx } from '$lib/audio';
	import { goto } from '$app/navigation';
	import HubHeader from '$lib/components/HubHeader.svelte';
	import { Lock, Crown, Zap, BookOpen, BookOpenText } from '@lucide/svelte';

	const mode = $derived(primaryMode(progress.profile));

	const UNIT_OF_LESSON = new Map(
		course.flatMap((u) => u.lessons.map((l) => [l.id, u.id] as const))
	);
	const unitOfLesson = (id: string) => UNIT_OF_LESSON.get(id);

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

<div class="hub-page learn">
	<HubHeader title="Learn" />

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

			<!-- Reading is not a separate track: readerStarsKey() is keyed on
			     course unit ids, so it is this unit in script. Profiles reorder
			     which comes first; neither is ever hidden or locked. -->
			{#if mode === 'read'}
				{@render readRow(unit)}
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

			{#if mode === 'lessons'}
				{@render readRow(unit)}
			{/if}

			<!-- Stories sit under the unit whose lesson unlocks them, so they read
			     as the payoff for finishing it rather than a locked curiosity on
			     a page of their own. -->
			{#each storiesForUnit(unit.id, unitOfLesson, lessonOrder) as story (story.id)}
				{@const open = story.requires.every((id) => progress.isCompleted(id))}
				{@const stars = progress.stars[storyStarsKey(story.id)] ?? 0}
				<svelte:element
					this={open ? 'a' : 'div'}
					class="side-row story"
					class:locked={!open}
					href={open ? `/stories/${story.id}` : undefined}
				>
					<span class="side-icon"><BookOpen size={18} strokeWidth={2} /></span>
					<span class="side-text">
						<span class="side-title">Story: {story.title}</span>
						<span class="side-sub">
							{#if stars > 0}
								{'★'.repeat(stars)}<span class="dim">{'★'.repeat(3 - stars)}</span>
							{:else if open}
								A tiny conversation you can already follow
							{:else}
								Finish this unit's lessons to open it
							{/if}
						</span>
					</span>
				</svelte:element>
			{/each}
		</section>
	{/each}
</div>

<!-- One unit read in Burmese script, no romanization. Never gated: a soft
     label warns when the words are unfamiliar, but the row stays tappable. -->
{#snippet readRow(unit: Unit)}
	{@const stars = progress.stars[readerStarsKey(unit.id)] ?? 0}
	{@const met = unitVocab(unit).some((v) => vocabSrs.isIntroduced(v.my))}
	<a class="side-row" href="/reader/{unit.id}">
		<span class="side-icon"><BookOpenText size={18} strokeWidth={2} /></span>
		<span class="side-text">
			<span class="side-title">Read this unit in script</span>
			<span class="side-sub">
				{#if stars > 0}
					{'★'.repeat(stars)}<span class="dim">{'★'.repeat(3 - stars)}</span>
				{:else if met}
					The words you know, in Burmese letters only
				{:else}
					You have not learned these words yet
				{/if}
			</span>
		</span>
	</a>
{/snippet}

<style>
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

	/* Reading and story rows. Deliberately quieter than a lesson node: they are
	   other ways through the same unit, not extra steps on the ladder. */
	.side-row {
		display: flex;
		align-items: center;
		gap: var(--s3);
		margin: var(--s2) 0;
		padding: 10px 14px;
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: inset 0 0 0 1.5px var(--line);
		color: var(--ink);
		text-decoration: none;
	}
	.side-row.locked {
		opacity: 0.55;
	}
	.side-icon {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		flex: 0 0 auto;
		border-radius: 10px;
		color: var(--teal-ink);
		background: var(--teal-soft);
	}
	.side-row.story .side-icon {
		color: var(--gold-ink);
		background: var(--gold-soft, var(--sink));
	}
	.side-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}
	.side-title {
		font-weight: 800;
		font-size: 0.92rem;
	}
	.side-sub {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.side-sub .dim {
		color: var(--star-dim);
	}

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
