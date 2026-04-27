import { useCallback, useState } from 'react';

import { useAztecClient } from '../aztec/context';
import { loadVotingContract } from '../aztec/voting';
import type { VoteConfig } from '../types';

export type VerifyStatus = 'idle' | 'checking' | 'done' | 'error';

export interface UseVerifyReceiptResult {
  verify: (fingerprint: string) => Promise<void>;
  status: VerifyStatus;
  result: boolean | null;
  error: string | null;
}

export function useVerifyReceipt(config: VoteConfig): UseVerifyReceiptResult {
  const client = useAztecClient();
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [result, setResult] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(
    async (fingerprint: string): Promise<void> => {
      setStatus('checking');
      setError(null);
      setResult(null);
      try {
        const trimmed = fingerprint.trim();
        if (!/^0x[0-9a-fA-F]+$/.test(trimmed)) {
          throw new Error('Fingerprint must be a hex string starting with 0x');
        }
        const contract = await loadVotingContract(client.wallet, config.contractAddress);
        const counted = (await contract.methods
          .verify_vote_counted(BigInt(trimmed))
          .simulate()) as boolean;
        setResult(counted);
        setStatus('done');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed');
        setStatus('error');
      }
    },
    [client, config],
  );

  return { verify, status, result, error };
}
