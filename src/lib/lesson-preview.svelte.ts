// Which lesson the preview sheet is showing, if any. Session-only UI state,
// like word-sheet.svelte.ts — the component lives once in the root layout, so
// the path can open it without navigating and losing its scroll position.
class LessonPreview {
	/** The lesson id on show, or null when the sheet is closed. */
	lessonId = $state<string | null>(null);

	get open(): boolean {
		return this.lessonId !== null;
	}

	show(id: string) {
		if (id.trim()) this.lessonId = id;
	}

	hide() {
		this.lessonId = null;
	}
}

export const lessonPreview = new LessonPreview();
