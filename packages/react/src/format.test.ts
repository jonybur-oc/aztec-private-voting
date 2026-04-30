import { describe, expect, it } from 'vitest';

import { percent, shortenHex } from './format';

describe('shortenHex', () => {
  it('strips the 0x prefix and truncates with an ellipsis', () => {
    expect(shortenHex('0x1234567890abcdef1234567890abcdef')).toBe('0x123456...cdef');
  });

  it('returns the original value when shorter than head + tail', () => {
    expect(shortenHex('0xabcd')).toBe('0xabcd');
  });

  it('respects custom head/tail lengths', () => {
    expect(shortenHex('0xabcdefghijkl', 3, 2)).toBe('0xabc...kl');
  });
});

describe('percent', () => {
  it('returns 0 when total is zero', () => {
    expect(percent(0, 0)).toBe(0);
  });

  it('rounds to one decimal', () => {
    expect(percent(1, 3)).toBeCloseTo(33.3, 1);
  });

  it('returns 100 for parts equal to total', () => {
    expect(percent(7, 7)).toBe(100);
  });
});
