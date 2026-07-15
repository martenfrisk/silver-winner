<script lang="ts">
	// Shwe (ရွှေ, "gold") — MyanLingo's Burmese cat mascot.
	// Moods drive small SVG animations: idle blink, happy bounce,
	// sad ears, celebratory wiggle.
	let {
		mood = 'idle',
		size = 120
	}: { mood?: 'idle' | 'happy' | 'sad' | 'celebrate'; size?: number } = $props();
</script>

<svg
	class="shwe {mood}"
	width={size}
	height={size}
	viewBox="0 0 120 120"
	xmlns="http://www.w3.org/2000/svg"
	role="img"
	aria-label="Shwe the cat mascot, feeling {mood}"
>
	<!-- tail -->
	<path
		class="tail"
		d="M96 92 Q116 86 112 66 Q110 56 102 54"
		fill="none"
		stroke="#e0a400"
		stroke-width="9"
		stroke-linecap="round"
	/>
	<!-- body -->
	<ellipse cx="60" cy="88" rx="34" ry="26" fill="#f7b500" />
	<ellipse cx="60" cy="94" rx="20" ry="16" fill="#ffe9ad" />
	<!-- paws -->
	<ellipse cx="44" cy="110" rx="9" ry="6" fill="#e0a400" />
	<ellipse cx="76" cy="110" rx="9" ry="6" fill="#e0a400" />

	<g class="head-group">
		<!-- ears -->
		<g class="ear left">
			<path d="M26 34 L34 8 L50 26 Z" fill="#f7b500" />
			<path d="M31 28 L35 15 L43 24 Z" fill="#8a5a2b" />
		</g>
		<g class="ear right">
			<path d="M94 34 L86 8 L70 26 Z" fill="#f7b500" />
			<path d="M89 28 L85 15 L77 24 Z" fill="#8a5a2b" />
		</g>
		<!-- head -->
		<circle cx="60" cy="44" r="32" fill="#f7b500" />
		<!-- burmese cat face mask -->
		<ellipse cx="60" cy="52" rx="22" ry="17" fill="#c98a1b" opacity="0.55" />
		<!-- muzzle -->
		<ellipse cx="60" cy="56" rx="14" ry="10" fill="#ffe9ad" />
		<!-- eyes -->
		<g class="eyes">
			<g class="eye-open">
				<circle cx="47" cy="42" r="6" fill="#3a2410" />
				<circle cx="73" cy="42" r="6" fill="#3a2410" />
				<circle cx="49" cy="40" r="2" fill="#fff" />
				<circle cx="75" cy="40" r="2" fill="#fff" />
			</g>
			<g class="eye-closed">
				<path d="M41 43 Q47 47 53 43" fill="none" stroke="#3a2410" stroke-width="2.5" stroke-linecap="round" />
				<path d="M67 43 Q73 47 79 43" fill="none" stroke="#3a2410" stroke-width="2.5" stroke-linecap="round" />
			</g>
		</g>
		<!-- nose + mouth -->
		<path d="M56 52 L64 52 L60 57 Z" fill="#d96c47" />
		{#if mood === 'sad'}
			<path class="mouth" d="M53 66 Q60 60 67 66" fill="none" stroke="#3a2410" stroke-width="2.5" stroke-linecap="round" />
		{:else}
			<path class="mouth" d="M60 57 Q60 62 54 62 M60 57 Q60 62 66 62" fill="none" stroke="#3a2410" stroke-width="2.5" stroke-linecap="round" />
		{/if}
		<!-- whiskers -->
		<g stroke="#c98a1b" stroke-width="1.8" stroke-linecap="round">
			<path d="M30 52 L44 54" />
			<path d="M30 60 L44 58" />
			<path d="M90 52 L76 54" />
			<path d="M90 60 L76 58" />
		</g>
	</g>

	{#if mood === 'sad'}
		<circle class="tear" cx="45" cy="50" r="3" fill="#6fc3e8" />
	{/if}
	{#if mood === 'celebrate'}
		<!-- party sparkles -->
		<g class="sparkles" fill="#f7b500">
			<path class="sp s1" d="M14 30 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z" />
			<path class="sp s2" d="M102 18 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#0ea5a5" />
			<path class="sp s3" d="M104 78 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#ff6b5e" />
		</g>
	{/if}
</svg>

<style>
	.shwe {
		overflow: visible;
		display: block;
	}

	/* idle: gentle breathing + blinking */
	.shwe.idle {
		animation: float 3.5s ease-in-out infinite;
	}

	.eye-closed {
		opacity: 0;
	}

	.shwe.idle .eye-open,
	.shwe.happy .eye-open {
		animation: blink-open 4s steps(1) infinite;
	}
	.shwe.idle .eye-closed,
	.shwe.happy .eye-closed {
		animation: blink-closed 4s steps(1) infinite;
	}

	/* happy: quick double bounce */
	.shwe.happy {
		animation: bounce 0.6s var(--spring);
	}

	/* celebrate: wiggle party */
	.shwe.celebrate {
		animation: party 0.8s var(--spring) infinite alternate;
		transform-origin: 50% 90%;
	}
	.shwe.celebrate .eye-closed {
		opacity: 1;
	}
	.shwe.celebrate .eye-open {
		opacity: 0;
	}

	/* sad: droopy ears + tear */
	.shwe.sad .ear.left {
		rotate: -14deg;
		transform-origin: 38px 30px;
	}
	.shwe.sad .ear.right {
		rotate: 14deg;
		transform-origin: 82px 30px;
	}
	.shwe.sad .head-group {
		translate: 0 3px;
	}
	.tear {
		animation: tear-drop 1.4s ease-in infinite;
	}

	.tail {
		animation: tail-swish 2.6s ease-in-out infinite;
		transform-origin: 96px 92px;
	}
	.shwe.celebrate .tail {
		animation-duration: 0.5s;
	}

	.sp {
		animation: sparkle 1s ease-in-out infinite;
		transform-origin: center;
	}
	.sp.s2 {
		animation-delay: 0.2s;
	}
	.sp.s3 {
		animation-delay: 0.45s;
	}

	@keyframes blink-open {
		0%, 91%, 97%, 100% { opacity: 1; }
		92%, 96% { opacity: 0; }
	}
	@keyframes blink-closed {
		0%, 91%, 97%, 100% { opacity: 0; }
		92%, 96% { opacity: 1; }
	}
	@keyframes bounce {
		0% { translate: 0 0; }
		30% { translate: 0 -14px; }
		60% { translate: 0 0; }
		80% { translate: 0 -6px; }
		100% { translate: 0 0; }
	}
	@keyframes party {
		0% { rotate: -6deg; translate: 0 0; }
		100% { rotate: 6deg; translate: 0 -8px; }
	}
	@keyframes tail-swish {
		0%, 100% { rotate: 0deg; }
		50% { rotate: 14deg; }
	}
	@keyframes tear-drop {
		0% { translate: 0 0; opacity: 0; }
		30% { opacity: 1; }
		100% { translate: 0 16px; opacity: 0; }
	}
	@keyframes sparkle {
		0%, 100% { scale: 0.6; opacity: 0.5; }
		50% { scale: 1.15; opacity: 1; }
	}
	@keyframes float {
		0%, 100% { translate: 0 0; }
		50% { translate: 0 -6px; }
	}
</style>
