import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { VoteReceipt } from './VoteReceipt';
import type { VoteReceipt as VoteReceiptData } from '../types';

const receipt: VoteReceiptData = {
  voteId: 'vote-1',
  voteTitle: 'Should we ship?',
  nullifier:
    '0x000000000000000000000000000000000000000000000000000000000000abcd',
  txHash: '0xdeadbeef',
  timestamp: 1714238400000,
  contractAddress: '0xcontract',
};

describe('VoteReceipt copy (APV-04, APV-05, APV-06)', () => {
  it('says "Your vote was cast" - never "ballot recorded" or jargon', () => {
    render(<VoteReceipt receipt={receipt} />);
    expect(screen.getByText(/your vote was cast/i)).toBeInTheDocument();
    expect(screen.queryByText(/ballot has been recorded/i)).toBeNull();
  });

  it('labels the hex value as "vote fingerprint", not "nullifier"', () => {
    render(<VoteReceipt receipt={receipt} />);
    expect(screen.getByText(/your vote fingerprint/i)).toBeInTheDocument();
    expect(screen.queryByText(/nullifier/i)).toBeNull();
  });

  it('renders the load-bearing privacy claim verbatim', () => {
    render(<VoteReceipt receipt={receipt} />);
    expect(
      screen.getByText(
        /this fingerprint proves your vote was counted without revealing how you voted/i,
      ),
    ).toBeInTheDocument();
  });

  it('exposes Download receipt as the primary action', () => {
    render(<VoteReceipt receipt={receipt} />);
    const button = screen.getByRole('button', { name: /download receipt/i });
    expect(button).toHaveClass('apv-receipt__primary');
  });

  it('keeps "How to verify" collapsed by default', () => {
    render(<VoteReceipt receipt={receipt} />);
    const toggle = screen.getByRole('button', { name: /how to verify/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/save the receipt now/i)).toBeNull();
  });

  it('expands the verify explainer on click', async () => {
    render(<VoteReceipt receipt={receipt} />);
    const toggle = screen.getByRole('button', { name: /how to verify/i });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/save the receipt now/i)).toBeInTheDocument();
    expect(screen.getByText(/paste your fingerprint/i)).toBeInTheDocument();
  });

  it('invokes the custom onDownload handler when provided', async () => {
    const onDownload = vi.fn();
    render(<VoteReceipt receipt={receipt} onDownload={onDownload} />);
    await userEvent.click(screen.getByRole('button', { name: /download receipt/i }));
    expect(onDownload).toHaveBeenCalledWith(receipt);
  });
});
