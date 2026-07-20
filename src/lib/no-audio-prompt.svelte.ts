// Has the "no headphones?" prompt been shown/dismissed yet this app load?
// Deliberately not persisted — it resets on reload so the nudge can surface
// again next real session, matching the temporary, situational nature of
// progress.tempMute.
class NoAudioPromptState {
	seen = $state(false);

	markSeen() {
		this.seen = true;
	}
}

export const noAudioPromptState = new NoAudioPromptState();
