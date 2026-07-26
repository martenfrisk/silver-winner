import { describe, expect, it } from 'vitest';
import { morphology } from './data/morphology';
import { allVocab, vocabByMy } from './vocab-srs.svelte';
import { lookupWord, MAX_RELATED } from './word-lookup';

/** A real compound the course teaches, so the fixtures track the content. */
const compound = Object.keys(morphology).find((my) => vocabByMy.has(my))!;

const look = (my: string, cap = MAX_RELATED) => lookupWord(my, allVocab, vocabByMy, cap);

describe('a word the course teaches', () => {
	it('carries its own definition', () => {
		const item = allVocab[0];
		const entry = look(item.my);
		expect(entry).toMatchObject({ my: item.my, roman: item.roman, en: item.en, known: true });
	});

	it('breaks a compound into its parts', () => {
		expect(look(compound).parts.length).toBeGreaterThan(0);
	});

	it('drops the whitespace-only parts the table uses for spacing', () => {
		// 'မင်္ဂလာပါ ခင်ဗျာ' has a { my: ' ' } separator that must not render
		// as an empty chip.
		for (const my of Object.keys(morphology)) {
			for (const p of look(my).parts) expect(p.my.trim()).not.toBe('');
		}
	});
});

describe('a word the course does not teach', () => {
	// Reveals carry whole phrases, not just dictionary headwords, so this is a
	// normal case rather than an error.
	it('still returns an entry rather than nothing', () => {
		const entry = look('ဤသည်မဟုတ်ပါ');
		expect(entry.known).toBe(false);
		expect(entry.my).toBe('ဤသည်မဟုတ်ပါ');
		expect(entry.en).toBeUndefined();
	});
});

describe('related words', () => {
	it('never includes the word itself', () => {
		for (const my of [compound, allVocab[0].my]) {
			expect(look(my).related.map((r) => r.my)).not.toContain(my);
		}
	});

	it('never repeats a word', () => {
		const related = look(compound).related.map((r) => r.my);
		expect(new Set(related).size).toBe(related.length);
	});

	it('respects the cap', () => {
		for (const v of allVocab) expect(look(v.my, 3).related.length).toBeLessThanOrEqual(3);
	});

	it('only ever returns real course vocabulary', () => {
		for (const v of allVocab) {
			for (const r of look(v.my).related) expect(vocabByMy.has(r.my)).toBe(true);
		}
	});

	it('links a compound to the words it is built from', () => {
		// ရေ (water) is taught on its own and turns up inside other words, so
		// looking it up should surface at least one of them.
		const entry = look('ရေ');
		expect(entry.known).toBe(true);
		expect(entry.related.length).toBeGreaterThan(0);
		for (const r of entry.related) {
			expect(r.my.includes('ရေ') || 'ရေ'.includes(r.my)).toBe(true);
		}
	});

	// The bug this pins: the entry for မင်္ဂလာပါ listed "The letter ga",
	// "nga", "pa" and "ma" as related words, because the script lessons teach
	// bare glyphs as vocabulary and the greeting contains all four characters.
	// Sharing a character is orthography, not morphology.
	it('never offers a bare glyph as a relative of a longer word', () => {
		const hello = allVocab.find((v) => v.my === 'မင်္ဂလာပါ');
		expect(hello, 'fixture: the course still teaches မင်္ဂလာပါ').toBeDefined();
		for (const r of look('မင်္ဂလာပါ').related) {
			expect(r.my.length, `${r.my} (${r.en})`).toBeGreaterThan(1);
		}
	});

	it('offers no single-character relative to any word', () => {
		for (const v of allVocab) {
			if (v.my.length === 1) continue; // glyph-to-glyph links are fair game
			for (const r of look(v.my).related) expect(r.my.length).toBeGreaterThan(1);
		}
	});

	// A single glyph is inside a large fraction of the course, so substring
	// matching on one character would return noise instead of relatives.
	it('does not substring-match a bare glyph', () => {
		const glyph = allVocab.find((v) => v.my.length === 1);
		if (!glyph) return; // no single-glyph vocab in the course right now
		const entry = look(glyph.my);
		const shared = new Set(
			Object.keys(morphology).filter((w) => (morphology[w] ?? []).some((p) => p.my === glyph.my))
		);
		for (const r of entry.related) expect(shared.has(r.my)).toBe(true);
	});

	it('carries enough of each relative to render a row', () => {
		for (const r of look(compound).related) {
			expect(r.my).toBeTruthy();
			expect(r.en).toBeTruthy();
			expect(typeof r.roman).toBe('string');
		}
	});
});

describe('every word in the course', () => {
	// The sheet opens on whatever a reveal happens to hold, so this must never
	// throw for anything the course can put in front of a learner.
	it('resolves without throwing', () => {
		for (const v of allVocab) expect(() => look(v.my)).not.toThrow();
	});
});
