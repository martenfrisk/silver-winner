<script lang="ts">
	import { progress, type Theme } from '$lib/progress.svelte';
	import { srs } from '$lib/srs.svelte';
	import { vocabSrs } from '$lib/vocab-srs.svelte';
	import { course } from '$lib/data/course';
	import { totalGlyphs } from '$lib/data/script';
	import { ui, immersionTier } from '$lib/i18n.svelte';
	import Mascot from '$lib/components/Mascot.svelte';

	const totalLessons = course.reduce((n, u) => n + u.lessons.length, 0);

	const since = $derived(
		new Date(progress.createdAt).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);

	const themeOptions: { value: Theme; label: string }[] = [
		{ value: 'system', label: 'System' },
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' }
	];

	function resetCourse() {
		if (confirm('Reset course progress (lessons, XP, streak)? This cannot be undone.')) {
			progress.reset();
			vocabSrs.reset();
		}
	}

	function resetScript() {
		if (confirm('Reset all Script Studio progress? This cannot be undone.')) {
			srs.reset();
		}
	}

	function resetAll() {
		if (confirm('Reset EVERYTHING? This cannot be undone.')) {
			progress.reset();
			srs.reset();
			vocabSrs.reset();
		}
	}
</script>

<svelte:head>
	<title>Profile · MyanLingo</title>
</svelte:head>

