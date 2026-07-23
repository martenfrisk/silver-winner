import { describe, expect, it } from 'vitest';
import { quoted } from './gloss';

describe('quoted', () => {
	it('quotes a plain gloss', () => {
		expect(quoted('Water')).toBe('“Water”');
	});

	it('does not nest quotes around a gloss that already has them', () => {
		// `How do you say “The letter “ka””?` read like a typo.
		expect(quoted('The letter “ka”')).toBe('“The letter ka”');
	});

	it('flattens straight quotes too', () => {
		expect(quoted('The letter "ka"')).toBe('“The letter ka”');
	});
});
