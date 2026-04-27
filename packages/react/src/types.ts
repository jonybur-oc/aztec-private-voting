export type EligibilityMode = 'open' | 'token' | 'allowlist';

export interface VoteConfig {
  voteId: string;
  title: string;
  description: string;
  options: string[];
  startTime: number;
  endTime: number;
  quorum: number;
  eligibilityMode: EligibilityMode;
  tokenAddress?: string;
  minTokenBalance?: string;
  allowlistRoot?: string;
  contractAddress: string;
}

export interface EligibilityProof {
  voteId: string;
  proof: string;
  generatedAt: number;
}

export interface VoteReceipt {
  voteId: string;
  voteTitle: string;
  nullifier: string;
  txHash: string;
  timestamp: number;
  contractAddress: string;
}

export interface VoteTally {
  voteId: string;
  totalVotes: number;
  quorum: number;
  quorumMet: boolean;
  finalized: boolean;
  results: VoteOptionResult[];
  finalizedTxHash?: string;
}

export interface VoteOptionResult {
  option: string;
  count: number;
  percentage: number;
}

export interface AztecConnection {
  pxeUrl: string;
  walletAddress: string;
}
