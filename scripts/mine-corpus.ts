// Proposes new decodable words for Script Studio by mining open Burmese speech
// corpora, and emits them as a TSV worksheet for a human to gloss.
//
// Why a worksheet rather than generated content: the corpora give frequency,
// talker count and real recordings, none of which we can invent. They cannot
// give an English gloss that is right, and a wrong gloss is worse than a
// missing word. So this script does the part a machine can do exactly and
// leaves `roman` and `en` blank for a Burmese speaker to fill in.
//
// It only proposes tokens whose glyph parts recompose the word under the same
// rule `lint-content.ts` applies, so anything it emits will survive the lint
// once glossed. That check is the whole reason the `parts` column is worth
// trusting.
//
// Usage:
//   bun run mine:corpus                      all units, >=5 occurrences
//   bun run mine:corpus --unit killer-stroke words readable by that unit
//   bun run mine:corpus --min-count 10 --min-speakers 3
//   bun run mine:corpus --out candidates.tsv
//
// Corpus files are NOT in the repo: they carry their own licences (SLR80 is
// CC BY-SA 4.0, FLEURS is CC BY 4.0) and anything derived from them inherits
// attribution obligations. Download them yourself into --data (default
// ./corpus, gitignored); the script prints the URLs if they're absent.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { glyphs, glyphById, scriptUnits, TALL_AA } from '../src/lib/data/script';
import { collectSpeakables } from './speakables';

