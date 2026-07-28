// Proposes new decodable words and decodable sentences from the user's own
// "Burmese - Introduction to the Script" deck (their own recordings, see
// IDEAS.md Round 18). Unlike mine-corpus.ts, every row already carries an
// English gloss, so the bottleneck here isn't glossing — it's romanization
// and unit placement, which still want a careful pass rather than a
// mechanical guess (a validation run against every *existing* decodableWords
// entry found real Burmese words — ပါ "particle", ရတနာ "treasure" — that
// read irregularly with no marker in the glyph parts to warn you, plus a
// coda-consonant segmentation problem for anything closed with အသတ်; a
// mechanical romanizer got only 46 of 67 known-good entries exactly right).
// So this script emits a worksheet with `parts` filled in and `roman` left
// for a human, exactly like mine-corpus.ts, and additionally flags any deck
// note mentioning voicing/weakening/irregular spelling/ည် so those rows get
// extra scrutiny rather than a casual gloss-and-ship.
//
// Usage:
//   bun scripts/mine-user-deck.ts --kind words
//   bun scripts/mine-user-deck.ts --kind sentences
//   bun scripts/mine-user-deck.ts --kind words --out candidates.tsv
//
// Reads Burmese__BScriptIntro.txt from the repo root by default (gitignored
// — pass --deck to point elsewhere).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { glyphById, glyphs, scriptUnits, TALL_AA } from '../src/lib/data/script';
import { collectSpeakables } from './speakables';

const arg = (flag: string, fallback: string) => {
	const i = process.argv.indexOf(flag);
	return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const deckPath = arg('--deck', join(import.meta.dir, '../Burmese__BScriptIntro.txt'));
const kind = arg('--kind', 'words') as 'words' | 'sentences';
const outPath = arg('--out', '');

if (!existsSync(deckPath)) {
	console.error(`No deck TSV at ${deckPath}. Pass --deck <path>.`);
	process.exit(1);
}

// ── Parse the deck ──────────────────────────────────────────────────
type Row = { my: string; en: string; notes: string; category: string; sound: string };
const SOUND = /\[sound:([^\]]+)\]/;
const rows: Row[] = [];
for (const line of readFileSync(deckPath, 'utf8').split('\n').slice(1)) {
	const cols = line.split('\t');
	if (cols.length < 6) continue;
	const my = cols[0].replace(/<\/?b>/g, '').trim();
	const en = cols[1].replace(/<[^>]+>/g, '').trim();
	const notes = cols[3] ?? '';
	const category = cols[4] ?? '';
	const m = (cols[2] ?? '').match(SOUND);
	if (!my || !en || !m) continue;
	rows.push({ my, en, notes, category, sound: m[1] });
}

// ── Glyph decomposition (mirrors mine-corpus.ts / lint-content.ts) ────
const byChar = [...glyphs].sort((a, b) => b.char.length - a.char.length);
const TALL_AA_CHAR = 'ါ';

function decompose(token: string): string[] | null {
	const parts: string[] = [];
	let i = 0;
	while (i < token.length) {
		if (token[i] === '္') { i++; continue; }
		if (token.startsWith(TALL_AA_CHAR, i)) { parts.push('aa'); i += TALL_AA_CHAR.length; continue; }
		const hit = byChar.find((g) => token.startsWith(g.char, i));
		if (!hit) return null;
		parts.push(hit.id);
		i += hit.char.length;
	}
	return parts.length > 0 ? parts : null;
}

function compose(parts: string[]): string {
	let out = '';
	let prev = '';
	for (const id of parts) {
		const g = glyphById.get(id);
		if (!g) return '';
		out += id === 'aa' && TALL_AA.has(prev) ? 'ါ' : g.char;
		prev = id;
	}
	return out;
}

const unitIndexOfGlyph = new Map<string, number>();
scriptUnits.forEach((u, i) => u.glyphIds.forEach((id) => unitIndexOfGlyph.set(id, i)));
const STACKED_UNIT = scriptUnits.findIndex((u) => u.id === 'stacked');

function earliestUnit(token: string, parts: string[]): number | null {
	let latest = -1;
	for (const id of parts) {
		const at = unitIndexOfGlyph.get(id);
		if (at === undefined) return null;
		latest = Math.max(latest, at);
	}
	if (token.includes('္') && STACKED_UNIT >= 0) latest = Math.max(latest, STACKED_UNIT);
	return latest;
}

