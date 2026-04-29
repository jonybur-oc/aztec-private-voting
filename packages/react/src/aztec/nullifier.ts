export interface NullifierInput {
  voteId: string;
  walletAddress: string;
}

// Deterministic per (voteId, voter). Same voter resubmitting on the same vote
// produces the same nullifier, so the on-chain double-vote check rejects it.
// Privacy note: an observer with the voter's address can compute this nullifier
// and check whether they voted. Production deployments should derive the
// nullifier from a wallet-private secret instead - see docs/receipt-design.md.
export async function deriveNullifier(input: NullifierInput): Promise<bigint> {
  const { Fr } = await import('@aztec/aztec.js');
  const { poseidon2Hash } = await import('@aztec/foundation/crypto');
  const voteIdField = Fr.fromString(toHex(input.voteId));
  const addressField = Fr.fromString(input.walletAddress);
  const hash = await poseidon2Hash([voteIdField, addressField]);
  return hash.toBigInt();
}

export function fingerprintFromNullifier(nullifier: bigint): string {
  return `0x${nullifier.toString(16).padStart(64, '0')}`;
}

function toHex(value: string): string {
  if (value.startsWith('0x')) return value;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  let hex = '0x';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}
