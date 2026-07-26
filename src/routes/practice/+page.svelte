<script lang="ts">
	// The Words deck, in one of two modes.
	//
	// Guided (the default) is the app-graded session: it picks a format per word
	// from its Leitner box and marks the answer itself. Self-graded is the
	// opt-in Anki-style one — Burmese on the front, the learner reports the
	// recall, SM-2 schedules it. See progress.selfReview.
	//
	// The two are whole sessions with almost nothing in common, so they are two
	// components and this route only chooses between them. Reading the setting
	// here rather than inside them keeps the choice in one place, and means
	// neither session has to know the other exists.
	import { progress } from '$lib/progress.svelte';
	import GuidedPracticeSession from '$lib/components/GuidedPracticeSession.svelte';
	import SelfReviewSession from '$lib/components/SelfReviewSession.svelte';
</script>

{#if progress.selfReview}
	<SelfReviewSession />
{:else}
	<GuidedPracticeSession />
{/if}
