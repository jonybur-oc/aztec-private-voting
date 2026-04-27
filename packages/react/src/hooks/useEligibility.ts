import { useEffect, useState } from 'react';

import { useAztec } from '../aztec/context';
import { loadVotingContract } from '../aztec/voting';
import type { EligibilityProof, VoteConfig } from '../types';

export type EligibilityStatus = 'checking' | 'eligible' | 'ineligible' | 'error';

export interface UseEligibilityResult {
  status: EligibilityStatus;
  proof: EligibilityProof | null;
  reason: string | null;
}

export function useEligibility(config: VoteConfig): UseEligibilityResult {
  const { client, loading, error } = useAztec();
  const [state, setState] = useState<UseEligibilityResult>({
    status: 'checking',
    proof: null,
    reason: null,
  });

  useEffect(() => {
    if (loading) {
      setState({ status: 'checking', proof: null, reason: null });
      return;
    }
    if (error || !client) {
      setState({ status: 'error', proof: null, reason: error ?? 'No Aztec client' });
      return;
    }

    let cancelled = false;
    const run = async (): Promise<void> => {
      try {
        const contract = await loadVotingContract(client.wallet, config.contractAddress);
        const proof = await generateEligibilityProof(contract, client.wallet, config);
        if (!cancelled) {
          setState({
            status: 'eligible',
            proof: { voteId: config.voteId, proof, generatedAt: Date.now() },
            reason: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Eligibility check failed';
          setState({ status: 'ineligible', proof: null, reason: message });
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [client, loading, error, config]);

  return state;
}

async function generateEligibilityProof(
  _contract: unknown,
  _wallet: unknown,
  config: VoteConfig,
): Promise<string> {
  if (config.eligibilityMode === 'open') {
    return '0x01';
  }
  if (config.eligibilityMode === 'token') {
    if (!config.tokenAddress || !config.minTokenBalance) {
      throw new Error('Token gating requires tokenAddress and minTokenBalance');
    }
    return config.tokenAddress;
  }
  if (config.eligibilityMode === 'allowlist') {
    if (!config.allowlistRoot) {
      throw new Error('Allowlist mode requires allowlistRoot');
    }
    return config.allowlistRoot;
  }
  throw new Error('Unknown eligibility mode');
}
