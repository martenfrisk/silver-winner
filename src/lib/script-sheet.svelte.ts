// Global open/close state for the quick-access script table overlay.
// Any header can open it; the component lives once in the root layout.
class ScriptSheet {
	open = $state(false);

	show() {
		this.open = true;
	}

	hide() {
		this.open = false;
	}

	toggle() {
		this.open = !this.open;
	}
}

export const scriptSheet = new ScriptSheet();
