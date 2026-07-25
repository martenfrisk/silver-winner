<script lang="ts">
	// Today: the action-first home. It answers "what now?" — the streak/goal
	// dial, the one next thing to continue, what's due, and a story — then the
	// other tracks. The course path itself lives one tab over, at /learn.
	import { course } from '$lib/data/course';
	import { progress } from '$lib/progress.svelte';
	import { srs } from '$lib/srs.svelte';
	import { vocabSrs } from '$lib/vocab-srs.svelte';
	import { scriptUnits, totalGlyphs } from '$lib/data/script';
	import { readerStarsKey } from '$lib/reader-session';
	import { nextUp, primaryTrack, tracks } from '$lib/tracks';
	import { ui } from '$lib/i18n.svelte';
	import Mascot from '$lib/components/Mascot.svelte';
	import StartChooser from '$lib/components/StartChooser.svelte';
	import { stories } from '$lib/data/stories';
	import { customCards } from '$lib/custom-cards.svelte';
	import { confusions } from '$lib/confusion.svelte';
	import { combinedDue, deckSummaries, hasAnyDeck, type ReviewSnapshot } from '$lib/review';
	import { scriptSheet } from '$lib/script-sheet.svelte';
	import {
		GraduationCap, BookOpen, PenLine, Dumbbell, Layers, ArrowRight, Volume2, VolumeX
	} from '@lucide/svelte';

	const totalLessons = course.reduce((n, u) => n + u.lessons.length, 0);
	const goalPct = $derived(Math.min(1, progress.xpToday / Math.max(1, progress.dailyGoal)));
	const goalRemaining = $derived(Math.max(0, progress.dailyGoal - progress.xpToday));

	const allLessons = course.flatMap((u) => u.lessons);
	const unlockedStories = $derived(
		stories.filter((s) => s.requires.every((id) => progress.isCompleted(id))).length
	);

	const reviewSnapshot = $derived<ReviewSnapshot>({
		vocab: {
			due: vocabSrs.dueCount,
			known: vocabSrs.introducedCount,
			mastered: vocabSrs.masteredCount
		},
		glyphs: { due: srs.dueCount, known: srs.introducedCount, total: totalGlyphs },
		cards: { due: customCards.dueCount, count: customCards.count },
		pairs: { total: confusions.total }
	});
	const reviewDue = $derived(combinedDue(reviewSnapshot));
	const reviewStarted = $derived(hasAnyDeck(reviewSnapshot));
	const dueDecks = $derived(deckSummaries(reviewSnapshot).filter((d) => d.due > 0));

	const primary = $derived(primaryTrack(progress.profile));
	const courseNext = $derived(allLessons.find((l) => l.id === progress.currentLesson));
	const readerNext = $derived(course.find((u) => !(readerStarsKey(u.id) in progress.stars)));
	const scriptNext = $derived(scriptUnits.find((u) => !srs.isUnitDone(u.id)));
	const uncrowned = $derived(allLessons.find((l) => !progress.isCrowned(l.id)));

	const next = $derived(
		nextUp(progress.profile, {
			vocabDue: vocabSrs.dueCount,
			glyphsDue: srs.dueCount,
			nextLesson: courseNext,
			nextReaderUnit: readerNext,
			nextScriptUnit: scriptNext,
			uncrownedLesson: uncrowned
		})
	);

	// Capitalised so it can render as <NextIcon /> directly.
	const NextIcon = $derived(
		next.track === 'reader' ? BookOpen : next.track === 'script' ? PenLine : GraduationCap
	);

	function trackHref(id: string): string {
		if (id === 'course') return '/learn';
		return tracks.find((t) => t.id === id)!.href;
	}
	const trackIcon: Record<string, typeof BookOpen> = { reader: BookOpen, script: PenLine, course: GraduationCap };

	const heroSub = $derived.by(() => {
		if (progress.completedCount > 0) return null;
		if (progress.profile === 'script-reader') return 'You already read the script. Let’s fill in the words.';
		if (progress.profile === 'speaker') return 'Let’s get you reading what you already speak.';
		return null;
	});

	// Dial ring geometry (r = 40).
	const C = 2 * Math.PI * 40;
</script>

<svelte:head>
	<title>Shwe: Learn Burmese</title>
	<meta name="description" content="A playful way to learn the Burmese language." />
</svelte:head>

