<script lang="ts">
	import { chartSections, glyphById, scriptUnits, totalGlyphs, type Glyph } from '$lib/data/script';
	import { srs } from '$lib/srs.svelte';
	import { progress } from '$lib/progress.svelte';
	import { ui } from '$lib/i18n.svelte';
	import GlyphProfile from '$lib/components/GlyphProfile.svelte';
	import Mascot from '$lib/components/Mascot.svelte';
	import { sfx } from '$lib/audio';
	import { goto } from '$app/navigation';
	import { Flame, Zap, Brain, Coffee, Lock, ArrowLeft } from '@lucide/svelte';

	const unitIds = scriptUnits.map((u) => u.id);
	let profileGlyph = $state<Glyph | null>(null);

	const anyIntroduced = $derived(srs.introducedCount > 0);
	const nextUnit = $derived(scriptUnits.find((u) => !srs.isUnitDone(u.id)));

	function openUnit(id: string, unlocked: boolean) {
		if (!unlocked) {
			sfx.wrong();
			return;
		}
		sfx.tap();
		goto(`/script/learn/${id}`);
	}

	const HEAT = ['var(--heat-0)', 'var(--heat-1)', 'var(--heat-2)', 'var(--heat-3)', 'var(--heat-4)'];
	function heat(id: string): string {
		const b = srs.box(id);
		return b < 0 ? 'transparent' : HEAT[b];
	}
</script>

<svelte:head>
	<title>Script Studio · Shwe</title>
</svelte:head>

