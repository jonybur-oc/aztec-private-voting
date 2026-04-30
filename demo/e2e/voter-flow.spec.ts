import { expect, test } from '@playwright/test';

import { requiresTestnet } from './_skip';

test.describe('Voter flow (APV-27)', () => {
  test.beforeEach(() => requiresTestnet());

  test('connect, prove eligibility, cast vote, receive receipt, download', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByText(/connecting wallet/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/you'?re eligible to vote/i)).toBeVisible({
      timeout: 30_000,
    });

    await page.getByLabel(/for/i).check();
    await page.getByRole('button', { name: /cast private vote/i }).click();

    await expect(page.getByText(/your vote was cast/i)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/your vote fingerprint/i)).toBeVisible();
    await expect(
      page.getByText(/this fingerprint proves your vote was counted/i),
    ).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /download receipt/i }).click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).not.toBeNull();
  });
});
