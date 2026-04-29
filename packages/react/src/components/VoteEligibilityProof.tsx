import { useEffect } from 'react';

import { useEligibility } from '../hooks/useEligibility';
import type { EligibilityProof, VoteConfig } from '../types';

export interface VoteEligibilityProofProps {
  config: VoteConfig;
  onEligible: (proof: EligibilityProof) => void;
  onIneligible: (reason: string) => void;
}

export function VoteEligibilityProof({
  config,
  onEligible,
  onIneligible,
}: VoteEligibilityProofProps): JSX.Element {
  const { status, proof, reason } = useEligibility(config);

  useEffect(() => {
    if (status === 'eligible' && proof) {
      onEligible(proof);
    }
    if (status === 'ineligible' && reason) {
      onIneligible(reason);
    }
  }, [status, proof, reason, onEligible, onIneligible]);

  if (status === 'connecting') {
    return (
      <div className="apv-eligibility apv-eligibility--checking" role="status">
        <span className="apv-spinner" aria-hidden="true" />
        <span>Connecting wallet...</span>
      </div>
    );
  }

  if (status === 'checking') {
    return (
      <div className="apv-eligibility apv-eligibility--checking" role="status">
        <span className="apv-spinner" aria-hidden="true" />
        <span>Checking eligibility...</span>
      </div>
    );
  }

  if (status === 'eligible') {
    return (
      <div className="apv-eligibility apv-eligibility--ok" role="status">
        <span aria-hidden="true">✓</span>
        <span>You&apos;re eligible to vote</span>
      </div>
    );
  }

  if (status === 'ineligible') {
    return (
      <div className="apv-eligibility apv-eligibility--no" role="alert">
        <span aria-hidden="true">×</span>
        <span>You&apos;re not eligible{reason ? `: ${reason}` : ''}</span>
      </div>
    );
  }

  return (
    <div className="apv-eligibility apv-eligibility--error" role="alert">
      <span>Could not check eligibility{reason ? `: ${reason}` : ''}</span>
    </div>
  );
}
