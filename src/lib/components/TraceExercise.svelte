<script lang="ts">
	import { onMount } from 'svelte';
	import { sfx } from '$lib/audio';
	import { ui } from '$lib/i18n.svelte';
	import type { Stroke } from '$lib/data/script';

	let {
		char,
		label,
		fromMemory = false,
		strokes,
		oncomplete,
		onpeek
	}: {
		char: string;
		/** Shown instead of the glyph in memory mode (e.g. the sound). */
		label?: string;
		/** Hide the template: draw the glyph from memory (top-box SRS drill). */
		fromMemory?: boolean;
		/** Stroke-order hint paths (100×100 space), if authored for this glyph. */
		strokes?: Stroke[];
		oncomplete: () => void;
		/** Called when the learner peeks (or skips) in memory mode. */
		onpeek?: () => void;
	} = $props();

	// Stroke-order hints are disabled. The authored paths in `strokeData` were
	// tuned against an HTML text rendering, but this pad paints the glyph with
	// canvas fillText, whose metrics differ — the strokes land at roughly 70px
	// over a ~96px glyph, so they read as plainly wrong rather than helpful.
	// The data and the animation code below are kept intact: re-enabling means
	// deriving the paths from the same fillText metrics the pad uses (measure
	// the painted glyph's bounding box, then author in that space) and
	// flipping this flag. See IDEAS.md #6.
	const STROKE_HINTS_ENABLED = false;

	const SIZE = 260; // CSS pixels
	const GRID = 64; // coverage-check resolution
	const DONE_AT = 0.5; // fraction of the glyph you must cover
	const STROKE_SECS = 1.1; // hint draw time per stroke
	const STROKE_GAP = 0.25;

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let template: Uint8Array = new Uint8Array(GRID * GRID);
	let covered: Uint8Array = new Uint8Array(GRID * GRID);
	let templateCount = 0;
	let coveredCount = 0;
	let progress = $state(0);
	let done = $state(false);
	let drawing = false;
	let last: { x: number; y: number } | null = null;
	let peeking = $state(false);
	let hintPlaying = $state(false);
	let hintRun = $state(0);
	/** Hint paths, or undefined while the feature is disabled. */
	const hint = $derived(STROKE_HINTS_ENABLED ? strokes : undefined);
	let reducedMotion = $state(false);
	let hintTimer: ReturnType<typeof setTimeout>;

	const FONT = '“Padauk”, “Myanmar MN”, “Noto Sans Myanmar”, sans-serif';

	function drawGuide() {
		ctx.clearRect(0, 0, SIZE, SIZE);
		if (fromMemory) return; // memory mode: blank pad
		ctx.save();
		// Theme-aware guide tint — canvas can't use var() directly.
		ctx.fillStyle =
			getComputedStyle(canvas).getPropertyValue('--trace-guide').trim() ||
			'rgba(74, 53, 32, 0.13)';
		ctx.font = `170px ${FONT}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(char, SIZE / 2, SIZE / 2 + 8);
		ctx.restore();
	}

	async function init() {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = SIZE * dpr;
		canvas.height = SIZE * dpr;
		ctx = canvas.getContext('2d')!;
		ctx.scale(dpr, dpr);

		await document.fonts.ready;

		// Render the glyph small offscreen to learn which cells it occupies.
		const off = document.createElement('canvas');
		off.width = off.height = GRID;
		const octx = off.getContext('2d')!;
		octx.font = `42px ${FONT}`;
		octx.textAlign = 'center';
		octx.textBaseline = 'middle';
		octx.fillText(char, GRID / 2, GRID / 2 + 2);
		const img = octx.getImageData(0, 0, GRID, GRID).data;
		templateCount = 0;
		for (let i = 0; i < GRID * GRID; i++) {
			if (img[i * 4 + 3] > 100) {
				template[i] = 1;
				templateCount++;
			}
		}
		drawGuide();
	}

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		void init();
		// Auto-play the stroke hint once when tracing over the template.
		if (hint && hint.length > 0 && !fromMemory) {
			const t = setTimeout(playHint, 500);
			return () => {
				clearTimeout(t);
				clearTimeout(hintTimer);
			};
		}
		return () => clearTimeout(hintTimer);
	});

	function playHint() {
		if (!hint || done) return;
		clearTimeout(hintTimer);
		hintRun++; // remounts the overlay via {#key}, restarting the CSS animations
		hintPlaying = true;
		const total = reducedMotion ? 2.5 : hint.length * (STROKE_SECS + STROKE_GAP) + 0.8;
		hintTimer = setTimeout(() => (hintPlaying = false), total * 1000);
	}

	function pos(e: PointerEvent) {
		const r = canvas.getBoundingClientRect();
		return { x: e.clientX - r.left, y: e.clientY - r.top };
	}

	function mark(x: number, y: number) {
		// Map brush position onto the coverage grid and mark nearby glyph cells.
		const gx = Math.round((x / SIZE) * GRID);
		const gy = Math.round((y / SIZE) * GRID);
		const R = 4;
		for (let dy = -R; dy <= R; dy++) {
			for (let dx = -R; dx <= R; dx++) {
				const cx = gx + dx;
				const cy = gy + dy;
				if (cx < 0 || cy < 0 || cx >= GRID || cy >= GRID) continue;
				const i = cy * GRID + cx;
				if (template[i] && !covered[i]) {
					covered[i] = 1;
					coveredCount++;
				}
			}
		}
		progress = templateCount === 0 ? 0 : coveredCount / templateCount;
		if (!done && progress >= DONE_AT) {
			done = true;
			sfx.match();
			oncomplete();
		}
	}

	function down(e: PointerEvent) {
		if (done) return;
		drawing = true;
		last = pos(e);
		canvas.setPointerCapture(e.pointerId);
		mark(last.x, last.y);
	}

	function move(e: PointerEvent) {
		if (!drawing || done || !last) return;
		const p = pos(e);
		ctx.strokeStyle = '#f7b500';
		ctx.lineWidth = 18;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.beginPath();
		ctx.moveTo(last.x, last.y);
		ctx.lineTo(p.x, p.y);
		ctx.stroke();
		// Sample along the segment for coverage.
		const steps = Math.max(1, Math.ceil(Math.hypot(p.x - last.x, p.y - last.y) / 6));
		for (let s = 0; s <= steps; s++) {
			mark(last.x + ((p.x - last.x) * s) / steps, last.y + ((p.y - last.y) * s) / steps);
		}
		last = p;
	}

	function up() {
		drawing = false;
		last = null;
	}

	function clear() {
		covered = new Uint8Array(GRID * GRID);
		coveredCount = 0;
		progress = 0;
		done = false;
		drawGuide();
	}

	function peekDown() {
		if (!peeking) onpeek?.();
		peeking = true;
	}

	function peekUp() {
		peeking = false;
	}

	function skip() {
		if (fromMemory) onpeek?.(); // skipping a memory drill counts as not knowing it
		done = true;
		oncomplete();
	}
</script>

<div class="trace">
	<h2 class="question">
		{#if fromMemory}
			🧠 Draw <span class="memory-label">“{label ?? char}”</span> from memory
		{:else}
			✍️ {ui('trace-it').text} <span class="my target">{char}</span>
		{/if}
	</h2>
	<div class="pad" class:done>
		<canvas
			bind:this={canvas}
			style="width: {SIZE}px; height: {SIZE}px"
			onpointerdown={down}
			onpointermove={move}
			onpointerup={up}
			onpointercancel={up}
		></canvas>
		{#if peeking}
			<div class="peek-overlay my" aria-hidden="true">{char}</div>
		{/if}
		{#if hintPlaying && hint}
			{#key hintRun}
				<svg class="hint" class:static={reducedMotion} viewBox="0 0 100 100" aria-hidden="true">
					{#each hint as s, i (i)}
						<path
							d={s.d}
							pathLength="1"
							style="animation-delay: {reducedMotion ? 0 : i * (STROKE_SECS + STROKE_GAP)}s"
						/>
						<circle class="dot" cx={s.start[0]} cy={s.start[1]} r="5.5" />
						<text class="dot-num" x={s.start[0]} y={s.start[1]}>{i + 1}</text>
					{/each}
				</svg>
			{/key}
		{/if}
		{#if done}
			<div class="stamp">✓</div>
		{/if}
	</div>
	<div class="trace-bar">
		<div class="trace-fill" style="width: {Math.min(100, (progress / DONE_AT) * 100)}%"></div>
	</div>
	<div class="row">
		<button class="mini" onclick={clear}>↺ Clear</button>
		{#if hint && hint.length > 0 && !fromMemory && !done}
			<button class="mini" onclick={playHint}>▶ Show strokes</button>
		{/if}
		{#if fromMemory && !done}
			<button
				class="mini peek"
				onpointerdown={peekDown}
				onpointerup={peekUp}
				onpointercancel={peekUp}
				onpointerleave={peekUp}
			>
				👁 Hold to peek
			</button>
		{/if}
		{#if !done}
			<button class="mini skip-trace" onclick={skip}>Can’t draw right now</button>
		{/if}
	</div>
</div>

<style>
	.trace {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
	}
	.question {
		font-size: 1.3rem;
		font-weight: 900;
	}
	.target {
		font-size: 1.7rem;
		color: var(--gold-ink);
	}
	.memory-label {
		color: var(--plum-ink);
	}
	.pad {
		position: relative;
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: inset 0 0 0 2px var(--line);
		touch-action: none;
		transition: box-shadow 0.3s ease;
	}
	.pad.done {
		box-shadow: inset 0 0 0 2.5px var(--green);
		animation: pulse-pop 0.4s ease-in-out;
	}
	canvas {
		display: block;
		border-radius: var(--radius);
		cursor: crosshair;
	}
	.peek-overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-size: 170px;
		line-height: 1;
		color: var(--trace-guide, rgba(74, 53, 32, 0.13));
		pointer-events: none;
		padding-top: 16px;
	}
	.hint {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.hint path {
		fill: none;
		stroke: var(--teal);
		stroke-width: 4.5;
		stroke-linecap: round;
		stroke-linejoin: round;
		opacity: 0.9;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation: draw-stroke 1.1s ease-in-out forwards;
	}
	.hint.static path {
		stroke-dashoffset: 0;
		animation: none;
		opacity: 0.5;
	}
	.hint .dot {
		fill: var(--teal);
	}
	.hint .dot-num {
		fill: #fff;
		font-size: 7px;
		font-weight: 900;
		text-anchor: middle;
		dominant-baseline: central;
	}
	@keyframes draw-stroke {
		to {
			stroke-dashoffset: 0;
		}
	}
	.stamp {
		position: absolute;
		right: 10px;
		top: 8px;
		font-size: 1.6rem;
		font-weight: 900;
		color: var(--green);
	}
	.trace-bar {
		width: 260px;
		height: 10px;
		border-radius: 99px;
		background: var(--line);
		overflow: hidden;
	}
	.trace-fill {
		height: 100%;
		background: var(--green);
		border-radius: 99px;
		transition: width 0.15s ease;
	}
	.row {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.mini {
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--teal-ink);
		padding: 6px 12px;
		border-radius: 10px;
		box-shadow: inset 0 0 0 2px var(--line);
		background: var(--card);
	}
	.mini.peek {
		color: var(--plum-ink);
		touch-action: none;
	}
	.skip-trace {
		color: var(--ink-soft);
	}
</style>
