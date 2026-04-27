export { VoteEligibilityProof } from './components/VoteEligibilityProof';
export { PrivateBallot } from './components/PrivateBallot';
export { VoteReceipt } from './components/VoteReceipt';
export { VoteResult } from './components/VoteResult';
export { VoteAdmin } from './components/VoteAdmin';

export { useEligibility } from './hooks/useEligibility';
export { useVote } from './hooks/useVote';
export { useTally } from './hooks/useTally';
export { useVerifyReceipt } from './hooks/useVerifyReceipt';
export { useDeployVote } from './hooks/useDeployVote';

export {
  AztecProvider,
  useAztec,
  useAztecClient,
  useBrowserAztecClient,
} from './aztec/context';
export { setPrivateVotingArtifact } from './aztec/artifact';

export { downloadReceipt, serializeReceipt } from './receipt';
export { formatTimestamp, shortenHex, percent } from './format';

export type {
  VoteConfig,
  EligibilityMode,
  EligibilityProof,
  VoteReceipt as VoteReceiptData,
  VoteTally,
  VoteOptionResult,
  AztecConnection,
} from './types';
export type { AztecClient, AztecProviderProps, BrowserAztecOptions } from './aztec/context';
export type { VoteEligibilityProofProps } from './components/VoteEligibilityProof';
export type { PrivateBallotProps } from './components/PrivateBallot';
export type { VoteReceiptProps } from './components/VoteReceipt';
export type { VoteResultProps } from './components/VoteResult';
export type { VoteAdminProps } from './components/VoteAdmin';
