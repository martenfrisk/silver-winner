<script lang="ts">
	// Correct/wrong is conveyed by colour, a mascot and a sound — none of which
	// reach a screen reader. This mirrors the verdict into a live region so the
	// result, and the answer the learner missed, are actually announced.
	//
	// The answer is included in the *correct* message too, not only the wrong
	// one: a live region stays silent when its text is unchanged, so two "Nice!"
	// answers in a row would announce once. Naming the word keeps each message
	// distinct, and repeats the thing being learned.
	let {
		status,
		answer,
		meaning
	}: {
		status: 'answer' | 'correct' | 'wrong';
		/** The target word, in Burmese. */
		answer?: string;
		/** Its English gloss, when there is one. */
		meaning?: string;
	} = $props();

	const message = $derived.by(() => {
		if (status === 'answer') return '';
		const said = [answer, meaning].filter(Boolean).join(', ');
		if (status === 'correct') return said ? `Correct. ${said}` : 'Correct.';
		return said ? `Not quite. The answer is ${said}` : 'Not quite.';
	});
</script>

<p class="sr-only" role="status" aria-live="assertive">{message}</p>
