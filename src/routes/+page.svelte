<script lang="ts">
	import { course, lessonSteps, stepStarsKey } from '$lib/data/course';
	import { progress } from '$lib/progress.svelte';
	import { srs } from '$lib/srs.svelte';
	import { vocabSrs } from '$lib/vocab-srs.svelte';
	import { scriptUnits, totalGlyphs } from '$lib/data/script';
	import { readerStarsKey } from '$lib/reader-session';
	import { canSkipUnit, primaryTrack, suggestFor, tracks } from '$lib/tracks';
	import { ui } from '$lib/i18n.svelte';
	import Mascot from '$lib/components/Mascot.svelte';
	import StartChooser from '$lib/components/StartChooser.svelte';
	import { stories } from '$lib/data/stories';
	import { scriptSheet } from '$lib/script-sheet.svelte';
	import { sfx } from '$lib/audio';
	import { goto } from '$app/navigation';

	const totalLessons = course.reduce((n, u) => n + u.lessons.length, 0);
	const goalPct = $derived(Math.min(1, progress.xpToday / Math.max(1, progress.dailyGoal)));
	const goalRemaining = $derived(Math.max(0, progress.dailyGoal - progress.xpToday));

	const allLessons = course.flatMap((u) => u.lessons);
	const unlockedStories = $derived(
		stories.filter((s) => s.requires.every((id) => progress.isCompleted(id))).length
	);

	// ── Profile-driven track routing (see src/lib/tracks.ts) ──────────
	const primary = $derived(primaryTrack(progress.profile));
	const courseNext = $derived(allLessons.find((l) => l.id === progress.currentLesson));
	const readerNext = $derived(course.find((u) => !(readerStarsKey(u.id) in progress.stars)));
	const scriptNext = $derived(scriptUnits.find((u) => !srs.isUnitDone(u.id)));
	const uncrowned = $derived(allLessons.find((l) => !progress.isCrowned(l.id)));

	/** The single best "do this next" action, for the daily-goal nudge. */
	const suggestion = $derived(
		suggestFor(progress.profile, {
			vocabDue: vocabSrs.dueCount,
			glyphsDue: srs.dueCount,
			nextLesson: courseNext,
			nextReaderUnit: readerNext,
			nextScriptUnit: scriptNext,
			uncrownedLesson: uncrowned
		})
	);

	/** The big "continue" card for the profile's primary track. */
	const primaryCard = $derived.by(() => {
		if (primary === 'reader') {
			return readerNext
				? { href: `/reader/${readerNext.id}`, title: 'Continue reading', sub: `Next: ${readerNext.title}` }
				: { href: '/reader', title: 'Reader track', sub: 'All units read. Keep them fresh' };
		}
		if (primary === 'script') {
			return scriptNext
				? { href: '/script', title: 'Continue the script', sub: `Next: ${scriptNext.title} · ${srs.introducedCount}/${totalGlyphs} glyphs` }
				: { href: '/script', title: 'Script Studio', sub: 'All letters learned. Keep them sharp' };
		}
		return courseNext
			? { href: `/lesson/${courseNext.id}`, title: 'Continue the course', sub: `Next: ${courseNext.title}` }
			: { href: uncrowned ? `/lesson/${uncrowned.id}?mode=hard` : '/practice', title: 'Course complete!', sub: uncrowned ? `Go for 👑 crowns, next: ${uncrowned.title}` : 'Keep everything fresh in Practice' };
	});

	/** href for a track's compact card in "More ways to learn". */
	function trackHref(id: string): string {
		if (id === 'course') return courseNext ? `/lesson/${courseNext.id}` : '/practice';
		return tracks.find((t) => t.id === id)!.href;
	}

	const heroSub = $derived.by(() => {
		if (progress.completedCount > 0) return null; // progress messaging takes over
		if (progress.profile === 'script-reader') return 'You already read the script. Let’s fill in the words.';
		if (progress.profile === 'speaker') return 'Let’s get you reading what you already speak.';
		return null;
	});

	function openLesson(id: string, unlocked: boolean) {
		if (!unlocked) {
			sfx.wrong();
			return;
		}
		sfx.tap();
		goto(`/lesson/${id}`);
	}

	/** Skips (or restores) every not-yet-done lesson in a unit the learner knows. */
	function toggleUnitSkip(lessons: { id: string }[], skipped: boolean) {
		sfx.tap();
		for (const l of lessons) {
			if (progress.isCompleted(l.id)) continue;
			if (skipped) progress.unskipLesson(l.id);
			else progress.skipLesson(l.id);
		}
	}

	function confirmReset() {
		if (confirm('Reset all progress? This cannot be undone.')) {
			progress.reset();
		}
	}
