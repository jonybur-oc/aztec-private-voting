import { useEffect, useState } from 'react';

import { useFinalizeVote } from '../hooks/useFinalizeVote';
import { useTally } from '../hooks/useTally';
import { useVoteCount } from '../hooks/useVoteCount';
import type { VoteConfig } from '../types';

export interface VoteFacilitatorProps {
  config: VoteConfig;
  onFinalized?: (txHash: string) => void;
  pollIntervalMs?: number;
}

export function VoteFacilitator({
  config,
  onFinalized,
  pollIntervalMs,
}: VoteFacilitatorProps): JSX.Element {
  const { count, status: countStatus, error: countError } = useVoteCount(config, {
    ...(pollIntervalMs !== undefined ? { intervalMs: pollIntervalMs } : {}),
  });
  const { tally, refresh: refreshTally } = useTally(config);
  const { finalize, status: finalizeStatus, error: finalizeError, txHash } =
    useFinalizeVote(config);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const closed = now >= config.endTime;
  const finalized = tally?.finalized ?? false;
  const quorumMet = (count ?? 0) >= config.quorum;
  const canFinalize = closed && !finalized && quorumMet && finalizeStatus !== 'finalizing';

  useEffect(() => {
    if (finalizeStatus === 'finalized' && txHash) {
      onFinalized?.(txHash);
      refreshTally();
    }
  }, [finalizeStatus, txHash, onFinalized, refreshTally]);

  return (
    <section className="apv-facilitator" aria-label="Facilitator dashboard">
      <header className="apv-facilitator__header">
        <h2 className="apv-facilitator__title">{config.title}</h2>
        <p className="apv-facilitator__address">
          Contract: <code>{config.contractAddress}</code>
        </p>
      </header>

      <dl className="apv-facilitator__meta">
        <div>
          <dt>Status</dt>
          <dd>{describeStatus({ closed, finalized, now, endTime: config.endTime })}</dd>
        </div>
        <div>
          <dt>Votes cast</dt>
          <dd className="apv-facilitator__count" aria-live="polite">
            {countStatus === 'loading' && count === null
              ? 'Loading...'
              : count !== null
                ? count.toLocaleString()
                : 'Unknown'}
          </dd>
        </div>
        <div>
          <dt>Quorum</dt>
          <dd>
            {config.quorum} ({quorumMet ? 'met' : 'not met'})
          </dd>
        </div>
        <div>
          <dt>Closes</dt>
          <dd>{new Date(config.endTime).toLocaleString()}</dd>
        </div>
      </dl>

      <p className="apv-facilitator__privacy">
        This is the count only. The tally remains encrypted until you finalize the
        vote after the deadline.
      </p>

      {countError ? (
        <p className="apv-facilitator__error" role="alert">
          {countError}
        </p>
      ) : null}

      <div className="apv-facilitator__actions">
        <button
          type="button"
          className="apv-facilitator__finalize"
          onClick={() => void finalize()}
          disabled={!canFinalize}
        >
          {finalizeStatus === 'finalizing'
            ? 'Finalizing...'
            : finalized
              ? 'Vote finalized'
              : 'Finalize vote'}
        </button>
        {!closed ? (
          <span className="apv-facilitator__finalize-hint">
            Finalization unlocks after the deadline.
          </span>
        ) : !quorumMet ? (
          <span className="apv-facilitator__finalize-hint">
            Quorum has not been reached.
          </span>
        ) : null}
      </div>

      {finalizeError ? (
        <p className="apv-facilitator__error" role="alert">
          {finalizeError}
        </p>
      ) : null}

      {finalized && tally ? (
        <div className="apv-facilitator__result">
          <h3>Final tally</h3>
          <ul>
            {tally.results.map((result) => (
              <li key={result.option}>
                <span>{result.option}</span>
                <span>
                  {result.percentage}% ({result.count})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function describeStatus({
  closed,
  finalized,
  now,
  endTime,
}: {
  closed: boolean;
  finalized: boolean;
  now: number;
  endTime: number;
}): string {
  if (finalized) return 'Finalized';
  if (closed) return 'Closed - awaiting finalization';
  return `Open - closes in ${formatDuration(endTime - now)}`;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
}
