<script lang="ts">
	// What is inside a lesson, before committing to it — and the way past the
	// lock if the learner wants it.
	//
	// Opened by tapping any node on the path. On a locked node that replaces a
	// dead end (the tap used to just buzz) with the two things actually worth
	// having there: the whole word list, and a door.
	//
	// Lives once in the root layout like the other sheets, so opening it costs
	// the path neither its scroll position nor its state.
	import { fade, fly } from 'svelte/transition';
	import { lessonPreview } from '$lib/lesson-preview.svelte';
	import { progress } from '$lib/progress.svelte';
	import { findLesson } from '$lib/data/course';
	import { lessonOutline } from '$lib/lesson-outline';
	import { roundHref } from '$lib/rounds';
	import { sfx } from '$lib/audio';
	import { goto } from '$app/navigation';
	import SpeakButton from './SpeakButton.svelte';
	import { Lock, X } from '@lucide/svelte';

	const found = $derived(lessonPreview.lessonId ? findLesson(lessonPreview.lessonId) : undefined);
	const outline = $derived(
		found ? lessonOutline(found.lesson, found.unit.title, progress.stars) : null
	);
	const unlocked = $derived(found ? progress.isUnlocked(found.lesson.id) : false);

	function close() {
		lessonPreview.hide();
	}

	function unlock() {
		if (!found) return;
		sfx.tap();
		progress.openLessonEarly(found.lesson.id);
	}

	function start(href: string) {
		sfx.tap();
		close();
		goto(href);
	}

	function onkeydown(e: KeyboardEvent) {
		if (lessonPreview.open && e.key === 'Escape') {
			// Stopped so nothing underneath also treats Escape as its own.
			e.stopPropagation();
			close();
		}
	}
</script>

<svelte:window {onkeydown} />

{#if outline}
	<div
		class="backdrop"
		role="presentation"
		transition:fade={{ duration: 150 }}
		onclick={(e) => {
			if (e.target === e.currentTarget) close();
		}}
	>
		<div
			class="sheet"
			role="dialog"
			aria-modal="true"
			aria-label="What's in {outline.title}"
			transition:fly={{ y: 40, duration: 250 }}
		>
			<header>
				<span class="emoji" aria-hidden="true">{outline.emoji}</span>
				<div class="head-text">
					<span class="t">{outline.title}</span>
					<span class="sub">
						{outline.unitTitle}
						&middot; {outline.wordCount} words in {outline.parts.length} parts
						{#if outline.optional}&middot; optional{/if}
					</span>
				</div>
				<button class="x" onclick={close} aria-label="Close preview">
					<X size={18} strokeWidth={2.5} />
				</button>
			</header>

			<div class="body">
				{#each outline.parts as p (p.step)}
					<section class="part">
						<div class="ph">
							<span class="pl">{p.label}</span>
							{#if p.done}
								<span class="stars">{'★'.repeat(p.stars)}</span>
							{:else if p.step === 1}
								<span class="note">unlocks the next lesson</span>
							{:else}
								<span class="note">optional</span>
							{/if}
						</div>
						<ul class="words">
							{#each p.words as w (w.my)}
								<li>
									<SpeakButton text={w.my} />
									<div class="wt">
										<span class="my">{w.my}</span>
										<span class="en">
											<!-- Guarded on the value as well as the toggle: a
											     scriptOnly lesson has no `roman` at all, and an
											     unguarded render put an empty separator here. -->
											{#if w.roman && progress.showRoman}<span class="roman">{w.roman}</span><span class="sep"> &middot; </span>{/if}{w.en}
										</span>
									</div>
								</li>
							{/each}
						</ul>
					</section>
				{/each}
			</div>

			<footer>
				{#if unlocked}
					<button class="btn go" onclick={() => start(roundHref(outline.id, 1))}>
						{outline.parts[0].done ? 'Practise again' : 'Start this lesson'}
					</button>
				{:else}
					<!-- Not a warning, just the truth: the path is a recommendation,
					     and someone who wants to jump has a reason. -->
					<p class="hint">
						<Lock size={13} strokeWidth={2.4} />
						Normally you'd reach this by finishing the lessons before it.
					</p>
					<button class="btn open" onclick={unlock}>Unlock it anyway</button>
				{/if}
			</footer>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: rgb(0 0 0 / 45%);
		display: grid;
		place-items: center;
		padding: 20px;
	}
	.sheet {
		width: min(460px, 100%);
		max-height: min(85dvh, 680px);
		display: flex;
		flex-direction: column;
		background: var(--bg);
		border-radius: 20px;
		box-shadow: 0 12px 40px rgb(0 0 0 / 30%);
		overflow: hidden;
	}

	header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 16px 14px;
		border-bottom: 1.5px solid var(--line);
	}
	.emoji {
		font-size: 1.7rem;
		line-height: 1;
	}
	.head-text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.t {
		font-weight: 800;
		font-size: 1.05rem;
		color: var(--ink);
	}
	.sub {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--ink-soft);
	}
	.x {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 999px;
		background: var(--sink);
		color: var(--ink-soft);
		flex: 0 0 auto;
	}

	.body {
		flex: 1;
		overflow-y: auto;
		padding: 4px 16px 12px;
	}
	.part {
		margin-top: 14px;
	}
	.ph {
		display: flex;
		align-items: baseline;
		gap: 8px;
		padding-bottom: 4px;
	}
	.pl {
		font-size: 0.8rem;
		font-weight: 800;
		color: var(--ink);
	}
	.stars {
		font-size: 0.75rem;
		color: var(--gold);
	}
	.note {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--ink-soft);
	}

	.words {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.words li {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 0;
		border-top: 1px solid var(--line);
	}
	.wt {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.my {
		font-size: 1.15rem;
		line-height: 1.35;
		color: var(--ink);
	}
	.en {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--ink-soft);
	}
	.roman {
		color: var(--teal-ink);
	}
	/* Spaced with margins rather than literal spaces in the markup: Svelte
	   trims template whitespace at compile time, so " &middot; " arrived as a
	   bare "·" jammed between the two readings. */
	.sep {
		display: inline-block;
		margin: 0 5px;
		color: var(--ink-soft);
	}

	footer {
		padding: 12px 16px 16px;
		border-top: 1.5px solid var(--line);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.hint {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		margin: 0;
		font-size: 0.76rem;
		font-weight: 600;
		color: var(--ink-soft);
		text-align: center;
	}
	.btn {
		width: 100%;
		padding: 13px;
		border-radius: 14px;
		font-family: var(--font-ui);
		font-size: 0.95rem;
		font-weight: 800;
	}
	.go {
		background: var(--gold);
		color: #3a2a05;
	}
	/* Quieter than "Start": jumping the queue should look like a deliberate
	   choice, not the thing the sheet is nudging toward. */
	.open {
		background: var(--sink);
		color: var(--ink);
		box-shadow: inset 0 0 0 1.5px var(--line);
	}
</style>
