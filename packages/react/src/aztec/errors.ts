export function translateVoteError(message: string): string {
  if (/nullifier already used/i.test(message)) {
    return 'You have already voted on this proposal.';
  }
  if (/voting ended/i.test(message)) {
    return 'This vote has closed and is no longer accepting ballots.';
  }
  if (/voting not started/i.test(message)) {
    return 'This vote has not opened yet.';
  }
  if (/already finalized/i.test(message)) {
    return 'This vote has already been finalized.';
  }
  if (/invalid choice/i.test(message)) {
    return 'That option is not on the ballot.';
  }
  return message;
}

export function translateFinalizeError(message: string): string {
  if (/voting still open/i.test(message)) {
    return 'The vote has not closed yet. Try again after the deadline.';
  }
  if (/already finalized/i.test(message)) {
    return 'This vote has already been finalized.';
  }
  if (/quorum not met/i.test(message)) {
    return 'Quorum has not been reached. The result cannot be finalized.';
  }
  return message;
}

export function translateDeployError(message: string): string {
  if (/insufficient funds/i.test(message)) {
    return 'The deployer wallet does not have enough funds to pay the deployment fee.';
  }
  if (/network/i.test(message)) {
    return 'Network error while talking to the Aztec node. Check your PXE connection and try again.';
  }
  return message;
}
