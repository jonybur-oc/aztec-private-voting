import { useEffect, useState } from 'react';

import { percent } from '../format';
import { useAztec } from '../aztec/context';
import { loadVotingContract } from '../aztec/voting';
import type { VoteConfig, VoteTally } from '../types';

export type TallyStatus = 'loading' | 'ready' | 'error';

export interface UseTallyResult {
  tally: VoteTally | null;
  status: TallyStatus;
  error: string | null;
  refresh: () => void;
}

export function useTally(config: VoteConfig): UseTallyResult {
  const { client, loading } = useAztec();
  const [tally, setTally] = useState<VoteTally | null>(null);
  const [status, setStatus] = useState<TallyStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (loading || !client) {
      setStatus('loading');
      return;
    }

    let cancelled = false;
    const run = async (): Promise<void> => {
      try {
        const contract = await loadVotingContract(client.wallet, config.contractAddress);
        const finalized = (await contract.methods.is_finalized().simulate()) as boolean;
        const totalVotes = Number(
          (await contract.methods.get_vote_count().simulate()) as bigint,
        );

        const counts: number[] = [];
        if (finalized) {
          for (let i = 0; i < config.options.length; i++) {
            const value = (await contract.methods
              .get_final_tally(i)
              .simulate()) as bigint;
            counts.push(Number(value));
          }
        }

        if (cancelled) return;

        const results = config.options.map((option, index) => {
          const count = counts[index] ?? 0;
          return {
            option,
            count,
            percentage: percent(count, totalVotes),
          };
        });

        setTally({
          voteId: config.voteId,
          totalVotes,
          quorum: config.quorum,
          quorumMet: totalVotes >= config.quorum,
          finalized,
          results,
        });
        setStatus('ready');
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load tally');
        setStatus('error');
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [client, loading, config, tick]);

  return {
    tally,
    status,
    error,
    refresh: () => setTick((t) => t + 1),
  };
}
