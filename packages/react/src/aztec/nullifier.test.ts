import { describe, expect, it } from 'vitest';

import { fingerprintFromNullifier } from './nullifier';

describe('fingerprintFromNullifier', () => {
  it('formats a small bigint as 64 hex chars with the 0x prefix', () => {
    expect(fingerprintFromNullifier(0xabcn)).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000abc',
    );
  });

  it('does not truncate the maximum field-sized value', () => {
    const max = (1n << 254n) - 1n;
    const fingerprint = fingerprintFromNullifier(max);
    expect(fingerprint.startsWith('0x')).toBe(true);
    expect(fingerprint).toHaveLength(2 + 64);
  });

  it('zero nullifier is a 64-char zero hex string', () => {
    expect(fingerprintFromNullifier(0n)).toBe(`0x${'0'.repeat(64)}`);
  });
});
