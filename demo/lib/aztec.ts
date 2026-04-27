import type { AccountWalletWithSecretKey, PXE } from '@aztec/aztec.js';

export async function createDemoWallet(pxe: PXE): Promise<AccountWalletWithSecretKey> {
  const { getSchnorrAccount } = await import(
    '@aztec/accounts/schnorr'
  );
  const { Fr, GrumpkinScalar } = await import('@aztec/aztec.js');
  const secretKey = restoreOrCreateSecret('apv-demo-secret');
  const signingKey = restoreOrCreateGrumpkin('apv-demo-signing', GrumpkinScalar);
  const account = await getSchnorrAccount(pxe, new Fr(secretKey), signingKey);
  await account.deploy().wait();
  return account.getWallet();
}

function restoreOrCreateSecret(key: string): bigint {
  if (typeof window === 'undefined') {
    throw new Error('Wallet bootstrap only works in the browser');
  }
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return BigInt(existing);
  }
  const bytes = new Uint8Array(31);
  crypto.getRandomValues(bytes);
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  window.localStorage.setItem(key, value.toString());
  return value;
}

function restoreOrCreateGrumpkin(
  key: string,
  GrumpkinScalar: { fromString: (s: string) => unknown; random: () => unknown },
): ReturnType<typeof GrumpkinScalar.random> {
  const existing = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  if (existing) {
    return GrumpkinScalar.fromString(existing);
  }
  const fresh = GrumpkinScalar.random();
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, String(fresh));
  }
  return fresh;
}
