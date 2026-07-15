<script lang="ts">
	// Lightweight CSS confetti burst — no dependencies.
	const COLORS = ['#f7b500', '#0ea5a5', '#8b5cf6', '#ff6b5e', '#2fb350'];
	const pieces = Array.from({ length: 48 }, (_, i) => ({
		id: i,
		left: Math.random() * 100,
		delay: Math.random() * 0.7,
		duration: 2.2 + Math.random() * 1.6,
		size: 7 + Math.random() * 7,
		color: COLORS[i % COLORS.length],
		spin: Math.random() > 0.5 ? 1 : -1,
		sway: 20 + Math.random() * 40
	}));
</script>

<div class="confetti" aria-hidden="true">
	{#each pieces as p (p.id)}
		<span
			style="
				left: {p.left}%;
				width: {p.size}px;
				height: {p.size * 0.6}px;
				background: {p.color};
				animation-delay: {p.delay}s;
				animation-duration: {p.duration}s;
				--sway: {p.sway * p.spin}px;
			"
		></span>
	{/each}
</div>

<style>
	.confetti {
		position: fixed;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		z-index: 50;
	}
	span {
		position: absolute;
		top: -20px;
		border-radius: 2px;
		animation: confetti-fall linear forwards;
	}
	@keyframes confetti-fall {
		0% {
			transform: translateY(-20px) translateX(0) rotate(0deg);
			opacity: 1;
		}
		25% {
			transform: translateY(28vh) translateX(var(--sway)) rotate(180deg);
		}
		50% {
			transform: translateY(55vh) translateX(calc(var(--sway) * -0.6)) rotate(420deg);
		}
		100% {
			transform: translateY(110vh) translateX(var(--sway)) rotate(720deg);
			opacity: 0.8;
		}
	}
</style>
