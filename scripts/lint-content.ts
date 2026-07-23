// Content lint for MyanLingo: validates course data, Script Studio data and
// audio coverage so broken exercises never reach the app.
//
// Usage:
//   bun run lint:content                 structural errors fail (exit 1),
//                                        missing audio is only a warning
//   bun run lint:content --strict-audio  missing audio also fails
//
// Checked:
//   Course  — unique unit/lesson ids, non-empty strings, choice answers in
//             range with no duplicate options, match pairs unique, assemble
//             tiles that actually compose the target sentence.
//   Script  — confusable/unit/chart glyph references, no glyph in two units,
//             decodable word parts that exist, are already taught by that
//             unit, and recompose the word's Burmese text.
//   Audio   — every speakable string (collected exactly like
//             scripts/generate-audio.ts) has a manifest entry and an mp3.
import { course } from '../src/lib/data/course';
import { lineMy, stories } from '../src/lib/data/stories';
import {
	allAudioSyllables,
	aspirationPairs,
	chartSections,
	decodableSentences,
	decodableWords,
	glyphById,
	glyphs,
	loanWords,
	scriptUnits,
	unitNotes,
	TALL_AA
} from '../src/lib/data/script';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const strictAudio = process.argv.includes('--strict-audio');

/** Signs that can never begin a syllable — see src/lib/burmese.ts. */
const DEPENDENT_START = /^[\u102B-\u103E\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D]/;

/** Most tiles an assemble exercise may ask a learner to order. */
const MAX_BUILD_TILES = 4;

const errors = new Map<string, string[]>();
const warnings = new Map<string, string[]>();
const add = (bucket: Map<string, string[]>, category: string, msg: string) => {
	if (!bucket.has(category)) bucket.set(category, []);
	bucket.get(category)!.push(msg);
};
const err = (category: string, msg: string) => add(errors, category, msg);
const warn = (category: string, msg: string) => add(warnings, category, msg);

// ── 1. Course structure (src/lib/data/course.ts) ─────────────────────
{
	const cat = 'Course (src/lib/data/course.ts)';
	const unitIds = new Set<string>();
	const lessonIds = new Set<string>();

	for (const unit of course) {
		if (!unit.id) err(cat, 'unit with empty id');
		if (unitIds.has(unit.id)) err(cat, `duplicate unit id "${unit.id}"`);
		unitIds.add(unit.id);
		if (!unit.title) err(cat, `unit "${unit.id}": empty title`);
		if (!unit.my) err(cat, `unit "${unit.id}": empty Burmese title`);

		for (const lesson of unit.lessons) {
			if (!lesson.id) err(cat, `unit "${unit.id}": lesson with empty id`);
			if (lessonIds.has(lesson.id)) err(cat, `duplicate lesson id "${lesson.id}"`);
			lessonIds.add(lesson.id);
			if (!lesson.title) err(cat, `lesson "${lesson.id}": empty title`);
			if (lesson.exercises.length === 0) err(cat, `lesson "${lesson.id}": no exercises`);

			lesson.exercises.forEach((ex, i) => {
				const at = `${unit.id} › ${lesson.id} › exercise #${i + 1} (${ex.kind})`;

				if (ex.kind === 'learn') {
					if (!ex.my) err(cat, `${at}: empty "my"`);
					if (!ex.roman) err(cat, `${at}: empty "roman"`);
					if (!ex.en) err(cat, `${at}: empty "en"`);
				} else if (ex.kind === 'choice') {
					if (!ex.question) err(cat, `${at}: empty question`);
					if (ex.options.length < 2) err(cat, `${at}: fewer than 2 options`);
					if (!Number.isInteger(ex.correct) || ex.correct < 0 || ex.correct >= ex.options.length)
						err(cat, `${at}: correct index ${ex.correct} out of range (${ex.options.length} options)`);
					const seen = new Set<string>();
					for (const o of ex.options) {
						if (!o.text) err(cat, `${at}: option with empty text`);
						if (seen.has(o.text)) err(cat, `${at}: duplicate option "${o.text}"`);
						seen.add(o.text);
					}
				} else if (ex.kind === 'listen') {
					if (!ex.my) err(cat, `${at}: empty "my"`);
					if (!ex.roman) err(cat, `${at}: empty "roman"`);
					if (!ex.en) err(cat, `${at}: empty "en"`);
					if (ex.options.length < 2) err(cat, `${at}: fewer than 2 options`);
					if (!Number.isInteger(ex.correct) || ex.correct < 0 || ex.correct >= ex.options.length)
						err(cat, `${at}: correct index ${ex.correct} out of range (${ex.options.length} options)`);
					else if (ex.options[ex.correct].text !== ex.my)
						err(cat, `${at}: correct option "${ex.options[ex.correct].text}" is not the played text "${ex.my}"`);
					const seen = new Set<string>();
					for (const o of ex.options) {
						if (!o.text) err(cat, `${at}: option with empty text`);
						if (seen.has(o.text)) err(cat, `${at}: duplicate option "${o.text}"`);
						seen.add(o.text);
					}
				} else if (ex.kind === 'match') {
					if (ex.pairs.length === 0) err(cat, `${at}: no pairs`);
					const seenL = new Set<string>();
					const seenR = new Set<string>();
					for (const p of ex.pairs) {
						if (!p.l || !p.r) err(cat, `${at}: pair with empty side (l="${p.l}", r="${p.r}")`);
						if (seenL.has(p.l)) err(cat, `${at}: duplicate left side "${p.l}"`);
						if (seenR.has(p.r)) err(cat, `${at}: duplicate right side "${p.r}"`);
						seenL.add(p.l);
						seenR.add(p.r);
					}
				} else if (ex.kind === 'assemble') {
					if (!ex.question) err(cat, `${at}: empty question`);
					if (!ex.my) err(cat, `${at}: empty "my"`);
					if (!ex.roman) err(cat, `${at}: empty "roman"`);
					if (ex.answer.length === 0) err(cat, `${at}: no answer tiles`);
					for (const t of [...ex.answer, ...ex.extras])
						if (!t.t) err(cat, `${at}: tile with empty text`);
					// The lesson page checks sequence.join('') against the answer
					// tiles, then reveals/speaks ex.my — so the tiles must compose
					// ex.my exactly (spaces in ex.my are display-only).
					const joined = ex.answer.map((a) => a.t).join('');
					const target = ex.my.replace(/\s+/g, '');
					if (joined !== target)
						err(cat, `${at}: answer tiles compose "${joined}" but "my" is "${target}"`);
					// A tile that opens with a dependent sign (ာ, း, ်) renders as a
					// stranded mark, so the word can never look right even when the
					// answer is correct. Tiles must be whole syllables.
					for (const t of [...ex.answer, ...ex.extras]) {
						if (DEPENDENT_START.test(t.t))
							err(cat, `${at}: tile "${t.t}" starts with a dependent mark — use whole syllables`);
					}
					// Ordering a long phrase tile-by-tile is a spelling test a
					// beginner fails for reasons unrelated to knowing the phrase.
					if (ex.answer.length > MAX_BUILD_TILES)
						err(
							cat,
							`${at}: ${ex.answer.length} answer tiles (max ${MAX_BUILD_TILES}) — chunk by word or morpheme`
						);
				}
			});
		}
	}
}

