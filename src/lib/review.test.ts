import { describe, expect, it } from 'vitest';
import {
	activeDecks,
	combinedDue,
	deckSummaries,
	hasAnyDeck,
	reviewPlan,
	type ReviewSnapshot
} from './review';

const snap = (o: Partial<ReviewSnapshot> = {}): ReviewSnapshot => ({
	vocab: { due: 0, known: 0, mastered: 0 },
	glyphs: { due: 0, known: 0, total: 52 },
	cards: { due: 0, count: 0 },
	pairs: { total: 0 },
	...o
});

describe('combinedDue', () => {
	it('adds up the scheduled decks', () => {
		const s = snap({
			vocab: { due: 8, known: 142, mastered: 20 },
			glyphs: { due: 5, known: 38, total: 52 },
			cards: { due: 1, count: 6 }
		});
		expect(combinedDue(s)).toBe(14);
	});

	it('leaves confusions out, because they have no schedule', () => {
		// The matrix counts what got mixed up; nothing in it is ever "due".
		// Counting it would make one number mean two things.
		const s = snap({ pairs: { total: 9, worst: { a: 'ခ', b: 'ဂ' } } });
		expect(combinedDue(s)).toBe(0);
	});

	it('is zero for a learner who has done nothing', () => {
		expect(combinedDue(snap())).toBe(0);
	});
});

describe('deckSummaries', () => {
	it('lists all four decks in a stable order', () => {
		expect(deckSummaries(snap()).map((d) => d.id)).toEqual(['words', 'letters', 'cards', 'pairs']);
	});

	it('marks only the three scheduled decks as scheduled', () => {
		const scheduled = deckSummaries(snap()).filter((d) => d.scheduled).map((d) => d.id);
		expect(scheduled).toEqual(['words', 'letters', 'cards']);
	});

	it('names the worst pair when there is one', () => {
		const s = snap({ pairs: { total: 4, worst: { a: 'စ', b: 'ဆ' } } });
		const pairs = deckSummaries(s).find((d) => d.id === 'pairs')!;
		expect(pairs.note).toBe('You mix up စ and ဆ');
		expect(pairs.due).toBe(0);
	});

	it('explains how to fill an empty deck rather than showing a bare zero', () => {
		for (const d of deckSummaries(snap())) {
			expect(d.empty, d.id).toBe(true);
			expect(d.note, d.id).toBeTruthy();
		}
	});

	it('gives every deck a count noun that reads right inline', () => {
		// "1 my cards" was the bug: the title is not a noun you can count with.
		for (const d of deckSummaries(snap())) {
			expect(d.noun, d.id).toMatch(/s$/);
			expect(d.noun, d.id).toBe(d.noun.toLowerCase());
		}
	});

	it('does not call the cards you wrote "learned"', () => {
		const s = snap({ cards: { due: 0, count: 1 } });
		const cards = deckSummaries(s).find((d) => d.id === 'cards')!;
		expect(cards.stock).toBe('1 card you wrote');
	});

	it('drops the explainer once a deck has something in it', () => {
		const s = snap({ vocab: { due: 0, known: 3, mastered: 0 } });
		const words = deckSummaries(s).find((d) => d.id === 'words')!;
		expect(words.empty).toBe(false);
		expect(words.note).toBeUndefined();
	});
});

describe('activeDecks / hasAnyDeck', () => {
	it('hides decks the learner has not started', () => {
		const s = snap({ vocab: { due: 2, known: 10, mastered: 1 } });
		expect(activeDecks(s).map((d) => d.id)).toEqual(['words']);
		expect(hasAnyDeck(s)).toBe(true);
	});

	it('reports nothing for a brand new learner', () => {
		expect(activeDecks(snap())).toEqual([]);
		expect(hasAnyDeck(snap())).toBe(false);
	});

	it('counts a deck as active on content, not on anything being due', () => {
		// 142 known words with none due is still a deck worth showing.
		const s = snap({ vocab: { due: 0, known: 142, mastered: 100 } });
		expect(hasAnyDeck(s)).toBe(true);
	});
});

describe('reviewPlan', () => {
	it('takes everything when the backlog fits under the cap', () => {
		const s = snap({
			vocab: { due: 4, known: 20, mastered: 0 },
			glyphs: { due: 3, known: 10, total: 52 }
		});
		expect(reviewPlan(s, 20)).toEqual([
			{ deck: 'words', take: 4 },
			{ deck: 'letters', take: 3 }
		]);
	});

	it('never exceeds the cap', () => {
		const s = snap({
			vocab: { due: 90, known: 200, mastered: 0 },
			glyphs: { due: 40, known: 50, total: 52 },
			cards: { due: 15, count: 30 }
		});
		const plan = reviewPlan(s, 20);
		expect(plan.reduce((n, p) => n + p.take, 0)).toBe(20);
	});

	it('gives every due deck at least one item, so no deck rots', () => {
		// A huge word backlog must not squeeze out the single due card.
		const s = snap({
			vocab: { due: 200, known: 300, mastered: 0 },
			glyphs: { due: 1, known: 5, total: 52 },
			cards: { due: 1, count: 2 }
		});
		const plan = reviewPlan(s, 20);
		expect(plan.map((p) => p.deck).sort()).toEqual(['cards', 'letters', 'words']);
		for (const p of plan) expect(p.take, p.deck).toBeGreaterThanOrEqual(1);
	});

	it('never asks for more of a deck than is due', () => {
		const s = snap({
			vocab: { due: 30, known: 50, mastered: 0 },
			cards: { due: 2, count: 5 }
		});
		for (const p of reviewPlan(s, 20)) {
			const due = p.deck === 'words' ? 30 : 2;
			expect(p.take).toBeLessThanOrEqual(due);
		}
	});

	it('skips unscheduled decks entirely', () => {
		const s = snap({ pairs: { total: 12, worst: { a: 'ခ', b: 'ဂ' } } });
		expect(reviewPlan(s)).toEqual([]);
	});

	it('returns nothing when nothing is due', () => {
		expect(reviewPlan(snap({ vocab: { due: 0, known: 50, mastered: 5 } }))).toEqual([]);
	});
});
