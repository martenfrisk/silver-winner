/**
 * Shared helpers for player-level keyboard shortcuts (lesson player and
 * Script Studio sessions). Shortcuts are dispatched as clicks on the visible
 * buttons so every component keeps a single code path for mouse, touch and
 * keyboard — sfx, guards and disabled states all apply automatically.
 */

/** True when a keydown should NOT be treated as an app shortcut. */
export function isShortcutIgnored(e: KeyboardEvent): boolean {
	// Held-down repeats, chords with modifiers, and IME composition.
	if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.isComposing) return true;
	// Don't steal keys from form fields or editable regions.
	const t = e.target;
	if (t instanceof HTMLElement) {
		if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement)
			return true;
		if (t.isContentEditable) return true;
	}
	return false;
}

/** The digit 0–9 a keydown represents, or null if it isn't a digit key. */
export function digitOf(e: KeyboardEvent): number | null {
	return /^[0-9]$/.test(e.key) ? Number(e.key) : null;
}

/** Click the nth (0-based) button matching `selector`, if present and enabled. */
export function clickNth(selector: string, n: number): void {
	if (n < 0) return;
	const el = document.querySelectorAll<HTMLButtonElement>(selector)[n];
	if (el && !el.disabled) el.click();
}
