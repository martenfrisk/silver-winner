import { describe, expect, it } from 'vitest';
import { grammarTip } from './grammar-tips';

describe('grammarTip', () => {
	it('explains the question particle', () => {
		expect(grammarTip('နေကောင်းလား')).toContain('yes/no question');
	});

	it('prefers negation over the polite ပါ', () => {
		expect(grammarTip('မစားပါဘူး')).toContain('negate');
	});

	it('explains plain statements ending in တယ်', () => {
		expect(grammarTip('ကျေးဇူးတင်ပါတယ်')).toContain('statement');
	});

	it('explains want-to before the future marker', () => {
		expect(grammarTip('သွားချင်တယ်')).toContain('want to');
	});

	it('explains polite ပါ on bare polite phrases', () => {
		expect(grammarTip('မင်္ဂလာပါ')).toContain('polite');
	});

	it('returns null for single nouns with no pattern', () => {
		expect(grammarTip('ကော်ဖီ')).toBeNull();
	});
});
