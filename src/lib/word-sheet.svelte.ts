// Which word the word sheet is showing, if any. Session-only UI state, like
// script-sheet.svelte.ts — the component lives once in the root layout so any
// player can open it without navigating anywhere.
class WordSheet {
	/** The word on show, or null when the sheet is closed. */
	word = $state<string | null>(null);

	get open(): boolean {
		return this.word !== null;
	}

	show(my: string) {
		if (my.trim()) this.word = my;
	}

	hide() {
		this.word = null;
	}
}

export const wordSheet = new WordSheet();
