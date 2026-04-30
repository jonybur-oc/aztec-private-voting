import { useCallback, useState } from 'react';

import { useAztecClient } from '../aztec/context';
import { loadVotingContract } from '../aztec/voting';
import type { VoteConfig } from '../types';

export type FinalizeStatus = 'idle' | 'finalizing' | 'finalized' | 'error';

export interface UseFinalizeVoteResult {
  finalize: () => Promise<string | null>;
  status: FinalizeStatus;
  error: string | null;
  txHash: string | null;
}

export function useFinalizeVote(config: VoteConfig): UseFinalizeVoteResult {
  const client = useAztecClient();
  const [status, setStatus] = useState<FinalizeStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const finalize = useCallback(async (): Promise<string | null> => {
    setStatus('finalizing');
    setError(null);
    try {
      const contract = await loadVotingContract(client.wallet, config.contractAddress);
      const tx = await contract.methods.finalize_vote().send().wait();
      const hash = tx.txHash.toString();
      setTxHash(hash);
      setStatus('finalized');
      return hash;
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Finalize failed';
      setError(translateFinalizeError(raw));
      setStatus('error');
      return null;
    }
  }, [client, config]);

  return { finalize, status, error, txHash };
}

function translateFinalizeError(message: string): string {
  if (/voting still open/i.test(message)) {
    return 'The vote has not closed yet. Try again after the deadline.';
  }
  if (/already finalized/i.test(message)) {
    return 'This vote has already been finalized.';
  }
  if (/quorum not met/i.test(message)) {
    return 'Quorum has not been reached. The result cannot be finalized.';
  }
  return message;
}