<div class="studio">
	<header class="topbar">
		<a class="back" href="/" aria-label="Back home"><ArrowLeft size={22} strokeWidth={2} /></a>
		<div class="title">
			<h1>{ui('script-studio').text}</h1>
			<p class="my sub">အက္ခရာ</p>
		</div>
		<div class="pills">
			<span class="pill" title="Day streak"><Flame size={15} strokeWidth={2} /> {progress.streak}</span>
			<span class="pill" title="Total XP"><Zap size={15} strokeWidth={2} /> {progress.xp}</span>
		</div>
	</header>

	<section class="hero-cards">
		<button
			class="card practice-card"
			disabled={!anyIntroduced}
			onclick={() => {
				sfx.tap();
				goto('/script/practice');
			}}
		>
			<span class="card-emoji"><Brain size={28} strokeWidth={1.8} /></span>
			<span class="card-title">{ui('practice').text}</span>
			<span class="card-sub">
				{#if !anyIntroduced}
					Finish a lesson first
				{:else if srs.dueCount > 0}
					<span class="due-badge">{srs.dueCount}</span> {ui('to-review').text}
				{:else}
					All caught up, keep it sharp
				{/if}
			</span>
		</button>
		<button
			class="card builder-card"
			disabled={!srs.isUnitDone('first-letters')}
			onclick={() => {
				sfx.tap();
				goto('/script/builder');
			}}
		>
			<span class="card-emoji my">က<span class="builder-dia">ို</span></span>
			<span class="card-title">Syllable builder</span>
			<span class="card-sub">
				{srs.isUnitDone('first-letters') ? 'Snap sounds together' : 'Unlocks after unit 1'}
			</span>
		</button>
		<button
			class="card loanword-card"
			disabled={!srs.isUnitDone('first-letters')}
			onclick={() => {
				sfx.tap();
				goto('/script/loanwords');
			}}
		>
			<span class="card-emoji"><Coffee size={28} strokeWidth={1.8} /></span>
			<span class="card-title">Loanword Lab</span>
			<span class="card-sub">
				{srs.isUnitDone('first-letters')
					? 'Decode words you already know'
					: 'Unlocks after unit 1'}
			</span>
		</button>
	</section>

	{#if srs.isUnitDone('first-letters')}
		<p class="crosslink">
			Reading the letters already? <a href="/reader">Learn the course's words through script in the Reader track →</a>
		</p>
	{/if}

	<section class="units">
		<h2 class="section-title">Lessons</h2>
		<div class="unit-list">
			{#each scriptUnits as unit (unit.id)}
				{@const unlocked = srs.isUnitUnlocked(unitIds, unit.id)}
				{@const doneUnit = srs.isUnitDone(unit.id)}
				{@const isNext = nextUnit?.id === unit.id}
				<button
					class="unit-card {doneUnit ? 'done' : ''} {unlocked ? '' : 'locked'} {isNext ? 'next' : ''}"
					onclick={() => openUnit(unit.id, unlocked)}
					disabled={!unlocked}
				>
					<span class="unit-glyph my">{#if unlocked}{unit.icon ?? glyphById.get(unit.glyphIds[0])?.char}{:else}<Lock size={20} strokeWidth={2} />{/if}</span>
					<span class="unit-text">
						<span class="unit-title">{unit.title}</span>
						<span class="unit-blurb">{unit.blurb}</span>
					</span>
					<span class="unit-state">
						{#if doneUnit}★{:else if isNext}<span class="start-tag">{ui('start').text}</span>{/if}
					</span>
				</button>
			{/each}
		</div>
	</section>

	<section class="chart">
		<h2 class="section-title">
			The alphabet
			<span class="chart-stats">{srs.introducedCount}/{totalGlyphs} learned · {srs.masteredCount} mastered</span>
		</h2>
		{#each chartSections as section (section.title)}
			<div class="chart-section">
				<h3>{section.title}</h3>
				<div class="cells">
					{#each section.ids as id (id)}
						{@const g = glyphById.get(id)!}
						<button
							class="cell"
							onclick={() => (profileGlyph = g)}
							aria-label="{g.name} details"
						>
							<span class="my cell-char">{g.char}</span>
							<span class="heat" style="background: {heat(id)}"></span>
						</button>
					{/each}
				</div>
			</div>
		{/each}
		<div class="legend">
			<span><i style="background:var(--heat-0)"></i> new</span>
			<span><i style="background:var(--heat-1)"></i> learning</span>
			<span><i style="background:var(--heat-2)"></i> good</span>
			<span><i style="background:var(--heat-3)"></i> strong</span>
			<span><i style="background:var(--heat-4)"></i> mastered</span>
		</div>
	</section>

	{#if !anyIntroduced}
		<div class="nudge">
			<Mascot mood="idle" size={80} />
			<p>New here? Start with <strong>First letters</strong>. You’ll read real words in 5 minutes.</p>
		</div>
	{/if}
</div>

{#if profileGlyph}
	<GlyphProfile
		glyph={profileGlyph}
		onclose={() => (profileGlyph = null)}
		onjump={(g) => (profileGlyph = g)}
	/>
{/if}

<style>
	.studio {
		max-width: 560px;
		margin: 0 auto;
		padding: 0 20px calc(96px + env(safe-area-inset-bottom));
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
	.title {
		flex: 1;
	}
	.title h1 {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 1.5rem;
		font-weight: 400;
		color: var(--ink);
	}
	.pill :global(svg) {
		color: var(--gold-ink);
	}
	.sub {
		margin: 0;
		color: var(--ink-soft);
		font-size: 0.9rem;
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

	.crosslink {
		margin: 10px 0 0;
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.crosslink a {
		color: var(--teal-ink);
	}

	.hero-cards {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		padding: 8px 0 4px;
	}
	.card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		padding: 16px;
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: inset 0 0 0 1px var(--line);
		text-align: left;
		transition: translate 0.1s ease, box-shadow 0.15s ease;
	}
	.card:active:not(:disabled) {
		translate: 0 1px;
		box-shadow: inset 0 0 0 1.5px var(--teal);
	}
	.card:disabled {
		opacity: 0.55;
	}
	.card :global(svg) {
		color: var(--teal-ink);
	}
	.loanword-card {
		grid-column: 1 / -1;
	}
	.card-emoji {
		font-size: 1.7rem;
	}
	.builder-dia {
		color: var(--teal);
	}
	.card-title {
		font-weight: 900;
		font-size: 1.05rem;
	}
	.card-sub {
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.due-badge {
		display: inline-grid;
		place-items: center;
		min-width: 22px;
		height: 22px;
		padding: 0 6px;
		border-radius: 99px;
		background: var(--coral);
		color: #fff;
		font-weight: 900;
	}

	.section-title {
		font-size: 1.1rem;
		font-weight: 900;
		padding: 22px 0 10px;
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
	}
	.chart-stats {
		font-size: 0.8rem;
		color: var(--ink-soft);
		font-weight: 700;
	}
	.unit-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.unit-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 14px;
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: inset 0 0 0 1px var(--line);
		text-align: left;
		transition: translate 0.1s ease, box-shadow 0.15s ease;
	}
	.unit-card:active:not(:disabled) {
		translate: 0 1px;
		box-shadow: inset 0 0 0 1.5px var(--teal);
	}
	.unit-card.locked {
		opacity: 0.55;
	}
	.unit-card.next {
		box-shadow: inset 0 0 0 2px var(--teal), 0 0 0 3px rgba(11, 110, 110, 0.12);
	}
	.unit-card.done {
		background: var(--gold-wash);
	}
	.unit-glyph {
		font-size: 1.8rem;
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		border-radius: 12px;
		background: var(--gold-soft);
		flex-shrink: 0;
	}
	.unit-card.locked .unit-glyph {
		background: var(--line);
	}
	.unit-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.unit-title {
		font-weight: 900;
	}
	.unit-blurb {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.unit-state {
		font-size: 1.2rem;
		color: var(--gold);
	}
	.start-tag {
		font-size: 0.7rem;
		font-weight: 900;
		letter-spacing: 0.1em;
		color: var(--plum-ink);
		background: var(--plum-soft);
		border-radius: 8px;
		padding: 4px 8px;
		animation: bob 1.2s ease-in-out infinite;
		display: inline-block;
	}
	@keyframes bob {
		0%, 100% { translate: 0 0; }
		50% { translate: 0 -4px; }
	}

	.chart-section h3 {
		font-size: 0.8rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--ink-soft);
		padding: 10px 0 6px;
	}
	.cells {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
		gap: 8px;
	}
	.cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px 4px 6px;
		border-radius: 12px;
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--line);
		transition: translate 0.1s ease, background 0.15s ease;
	}
	.cell:hover {
		background: var(--card-hover);
		translate: 0 -2px;
	}
	.cell-char {
		font-size: 1.5rem;
		line-height: 1.4;
	}
	.heat {
		width: 26px;
		height: 5px;
		border-radius: 99px;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		padding: 16px 0 0;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.legend i {
		display: inline-block;
		width: 12px;
		height: 6px;
		border-radius: 99px;
		margin-right: 4px;
	}
	.nudge {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-top: 24px;
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 2px var(--line);
		padding: 14px 18px;
		font-weight: 700;
		color: var(--ink-soft);
	}
</style>
