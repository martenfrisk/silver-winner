<script lang="ts">
	import { onMount } from 'svelte';
	import { sfx } from '$lib/audio';
	import { ui } from '$lib/i18n.svelte';

	let { char, oncomplete }: { char: string; oncomplete: () => void } = $props();

	const SIZE = 260; // CSS pixels
	const GRID = 64; // coverage-check resolution
	const DONE_AT = 0.5; // fraction of the glyph you must cover

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

	const FONT = '“Padauk”, “Myanmar MN”, “Noto Sans Myanmar”, sans-serif';

	function drawGuide() {
		ctx.clearRect(0, 0, SIZE, SIZE);
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
		void init();
	});

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
</script>

<div class="trace">
	<h2 class="question">✍️ {ui('trace-it').text} <span class="my target">{char}</span></h2>
	<div class="pad" class:done>
		<canvas
			bind:this={canvas}
			style="width: {SIZE}px; height: {SIZE}px"
			onpointerdown={down}
			onpointermove={move}
			onpointerup={up}
			onpointercancel={up}
		></canvas>
		{#if done}
			<div class="stamp">✓</div>
		{/if}
	</div>
	<div class="trace-bar">
		<div class="trace-fill" style="width: {Math.min(100, (progress / DONE_AT) * 100)}%"></div>
	</div>
	<div class="row">
		<button class="mini" onclick={clear}>↺ Clear</button>
		{#if !done}
			<button class="mini skip-trace" onclick={() => { done = true; oncomplete(); }}>
				Can’t draw right now
			</button>
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
	.skip-trace {
		color: var(--ink-soft);
	}
</style>
