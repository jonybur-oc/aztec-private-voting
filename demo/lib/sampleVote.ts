import type { VoteConfig } from '@aztec-private-voting/react';

import deployment from '../../deployments/alpha-testnet.json';

interface DeploymentRecord {
  network: string;
  contractAddress: string | null;
  deployedAt: string | null;
  title?: string;
  description?: string;
  options?: string[];
  startTime?: number;
  endTime?: number;
  quorum?: number;
  eligibilityMode?: VoteConfig['eligibilityMode'];
}

export function getDeployedContractAddress(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS;
  if (fromEnv && fromEnv !== '0x...' && fromEnv.length > 0) {
    return fromEnv;
  }
  const record = deployment as DeploymentRecord;
  return record.contractAddress;
}

export function buildSampleVote(contractAddress: string): VoteConfig {
  const record = deployment as DeploymentRecord;
  if (record.contractAddress === contractAddress && record.options) {
    return {
      voteId: contractAddress,
      contractAddress,
      title: record.title ?? 'Untitled vote',
      description: record.description ?? '',
      options: record.options,
      startTime: record.startTime ?? Date.now() - 1000 * 60 * 60,
      endTime: record.endTime ?? Date.now() + 1000 * 60 * 60 * 24 * 7,
      quorum: record.quorum ?? 1,
      eligibilityMode: record.eligibilityMode ?? 'open',
    };
  }
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
