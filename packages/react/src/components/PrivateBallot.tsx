import { useState } from 'react';

import { useVote } from '../hooks/useVote';
import type { EligibilityProof, VoteConfig, VoteReceipt } from '../types';

export interface PrivateBallotProps {
  config: VoteConfig;
  eligibilityProof: EligibilityProof;
  onVoteCast: (receipt: VoteReceipt) => void;
}

export function PrivateBallot({
  config,
  eligibilityProof,
  onVoteCast,
}: PrivateBallotProps): JSX.Element {
  const [selected, setSelected] = useState<number | null>(null);
  const { castVote, status, error } = useVote(config);

  const now = Date.now();
  const notStarted = now < config.startTime;
  const closed = now >= config.endTime;
  const submitting = status === 'submitting';
  const disabled = submitting || selected === null || notStarted || closed;

  if (closed) {
    return (
      <p className="apv-ballot__closed" role="status">
        This vote has closed and is no longer accepting ballots.
      </p>
    );
  }

  if (notStarted) {
    return (
      <p className="apv-ballot__closed" role="status">
        This vote has not opened yet.
      </p>
    );
  }

  const handleSubmit = async (): Promise<void> => {
    if (selected === null) return;
    const receipt = await castVote({
      choice: selected,
      eligibilityProof,
    });
    if (receipt) {
      onVoteCast(receipt);
    }
  };

  return (
    <form
      className="apv-ballot"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <fieldset className="apv-ballot__options" disabled={submitting}>
        <legend className="apv-ballot__title">{config.title}</legend>
        {config.description ? (
          <p className="apv-ballot__description">{config.description}</p>
        ) : null}
        {config.options.map((option, index) => (
          <label key={option} className="apv-ballot__option">
            <input
              type="radio"
              name="apv-vote-choice"
              value={index}
              checked={selected === index}
              onChange={() => setSelected(index)}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>

      {error ? (
        <p className="apv-ballot__error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="apv-ballot__submit" disabled={disabled}>
        {submitting ? 'Submitting your encrypted ballot...' : 'Cast Private Vote'}
      </button>
    </form>
  );
}
