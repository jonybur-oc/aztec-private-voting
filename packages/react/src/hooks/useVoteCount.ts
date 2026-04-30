import { useEffect, useState } from 'react';

import { useAztec } from '../aztec/context';
import { loadVotingContract } from '../aztec/voting';
import type { VoteConfig } from '../types';

export type VoteCountStatus = 'loading' | 'ready' | 'error';

export interface UseVoteCountOptions {
  intervalMs?: number;
}

export interface UseVoteCountResult {
  count: number | null;
  status: VoteCountStatus;
  error: string | null;
  refresh: () => void;
}

const DEFAULT_INTERVAL_MS = 10_000;

export function useVoteCount(
  config: VoteConfig,
  options: UseVoteCountOptions = {},
): UseVoteCountResult {
  const { client, loading } = useAztec();
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<VoteCountStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;

  useEffect(() => {
    if (loading || !client) {
      setStatus('loading');
      return;
    }

    let cancelled = false;
    const fetchOnce = async (): Promise<void> => {
      try {
        const contract = await loadVotingContract(client.wallet, config.contractAddress);
        const value = (await contract.methods.get_vote_count().simulate()) as bigint;
        if (cancelled) return;
        setCount(Number(value));
        setStatus('ready');
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to read vote count');
        setStatus('error');
      }
    };

    void fetchOnce();
    const id = window.setInterval(() => void fetchOnce(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [client, loading, config, intervalMs, tick]);

  return {
    count,
    status,
    error,
    refresh: () => setTick((t) => t + 1),
  };
}
