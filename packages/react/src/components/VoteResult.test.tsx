import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { VoteResult } from './VoteResult';
import type { VoteConfig, VoteTally } from '../types';

const tally: VoteTally = {
  voteId: 'vote-1',
  totalVotes: 5,
  quorum: 1,
  quorumMet: true,
  finalized: true,
  finalizedTxHash: '0xfin',
  results: [
    { option: 'For', count: 3, percentage: 60 },
    { option: 'Against', count: 2, percentage: 40 },
  ],
};

const verifyMock = vi.fn(async (_fingerprint: string): Promise<void> => undefined);
const verifyState = {
  status: 'idle' as 'idle' | 'checking' | 'done' | 'error',
  result: null as boolean | null,
  error: null as string | null,
};

vi.mock('../hooks/useTally', () => ({
  useTally: () => ({
    tally,
    status: 'ready',
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('../hooks/useVerifyReceipt', () => ({
  useVerifyReceipt: () => ({
    verify: verifyMock,
    status: verifyState.status,
    result: verifyState.result,
    error: verifyState.error,
  }),
}));

const config: VoteConfig = {
  voteId: 'vote-1',
  contractAddress: '0xcontract',
  title: 'Should we ship?',
  description: '',
  options: ['For', 'Against'],
  startTime: 0,
  endTime: 1,
  quorum: 1,
  eligibilityMode: 'open',
};

describe('VoteResult verifier (APV-09, APV-10, APV-11, APV-31)', () => {
  it('exposes the verifier link without requiring login', () => {
    render(<VoteResult config={config} />);
    expect(
      screen.getByRole('button', { name: /verify your vote was counted/i }),
    ).toBeInTheDocument();
  });

  it('calls verify with the pasted fingerprint', async () => {
    verifyMock.mockReset();
    render(<VoteResult config={config} />);
    await userEvent.click(
      screen.getByRole('button', { name: /verify your vote was counted/i }),
    );
    const input = screen.getByLabelText(/paste your vote fingerprint/i);
    await userEvent.type(input, '0xabc');
    await userEvent.click(screen.getByRole('button', { name: /check/i }));
    expect(verifyMock).toHaveBeenCalledWith('0xabc');
  });

  it('renders the counted message when result is true', async () => {
    verifyState.status = 'done';
    verifyState.result = true;
    render(<VoteResult config={config} />);
    await userEvent.click(
      screen.getByRole('button', { name: /verify your vote was counted/i }),
    );
    await waitFor(() => {
      expect(
        screen.getByText(/this fingerprint was counted in the vote/i),
      ).toBeInTheDocument();
    });
    verifyState.status = 'idle';
    verifyState.result = null;
  });

  it('renders the not-counted message when result is false', async () => {
    verifyState.status = 'done';
    verifyState.result = false;
    render(<VoteResult config={config} />);
    await userEvent.click(
      screen.getByRole('button', { name: /verify your vote was counted/i }),
    );
    await waitFor(() => {
      expect(
        screen.getByText(/this fingerprint was not found in the counted votes/i),
      ).toBeInTheDocument();
    });
    verifyState.status = 'idle';
    verifyState.result = null;
  });
});
