import { useState } from 'react';

import { shortenHex } from '../format';
import { useTally } from '../hooks/useTally';
import { useVerifyReceipt } from '../hooks/useVerifyReceipt';
import type { VoteConfig } from '../types';

export interface VoteResultProps {
  config: VoteConfig;
  showVerificationLink?: boolean;
  txExplorerBase?: string;
}

export function VoteResult({
  config,
  showVerificationLink = true,
  txExplorerBase,
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
    </div>
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
