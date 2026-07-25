<script lang="ts">
	import { progress, FREEZE_COST, MAX_FREEZES, type Profile, type Theme } from '$lib/progress.svelte';
	import { srs } from '$lib/srs.svelte';
	import { vocabSrs } from '$lib/vocab-srs.svelte';
	import { customCards } from '$lib/custom-cards.svelte';
	import { calibration } from '$lib/calibration.svelte';
	import { confusions } from '$lib/confusion.svelte';
	import { describeLean } from '$lib/calibration';
	import { buildBackup, backupFilename, parseBackup, describeBackup } from '$lib/backup';
	import { VOICES, VOICE_IDS } from '$lib/voices';
	import { speak } from '$lib/audio';
	import { course } from '$lib/data/course';
	import { totalGlyphs } from '$lib/data/script';
	import { ui, immersionTier } from '$lib/i18n.svelte';
	import { achievements } from '$lib/achievements';
	import { sync } from '$lib/sync.svelte';
	import Mascot from '$lib/components/Mascot.svelte';
	import Heatmap from '$lib/components/Heatmap.svelte';
	import HubHeader from '$lib/components/HubHeader.svelte';
	import { overview } from '$lib/overview.svelte';
	import { Zap, Flame, GraduationCap, Trophy, Brain, Snowflake, Headphones, Download, Upload, Layers, Crown, BookOpen, BookOpenText, MessageSquare, PenLine, Cloud, CloudOff, RefreshCw, LogOut, Mail } from '@lucide/svelte';

	const courseTrack = $derived(overview.track('course'));
	const readerTrack = $derived(overview.track('reader'));
	const scriptTrack = $derived(overview.track('script'));
	const storyTrack = $derived(overview.track('stories'));

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
			// Predictions are about course words; keeping them would resolve
			// against a learner who no longer exists.
			calibration.reset();
		}
	}

	function resetScript() {
		if (confirm('Reset all Script Studio progress? This cannot be undone.')) {
			srs.reset();
			// The map is entirely about glyphs, so it goes with them.
			confusions.reset();
		}
	}

	function resetAll() {
		if (confirm('Reset EVERYTHING? This cannot be undone.')) {
			progress.reset();
			srs.reset();
			vocabSrs.reset();
			customCards.reset();
			calibration.reset();
			confusions.reset();
		}
	}

	// ── Backup ────────────────────────────────────────────────────────
	// No backend means this browser's localStorage is the only copy of
	// everything the learner has done. Export is the whole safety net.

	let fileInput = $state<HTMLInputElement | null>(null);
	let backupError = $state('');

	function exportBackup() {
		const file = buildBackup((key) => localStorage.getItem(key));
		const url = URL.createObjectURL(
			new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
		);
		const a = document.createElement('a');
		a.href = url;
		a.download = backupFilename();
		a.click();
		URL.revokeObjectURL(url);
		backupError = '';
	}

	async function onBackupFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		// Cleared so picking the same file again after an error still fires change.
		input.value = '';
		if (!file) return;

		const res = parseBackup(await file.text());
		if (!res.ok) {
			backupError = res.error;
			return;
		}
		backupError = '';
		const ok = confirm(
			`Restore this backup?\n\n${describeBackup(res.summary)}\n\n` +
				'This replaces all progress currently in this browser.'
		);
		if (!ok) return;
		for (const [key, value] of Object.entries(res.payloads)) localStorage.setItem(key, value);
		// Reload rather than patch the live stores: it re-runs the pre-paint theme
		// script, re-seeds the vocab SRS from the restored progress, and leaves no
		// chance of two stores disagreeing about which learner they belong to.
		location.reload();
	}

	// ── Sync ──────────────────────────────────────────────────────────
	// Entirely optional and additive: with no Supabase project configured,
	// `sync.enabled` is false and this whole section renders nothing, same as
	// the app before this existed. See $lib/sync.svelte.ts and $lib/sync-merge
	// for the sign-in flow and the merge rule.

	let syncEmail = $state('');

	function sendMagicLink(e: Event) {
		e.preventDefault();
		if (!syncEmail.trim()) return;
		sync.sendMagicLink(syncEmail.trim());
	}

	/** Coarse "3 minutes ago" phrasing — precision doesn't matter here. */
	function timeAgo(at: number): string {
		const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));
		if (seconds < 60) return 'just now';
		const minutes = Math.round(seconds / 60);
		if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
		const hours = Math.round(minutes / 60);
		if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
		const days = Math.round(hours / 24);
		return `${days} day${days === 1 ? '' : 's'} ago`;
	}

	const syncStatusText = $derived.by(() => {
		if (sync.status === 'syncing') return 'Syncing…';
		if (sync.status === 'offline') return "Offline — will sync next time you're online.";
		if (sync.status === 'error') return sync.message || 'Sync failed — will try again later.';
		if (sync.lastSyncedAt) return `Last synced ${timeAgo(sync.lastSyncedAt)}.`;
		return 'Not synced yet.';
	});