<div class="account">
	<header class="topbar">
		<a class="back" href="/" aria-label="Back home">←</a>
		<h1>{ui('profile').text}</h1>
	</header>

	<section class="hero">
		<Mascot mood="happy" size={110} />
		<div>
			<h2>Burmese learner</h2>
			<p class="since">Learning since {since}</p>
		</div>
	</section>

	<section class="stats-grid">
		<div class="stat">
			<span class="stat-value">⚡ {progress.xp}</span>
			<span class="stat-label">total XP</span>
		</div>
		<div class="stat">
			<span class="stat-value">🔥 {progress.streak}</span>
			<span class="stat-label">day {ui('streak').text.toLowerCase()}</span>
		</div>
		<div class="stat">
			<span class="stat-value">📚 {progress.completedCount}/{totalLessons}</span>
			<span class="stat-label">course lessons</span>
		</div>
		<div class="stat">
			<span class="stat-value my-accent">က {srs.introducedCount}/{totalGlyphs}</span>
			<span class="stat-label">glyphs learned</span>
		</div>
		<div class="stat">
			<span class="stat-value">🏆 {srs.masteredCount}</span>
			<span class="stat-label">glyphs mastered</span>
		</div>
		<div class="stat">
			<span class="stat-value">🧠 {srs.dueCount}</span>
			<span class="stat-label">reviews due</span>
		</div>
	</section>

	<section class="settings">
		<h2>{ui('settings').text}</h2>
		<label class="setting">
			<span class="setting-text">
				<span class="setting-title">Sound</span>
				<span class="setting-desc">Effects, pronunciations and fanfares.</span>
			</span>
			<input
				type="checkbox"
				checked={progress.sound}
				onchange={() => progress.toggleSound()}
			/>
		</label>
		<label class="setting">
			<span class="setting-text">
				<span class="setting-title">Romanization</span>
				<span class="setting-desc">Show pronunciation in Latin letters. Off by default — trust your ears.</span>
			</span>
			<input
				type="checkbox"
				checked={progress.showRoman}
				onchange={() => progress.toggleRoman()}
			/>
		</label>
		<div class="setting">
			<span class="setting-text">
				<span class="setting-title">Theme</span>
				<span class="setting-desc">Follow your device, or force light or dark.</span>
			</span>
			<div class="theme-picker" role="radiogroup" aria-label="Theme">
				{#each themeOptions as opt (opt.value)}
					<button
						role="radio"
						aria-checked={progress.theme === opt.value}
						class:active={progress.theme === opt.value}
						onclick={() => progress.setTheme(opt.value)}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>
		<label class="setting">
			<span class="setting-text">
				<span class="setting-title">Immersion mode</span>
				<span class="setting-desc">
					The app's buttons and labels gradually switch to Burmese as you learn more script —
					like setting your phone to Burmese, but step by step.
					{#if progress.immersion}
						<strong>Current level: {immersionTier()}/3</strong>
						{#if immersionTier() === 0}
							(learn 5+ glyphs in the Script Studio to see it kick in)
						{/if}
					{/if}
				</span>
			</span>
			<input
				type="checkbox"
				checked={progress.immersion}
				onchange={() => progress.toggleImmersion()}
			/>
		</label>
	</section>

	<section class="danger">
		<h2>Danger zone</h2>
		<div class="danger-row">
			<button class="danger-btn" onclick={resetCourse}>Reset course</button>
			<button class="danger-btn" onclick={resetScript}>Reset script</button>
			<button class="danger-btn worst" onclick={resetAll}>Reset everything</button>
		</div>
		<p class="note">Everything lives in this browser's localStorage — no account, no cloud.</p>
	</section>
</div>

<style>
	.account {
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
	.topbar h1 {
		font-size: 1.35rem;
		font-weight: 900;
	}
	.hero {
		display: flex;
		align-items: center;
		gap: 18px;
		padding: 10px 0 20px;
	}
	.hero h2 {
		font-size: 1.3rem;
		font-weight: 900;
	}
	.since {
		margin: 4px 0 0;
		color: var(--ink-soft);
		font-weight: 700;
		font-size: 0.9rem;
	}
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
	}
	@media (max-width: 440px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	.stat {
		display: flex;
		flex-direction: column;
		gap: 4px;
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 14px 16px;
	}
	.stat-value {
		font-size: 1.2rem;
		font-weight: 900;
	}
	.my-accent {
		font-family: var(--font-my);
	}
	.stat-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--ink-soft);
		font-weight: 800;
	}
	.settings h2,
	.danger h2 {
		font-size: 1.1rem;
		font-weight: 900;
		padding: 26px 0 12px;
	}
	.setting {
		display: flex;
		align-items: center;
		gap: 16px;
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 14px 16px;
		margin-bottom: 10px;
		cursor: pointer;
	}
	.setting-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}
	.setting-title {
		font-weight: 900;
	}
	.setting-desc {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.setting input {
		appearance: none;
		width: 52px;
		height: 30px;
		border-radius: 99px;
		background: var(--line);
		position: relative;
		cursor: pointer;
		transition: background 0.2s ease;
		flex-shrink: 0;
	}
	.setting input::after {
		content: '';
		position: absolute;
		left: 4px;
		top: 4px;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 1px 3px rgb(0 0 0 / 25%);
		transition: translate 0.2s var(--pop);
	}
	.setting input:checked {
		background: var(--green);
	}
	.setting input:checked::after {
		translate: 22px 0;
	}
	.theme-picker {
		display: flex;
		gap: 6px;
		flex-shrink: 0;
	}
	.theme-picker button {
		padding: 8px 12px;
		border-radius: 10px;
		font-size: 0.8rem;
		font-weight: 800;
		color: var(--ink-soft);
		background: var(--bg);
		box-shadow: inset 0 0 0 2px var(--line);
		transition:
			background 0.15s ease,
			color 0.15s ease,
			box-shadow 0.15s ease;
	}
	.theme-picker button.active {
		color: #fff;
		background: var(--gold);
		box-shadow: 0 2px 0 var(--gold-dark);
	}
	.danger-row {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	.danger-btn {
		padding: 10px 16px;
		border-radius: 12px;
		font-weight: 800;
		font-size: 0.9rem;
		color: var(--coral-ink);
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--coral-line);
	}
	.danger-btn.worst {
		color: #fff;
		background: var(--coral);
		box-shadow: 0 3px 0 var(--coral-dark);
	}
	.note {
		margin: 14px 0 0;
		font-size: 0.8rem;
		color: var(--ink-soft);
		font-weight: 700;
	}
</style>
