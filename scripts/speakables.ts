// Every Burmese string the app can speak aloud.
//
// This used to be a loop duplicated verbatim in generate-audio.ts and
// lint-content.ts, with a comment in each telling the next person to keep them
// identical — if they drifted, the linter would happily pass while the
// generator silently skipped a string, and the audio would just be missing.
// One function, imported by both, so they can't disagree.
//
// Adding a new speakable field or exercise kind means editing this file, and
// only this file.
import { course } from '../src/lib/data/course';
import {
	allAudioSyllables,
	decodableSentences,
	decodableWords,
	glyphs,
	loanWords
} from '../src/lib/data/script';
import { lineMy, stories } from '../src/lib/data/stories';

export function collectSpeakables(): Set<string> {
	const texts = new Set<string>();

	for (const unit of course) {
		for (const lesson of unit.lessons) {
			for (const ex of lesson.exercises) {
				if (ex.kind === 'learn') texts.add(ex.my);
				else if (ex.kind === 'listen') texts.add(ex.my);
				else if (ex.kind === 'choice' && ex.promptMy) texts.add(ex.promptMy);
				else if (ex.kind === 'match') for (const p of ex.pairs) texts.add(p.l);
				else if (ex.kind === 'assemble') texts.add(ex.my);
			}
		}
	}

	// Script Studio: glyph names, buildable syllables, decodable words + sentences.
	for (const g of glyphs) texts.add(g.speak);
	for (const s of allAudioSyllables()) texts.add(s.text);
	for (const words of Object.values(decodableWords)) for (const w of words) texts.add(w.my);
	for (const sentences of Object.values(decodableSentences)) for (const s of sentences) texts.add(s.my);
	for (const w of loanWords) texts.add(w.my);
	for (const story of stories) for (const line of story.lines) texts.add(lineMy(line));

	return texts;
}