const FLAG_RE = /voicing|weakening|irregular|redundant|ည်/i;
const known = collectSpeakables();

if (kind === 'words') {
	const seen = new Set<string>();
	const candidates: { unit: string; my: string; en: string; parts: string[]; flagged: boolean; example: string }[] = [];
	for (const r of rows) {
		if (!/^words?$/.test(r.category.trim())) continue;
		if (known.has(r.my) || seen.has(r.my)) continue;
		seen.add(r.my);
		const parts = decompose(r.my);
		if (!parts) continue;
		if (compose(parts) !== r.my.replace(/္/g, '')) continue;
		const at = earliestUnit(r.my, parts);
		if (at === null) continue;
		candidates.push({
			unit: scriptUnits[at].id,
			my: r.my,
			en: r.en,
			parts,
			flagged: FLAG_RE.test(r.notes) || FLAG_RE.test(r.category),
			example: r.sound
		});
	}
	const unitOrder = new Map(scriptUnits.map((u, i) => [u.id, i]));
	candidates.sort((a, b) => unitOrder.get(a.unit)! - unitOrder.get(b.unit)! || a.my.length - b.my.length);

	const header = ['unit', 'my', 'roman', 'en', 'parts', 'flagged', 'example_sound'];
	const tsv = [
		header.join('\t'),
		...candidates.map((c) => [c.unit, c.my, '', c.en, c.parts.join(','), c.flagged ? 'yes' : '', c.example].join('\t'))
	].join('\n');
	if (outPath) writeFileSync(outPath, tsv + '\n');
	else console.log(tsv);
	console.error(
		`\n${rows.length} deck rows, ${candidates.length} new word candidate(s) ` +
			`(${candidates.filter((c) => c.flagged).length} flagged for a phonology footnote — extra care).` +
			`\nFill in roman, paste into decodableWords in src/lib/data/script.ts.`
	);
} else {
	const seen = new Set<string>();
	const candidates: { unit: string; my: string; en: string; flagged: boolean; example: string }[] = [];
	for (const r of rows) {
		if (!/^sentences?$|^phrases?$/.test(r.category.trim())) continue;
		if (known.has(r.my) || seen.has(r.my)) continue;
		seen.add(r.my);
		const chars = [...r.my.replace(/[\s၊။]/g, '')];
		let i = 0;
		const parts: string[] = [];
		let broken = false;
		while (i < chars.join('').length) {
			const rest = chars.join('').slice(i);
			if (rest[0] === '္') { i++; continue; }
			if (rest.startsWith(TALL_AA_CHAR)) { parts.push('aa'); i += TALL_AA_CHAR.length; continue; }
			const hit = byChar.find((g) => rest.startsWith(g.char));
			if (!hit) { broken = true; break; }
			parts.push(hit.id);
			i += hit.char.length;
		}
		if (broken) continue;
		const at = earliestUnit(r.my, parts);
		if (at === null) continue;
		candidates.push({
			unit: scriptUnits[at].id,
			my: r.my,
			en: r.en,
			flagged: FLAG_RE.test(r.notes) || FLAG_RE.test(r.category),
			example: r.sound
		});
	}
	const unitOrder = new Map(scriptUnits.map((u, i) => [u.id, i]));
	candidates.sort((a, b) => unitOrder.get(a.unit)! - unitOrder.get(b.unit)! || a.my.length - b.my.length);

	const header = ['unit', 'my', 'roman', 'en', 'flagged', 'example_sound'];
	const tsv = [
		header.join('\t'),
		...candidates.map((c) => [c.unit, c.my, '', c.en, c.flagged ? 'yes' : '', c.example].join('\t'))
	].join('\n');
	if (outPath) writeFileSync(outPath, tsv + '\n');
	else console.log(tsv);
	console.error(
		`\n${rows.length} deck rows, ${candidates.length} new sentence/phrase candidate(s) ` +
			`(${candidates.filter((c) => c.flagged).length} flagged).` +
			`\nFill in roman, paste into decodableSentences in src/lib/data/script.ts.`
	);
}