</script>

<svelte:head>
	<title>MyanLingo: Learn Burmese</title>
	<meta name="description" content="A playful way to learn the Burmese language." />
</svelte:head>

<div class="home" class:onboarding={progress.profile === null}>
	<header class="topbar">
		<div class="brand">
			<span class="brand-mark">မ</span>
			<span class="brand-name">MyanLingo</span>
		</div>
		<div class="pills">
			<!-- A 0% ring, a 0-day streak and "0 XP" say nothing on day one.
			     They appear as soon as there's anything to report. -->
			{#if progress.xp > 0}
			<span
				class="pill goal-pill"
				class:reached={goalPct >= 1}
				title="{progress.xpToday} / {progress.dailyGoal} XP today · 🔥 {progress.streak}-day streak"
				aria-label="Daily goal: {progress.xpToday} of {progress.dailyGoal} XP. Streak: {progress.streak} days."
			>
				<svg class="ring" viewBox="0 0 22 22" aria-hidden="true">
					<circle class="ring-bg" cx="11" cy="11" r="8.5" />
					<circle
						class="ring-fill"
						cx="11"
						cy="11"
						r="8.5"
						stroke-dasharray="{goalPct * 53.4} 53.4"
					/>
				</svg>
				🔥 {progress.streak}
				{#if progress.freezes > 0}
					<span class="freeze-mini" title="{progress.freezes} streak freeze{progress.freezes > 1 ? 's' : ''} held">🧊{progress.freezes}</span>
				{/if}
			</span>
			<span class="pill" title="Total XP">⚡ {progress.xp} XP</span>
			{/if}
			<button
				class="pill toggle"
				class:off={!progress.showRoman}
				onclick={() => progress.toggleRoman()}
				title={progress.showRoman ? 'Hide romanization' : 'Show romanization'}
				aria-pressed={progress.showRoman}
			>
				Aa
			</button>
			<button
				class="pill toggle my"
				onclick={() => scriptSheet.show()}
				title="Script table"
				aria-label="Open the script reference table"
			>
				က
			</button>
			<button
				class="pill toggle"
				onclick={() => progress.toggleSound()}
				title={progress.sound ? 'Sound on' : 'Sound off'}
				aria-pressed={progress.sound}
			>
				{progress.sound ? '🔊' : '🔇'}
			</button>
			<a class="pill toggle" href="/account" title={ui('profile').text} aria-label="Profile">🐱</a>
		</div>
	</header>

	{#if progress.profile === null}
		<!-- First run: nothing but the question. The path, the tracks and the
		     daily-goal chrome all arrive once we know who's learning. -->
		<StartChooser />
	{:else}
		<aside class="rail">
			<section class="hero">
				<Mascot mood={progress.completedCount === totalLessons ? 'celebrate' : 'idle'} size={130} />
				<div class="hero-text">
					<h1>
						{#if progress.completedCount === 0}
							မင်္ဂလာပါ! <span class="hero-sub">{heroSub ?? 'I’m Shwe. Let’s learn Burmese!'}</span>
						{:else if progress.completedCount === totalLessons}
							You finished the course! <span class="hero-sub">ဂုဏ်ယူပါတယ်, congratulations!</span>
						{:else}
							{ui('welcome-back').text} <span class="hero-sub">{progress.completedCount}/{totalLessons} lessons done. Keep going!</span>
						{/if}
					</h1>
				</div>
			</section>

			<a class="primary-card" href={primaryCard.href}>
				<span class="primary-emoji" class:my={primary === 'script'}>
					{primary === 'course' ? '🐱' : primary === 'reader' ? '📖' : 'အ'}
				</span>
				<span class="primary-text">
					<span class="primary-title">{primaryCard.title}</span>
					<span class="primary-sub">{primaryCard.sub}</span>
				</span>
				<span class="primary-arrow">→</span>
			</a>

			<!-- Before the first lesson this would only repeat the card above it and
			     the START bubble on the path — three ways to say "begin lesson one".
			     It earns its place once there's a streak worth keeping. -->
			{#if progress.completedCount > 0}
				<a class="nudge" class:reached={goalRemaining === 0} href={suggestion.href}>
					<span class="nudge-ring" aria-hidden="true">
						<svg viewBox="0 0 34 34">
							<circle class="nudge-ring-bg" cx="17" cy="17" r="13.5" />
							<circle class="nudge-ring-fill" cx="17" cy="17" r="13.5" stroke-dasharray="{goalPct * 84.8} 84.8" />
						</svg>
						<span class="nudge-ring-label">{goalRemaining === 0 ? '✓' : Math.round(goalPct * 100) + '%'}</span>
					</span>
					<span class="nudge-text">
						{#if goalRemaining === 0}
							<strong>Daily goal reached! 🎉</strong>
							<span class="nudge-sub">On a roll, how about {suggestion.label}?</span>
						{:else if progress.xpToday === 0}
							<strong>Start today's {progress.dailyGoal} XP</strong>
							<span class="nudge-sub">Keep the 🔥 streak alive, try {suggestion.label}</span>
						{:else}
							<strong>{goalRemaining} XP to today's goal</strong>
							<span class="nudge-sub">Almost there, try {suggestion.label}</span>
						{/if}
					</span>
					<span class="nudge-arrow" aria-hidden="true">→</span>
				</a>
			{/if}

			{#if vocabSrs.introducedCount > 0}
				<a class="script-card practice-card" href="/practice">
					<span class="script-glyph practice-glyph">💪</span>
					<span class="script-text">
						<span class="script-title practice-title">{ui('practice').text}</span>
						<span class="script-sub">
							{#if vocabSrs.dueCount > 0}
								{vocabSrs.dueCount} {ui('to-review').text}
							{:else}
								Keep your {vocabSrs.introducedCount} words fresh
							{/if}
						</span>
					</span>
					{#if vocabSrs.dueCount > 0}
						<span class="script-due">{vocabSrs.dueCount}</span>
					{:else}
						<span class="script-arrow practice-arrow">→</span>
					{/if}
				</a>
			{/if}

			{#if unlockedStories > 0}
				<a class="script-card stories-card" href="/stories">
					<span class="script-glyph stories-glyph">📚</span>
					<span class="script-text">
						<span class="script-title stories-title">Stories</span>
						<span class="script-sub">
							{unlockedStories} tiny conversation{unlockedStories > 1 ? 's' : ''} you can already understand
						</span>
					</span>
					<span class="script-arrow stories-arrow">→</span>
				</a>
			{/if}

			<section class="more">
				<h2 class="more-title">More ways to learn</h2>
				{#each tracks.filter((t) => t.id !== primary) as t (t.id)}
					<a class="more-card" href={trackHref(t.id)}>
						<span class="more-emoji" class:my={t.id === 'script'}>{t.emoji}</span>
						<span class="more-text">
							<span class="more-name">{t.title}</span>
							<span class="more-audience">{t.audience}</span>
						</span>
						{#if t.id === 'script' && srs.dueCount > 0}
							<span class="script-due">{srs.dueCount}</span>
						{:else}
							<span class="more-arrow">→</span>
						{/if}
					</a>
				{/each}
			</section>
		</aside>

		<div class="path">
			{#each course as unit (unit.id)}
				{@const pending = unit.lessons.filter((l) => !progress.isCompleted(l.id))}
				{@const unitSkipped = pending.length > 0 && pending.every((l) => progress.isSkipped(l.id))}
				<section class="unit">
					<div class="unit-header" style="--unit-color: {unit.color}">
						<div>
							<h2>{unit.title}</h2>
							<p class="my unit-my">{unit.my}</p>
						</div>
						<!-- You told us you read the script; this unit teaches it. Offer
						     the way past instead of making you grind through it. -->
						{#if pending.length > 0 && canSkipUnit(progress.profile, unit.id)}
							<button
								class="skip-unit"
								class:done={unitSkipped}
								onclick={() => toggleUnitSkip(pending, unitSkipped)}
								title={unitSkipped
									? 'Put these lessons back on the path'
									: 'Unlock what comes after without doing these lessons'}
							>
								{unitSkipped ? '↩ Un-skip' : '⏭ I know this'}
							</button>
						{/if}
					</div>
					<div class="nodes">
						{#each unit.lessons as lesson, i (lesson.id)}
							{@const unlocked = progress.isUnlocked(lesson.id)}
							{@const stars = progress.stars[lesson.id] ?? 0}
							{@const isCurrent = progress.currentLesson === lesson.id}
							{@const skipped = stars === 0 && progress.isSkipped(lesson.id)}
							<div class="node-row" style="--offset: {[0, 1, -1][i % 3]}">
								<div class="node-wrap">
									<button
										class="node {unlocked ? '' : 'locked'} {stars > 0 ? 'completed' : ''} {isCurrent ? 'current' : ''}"
										class:skipped
										style="--unit-color: {unit.color}"
										onclick={() => openLesson(lesson.id, unlocked)}
										disabled={!unlocked}
										aria-label="{lesson.title}{unlocked ? '' : ' (locked)'}"
									>
										{#if isCurrent}
											<span class="start-bubble" class:my={ui('start').my}>{ui('start').text}</span>
										{/if}
										<!-- A skipped lesson isn't gating anything, so it never wears
									     the padlock even while earlier units are unfinished. -->
									<span class="node-emoji">{unlocked || skipped ? lesson.emoji : '🔒'}</span>
										{#if stars > 0}
											<span class="node-stars">
												{'★'.repeat(stars)}<span class="dim">{'★'.repeat(3 - stars)}</span>
											</span>
										{:else if skipped}
											<!-- Still tappable: skipping is "not now", not "never". -->
											<span class="node-stars node-skipped">skipped</span>
										{/if}
									</button>
									{#if !unlocked && progress.profile === 'speaker'}
										<a
											class="testout-chip"
											href="/lesson/{lesson.id}?mode=hard"
											title="Test out: a perfect drills-only run completes this lesson"
											aria-label="Test out of {lesson.title}"
										>
											⚡
										</a>
									{/if}
									{#if stars > 0}
										<a
											class="crown-chip"
											class:crowned={progress.isCrowned(lesson.id)}
											href="/lesson/{lesson.id}?mode=hard"
											title={progress.isCrowned(lesson.id)
												? 'Crowned! Replay hard mode anytime'
												: 'Hard mode: a perfect drills-only run earns the crown'}
											aria-label="Hard mode for {lesson.title}"
										>
											👑
										</a>
									{/if}
								</div>
								<span class="node-title {unlocked ? '' : 'muted'}">{lesson.title}</span>
								{#if stars > 0 && lessonSteps(lesson).length > 1}
									<!-- Optional depth: more words on the same topic. Only step 1
									     gates the next lesson, so these never block the path. -->
									<div class="steps" aria-label="Extra steps for {lesson.title}">
										{#each lessonSteps(lesson).slice(1) as s (s)}
											{@const doneStep = (progress.stars[stepStarsKey(lesson.id, s)] ?? 0) > 0}
											<a
												class="step-chip"
												class:done={doneStep}
												href="/lesson/{lesson.id}?step={s}"
												title={doneStep
													? `Step ${s} done — replay anytime`
													: `Step ${s}: more ${lesson.title.toLowerCase()} words`}
											>
												{doneStep ? '✓' : '+'} {s}
											</a>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			{/each}
		</div>

		<footer class="page-footer">
			<p>Progress is saved in your browser.</p>
			<button class="reset" onclick={confirmReset}>Reset progress</button>
		</footer>
	{/if}
</div>

<style>
	.home {
		max-width: 560px;
		margin: 0 auto;
		padding: 0 20px 60px;
	}

	/* The cards stack in one rail; on desktop that rail becomes a sidebar
	   next to the path (see the wide layout below). A single flex gap here
	   replaces the per-card margins so both layouts space identically. */
	.rail {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	/* Wide screens: the path gets the room it wants and the cards move into a
	   sticky sidebar, instead of everything queueing in one narrow column. */
	@media (min-width: 900px) {
		.home {
			max-width: 1080px;
			display: grid;
			grid-template-columns: minmax(0, 1fr) 340px;
			column-gap: 40px;
			align-items: start;
		}
		.topbar {
			grid-column: 1 / -1;
		}
		.path {
			grid-column: 1;
			grid-row: 2;
			padding-top: 6px;
		}
		.rail {
			grid-column: 2;
			grid-row: 2;
			position: sticky;
			top: 78px;
		}
		.page-footer {
			grid-column: 1 / -1;
		}
		/* More width means a wider zigzag. */
		.node-row {
			translate: calc(var(--offset) * 104px) 0;
		}
		/* The mascot doesn't need to dominate a 340px rail. */
		.hero :global(.shwe) {
			width: 96px;
			height: 96px;
		}
		/* Onboarding has no path and no sidebar — just the question, centred. */
		.home.onboarding {
			display: block;
			max-width: 640px;
		}
	}
	.topbar {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 0;
		background: color-mix(in srgb, var(--bg) 88%, transparent);
		backdrop-filter: blur(8px);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.brand-mark {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 13px;
		background: var(--gold);
		box-shadow: 0 3px 0 var(--gold-dark);
		color: #fff;
		font-family: var(--font-my);
		font-size: 1.3rem;
	}
	.brand-name {
		font-size: 1.3rem;
		font-weight: 900;
		color: var(--gold-ink);
		letter-spacing: -0.02em;
	}
	.pills {
		display: flex;
		gap: 8px;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--line);
		border-radius: 99px;
		padding: 7px 13px;
		font-size: 0.9rem;
		font-weight: 800;
	}
	.pill.toggle {
		transition: scale 0.2s var(--pop);
	}
	.pill.toggle:active {
		scale: 0.9;
	}
	.pill.toggle.off {
		color: var(--ink-soft);
		text-decoration: line-through;
		opacity: 0.7;
	}
	.goal-pill {
		gap: 6px;
	}
	.ring {
		width: 22px;
		height: 22px;
		rotate: -90deg;
	}
	.ring circle {
		fill: none;
		stroke-width: 3.5;
		stroke-linecap: round;
	}
	.ring-bg {
		stroke: var(--line);
	}
	.ring-fill {
		stroke: var(--gold);
		transition: stroke-dasharray 0.6s var(--pop);
	}
	.goal-pill.reached .ring-fill {
		stroke: var(--green);
	}
	.goal-pill.reached {
		animation: goal-pop 0.4s ease-in-out;
	}
	@keyframes goal-pop {
		0% { scale: 1; }
		35% { scale: 1.08; }
		70% { scale: 0.98; }
		100% { scale: 1; }
	}

	.hero {
		display: flex;
		align-items: center;
		gap: 18px;
		padding: 12px 0 0;
	}
	.hero h1 {
		font-size: 1.5rem;
		font-weight: 900;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.hero-sub {
		font-size: 1rem;
		font-weight: 700;
		color: var(--ink-soft);
	}

	.nudge {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 16px;
		border-radius: var(--radius);
		background: var(--gold-soft);
		box-shadow: inset 0 0 0 2px var(--gold);
		text-decoration: none;
		color: var(--ink);
		transition: translate 0.1s ease;
	}
	.nudge:active {
		translate: 0 2px;
	}
	.nudge.reached {
		background: var(--green-soft);
		box-shadow: inset 0 0 0 2px var(--green);
	}
	.nudge-ring {
		position: relative;
		width: 44px;
		height: 44px;
		flex-shrink: 0;
	}
	.nudge-ring svg {
		width: 100%;
		height: 100%;
		rotate: -90deg;
	}
	.nudge-ring circle {
		fill: none;
		stroke-width: 4;
		stroke-linecap: round;
	}
	.nudge-ring-bg {
		stroke: color-mix(in srgb, var(--gold) 35%, transparent);
	}
	.nudge-ring-fill {
		stroke: var(--gold-dark);
		transition: stroke-dasharray 0.6s var(--pop);
	}
	.nudge.reached .nudge-ring-bg {
		stroke: color-mix(in srgb, var(--green) 35%, transparent);
	}
	.nudge.reached .nudge-ring-fill {
		stroke: var(--green);
	}
	.nudge-ring-label {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-size: 0.62rem;
		font-weight: 900;
		color: var(--gold-ink);
	}
	.nudge.reached .nudge-ring-label {
		color: var(--green-ink);
		font-size: 0.95rem;
	}
	.nudge-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}
	.nudge-text strong {
		font-weight: 900;
		font-size: 0.98rem;
	}
	.nudge-sub {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.nudge-arrow {
		font-weight: 900;
		font-size: 1.15rem;
		color: var(--gold-ink);
	}
	.nudge.reached .nudge-arrow {
		color: var(--green-ink);
	}

	.script-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 18px;
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: 0 4px 0 var(--plum-dark), inset 0 0 0 2px var(--plum);
		text-decoration: none;
		color: var(--ink);
		transition: translate 0.1s ease, box-shadow 0.1s ease;
	}
	.script-card:active {
		translate: 0 4px;
		box-shadow: 0 0 0 var(--plum-dark), inset 0 0 0 2px var(--plum);
	}
	.script-glyph {
		width: 48px;
		height: 48px;
		display: grid;
		place-items: center;
		font-size: 1.7rem;
		border-radius: 14px;
		background: var(--plum-soft);
		color: var(--plum-ink);
		flex-shrink: 0;
	}
	.script-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.script-title {
		font-weight: 900;
		color: var(--plum-ink);
	}
	.script-sub {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.script-due {
		display: grid;
		place-items: center;
		min-width: 26px;
		height: 26px;
		padding: 0 8px;
		border-radius: 99px;
		background: var(--coral);
		color: #fff;
		font-weight: 900;
		font-size: 0.85rem;
	}
	.script-arrow {
		font-size: 1.2rem;
		font-weight: 900;
		color: var(--plum-ink);
	}

	.primary-card {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 18px 20px;
		border-radius: var(--radius);
		background: var(--gold);
		box-shadow: 0 5px 0 var(--gold-dark);
		text-decoration: none;
		color: #fff;
		transition: translate 0.1s ease, box-shadow 0.1s ease, filter 0.15s ease;
	}
	.primary-card:hover {
		filter: brightness(1.05);
	}
	.primary-card:active {
		translate: 0 5px;
		box-shadow: 0 0 0 var(--gold-dark);
	}
	.primary-emoji {
		width: 54px;
		height: 54px;
		display: grid;
		place-items: center;
		font-size: 1.9rem;
		border-radius: 16px;
		background: rgb(255 255 255 / 22%);
		flex-shrink: 0;
	}
	.primary-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.primary-title {
		font-weight: 900;
		font-size: 1.15rem;
	}
	.primary-sub {
		font-size: 0.9rem;
		font-weight: 700;
		opacity: 0.9;
	}
	.primary-arrow {
		font-size: 1.4rem;
		font-weight: 900;
	}

	.more {
		margin-top: 10px;
	}
	.more-title {
		font-size: 0.78rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--ink-soft);
		margin-bottom: 8px;
	}
	.more-card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 11px 14px;
		margin-bottom: 8px;
		border-radius: 14px;
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--line);
		text-decoration: none;
		color: var(--ink);
		transition: box-shadow 0.15s ease;
	}
	.more-card:hover {
		box-shadow: inset 0 0 0 2px var(--plum);
	}
	.more-emoji {
		width: 38px;
		height: 38px;
		display: grid;
		place-items: center;
		font-size: 1.2rem;
		border-radius: 11px;
		background: var(--plum-soft);
		color: var(--plum-ink);
		flex-shrink: 0;
	}
	.more-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}
	.more-name {
		font-weight: 900;
		font-size: 0.95rem;
	}
	.more-audience {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.more-arrow {
		font-weight: 900;
		color: var(--ink-soft);
	}

	.testout-chip {
		position: absolute;
		top: -8px;
		right: -14px;
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--teal), 0 2px 0 var(--teal-dark);
		text-decoration: none;
		font-size: 0.9rem;
		transition: scale 0.15s var(--pop);
	}
	.testout-chip:hover {
		scale: 1.15;
	}

	.stories-card {
		box-shadow: 0 4px 0 var(--coral-dark), inset 0 0 0 2px var(--coral);
	}
	.stories-card:active {
		translate: 0 4px;
		box-shadow: 0 0 0 var(--coral-dark), inset 0 0 0 2px var(--coral);
	}
	.stories-glyph {
		background: var(--coral-soft, var(--line));
	}
	.stories-title,
	.stories-arrow {
		color: var(--coral-ink);
	}

	.practice-card {
		box-shadow: 0 4px 0 var(--teal-dark), inset 0 0 0 2px var(--teal);
	}
	.practice-card:active {
		translate: 0 4px;
		box-shadow: 0 0 0 var(--teal-dark), inset 0 0 0 2px var(--teal);
	}
	.practice-glyph {
		background: var(--teal-soft);
	}
	.practice-title,
	.practice-arrow {
		color: var(--teal-ink);
	}

	.path {
		display: flex;
		flex-direction: column;
		gap: 36px;
		padding-top: 20px;
	}
	.unit-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		background: var(--unit-color);
		border-radius: var(--radius);
		padding: 18px 22px;
		color: #fff;
		box-shadow: 0 4px 0 rgb(0 0 0 / 18%);
	}
	.skip-unit {
		flex-shrink: 0;
		padding: 8px 14px;
		border-radius: 99px;
		background: rgb(255 255 255 / 22%);
		color: #fff;
		font-size: 0.82rem;
		font-weight: 800;
		white-space: nowrap;
		transition: background 0.15s ease, scale 0.2s var(--pop);
	}
	.skip-unit:hover {
		background: rgb(255 255 255 / 34%);
	}
	.skip-unit:active {
		scale: 0.94;
	}
	.skip-unit.done {
		background: rgb(0 0 0 / 20%);
	}
	.unit-header h2 {
		font-size: 1.25rem;
		font-weight: 900;
	}
	.unit-my {
		margin: 2px 0 0;
		opacity: 0.9;
		font-size: 1rem;
	}
	.nodes {
		display: flex;
		flex-direction: column;
		gap: 38px;
		padding: 34px 0 6px;
	}
	.node-row {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		translate: calc(var(--offset) * 72px) 0;
	}
	.node-wrap {
		position: relative;
	}
	.crown-chip {
		position: absolute;
		top: -8px;
		right: -14px;
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--line), 0 2px 0 var(--line);
		text-decoration: none;
		font-size: 0.95rem;
		filter: grayscale(1);
		opacity: 0.75;
		transition: scale 0.15s var(--pop), filter 0.2s ease, opacity 0.2s ease;
	}
	.crown-chip:hover {
		scale: 1.15;
		filter: grayscale(0.3);
		opacity: 1;
	}
	.crown-chip.crowned {
		filter: none;
		opacity: 1;
		box-shadow: inset 0 0 0 2px var(--gold), 0 2px 0 var(--gold-dark);
	}
	.freeze-mini {
		font-size: 0.75rem;
		font-weight: 900;
		color: var(--teal-ink);
	}
	.node {
		position: relative;
		width: 78px;
		height: 78px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--unit-color);
		box-shadow: 0 7px 0 rgb(0 0 0 / 22%);
		transition: translate 0.1s ease, box-shadow 0.1s ease, filter 0.2s ease;
	}
	.node:hover:not(:disabled) {
		filter: brightness(1.07);
	}
	.node:active:not(:disabled) {
		translate: 0 7px;
		box-shadow: 0 0 0 rgb(0 0 0 / 22%);
	}
	.node.locked {
		background: var(--disabled-bg);
		box-shadow: 0 7px 0 var(--disabled-shadow);
	}
	.node.current {
		animation: node-pulse 1.8s ease-in-out infinite;
	}
	.node-emoji {
		font-size: 1.9rem;
	}
	.node-stars {
		position: absolute;
		bottom: -4px;
		background: var(--card);
		border-radius: 99px;
		box-shadow: inset 0 0 0 1.5px var(--line);
		padding: 1px 7px;
		font-size: 0.7rem;
		color: var(--gold-ink);
	}
	.node-stars .dim {
		color: var(--star-dim);
	}
	/* Skipped lessons read as "passed over", not "done" — no stars, no colour. */
	.node.skipped {
		filter: grayscale(0.75);
		opacity: 0.7;
	}
	.node-skipped {
		color: var(--ink-soft);
		font-size: 0.62rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.start-bubble {
		position: absolute;
		top: -34px;
		background: var(--card);
		color: var(--gold-ink);
		font-size: 0.72rem;
		font-weight: 900;
		letter-spacing: 0.1em;
		padding: 6px 12px;
		border-radius: 10px;
		box-shadow: inset 0 0 0 2px var(--line);
		animation: bob 1.2s ease-in-out infinite;
		white-space: nowrap;
	}
	.start-bubble::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: -5px;
		translate: -50% 0;
		border: 5px solid transparent;
		border-top-color: var(--card);
		border-bottom: none;
	}
	.node-title {
		font-size: 0.88rem;
		font-weight: 800;
		color: var(--ink);
	}
	.node-title.muted {
		color: var(--ink-soft);
		opacity: 0.7;
	}
	.steps {
		display: flex;
		gap: 5px;
		margin-top: 5px;
	}
	.step-chip {
		font-size: 0.68rem;
		font-weight: 900;
		text-decoration: none;
		color: var(--plum-ink);
		background: var(--plum-soft);
		border-radius: 999px;
		padding: 2px 9px;
		line-height: 1.6;
		transition: scale 0.12s var(--pop);
	}
	.step-chip.done {
		color: var(--green-ink);
		background: var(--green-soft);
	}
	.step-chip:active {
		scale: 0.92;
	}

	.page-footer {
		margin-top: 48px;
		text-align: center;
		color: var(--ink-soft);
		font-size: 0.85rem;
	}
	.reset {
		color: var(--coral-ink);
		font-weight: 800;
		text-decoration: underline;
		font-size: 0.85rem;
	}

	@media (max-width: 520px) {
		.brand-name {
			display: none;
		}
		.pill {
			padding: 6px 10px;
			font-size: 0.82rem;
			white-space: nowrap;
		}
		.node-row {
			translate: calc(var(--offset) * 56px) 0;
		}
	}

	@keyframes node-pulse {
		0%, 100% { scale: 1; }
		50% { scale: 1.07; }
	}
	@keyframes bob {
		0%, 100% { translate: 0 0; }
		50% { translate: 0 -5px; }
	}
</style>