</script>

<svelte:head>
	<title>Profile · Shwe</title>
</svelte:head>

<div class="hub-page account">
	<HubHeader title={ui('profile').text} />

	<section class="hero">
		<Mascot mood="happy" size={110} />
		<div>
			<h2>Burmese learner</h2>
			<p class="since">Learning since {since}</p>
		</div>
	</section>

	<!-- Every track, not just the course and the glyphs. Reader units, stories,
	     deeper rounds, crowns and the vocabulary deck all existed and none of
	     them appeared here; the old "reviews due" tile showed the glyph deck
	     alone, which read as if it were every deck. -->
	<section class="stats-grid">
		<div class="stat">
			<span class="stat-value"><Zap size={18} strokeWidth={2} /> {progress.xp}</span>
			<span class="stat-label">total XP</span>
		</div>
		<div class="stat">
			<span class="stat-value"><Flame size={18} strokeWidth={2} /> {progress.streak}</span>
			<span class="stat-label">day {ui('streak').text.toLowerCase()}</span>
		</div>
		<div class="stat">
			<span class="stat-value"><Brain size={18} strokeWidth={2} /> {overview.combinedDue}</span>
			<span class="stat-label">reviews due, all decks</span>
		</div>
		<div class="stat">
			<span class="stat-value"><GraduationCap size={18} strokeWidth={2} /> {courseTrack.done}/{courseTrack.total}</span>
			<span class="stat-label">course lessons</span>
		</div>
		<div class="stat">
			<span class="stat-value"><Layers size={18} strokeWidth={2} /> {overview.rounds.done}/{overview.rounds.total}</span>
			<span class="stat-label">deeper rounds</span>
		</div>
		<div class="stat">
			<span class="stat-value"><Crown size={18} strokeWidth={2} /> {overview.crownCount}</span>
			<span class="stat-label">{overview.crownCount === 1 ? 'crown' : 'crowns'}</span>
		</div>
		<div class="stat">
			<span class="stat-value"><BookOpenText size={18} strokeWidth={2} /> {readerTrack.done}/{readerTrack.total}</span>
			<span class="stat-label">units read in script</span>
		</div>
		<div class="stat">
			<span class="stat-value"><BookOpen size={18} strokeWidth={2} /> {storyTrack.done}/{storyTrack.total}</span>
			<span class="stat-label">stories finished</span>
		</div>
		<div class="stat">
			<span class="stat-value"><MessageSquare size={18} strokeWidth={2} /> {vocabSrs.introducedCount}</span>
			<span class="stat-label">words learned</span>
		</div>
		<div class="stat">
			<span class="stat-value"><span class="my-accent my">က</span> {srs.introducedCount}/{totalGlyphs}</span>
			<span class="stat-label">glyphs learned</span>
		</div>
		<div class="stat">
			<span class="stat-value"><Trophy size={18} strokeWidth={2} /> {srs.masteredCount}</span>
			<span class="stat-label">glyphs mastered</span>
		</div>
		<div class="stat">
			<span class="stat-value"><PenLine size={18} strokeWidth={2} /> {scriptTrack.done}/{scriptTrack.total}</span>
			<span class="stat-label">alphabet units</span>
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
					Which track home leads with. Everything stays open either way.
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
				<span class="setting-desc">XP to earn each day. Today: {progress.xpToday}/{progress.dailyGoal}.</span>
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
				<span class="setting-title"><Snowflake size={16} strokeWidth={2} /> Streak freeze</span>
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
				<span class="setting-title"><Headphones size={16} strokeWidth={2} /> No-audio mode</span>
				<span class="setting-desc">
					Temporarily mute everything, for when you don't have headphones.
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
		<div class="setting">
			<span class="setting-text">
				<span class="setting-title">Voice</span>
				<span class="setting-desc">
					Who reads the Burmese. Listening drills that test similar sounds ignore this and
					switch between voices on purpose, so you learn the sound and not the speaker.
				</span>
			</span>
			<div class="theme-picker" role="radiogroup" aria-label="Voice">
				{#each VOICE_IDS as id (id)}
					<button
						role="radio"
						aria-checked={progress.voice === id}
						class:active={progress.voice === id}
						onclick={() => {
							progress.setVoice(id);
							speak('မင်္ဂလာပါ', id);
						}}
					>
						{VOICES[id].label}
					</button>
				{/each}
			</div>
		</div>
		<label class="setting">
			<span class="setting-text">
				<span class="setting-title">Romanization</span>
				<span class="setting-desc">Show pronunciation in Latin letters. Off by default: trust your ears.</span>
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
					The app's buttons and labels gradually switch to Burmese as you learn more script,
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

	{#if calibration.summary.resolved > 0 || calibration.pendingCount > 0}
		<section class="calibration">
			<h2>How well you read yourself</h2>
			<div class="cal-card">
				{#if calibration.summary.resolved > 0}
					<p class="cal-score">
						<strong>{calibration.summary.right}</strong> of
						<strong>{calibration.summary.resolved}</strong> predictions right
					</p>
					<div class="cal-bars">
						<span class="cal-bar over" style="--n: {calibration.summary.overshoot}"></span>
						<span class="cal-bar under" style="--n: {calibration.summary.undershoot}"></span>
					</div>
					<p class="cal-legend">
						{calibration.summary.overshoot} thought you'd remember and didn't ·
						{calibration.summary.undershoot} doubted yourself and knew it
					</p>
				{/if}
				<p class="cal-lean">{describeLean(calibration.summary)}</p>
				{#if calibration.pendingCount > 0}
					<p class="note">
						{calibration.pendingCount} prediction{calibration.pendingCount === 1 ? '' : 's'} waiting
						on {calibration.pendingCount === 1 ? 'its word' : 'their words'} to come back around.
					</p>
				{/if}
			</div>
		</section>
	{/if}

	{#if sync.enabled}
		<section class="sync">
			<h2>Sync</h2>
			{#if sync.user}
				<div class="setting">
					<span class="setting-text">
						<span class="setting-title"><Cloud size={16} strokeWidth={2} /> {sync.user.email}</span>
						<span class="setting-desc">{syncStatusText}</span>
					</span>
					<button
						class="buy-btn"
						disabled={sync.status === 'syncing'}
						onclick={() => sync.syncNow()}
					>
						<RefreshCw size={14} strokeWidth={2} /> Sync now
					</button>
				</div>
				<div class="setting">
					<span class="setting-text">
						<span class="setting-title">Signed in on this device</span>
						<span class="setting-desc">
							Signing out only forgets this device's sync connection. Everything already saved
							here stays right where it is.
						</span>
					</span>
					<button class="buy-btn" onclick={() => sync.signOut()}>
						<LogOut size={14} strokeWidth={2} /> Sign out
					</button>
				</div>
			{:else}
				<div class="setting sync-form">
					<span class="setting-text">
						<span class="setting-title"><CloudOff size={16} strokeWidth={2} /> Sync across devices</span>
						<span class="setting-desc">
							Optional. Sign in with an email link to back up your progress and settings to your
							account, and pick them up on another device. Nothing changes if you skip this.
						</span>
					</span>
					<form onsubmit={sendMagicLink}>
						<input
							type="email"
							placeholder="you@example.com"
							bind:value={syncEmail}
							required
							disabled={sync.status === 'sending-link'}
						/>
						<button class="buy-btn" type="submit" disabled={sync.status === 'sending-link'}>
							<Mail size={14} strokeWidth={2} />
							{sync.status === 'sending-link' ? 'Sending…' : 'Send magic link'}
						</button>
					</form>
				</div>
				{#if sync.status === 'link-sent'}
					<p class="note">Check {syncEmail} for a sign-in link.</p>
				{:else if sync.status === 'error'}
					<p class="backup-error" role="alert">{sync.message}</p>
				{/if}
			{/if}
		</section>
	{/if}

	<section class="backup">
		<h2>Backup</h2>
		<div class="setting">
			<span class="setting-text">
				<span class="setting-title"><Download size={16} strokeWidth={2} /> Save a backup</span>
				<span class="setting-desc">
					Downloads everything (XP, streak, stars, both review decks and your own cards) as
					one file. Keep it somewhere safe.
				</span>
			</span>
			<button class="buy-btn" onclick={exportBackup}>Download</button>
		</div>
		<div class="setting">
			<span class="setting-text">
				<span class="setting-title"><Upload size={16} strokeWidth={2} /> Restore a backup</span>
				<span class="setting-desc">
					Loads a backup file into this browser, replacing everything currently here.
				</span>
			</span>
			<button class="buy-btn" onclick={() => fileInput?.click()}>Choose file</button>
		</div>
		<input
			bind:this={fileInput}
			type="file"
			accept="application/json,.json"
			onchange={onBackupFile}
			hidden
		/>
		{#if backupError}
			<p class="backup-error" role="alert">{backupError}</p>
		{/if}
		<p class="note">
			Clearing your browser data wipes your progress, and there's no account to restore it from.
			A backup is the only copy that survives.
		</p>
	</section>

	<section class="danger">
		<h2>Danger zone</h2>
		<div class="danger-row">
			<button class="danger-btn" onclick={resetCourse}>Reset course</button>
			<button class="danger-btn" onclick={resetScript}>Reset script</button>
			<button class="danger-btn worst" onclick={resetAll}>Reset everything</button>
		</div>
		<p class="note">Everything lives in this browser's localStorage. No account, no cloud.</p>
	</section>
</div>

<style>
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
		display: inline-flex;
		align-items: center;
		gap: 7px;
		font-size: 1.2rem;
		font-weight: 800;
		color: var(--ink);
	}
	.stat-value :global(svg) {
		color: var(--teal-ink);
	}
	.my-accent {
		font-family: var(--font-my);
		color: var(--teal-ink);
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
	.calibration h2,
	.sync h2,
	.backup h2,
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
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-weight: 800;
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
		color: var(--on-primary);
		background: var(--teal-deep);
	}
	.buy-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 10px 16px;
		border-radius: 12px;
		font-weight: 700;
		font-size: 0.85rem;
		color: var(--on-primary);
		background: var(--teal-deep);
		box-shadow: 0 8px 20px -10px rgba(15, 63, 58, 0.5);
		flex-shrink: 0;
	}
	.buy-btn:disabled {
		color: var(--disabled-ink, var(--ink-soft));
		background: var(--disabled-bg, var(--line));
		box-shadow: none;
		cursor: not-allowed;
	}
	.cal-card {
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 16px;
	}
	.cal-score {
		margin: 0 0 10px;
		font-size: 1rem;
		font-weight: 700;
	}
	.cal-score strong {
		font-weight: 900;
	}
	/* Two bars sized by count, so the lean is visible before the sentence is read. */
	.cal-bars {
		display: flex;
		gap: 4px;
		height: 10px;
		margin-bottom: 8px;
	}
	.cal-bar {
		flex: var(--n) 0 0;
		border-radius: 5px;
		min-width: 0;
	}
	.cal-bar.over {
		background: var(--coral);
	}
	.cal-bar.under {
		background: var(--teal);
	}
	.cal-legend {
		margin: 0 0 10px;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.cal-lean {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 800;
	}
	.cal-card .note {
		margin-top: 10px;
	}
	/* The backup rows are informational, not clickable as a whole — the button is. */
	.backup .setting,
	.sync .setting {
		cursor: default;
	}
	.backup-error {
		margin: 2px 0 0;
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--coral-ink);
	}
	.sync-form {
		flex-wrap: wrap;
	}
	.sync-form form {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}
	.sync-form input {
		min-width: 0;
		padding: 10px 14px;
		border-radius: 12px;
		background: var(--bg);
		box-shadow: inset 0 0 0 2px var(--line);
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink);
	}
	.sync-form input::placeholder {
		color: var(--ink-soft);
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
		box-shadow: 0 8px 20px -10px rgba(224, 85, 72, 0.5);
	}
	.note {
		margin: 14px 0 0;
		font-size: 0.8rem;
		color: var(--ink-soft);
		font-weight: 700;
	}
</style>
