import { describe, expect, it } from 'vitest';
import { syllables, syllableCount } from './burmese';

describe('syllables', () => {
	it('keeps a syllable whole instead of splitting off its marks', () => {
		// Intl.Segmenter alone returns ["ကျေ", "ာ", "င်", "း"] here — four tiles,
		// three of which cannot be rendered or read on their own.
		expect(syllables('ကျောင်း')).toEqual(['ကျောင်း']);
		expect(syllables('ဈေး')).toEqual(['ဈေး']);
		expect(syllables('ခါး')).toEqual(['ခါး']);
	});

	it('splits multi-syllable words at the syllable boundaries', () => {
		expect(syllables('ကျေးဇူးတင်ပါတယ်')).toEqual(['ကျေး', 'ဇူး', 'တင်', 'ပါ', 'တယ်']);
		expect(syllables('တောင်းပန်ပါတယ်')).toEqual(['တောင်း', 'ပန်', 'ပါ', 'တယ်']);
		expect(syllables('မနက်ဖြန်')).toEqual(['မ', 'နက်', 'ဖြန်']);
		expect(syllables('လက်ဖက်ရည်')).toEqual(['လက်', 'ဖက်', 'ရည်']);
	});

	it('keeps a stacked consonant with the syllable it closes', () => {
		expect(syllables('မင်္ဂလာပါ')).toEqual(['မင်္ဂ', 'လာ', 'ပါ']);
	});

	it('drops spaces so the tiles still compose the word', () => {
		const word = 'ဒါ အမေပါ';
		expect(syllables(word).join('')).toBe(word.replace(/\s+/g, ''));
	});

	it('never emits a tile that starts with a dependent sign', () => {
		const dependent = /^[ါ-ှ]/;
		for (const word of ['ကျောင်း', 'မုန့်ဟင်းခါး', 'ဘယ်လောက်လဲ', 'တနင်္ဂနွေနေ့']) {
			for (const tile of syllables(word)) expect(dependent.test(tile)).toBe(false);
		}
	});

	it('counts syllables', () => {
		expect(syllableCount('ရေ')).toBe(1);
		expect(syllableCount('ကျေးဇူးတင်ပါတယ်')).toBe(5);
	});
});