const arg = (flag: string, fallback: string) => {
	const i = process.argv.indexOf(flag);
	return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const dataDir = arg('--data', join(import.meta.dir, '../corpus'));
const minCount = Number(arg('--min-count', '5'));
const minSpeakers = Number(arg('--min-speakers', '2'));
const unitFilter = arg('--unit', '');
const outPath = arg('--out', '');

// ── Corpus loading ────────────────────────────────────────────────────
// SLR80 is read by volunteers in a conversational register; FLEURS is read
// Wikipedia prose. They are different enough (76% vs 23% colloquial markers)
// that the split is reported per token rather than pooled — a word that only
// FLEURS attests is written Burmese and probably not course vocabulary.
const SOURCES = [
	{ file: 'line_index_female.tsv', corpus: 'slr80', textCol: 1, speakerCol: 0, minCols: 2 },
	{ file: 'fleurs_train.tsv', corpus: 'fleurs', textCol: 3, speakerCol: 6, minCols: 7 },
	{ file: 'fleurs_dev.tsv', corpus: 'fleurs', textCol: 3, speakerCol: 6, minCols: 7 },
	{ file: 'fleurs_test.tsv', corpus: 'fleurs', textCol: 3, speakerCol: 6, minCols: 7 }
] as const;

const HELP = `
No corpus files found in ${dataDir}

  mkdir -p ${dataDir} && cd ${dataDir}
  curl -O https://www.openslr.org/resources/80/line_index_female.tsv
  for s in train dev test; do
    curl -o fleurs_$s.tsv \\
      "https://huggingface.co/datasets/google/fleurs/resolve/main/data/my_mm/$s.tsv"
  done

SLR80 is CC BY-SA 4.0, FLEURS is CC BY 4.0. Attribute both if you ship
anything derived from them.
`;

type Utt = { text: string; corpus: string; speaker: string };
const utts: Utt[] = [];
for (const src of SOURCES) {
	const path = join(dataDir, src.file);
	if (!existsSync(path)) continue;
	for (const line of readFileSync(path, 'utf8').split('\n')) {
		const cols = line.split('\t');
		if (cols.length < src.minCols) continue;
		const text = cols[src.textCol]?.trim();
		if (!text) continue;
		// SLR80 file ids are bur_<speaker>_<utterance>; FLEURS has no speaker id,
		// only a gender label, so its "speakers" are a floor, not a count.
		const raw = cols[src.speakerCol] ?? '';
		const speaker = src.corpus === 'slr80' ? `slr:${raw.split('_')[1]}` : `fleurs:${raw}`;
		utts.push({ text, corpus: src.corpus, speaker });
	}
}

if (utts.length === 0) {
	console.error(HELP);
	process.exit(1);
}

// ── Glyph decomposition ───────────────────────────────────────────────
// Reverse of buildSyllable: characters back to the glyph ids a learner needs
// in order to read them. Longest match first, because ို (io) is a single
// taught unit that would otherwise decompose into ိ + ု.
const byChar = [...glyphs].sort((a, b) => b.char.length - a.char.length);
/** The tall ာ is a positional variant, not a glyph of its own. */
const TALL_AA_CHAR = 'ါ';

function decompose(token: string): string[] | null {
	const parts: string[] = [];
	let i = 0;
	while (i < token.length) {
		if (token[i] === '္') {
			// The virama is invisible to the parts model (see lint-content.ts):
			// both stacked consonants are listed, the join mark is not.
			i++;
			continue;
		}
		if (token.startsWith(TALL_AA_CHAR, i)) {
			parts.push('aa');
			i += TALL_AA_CHAR.length;
			continue;
		}
		const hit = byChar.find((g) => token.startsWith(g.char, i));
		if (!hit) return null;
		parts.push(hit.id);
		i += hit.char.length;
	}
	return parts.length > 0 ? parts : null;
}

/** Mirrors the recomposition lint-content.ts performs, tall ာ rule included. */
function compose(parts: string[]): string {
	let out = '';
	let prev = '';
	for (const id of parts) {
		const g = glyphById.get(id);
		if (!g) return '';
		out += id === 'aa' && TALL_AA.has(prev) ? TALL_AA_CHAR : g.char;
		prev = id;
	}
	return out;
}

/** Earliest script unit by which every part has been taught. */
const unitIndexOfGlyph = new Map<string, number>();
scriptUnits.forEach((u, i) => u.glyphIds.forEach((id) => unitIndexOfGlyph.set(id, i)));
const STACKED_UNIT = scriptUnits.findIndex((u) => u.id === 'stacked');

function earliestUnit(token: string, parts: string[]): number | null {
	let latest = -1;
	for (const id of parts) {
		const at = unitIndexOfGlyph.get(id);
		if (at === undefined) return null; // glyph exists but no unit teaches it
		latest = Math.max(latest, at);
	}
	// The virama is invisible to the parts model, so a stacked word looks
	// readable as soon as both its consonants are known — ကိစ္စ would land in
	// "round sounds", well before anyone has been shown that letters stack at
	// all. The stacking unit teaches no glyph of its own, so nothing else
	// gates these; do it here.
	if (token.includes('္') && STACKED_UNIT >= 0) latest = Math.max(latest, STACKED_UNIT);
	return latest;
}

// ── Tally ─────────────────────────────────────────────────────────────
// Burmese has no word spaces; these tokens are what the transcribers chose to
// separate, so they are words or short phrases, not a segmentation.
// Speaker counting is deliberately asymmetric. SLR80 file ids carry a real
// speaker field (20 of them), so its count is a count. FLEURS exposes only a
// gender label, so two FLEURS utterances by different people collapse to one
// label: its contribution is a floor (two genders really are two people) and
// never an upper bound. Anyone reaching for "how many talkers said this word"
// wants the SLR80 column; the combined one only proves "at least this many".
type Tally = {
	count: number;
	slr80: number;
	fleurs: number;
	speakers: Set<string>;
	slr80Talkers: Set<string>;
	example: string;
};
const tally = new Map<string, Tally>();
for (const u of utts) {
	for (const t of u.text.split(/\s+/)) {
		if (!t) continue;
		let e = tally.get(t);
		if (!e) {
			e = {
				count: 0,
				slr80: 0,
				fleurs: 0,
				speakers: new Set(),
				slr80Talkers: new Set(),
				example: u.text
			};
			tally.set(t, e);
		}
		e.count++;
		if (u.corpus === 'slr80') {
			e.slr80++;
			e.slr80Talkers.add(u.speaker);
		} else e.fleurs++;
		e.speakers.add(u.speaker);
		if (u.text.length < e.example.length) e.example = u.text;
	}
}

const known = collectSpeakables();
const rows: {
	unit: string;
	token: string;
	count: number;
	slr80: number;
	fleurs: number;
	speakersMin: number;
	slr80Talkers: number;
	parts: string[];
	example: string;
}[] = [];

let rejectedUntaught = 0;
let rejectedCompose = 0;
for (const [token, e] of tally) {
	if (e.count < minCount || e.speakers.size < minSpeakers) continue;
	if (known.has(token)) continue;
	const parts = decompose(token);
	if (!parts) {
		rejectedUntaught++;
		continue;
	}
	// A token can decompose into known glyphs and still fail to rebuild: ါ after
	// a consonant outside TALL_AA, for one. Dropping those here is what lets the
	// parts column be pasted into script.ts unedited.
	if (compose(parts) !== token.replace(/္/g, '')) {
		rejectedCompose++;
		continue;
	}
	const at = earliestUnit(token, parts);
	if (at === null) continue;
	const unit = scriptUnits[at];
	if (unitFilter && unit.id !== unitFilter) continue;
	rows.push({
		unit: unit.id,
		token,
		count: e.count,
		slr80: e.slr80,
		fleurs: e.fleurs,
		speakersMin: e.speakers.size,
		slr80Talkers: e.slr80Talkers.size,
		parts,
		example: e.example
	});
}

// Unit order first so a reviewer works through one unit at a time, then the
// words most worth their attention.
const unitOrder = new Map(scriptUnits.map((u, i) => [u.id, i]));
rows.sort(
	(a, b) => unitOrder.get(a.unit)! - unitOrder.get(b.unit)! || b.count - a.count || b.slr80Talkers - a.slr80Talkers
);

// speakers_min is a floor across both corpora; slr80_talkers is the only
// figure that is a real count of distinct people (see the Tally comment).
const header = ['unit', 'my', 'roman', 'en', 'parts', 'count', 'slr80', 'fleurs', 'speakers_min', 'slr80_talkers', 'example'];
const tsv = [
	header.join('\t'),
	...rows.map((r) =>
		[
			r.unit,
			r.token,
			'', // roman: for the reviewer
			'', // en: for the reviewer
			r.parts.join(','),
			r.count,
			r.slr80,
			r.fleurs,
			r.speakersMin,
			r.slr80Talkers,
			r.example
		].join('\t')
	)
].join('\n');

if (outPath) {
	writeFileSync(outPath, tsv + '\n');
	console.log(`Wrote ${rows.length} candidates to ${outPath}`);
} else {
	console.log(tsv);
}

const perUnit = new Map<string, number>();
for (const r of rows) perUnit.set(r.unit, (perUnit.get(r.unit) ?? 0) + 1);
console.error(
	`\n${utts.length} utterances, ${tally.size} distinct tokens` +
		`\n${rows.length} candidates at >=${minCount} occurrences and >=${minSpeakers} speakers (floor)` +
		`\n${rows.filter((r) => r.slr80Talkers >= 3).length} of them said by >=3 real SLR80 talkers` +
		`\n${rejectedUntaught} skipped (use glyphs the app does not teach), ${rejectedCompose} skipped (parts do not rebuild the word)` +
		'\nby unit: ' +
		scriptUnits
			.filter((u) => perUnit.has(u.id))
			.map((u) => `${u.id}=${perUnit.get(u.id)}`)
			.join(' ') +
		'\n\nFill in roman and en, then paste into decodableWords in src/lib/data/script.ts.' +
		'\nSLR80 is CC BY-SA 4.0 and FLEURS is CC BY 4.0: attribute both.'
);
