import type { VoteConfig } from '@aztec-private-voting/react';

export function buildSampleVote(contractAddress: string): VoteConfig {
  const now = Date.now();
  return {
    voteId: contractAddress,
    contractAddress,
    title: 'Should the treasury fund this initiative? (50 ETH)',
    description:
      'A request from the ecosystem grants committee. Vote closes in 7 days.',
    options: ['For', 'Against', 'Abstain'],
    startTime: now - 1000 * 60 * 60,
    endTime: now + 1000 * 60 * 60 * 24 * 7,
    quorum: 5,
    eligibilityMode: 'open',
  };
}

export function buildClosedSampleVote(contractAddress: string): VoteConfig {
  const closed = buildSampleVote(contractAddress);
  return {
    ...closed,
    endTime: Date.now() - 1000 * 60 * 60,
  };
}
