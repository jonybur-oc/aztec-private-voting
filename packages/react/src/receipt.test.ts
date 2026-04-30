import { describe, expect, it } from 'vitest';

import { serializeReceipt } from './receipt';
import type { VoteReceipt } from './types';

describe('serializeReceipt (APV-32)', () => {
  const receipt: VoteReceipt = {
    voteId: 'vote-123',
    voteTitle: 'Should we ship?',
    nullifier:
      '0x0000000000000000000000000000000000000000000000000000000000000abc',
    txHash: '0xdeadbeef',
    timestamp: 1714238400000,
    contractAddress: '0xabc123',
  };

  it('writes the canonical receipt envelope (version + kind)', () => {
    const parsed = JSON.parse(serializeReceipt(receipt)) as Record<string, unknown>;
    expect(parsed.version).toBe(1);
    expect(parsed.kind).toBe('aztec-private-voting-receipt');
  });

  it('contains all the verifiable fields', () => {
    const parsed = JSON.parse(serializeReceipt(receipt)) as Record<string, unknown>;
    expect(parsed.voteId).toBe(receipt.voteId);
    expect(parsed.voteTitle).toBe(receipt.voteTitle);
    expect(parsed.nullifier).toBe(receipt.nullifier);
    expect(parsed.txHash).toBe(receipt.txHash);
    expect(parsed.timestamp).toBe(receipt.timestamp);
    expect(parsed.contractAddress).toBe(receipt.contractAddress);
  });

  it('does NOT include the vote choice', () => {
    const json = serializeReceipt(receipt);
    expect(json).not.toMatch(/choice/i);
    expect(json).not.toMatch(/option/i);
    expect(json).not.toMatch(/vote_choice/i);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed).not.toHaveProperty('choice');
    expect(parsed).not.toHaveProperty('vote');
    expect(parsed).not.toHaveProperty('selection');
  });

  it('does NOT include the voter address', () => {
    const json = serializeReceipt(receipt);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed).not.toHaveProperty('voter');
    expect(parsed).not.toHaveProperty('walletAddress');
    expect(parsed).not.toHaveProperty('address');
  });
});
