import { describe, expect, it } from 'vitest';

import {
  translateDeployError,
  translateFinalizeError,
  translateVoteError,
} from './errors';

describe('translateVoteError', () => {
  it('renders double-vote as plain language (APV-28, APV-39)', () => {
    expect(translateVoteError('Assertion failed: nullifier already used')).toBe(
      'You have already voted on this proposal.',
    );
  });

  it('renders post-deadline as a closed-vote message (APV-29, APV-40)', () => {
    expect(translateVoteError('Assertion failed: voting ended')).toBe(
      'This vote has closed and is no longer accepting ballots.',
    );
  });

  it('renders pre-start as a not-yet-open message', () => {
    expect(translateVoteError('Assertion failed: voting not started')).toBe(
      'This vote has not opened yet.',
    );
  });

  it('renders invalid-choice as a ballot-mismatch message', () => {
    expect(translateVoteError('Assertion failed: invalid choice')).toBe(
      'That option is not on the ballot.',
    );
  });

  it('passes through unrelated errors so callers can debug them', () => {
    expect(translateVoteError('PXE disconnected')).toBe('PXE disconnected');
  });
});

describe('translateFinalizeError', () => {
  it('renders pre-deadline finalize as a wait message (APV-18)', () => {
    expect(translateFinalizeError('Assertion failed: voting still open')).toBe(
      'The vote has not closed yet. Try again after the deadline.',
    );
  });

  it('renders quorum-not-met as plain language', () => {
    expect(translateFinalizeError('Assertion failed: quorum not met')).toBe(
      'Quorum has not been reached. The result cannot be finalized.',
    );
  });

  it('renders already-finalized as a one-shot message', () => {
    expect(translateFinalizeError('Assertion failed: already finalized')).toBe(
      'This vote has already been finalized.',
    );
  });
});

describe('translateDeployError (APV-41)', () => {
  it('renders insufficient-funds with a specific actionable message', () => {
    expect(
      translateDeployError('Failed to deploy: insufficient funds for gas'),
    ).toMatch(/funds/i);
  });

  it('renders network errors with a connectivity hint', () => {
    expect(translateDeployError('Network connection refused')).toMatch(/network/i);
  });
});
