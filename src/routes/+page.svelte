<script lang="ts">
	import { course } from '$lib/data/course';
	import { progress } from '$lib/progress.svelte';
	import { srs } from '$lib/srs.svelte';
	import { vocabSrs } from '$lib/vocab-srs.svelte';
	import { totalGlyphs } from '$lib/data/script';
	import { ui } from '$lib/i18n.svelte';
	import Mascot from '$lib/components/Mascot.svelte';
	import { sfx } from '$lib/audio';
	import { goto } from '$app/navigation';

	const totalLessons = course.reduce((n, u) => n + u.lessons.length, 0);
	const goalPct = $derived(Math.min(1, progress.xpToday / Math.max(1, progress.dailyGoal)));

	function openLesson(id: string, unlocked: boolean) {
		if (!unlocked) {
			sfx.wrong();
			return;
		}
		sfx.tap();
		goto(`/lesson/${id}`);
	}

	function confirmReset() {
		if (confirm('Reset all progress? This cannot be undone.')) {
			progress.reset();
		}
	}
</script>

<svelte:head>
	<title>MyanLingo — Learn Burmese</title>
	<meta name="description" content="A playful way to learn the Burmese language." />
</svelte:head>

<div class="home">
	<header class="topbar">
		<div class="brand">
			<span class="brand-mark">မ</span>
			<span class="brand-name">MyanLingo</span>
		</div>
		<div class="pills">
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

	<section class="hero">
		<Mascot mood={progress.completedCount === totalLessons ? 'celebrate' : 'idle'} size={130} />
		<div class="hero-text">
			<h1>
				{#if progress.completedCount === 0}
					မင်္ဂလာပါ! <span class="hero-sub">I’m Shwe. Let’s learn Burmese!</span>
				{:else if progress.completedCount === totalLessons}
					You finished the course! <span class="hero-sub">ဂုဏ်ယူပါတယ် — congratulations!</span>
				{:else}
					{ui('welcome-back').text} <span class="hero-sub">{progress.completedCount}/{totalLessons} lessons done. Keep going!</span>
				{/if}
			</h1>
		</div>
	</section>

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

	<a class="script-card" href="/script">
		<span class="script-glyph my">အ</span>
		<span class="script-text">
			<span class="script-title">{ui('script-studio').text} <span class="optional-tag">optional</span></span>
			<span class="script-sub">
				{#if srs.introducedCount === 0}
					Learn to read Burmese — start with the letters
				{:else}
					{srs.introducedCount}/{totalGlyphs} glyphs · {srs.masteredCount} mastered
				{/if}
			</span>
		</span>
		{#if srs.dueCount > 0}
			<span class="script-due">{srs.dueCount}</span>
		{:else}
			<span class="script-arrow">→</span>
		{/if}
	</a>

	<div class="path">
		{#each course as unit (unit.id)}
			<section class="unit">
				<div class="unit-header" style="--unit-color: {unit.color}">
					<div>
						<h2>{unit.title}</h2>
						<p class="my unit-my">{unit.my}</p>
					</div>
				</div>
				<div class="nodes">
					{#each unit.lessons as lesson, i (lesson.id)}
						{@const unlocked = progress.isUnlocked(lesson.id)}
						{@const stars = progress.stars[lesson.id] ?? 0}
						{@const isCurrent = progress.currentLesson === lesson.id}
						<div class="node-row" style="--offset: {[0, 1, -1][i % 3]}">
							<div class="node-wrap">
								<button
									class="node {unlocked ? '' : 'locked'} {stars > 0 ? 'completed' : ''} {isCurrent ? 'current' : ''}"
									style="--unit-color: {unit.color}"
									onclick={() => openLesson(lesson.id, unlocked)}
									disabled={!unlocked}
									aria-label="{lesson.title}{unlocked ? '' : ' (locked)'}"
								>
									{#if isCurrent}
										<span class="start-bubble" class:my={ui('start').my}>{ui('start').text}</span>
									{/if}
									<span class="node-emoji">{unlocked ? lesson.emoji : '🔒'}</span>
									{#if stars > 0}
										<span class="node-stars">
											{'★'.repeat(stars)}<span class="dim">{'★'.repeat(3 - stars)}</span>
										</span>
									{/if}
								</button>
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
</div>

<style>
	.home {
		max-width: 560px;
		margin: 0 auto;
		padding: 0 20px 60px;
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
		padding: 18px 0 8px;
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

	.script-card {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-top: 14px;
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
	.optional-tag {
		font-size: 0.65rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--ink-soft);
		background: var(--line);
		border-radius: 6px;
		padding: 2px 6px;
		vertical-align: middle;
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
		background: var(--unit-color);
		border-radius: var(--radius);
		padding: 18px 22px;
		color: #fff;
		box-shadow: 0 4px 0 rgb(0 0 0 / 18%);
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
