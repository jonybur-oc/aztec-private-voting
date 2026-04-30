import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AztecProvider } from '../aztec/context';
import { PrivateBallot } from './PrivateBallot';
import type { EligibilityProof, VoteConfig } from '../types';

vi.mock('../hooks/useVote', () => ({
  useVote: () => ({
    castVote: vi.fn(),
    status: 'idle',
    error: null,
    receipt: null,
  }),
}));

const baseConfig = (overrides: Partial<VoteConfig> = {}): VoteConfig => ({
  voteId: 'vote-1',
  contractAddress: '0xcontract',
  title: 'Should we ship?',
  description: 'A test proposal',
  options: ['For', 'Against', 'Abstain'],
  startTime: Date.now() - 1000,
  endTime: Date.now() + 60_000,
  quorum: 1,
  eligibilityMode: 'open',
  ...overrides,
});

const proof: EligibilityProof = {
  voteId: 'vote-1',
  proof: '0x01',
  generatedAt: 0,
};

function renderBallot(config: VoteConfig): ReturnType<typeof render> {
  return render(
    <AztecProvider client={null} loading={false} error={null}>
      <PrivateBallot config={config} eligibilityProof={proof} onVoteCast={() => {}} />
    </AztecProvider>,
  );
}

describe('PrivateBallot deadline guard (APV-08, APV-40)', () => {
  it('renders the closed message when end_time has passed', () => {
    renderBallot(baseConfig({ endTime: Date.now() - 1 }));
    expect(
      screen.getByText(/this vote has closed and is no longer accepting ballots/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cast private vote/i })).toBeNull();
  });

  it('renders the not-yet-open message when start_time is in the future', () => {
    renderBallot(baseConfig({ startTime: Date.now() + 60_000 }));
    expect(screen.getByText(/this vote has not opened yet/i)).toBeInTheDocument();
  });

  it('renders the ballot when the vote is open', () => {
    renderBallot(baseConfig());
    expect(screen.getByRole('button', { name: /cast private vote/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/for/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/against/i)).toBeInTheDocument();
  });
});
