<script lang="ts">
	// The app's primary navigation: a fixed bottom tab bar so every hub is one
	// tap away. Shown only on hub screens — inside a lesson or a drill it would
	// be a distraction and an escape hatch out of the flow, so it hides there.
	import { page } from '$app/state';
	import { House, GraduationCap, Dumbbell, User } from '@lucide/svelte';

	const path = $derived(page.url.pathname);

	// Hubs get the bar; players (lesson, practice run, script drills, a story)
	// do not. An exact-match allowlist is easier to reason about than trying to
	// enumerate every immersive route.
	const HUBS = ['/', '/learn', '/reader', '/script', '/account', '/stories', '/dictionary', '/cards'];
	const show = $derived(HUBS.includes(path));

	const tabs = [
		{ href: '/', label: 'Today', icon: House, on: (p: string) => p === '/' },
		{ href: '/learn', label: 'Learn', icon: GraduationCap, on: (p: string) => p === '/learn' || p.startsWith('/lesson') || p === '/dictionary' },
		{ href: '/practice', label: 'Practice', icon: Dumbbell, on: (p: string) => p.startsWith('/practice') || p === '/cards' },
		{ href: '/script', label: 'Script', glyph: 'က', on: (p: string) => p.startsWith('/script') },
		{ href: '/account', label: 'You', icon: User, on: (p: string) => p.startsWith('/account') }
	];
</script>

{#if show}
	<nav class="bottomnav" aria-label="Primary">
		{#each tabs as t (t.href)}
			<a href={t.href} class="tab" class:on={t.on(path)} aria-current={t.on(path) ? 'page' : undefined}>
				{#if t.glyph}
					<span class="glyph my" aria-hidden="true">{t.glyph}</span>
				{:else if t.icon}
					{@const Icon = t.icon}
					<Icon size={22} strokeWidth={1.9} aria-hidden="true" />
				{/if}
				<span class="lab">{t.label}</span>
			</a>
		{/each}
	</nav>
{/if}

<style>
	.bottomnav {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 40;
		display: flex;
		justify-content: space-around;
		align-items: stretch;
		padding: var(--s2) var(--s2) calc(var(--s2) + env(safe-area-inset-bottom));
		background: color-mix(in srgb, var(--card) 88%, transparent);
		backdrop-filter: blur(12px);
		border-top: 1px solid var(--line);
	}
	.tab {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		padding: 6px 0;
		text-decoration: none;
		color: var(--ink-soft);
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.01em;
		border-radius: var(--radius-sm);
		transition: color 0.15s ease;
	}
	.tab.on {
		color: var(--teal-ink);
	}
	.glyph {
		font-size: 1.35rem;
		line-height: 0.9;
		height: 22px;
		display: grid;
		place-items: center;
	}
	.tab :global(svg) {
		display: block;
	}

	/* Desktop: the bar becomes a slim rail is overkill for a mockup-faithful
	   pass; keep it a centered bottom bar with a max width so it doesn't stretch
	   across a wide monitor. */
	@media (min-width: 720px) {
		.bottomnav {
			left: 50%;
			right: auto;
			translate: -50% 0;
			bottom: 16px;
			max-width: 460px;
			width: calc(100% - 32px);
			border: 1px solid var(--line);
			border-radius: 20px;
			box-shadow: var(--shadow-pop);
		}
	}
</style>
