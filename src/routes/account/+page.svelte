<script lang="ts">
	import { progress, FREEZE_COST, MAX_FREEZES, type Profile, type Theme } from '$lib/progress.svelte';
	import { srs } from '$lib/srs.svelte';
	import { vocabSrs } from '$lib/vocab-srs.svelte';
	import { course } from '$lib/data/course';
	import { totalGlyphs } from '$lib/data/script';
	import { ui, immersionTier } from '$lib/i18n.svelte';
	import { achievements } from '$lib/achievements';
	import Mascot from '$lib/components/Mascot.svelte';
	import Heatmap from '$lib/components/Heatmap.svelte';

	const totalLessons = course.reduce((n, u) => n + u.lessons.length, 0);

	const since = $derived(
		new Date(progress.createdAt).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);

	const goalOptions = [10, 20, 30, 50];
	const earnedCount = $derived(
		achievements.filter((a) => a.id in progress.achievements).length
	);

	const themeOptions: { value: Theme; label: string }[] = [
		{ value: 'system', label: 'System' },
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' }
	];

	const profileOptions: { value: Profile; label: string }[] = [
		{ value: 'beginner', label: 'New to Burmese' },
		{ value: 'script-reader', label: 'Read, learning words' },
		{ value: 'speaker', label: 'Speak, learning script' },
		{ value: 'explorer', label: 'Exploring' }
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

	<section class="activity">
		<h2>Activity</h2>
		<Heatmap />
	</section>

	<section class="badges">
		<h2>Achievements <span class="badge-count">{earnedCount}/{achievements.length}</span></h2>
		<div class="badge-grid">
			{#each achievements as a (a.id)}
				{@const isEarned = a.id in progress.achievements}
				<div class="badge" class:earned={isEarned} title={a.desc}>
					<span class="badge-emoji">{a.emoji}</span>
					<span class="badge-name">{a.name}</span>
					<span class="badge-desc">{a.desc}</span>
				</div>
			{/each}
		</div>
	</section>

	<section class="settings">
		<h2>{ui('settings').text}</h2>
		<div class="setting">
			<span class="setting-text">
				<span class="setting-title">Starting point</span>
				<span class="setting-desc">
					Which track home leads with — everything stays open either way.
					Speakers also get ⚡ test-out on locked lessons; beginners get romanization
					on listening drills until they've learned some letters.
				</span>
			</span>
			<div class="theme-picker profile-picker" role="radiogroup" aria-label="Starting point">
				{#each profileOptions as opt (opt.value)}
					<button
						role="radio"
						aria-checked={progress.profile === opt.value}
						class:active={progress.profile === opt.value}
						onclick={() => progress.setProfile(opt.value)}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>
		<div class="setting">
			<span class="setting-text">
				<span class="setting-title">Daily goal</span>
				<span class="setting-desc">XP to earn each day — today: {progress.xpToday}/{progress.dailyGoal}.</span>
			</span>
			<div class="theme-picker" role="radiogroup" aria-label="Daily XP goal">
				{#each goalOptions as g (g)}
					<button
						role="radio"
						aria-checked={progress.dailyGoal === g}
						class:active={progress.dailyGoal === g}
						onclick={() => progress.setDailyGoal(g)}
					>
						{g}
					</button>
				{/each}
			</div>
		</div>
		<div class="setting">
			<span class="setting-text">
				<span class="setting-title">Streak freeze 🧊</span>
				<span class="setting-desc">
					Each one silently covers a missed day so your streak survives.
					Holding {progress.freezes}/{MAX_FREEZES}.
				</span>
			</span>
			<button
				class="buy-btn"
				disabled={progress.xp < FREEZE_COST || progress.freezes >= MAX_FREEZES}
				onclick={() => progress.buyFreeze()}
			>
				{progress.freezes >= MAX_FREEZES ? 'Max held' : `Buy · ${FREEZE_COST} XP`}
			</button>
		</div>
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
				<span class="setting-title">No-audio mode 🎧</span>
				<span class="setting-desc">
					Temporarily mute everything — for when you don't have headphones.
					Resets next time you open the app; your Sound setting above is unaffected.
				</span>
			</span>
			<input
				type="checkbox"
				checked={progress.tempMute}
				disabled={!progress.sound}
				onchange={() => progress.toggleTempMute()}
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
	.activity h2,
	.badges h2,
	.danger h2 {
		font-size: 1.1rem;
		font-weight: 900;
		padding: 26px 0 12px;
	}
	.badge-count {
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--ink-soft);
		margin-left: 6px;
	}
	.badge-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
	}
	@media (max-width: 440px) {
		.badge-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	.badge {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 4px;
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 14px 10px;
	}
	.badge:not(.earned) {
		opacity: 0.45;
		filter: grayscale(0.9);
	}
	.badge.earned {
		box-shadow: inset 0 0 0 2px var(--gold);
	}
	.badge-emoji {
		font-size: 1.7rem;
	}
	.badge-name {
		font-weight: 900;
		font-size: 0.85rem;
	}
	.badge-desc {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--ink-soft);
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
	.profile-picker {
		flex-wrap: wrap;
		justify-content: flex-end;
		max-width: 240px;
	}
	.theme-picker button.active {
		color: #fff;
		background: var(--gold);
		box-shadow: 0 2px 0 var(--gold-dark);
	}
	.buy-btn {
		padding: 10px 16px;
		border-radius: 12px;
		font-weight: 800;
		font-size: 0.85rem;
		color: #fff;
		background: var(--teal);
		box-shadow: 0 3px 0 var(--teal-dark);
		flex-shrink: 0;
	}
	.buy-btn:disabled {
		color: var(--disabled-ink, var(--ink-soft));
		background: var(--disabled-bg, var(--line));
		box-shadow: 0 3px 0 var(--disabled-shadow, var(--line));
		cursor: not-allowed;
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
