import { useCallback, useState } from 'react';

import { useAztecClient } from '../aztec/context';
import { deriveNullifier, generateVoteSecret } from '../aztec/nullifier';
import { loadVotingContract } from '../aztec/voting';
import type { EligibilityProof, VoteConfig, VoteReceipt } from '../types';

export type VoteStatus = 'idle' | 'submitting' | 'cast' | 'error';

export interface CastVoteInput {
  choice: number;
  eligibilityProof: EligibilityProof;
}

export interface UseVoteResult {
  castVote: (input: CastVoteInput) => Promise<VoteReceipt | null>;
  status: VoteStatus;
  error: string | null;
  receipt: VoteReceipt | null;
}

export function useVote(config: VoteConfig): UseVoteResult {
  const client = useAztecClient();
  const [status, setStatus] = useState<VoteStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<VoteReceipt | null>(null);

  const castVote = useCallback(
    async (input: CastVoteInput): Promise<VoteReceipt | null> => {
      setStatus('submitting');
      setError(null);
      try {
        const contract = await loadVotingContract(client.wallet, config.contractAddress);

        const secret = generateVoteSecret();
        const nullifier = await deriveNullifier({
          voteId: config.voteId,
          walletAddress: client.wallet.getAddress().toString(),
          secret,
        });

        const eligibilityField = BigInt(input.eligibilityProof.proof);

        const tx = await contract.methods
          .cast_vote(input.choice, eligibilityField, nullifier)
          .send()
          .wait();

        const next: VoteReceipt = {
          voteId: config.voteId,
          voteTitle: config.title,
          nullifier: `0x${nullifier.toString(16)}`,
          txHash: tx.txHash.toString(),
          timestamp: Date.now(),
          contractAddress: config.contractAddress,
        };
        setReceipt(next);
        setStatus('cast');
        return next;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Vote submission failed';
        setError(message);
        setStatus('error');
        return null;
      }
    },
    [client, config],
  );

  return { castVote, status, error, receipt };
}
