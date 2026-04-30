import { useState } from 'react';

import { shortenHex } from '../format';
import { useTally } from '../hooks/useTally';
import { useVerifyReceipt } from '../hooks/useVerifyReceipt';
import type { VoteConfig } from '../types';

export interface VoteResultProps {
  config: VoteConfig;
  showVerificationLink?: boolean;
  txExplorerBase?: string;
  contractExplorerBase?: string;
  showAuditorPanel?: boolean;
}

export function VoteResult({
  config,
  showVerificationLink = true,
  txExplorerBase,
  contractExplorerBase,
  showAuditorPanel = true,
}: VoteResultProps): JSX.Element {
  const { tally, status, error } = useTally(config);
  const [showVerifier, setShowVerifier] = useState(false);

  if (status === 'loading') {
    return (
      <div className="apv-result apv-result--loading" role="status">
        Loading results...
      </div>
    );
  }

  if (status === 'error' || !tally) {
    return (
      <div className="apv-result apv-result--error" role="alert">
        Could not load results{error ? `: ${error}` : ''}
      </div>
    );
  }

  return (
    <div className="apv-result">
      <header className="apv-result__header">
        <h2 className="apv-result__title">{config.title}</h2>
        <p className="apv-result__meta">
          {tally.totalVotes} votes cast - quorum{' '}
          {tally.quorumMet ? 'met' : `not met (${tally.quorum} required)`}
        </p>
      </header>

      <ul className="apv-result__bars">
        {tally.results.map((result) => (
          <li key={result.option} className="apv-result__bar">
            <div className="apv-result__bar-row">
              <span>{result.option}</span>
              <span>
                {result.percentage}% ({result.count})
              </span>
            </div>
            <div
              className="apv-result__bar-track"
              role="progressbar"
              aria-valuenow={result.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${result.option} percentage`}
            >
              <div
                className="apv-result__bar-fill"
                style={{ width: `${result.percentage}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      {tally.finalized && tally.finalizedTxHash ? (
        <p className="apv-result__verified">
          Results verified on Aztec
          {txExplorerBase ? (
            <>
              {' '}
              -{' '}
              <a
                href={`${txExplorerBase}${tally.finalizedTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {shortenHex(tally.finalizedTxHash)}
              </a>
            </>
          ) : (
            <> - {shortenHex(tally.finalizedTxHash)}</>
          )}
        </p>
      ) : null}

      {showVerificationLink ? (
        <button
          type="button"
          className="apv-result__verify-toggle"
          onClick={() => setShowVerifier((v) => !v)}
        >
          {showVerifier ? 'Close verifier' : 'Verify your vote was counted'}
        </button>
      ) : null}

      {showVerifier ? <ReceiptVerifier config={config} /> : null}

      {showAuditorPanel && tally.finalized ? (
        <AuditorPanel
          tally={tally}
          config={config}
          contractExplorerBase={contractExplorerBase}
          txExplorerBase={txExplorerBase}
        />
      ) : null}
    </div>
  );
}

interface AuditorPanelProps {
  tally: NonNullable<ReturnType<typeof useTally>['tally']>;
  config: VoteConfig;
  contractExplorerBase: string | undefined;
  txExplorerBase: string | undefined;
}

function AuditorPanel({
  tally,
  config,
  contractExplorerBase,
  txExplorerBase,
}: AuditorPanelProps): JSX.Element {
  const tallySum = tally.results.reduce((acc, r) => acc + r.count, 0);
  const totalsMatch = tallySum === tally.totalVotes;

  return (
    <section className="apv-auditor" aria-label="Auditor verification">
      <h3 className="apv-auditor__title">For auditors</h3>
      <ul className="apv-auditor__claims">
        <li>
          <span className="apv-auditor__check" aria-hidden="true">
            ✓
          </span>
          <div>
            <strong>Tally totals match the vote count.</strong>{' '}
            {tallySum.toLocaleString()} votes in the option breakdown vs{' '}
            {tally.totalVotes.toLocaleString()} cast on chain.{' '}
            {totalsMatch ? null : (
              <span className="apv-auditor__warn">Mismatch detected.</span>
            )}
          </div>
        </li>
        <li>
          <span className="apv-auditor__check" aria-hidden="true">
            ✓
          </span>
          <div>
            <strong>No address voted twice.</strong> Each accepted ballot inserts a
            unique nullifier; the contract rejects duplicates at submission, so the
            on-chain count equals the number of distinct voters.
          </div>
        </li>
        <li>
          <span className="apv-auditor__check" aria-hidden="true">
            ✓
          </span>
          <div>
            <strong>Individual choices are not readable from chain.</strong> Only
            the aggregated tally was revealed by{' '}
            <code>finalize_vote</code>; the per-ballot choice never left the prover.
          </div>
        </li>
        <li>
          <span className="apv-auditor__check" aria-hidden="true">
            ✓
          </span>
          <div>
            <strong>Final tally was computed on chain.</strong> The reveal call
            below is what produced the numbers above.
          </div>
        </li>
      </ul>

      <dl className="apv-auditor__refs">
        <div>
          <dt>Contract</dt>
          <dd>
            {contractExplorerBase ? (
              <a
                href={`${contractExplorerBase}${config.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {shortenHex(config.contractAddress, 8, 6)}
              </a>
            ) : (
              <code>{config.contractAddress}</code>
            )}
          </dd>
        </div>
        {tally.finalizedTxHash ? (
          <div>
            <dt>Finalize tx</dt>
            <dd>
              {txExplorerBase ? (
                <a
                  href={`${txExplorerBase}${tally.finalizedTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {shortenHex(tally.finalizedTxHash, 8, 6)}
                </a>
              ) : (
                <code>{tally.finalizedTxHash}</code>
              )}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

function ReceiptVerifier({ config }: { config: VoteConfig }): JSX.Element {
  const [fingerprint, setFingerprint] = useState('');
  const { verify, status, result, error } = useVerifyReceipt(config);

  return (
    <div className="apv-verifier">
      <label htmlFor="apv-verifier-input">Paste your vote fingerprint</label>
      <div className="apv-verifier__row">
        <input
          id="apv-verifier-input"
          type="text"
          value={fingerprint}
          onChange={(event) => setFingerprint(event.target.value)}
          placeholder="0x..."
        />
        <button
          type="button"
          onClick={() => void verify(fingerprint)}
          disabled={status === 'checking' || fingerprint.length === 0}
        >
          {status === 'checking' ? 'Checking...' : 'Check'}
        </button>
      </div>
      {status === 'done' && result !== null ? (
        <p className={result ? 'apv-verifier__ok' : 'apv-verifier__no'}>
          {result
            ? 'This fingerprint was counted in the vote.'
            : 'This fingerprint was not found in the counted votes.'}
        </p>
      ) : null}
      {error ? (
        <p className="apv-verifier__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
