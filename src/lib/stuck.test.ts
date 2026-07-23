import { describe, expect, it } from 'vitest';
import { AttemptTracker, MAX_ATTEMPTS } from './stuck';

describe('AttemptTracker', () => {
	it('re-queues an item until it hits the attempt limit', () => {
		const t = new AttemptTracker();
		const requeues: boolean[] = [];
		for (let i = 0; i < MAX_ATTEMPTS; i++) requeues.push(t.miss('ရေ'));
		// Every miss but the last one comes back; the last retires it.
		expect(requeues.slice(0, -1).every(Boolean)).toBe(true);
		expect(requeues.at(-1)).toBe(false);
		expect(t.retired('ရေ')).toBe(true);
	});

	it('counts each item separately', () => {
		const t = new AttemptTracker();
		t.miss('ရေ');
		t.miss('ရေ');
		t.miss('ဒါ');
		expect(t.count('ရေ')).toBe(2);
		expect(t.count('ဒါ')).toBe(1);
		expect(t.retired('ဒါ')).toBe(false);
	});

	it('reports zero for an item that has never been missed', () => {
		const t = new AttemptTracker();
		expect(t.count('ဈေး')).toBe(0);
		expect(t.retired('ဈေး')).toBe(false);
	});
});
