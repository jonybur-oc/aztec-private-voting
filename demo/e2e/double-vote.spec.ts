import { expect, test } from '@playwright/test';

import { requiresTestnet } from './_skip';

test.describe('Double-vote protection (APV-28)', () => {
  test.beforeEach(() => requiresTestnet());

  test('a second cast attempt from the same wallet is rejected', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/your vote was cast/i)).toBeVisible({ timeout: 60_000 });

    // Reset to the ballot screen by reloading - the same wallet should now hit the
    // on-chain double-vote check.
    await page.reload();
    await expect(page.getByText(/you'?re eligible to vote/i)).toBeVisible();
    await page.getByLabel(/for/i).check();
    await page.getByRole('button', { name: /cast private vote/i }).click();

    await expect(
      page.getByText(/you have already voted on this proposal/i),
    ).toBeVisible({ timeout: 60_000 });
  });
});
