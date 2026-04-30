import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

import { requiresTestnet } from './_skip';

test.describe('Receipt download (APV-32)', () => {
  test.beforeEach(() => requiresTestnet());

  test('downloads JSON containing the verifiable fields and no vote choice', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByText(/your vote was cast/i)).toBeVisible({ timeout: 60_000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /download receipt/i }).click();
    const download = await downloadPromise;
    const path = await download.path();
    if (!path) throw new Error('Download path not available');

    const raw = await fs.readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    expect(parsed.kind).toBe('aztec-private-voting-receipt');
    expect(parsed.version).toBe(1);
    expect(parsed.nullifier).toMatch(/^0x[0-9a-f]{64}$/);
    expect(parsed.txHash).toMatch(/^0x/);
    expect(typeof parsed.timestamp).toBe('number');
    expect(parsed.contractAddress).toBeTruthy();
    expect(parsed.voteId).toBeTruthy();

    expect(parsed).not.toHaveProperty('choice');
    expect(parsed).not.toHaveProperty('vote');
    expect(parsed).not.toHaveProperty('walletAddress');
    expect(parsed).not.toHaveProperty('voter');
  });
});
