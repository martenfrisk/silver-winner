// Whether a modal overlay is currently capturing input.
//
// Every player has a window-level keydown handler that answers the question on
// screen: digits pick an option, Enter checks or advances. While a sheet is
// open those keys must do nothing, or the learner is answering a question they
// can't see — so all five handlers carried `|| scriptSheet.open`.
//
// One overlay was fine to inline five times. Two is where it starts costing:
// the failure mode of forgetting a site is silent, and it is exactly the kind
// of bug that only shows up when someone taps a number while reading a
// definition. So the list lives here, and a new overlay is added in one place.
import { lessonPreview } from '$lib/lesson-preview.svelte';
import { scriptSheet } from '$lib/script-sheet.svelte';
import { wordSheet } from '$lib/word-sheet.svelte';

/** True while any modal overlay is up. Guard player shortcuts with this. */
export function overlayOpen(): boolean {
	return scriptSheet.open || wordSheet.open || lessonPreview.open;
}