// ── 2. Script Studio data (src/lib/data/script.ts) ───────────────────
{
	const cat = 'Script (src/lib/data/script.ts)';

	const seenGlyphIds = new Set<string>();
	for (const g of glyphs) {
		if (!g.id) err(cat, 'glyph with empty id');
		if (seenGlyphIds.has(g.id)) err(cat, `duplicate glyph id "${g.id}"`);
		seenGlyphIds.add(g.id);
		if (!g.char) err(cat, `glyph "${g.id}": empty char`);
		if (!g.name) err(cat, `glyph "${g.id}": empty name`);
		if (!g.speak) err(cat, `glyph "${g.id}": empty speak text`);
		const seenConf = new Set<string>();
		for (const c of g.confusables) {
			if (!glyphById.has(c)) err(cat, `glyph "${g.id}": unknown confusable "${c}"`);
			if (c === g.id) err(cat, `glyph "${g.id}": lists itself as a confusable`);
			if (seenConf.has(c)) err(cat, `glyph "${g.id}": duplicate confusable "${c}"`);
			seenConf.add(c);
		}
	}

	// Teaching units: valid refs, no glyph taught twice, every glyph reachable.
	const unitIds = new Set<string>();
	const glyphToUnit = new Map<string, string>();
	for (const unit of scriptUnits) {
		if (unitIds.has(unit.id)) err(cat, `duplicate script unit id "${unit.id}"`);
		unitIds.add(unit.id);
		for (const id of unit.glyphIds) {
			if (!glyphById.has(id)) {
				err(cat, `script unit "${unit.id}": unknown glyph id "${id}"`);
				continue;
			}
			const other = glyphToUnit.get(id);
			if (other) err(cat, `glyph "${id}" appears in two units: "${other}" and "${unit.id}"`);
			glyphToUnit.set(id, unit.id);
		}
	}
	for (const g of glyphs)
		if (!glyphToUnit.has(g.id)) warn(cat, `glyph "${g.id}" is not taught in any script unit`);

	for (const section of chartSections)
		for (const id of section.ids)
			if (!glyphById.has(id)) err(cat, `chart section "${section.title}": unknown glyph id "${id}"`);

	for (const [a, b] of aspirationPairs) {
		if (!glyphById.has(a)) err(cat, `aspirationPairs: unknown glyph id "${a}"`);
		if (!glyphById.has(b)) err(cat, `aspirationPairs: unknown glyph id "${b}"`);
	}

	for (const [key, notes] of Object.entries(unitNotes)) {
		if (!unitIds.has(key)) err(cat, `unitNotes key "${key}" is not a script unit id`);
		for (const n of notes)
			if (!n.title || !n.body) err(cat, `unitNotes "${key}": note with empty title or body`);
	}

	for (const [key, sentences] of Object.entries(decodableSentences)) {
		if (!unitIds.has(key)) err(cat, `decodableSentences key "${key}" is not a script unit id`);
		for (const s of sentences) {
			const at = `unit "${key}" sentence "${s.my}"`;
			if (!s.my) err(cat, `unit "${key}": decodable sentence with empty "my"`);
			if (!s.roman) err(cat, `${at}: empty "roman"`);
			if (!s.en) err(cat, `${at}: empty "en"`);
		}
	}

	// Decodable words: keys ↔ units, and each unit needs an entry (even []).
	for (const key of Object.keys(decodableWords))
		if (!unitIds.has(key)) err(cat, `decodableWords key "${key}" is not a script unit id`);
	for (const unit of scriptUnits)
		if (!(unit.id in decodableWords))
			err(cat, `script unit "${unit.id}" has no decodableWords entry`);

	// Words must use only glyphs taught so far, and their parts must
	// recompose the Burmese text (aa → tall ါ straight after a TALL_AA
	// consonant, the same rule buildSyllable applies).
	const taught = new Set<string>();
	for (const unit of scriptUnits) {
		for (const id of unit.glyphIds) taught.add(id);
		for (const w of decodableWords[unit.id] ?? []) {
			const at = `unit "${unit.id}" word "${w.my}"`;
			if (!w.my) err(cat, `unit "${unit.id}": decodable word with empty "my"`);
			if (!w.roman) err(cat, `${at}: empty "roman"`);
			if (!w.en) err(cat, `${at}: empty "en"`);
			if (w.parts.length === 0) err(cat, `${at}: empty parts`);

			let composed = '';
			let prevId = '';
			let broken = false;
			for (const id of w.parts) {
				const g = glyphById.get(id);
				if (!g) {
					err(cat, `${at}: unknown glyph id "${id}" in parts`);
					broken = true;
					break;
				}
				if (!taught.has(id))
					err(cat, `${at}: uses "${id}", which is not taught yet by unit "${unit.id}"`);
				composed += id === 'aa' && TALL_AA.has(prevId) ? 'ါ' : g.char;
				prevId = id;
			}
			// The virama (္) that forms consonant stacks is invisible to the
			// parts model — both stacked consonants are listed, the join mark
			// isn't. Compare against the word with viramas stripped.
			const target = w.my.replace(/္/g, '');
			if (!broken && composed !== target)
				err(cat, `${at}: parts [${w.parts.join(', ')}] compose "${composed}", not "${target}"`);
		}
	}
}

