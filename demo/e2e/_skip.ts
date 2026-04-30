import { test } from '@playwright/test';

// E2e flows talk to a real PXE + deployed contract on Aztec Alpha testnet.
// Set E2E_TESTNET_READY=1 once the demo is pointed at a live deployment.
export const requiresTestnet = (): void => {
  test.skip(!process.env.E2E_TESTNET_READY, 'Requires Aztec testnet + deployed vote contract');
};
