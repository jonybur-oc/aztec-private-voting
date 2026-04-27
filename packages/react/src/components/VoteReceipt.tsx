import { useState } from 'react';

import { shortenHex, formatTimestamp } from '../format';
import { downloadReceipt } from '../receipt';
import type { VoteReceipt as VoteReceiptData } from '../types';

export interface VoteReceiptProps {
  receipt: VoteReceiptData;
  onDownload?: (receipt: VoteReceiptData) => void;
  onVerify?: (receipt: VoteReceiptData) => void;
  verifierUrl?: string;
}

export function VoteReceipt({
  receipt,
  onDownload,
  onVerify,
  verifierUrl,
}: VoteReceiptProps): JSX.Element {
  const [showHowToVerify, setShowHowToVerify] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(receipt.nullifier);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = (): void => {
    if (onDownload) {
      onDownload(receipt);
      return;
    }
    downloadReceipt(receipt);
  };

  const handleVerify = (): void => {
    if (onVerify) {
      onVerify(receipt);
      return;
    }
    if (verifierUrl) {
      window.open(verifierUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="apv-receipt" role="region" aria-label="Vote receipt">
      <div className="apv-receipt__header">
        <span className="apv-receipt__check" aria-hidden="true">
          ✓
        </span>
        <h2 className="apv-receipt__title">Your vote was cast</h2>
      </div>

      <dl className="apv-receipt__meta">
        <div>
          <dt>Vote</dt>
          <dd>{receipt.voteTitle}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{formatTimestamp(receipt.timestamp)}</dd>
        </div>
      </dl>

      <div className="apv-receipt__fingerprint">
        <label htmlFor="apv-fingerprint">Your vote fingerprint</label>
        <div className="apv-receipt__fingerprint-row">
          <code id="apv-fingerprint" className="apv-receipt__fingerprint-value">
            {shortenHex(receipt.nullifier, 6, 4)}
          </code>
          <button
            type="button"
            className="apv-receipt__copy"
            onClick={handleCopy}
            aria-label="Copy vote fingerprint"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <p className="apv-receipt__explainer">
        This fingerprint proves your vote was counted without revealing how you
        voted. Save it to verify after the vote closes.
      </p>

      <div className="apv-receipt__actions">
        <button type="button" className="apv-receipt__primary" onClick={handleDownload}>
          Download receipt
        </button>
        <button
          type="button"
          className="apv-receipt__secondary"
          onClick={() => setShowHowToVerify((v) => !v)}
          aria-expanded={showHowToVerify}
        >
          {showHowToVerify ? 'Hide' : 'How to verify'}
        </button>
      </div>

      {showHowToVerify ? (
        <div className="apv-receipt__how-to" role="note">
          <p>
            After the vote closes, you can check that your fingerprint appears
            in the set of counted votes. This proves your vote was included
            without revealing your choice.
          </p>
          <ol>
            <li>Save the receipt now (it&apos;s only stored on your device).</li>
            <li>When the vote closes, open the verifier.</li>
            <li>Paste your fingerprint. The verifier will tell you whether it was counted.</li>
          </ol>
          {verifierUrl ? (
            <button type="button" className="apv-receipt__link" onClick={handleVerify}>
              Open verifier
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