<div class="today" class:onboarding={progress.profile === null}>
	<header class="topbar">
		<span class="brand-name">Shwe</span>
		<div class="tools">
			<button
				class="tool"
				class:off={!progress.showRoman}
				onclick={() => progress.toggleRoman()}
				aria-pressed={progress.showRoman}
				title={progress.showRoman ? 'Hide romanization' : 'Show romanization'}>Aa</button>
			<button class="tool my" onclick={() => scriptSheet.show()} aria-label="Open the script table">က</button>
			<button
				class="tool icon"
				onclick={() => progress.toggleSound()}
				aria-pressed={progress.sound}
				title={progress.sound ? 'Sound on' : 'Sound off'}>
				{#if progress.sound}<Volume2 size={19} strokeWidth={2} />{:else}<VolumeX size={19} strokeWidth={2} />{/if}
			</button>
		</div>
	</header>

	<!-- The chooser sits above Today rather than replacing it. It used to be the
	     entire page body, so a brand new learner's first screen had no links at
	     all. Showing the real app underneath also means picking a profile
	     visibly reorders what's already on screen, which teaches what a profile
	     does far better than a gate would. -->
	{#if progress.profile === null}
		<StartChooser />
	{/if}

	<!-- While the chooser is up it is the hero: it already has the mascot and
	     the greeting, so rendering both put two cats and two မင်္ဂလာပါ on one
	     screen. -->
	{#if progress.profile !== null}
		<section class="hero">
			<Mascot mood={progress.completedCount === totalLessons ? 'celebrate' : 'idle'} size={84} />
			<div class="greet">
				<h1>
					{#if progress.completedCount === 0}
						မင်္ဂလာပါ!
					{:else if progress.completedCount === totalLessons}
						You finished the course!
					{:else}
						{ui('welcome-back').text}
					{/if}
				</h1>
				<p class="greet-sub">
					{#if progress.completedCount === 0}
						{heroSub ?? 'I’m Shwe. Let’s learn Burmese.'}
					{:else if progress.completedCount === totalLessons}
						ဂုဏ်ယူပါတယ်, congratulations!
					{:else}
						{progress.completedCount}/{totalLessons} lessons done.
					{/if}
				</p>
			</div>
		</section>
	{/if}

	<!-- One hero action. There used to be two cards answering the same
	     question (this one, and a suggestion inside the dial) which could
	     disagree with each other. See nextUp in $lib/tracks. -->
	<a class="primary-card" href={next.href}>
		<span class="pc-icon"><NextIcon size={24} strokeWidth={2} /></span>
		<span class="pc-text">
			<span class="pc-title">{next.title}</span>
			<span class="pc-sub">{next.sub}</span>
		</span>
		<ArrowRight size={22} strokeWidth={2} class="pc-arrow" />
	</a>

	<!-- The dial is now just the streak and goal readout: no link, no
	     competing suggestion. Still hidden until there's a number worth
	     showing. -->
	{#if progress.xp > 0}
		<div class="dial" class:reached={goalRemaining === 0}>
			<span class="ring" aria-hidden="true">
				<svg viewBox="0 0 92 92">
					<circle class="bg" cx="46" cy="46" r="40" />
					<circle class="fill" cx="46" cy="46" r="40" stroke-dasharray={C} stroke-dashoffset={C * (1 - goalPct)} transform="rotate(-90 46 46)" />
				</svg>
				<span class="mid"><span class="n">{progress.streak}</span><span class="u">streak</span></span>
			</span>
			<span class="dtext">
				<span class="lab">Today’s goal</span>
				<span class="big">{progress.xpToday} / {progress.dailyGoal} XP</span>
				<span class="sm">
					{#if goalRemaining === 0}Reached for today.
					{:else if progress.xpToday === 0}Nothing yet today.
					{:else}{goalRemaining} XP to go.{/if}
				</span>
			</span>
		</div>
	{/if}

	<!-- One tile for every deck. This used to be three (practice, cards, and
	     a second cards tile in the list below when the count was zero), which
	     meant "have I got anything to review?" had three answers on one
	     screen. See $lib/review. -->
	{#if reviewStarted}
		<a class="tile" href="/review">
			<span class="tile-icon teal"><Dumbbell size={20} strokeWidth={2} /></span>
			<span class="tile-text">
				<span class="tile-title">{ui('review').text}</span>
				<span class="tile-sub">
					{#if reviewDue > 0}
						{#each dueDecks as d, i (d.id)}{i > 0 ? ' · ' : ''}{d.due}
						{d.due === 1 ? d.noun.replace(/s$/, '') : d.noun}{/each}
					{:else}
						All caught up
					{/if}
				</span>
			</span>
			{#if reviewDue > 0}<span class="due">{reviewDue}</span>{:else}<ArrowRight size={18} strokeWidth={2} class="tile-arrow" />{/if}
		</a>
	{/if}

	{#if unlockedStories > 0}
		<a class="tile" href="/stories">
			<span class="tile-icon gold"><BookOpen size={20} strokeWidth={2} /></span>
			<span class="tile-text">
				<span class="tile-title">Stories</span>
				<span class="tile-sub">{unlockedStories} tiny conversation{unlockedStories > 1 ? 's' : ''} you can already understand</span>
			</span>
			<ArrowRight size={18} strokeWidth={2} class="tile-arrow" />
		</a>
	{/if}

	<section class="more">
		<h2 class="more-title">More ways to learn</h2>
		{#each tracks.filter((t) => t.id !== primary) as t (t.id)}
			{@const Icon = trackIcon[t.id]}
			<a class="tile" href={trackHref(t.id)}>
				<span class="tile-icon plum"><Icon size={20} strokeWidth={2} /></span>
				<span class="tile-text">
					<span class="tile-title">{t.title}</span>
					<span class="tile-sub">{t.audience}</span>
				</span>
				<ArrowRight size={18} strokeWidth={2} class="tile-arrow" />
			</a>
		{/each}
	</section>
</div>

<style>
	.today {
		max-width: 560px;
		margin: 0 auto;
		padding: var(--s4) var(--s5) calc(96px + env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		gap: var(--s3);
	}
	.today.onboarding { gap: var(--s5); }

	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--s2) 0 var(--s3);
	}
	.brand-name { font-family: var(--font-display); font-style: italic; font-size: 1.5rem; color: var(--ink); }
	.tools { display: flex; gap: var(--s2); }
	.tool {
		width: 38px; height: 38px; border-radius: var(--radius-sm);
		background: var(--card); box-shadow: inset 0 0 0 1px var(--line);
		color: var(--ink); font-weight: 700; font-size: 0.88rem;
		display: grid; place-items: center;
	}
	.tool.my { font-size: 1.1rem; color: var(--teal-ink); }
	.tool.off { color: var(--ink-soft); }

	.hero { display: flex; align-items: center; gap: var(--s3); padding: var(--s2) 0; }
	.greet h1 { font-family: var(--font-display); font-style: italic; font-weight: 400; font-size: 1.7rem; color: var(--ink); line-height: 1.05; }
	.greet-sub { color: var(--ink-soft); font-size: 0.92rem; margin-top: 2px; }

	/* Today dial — streak in the centre, daily goal as the ring. */
	.dial {
		display: flex; align-items: center; gap: var(--s5);
		background: var(--teal-deep); color: var(--on-primary);
		border-radius: var(--radius-lg); padding: var(--s5); text-decoration: none;
	}
	.dial .ring { position: relative; width: 88px; height: 88px; flex: 0 0 auto; }
	.dial .ring svg { width: 100%; height: 100%; }
	.dial .ring .bg { fill: none; stroke: rgba(255, 255, 255, 0.16); stroke-width: 6; }
	.dial .ring .fill { fill: none; stroke: var(--gold-bright, #f6c445); stroke-width: 6; stroke-linecap: round; transition: stroke-dashoffset 0.8s var(--pop); }
	.dial .ring .mid { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; line-height: 1; }
	.dial .ring .n { font-family: var(--font-display); font-style: italic; font-size: 1.9rem; color: var(--gold-bright, #f6c445); }
	.dial .ring .u { font-size: 0.56rem; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.8; margin-top: 5px; }
	.dial .dtext { display: flex; flex-direction: column; gap: 3px; }
	.dial .lab { font-size: 0.68rem; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700; opacity: 0.82; }
	.dial .big { font-family: var(--font-display); font-style: italic; font-size: 1.3rem; }
	.dial .sm { font-size: 0.82rem; opacity: 0.82; line-height: 1.4; }

	.primary-card {
		display: flex; align-items: center; gap: var(--s4);
		background: var(--teal-deep); color: var(--on-primary);
		border-radius: var(--radius-lg); padding: var(--s5); text-decoration: none;
		position: relative; overflow: hidden;
	}
	.pc-icon { width: 46px; height: 46px; border-radius: var(--radius-sm); background: rgba(255, 255, 255, 0.12); display: grid; place-items: center; flex: 0 0 auto; }
	.pc-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
	.pc-title { font-weight: 700; font-size: 1.1rem; }
	.pc-sub { font-size: 0.86rem; opacity: 0.82; }
	.primary-card :global(.pc-arrow) { opacity: 0.7; flex: 0 0 auto; }

	.tile {
		display: flex; align-items: center; gap: var(--s4);
		background: var(--card); border-radius: var(--radius);
		box-shadow: inset 0 0 0 1px var(--line); padding: var(--s4); text-decoration: none;
	}
	.tile-icon { width: 42px; height: 42px; border-radius: var(--radius-sm); display: grid; place-items: center; flex: 0 0 auto; }
	.tile-icon.teal { background: var(--teal-soft); color: var(--teal-ink); }
	.tile-icon.gold { background: var(--gold-wash); color: var(--gold-ink); }
	.tile-icon.plum { background: var(--plum-soft); color: var(--plum-ink); }
	.tile-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
	.tile-title { font-weight: 700; font-size: 0.98rem; color: var(--ink); }
	.tile-sub { font-size: 0.82rem; color: var(--ink-soft); line-height: 1.35; }
	.tile :global(.tile-arrow) { color: var(--ink-soft); flex: 0 0 auto; }
	.due {
		min-width: 26px; height: 26px; padding: 0 8px; border-radius: 999px;
		background: var(--coral); color: #fff; font-weight: 800; font-size: 0.82rem;
		display: grid; place-items: center; flex: 0 0 auto;
	}

	.more { margin-top: var(--s3); display: flex; flex-direction: column; gap: var(--s3); }
	.more-title { font-size: 0.72rem; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 800; color: var(--ink-soft); }
</style>
