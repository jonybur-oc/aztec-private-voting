export interface NullifierInput {
  voteId: string;
  walletAddress: string;
  secret: bigint;
}

export async function deriveNullifier(input: NullifierInput): Promise<bigint> {
  const { poseidon2Hash, Fr } = await import('@aztec/aztec.js');
  const voteIdField = Fr.fromString(toHex(input.voteId));
  const addressField = Fr.fromString(input.walletAddress);
  const secretField = new Fr(input.secret);
  const hash = await poseidon2Hash([voteIdField, addressField, secretField]);
  return hash.toBigInt();
}

export function generateVoteSecret(): bigint {
  const bytes = new Uint8Array(31);
  crypto.getRandomValues(bytes);
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  return value;
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