// ── 3. Audio coverage ─────────────────────────────────────────────────
{
	const cat = 'Audio coverage';
	const manifestPath = join(import.meta.dir, '../src/lib/audio-manifest.json');
	const audioDir = join(import.meta.dir, '../static');
	const manifest: Record<string, string> = JSON.parse(readFileSync(manifestPath, 'utf8'));

	// Collect every speakable string exactly like scripts/generate-audio.ts.
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
	for (const g of glyphs) texts.add(g.speak);
	for (const s of allAudioSyllables()) texts.add(s.text);
	for (const words of Object.values(decodableWords)) for (const w of words) texts.add(w.my);
	for (const sentences of Object.values(decodableSentences)) for (const s of sentences) texts.add(s.my);
	for (const w of loanWords) texts.add(w.my);
	for (const story of stories) for (const line of story.lines) texts.add(lineMy(line));

	const missing: string[] = [];
	for (const text of texts) {
		const file = manifest[text];
		if (!file) missing.push(`"${text}" — no manifest entry`);
		else if (!existsSync(join(audioDir, file)))
			missing.push(`"${text}" — manifest points to missing file ${file}`);
	}
	if (missing.length > 0) {
		for (const m of missing) warn(cat, m);
		warn(cat, `${missing.length} speakable string(s) without audio — run \`bun run audio\` to regenerate`);
	}

	for (const text of Object.keys(manifest))
		if (!texts.has(text)) warn(cat, `stale manifest entry "${text}" (no longer speakable)`);
}

// ── Report ────────────────────────────────────────────────────────────
const errorCount = [...errors.values()].reduce((n, v) => n + v.length, 0);
const warningCount = [...warnings.values()].reduce((n, v) => n + v.length, 0);

for (const [category, msgs] of errors) {
	console.error(`\n❌ ${category}`);
	for (const m of msgs) console.error(`   - ${m}`);
}
for (const [category, msgs] of warnings) {
	console.warn(`\n⚠️  ${category}`);
	for (const m of msgs) console.warn(`   - ${m}`);
}

console.log('');
if (errorCount === 0 && warningCount === 0) console.log('✅ Content lint passed — no issues found.');
else if (errorCount === 0)
	console.log(`⚠️  Content lint passed with ${warningCount} warning(s)${strictAudio ? ' (failing: --strict-audio)' : ''}.`);
else console.log(`❌ Content lint failed: ${errorCount} error(s), ${warningCount} warning(s).`);

process.exit(errorCount > 0 || (strictAudio && warningCount > 0) ? 1 : 0);
