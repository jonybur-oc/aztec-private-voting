import { expect, test } from '@playwright/test';

import { requiresTestnet } from './_skip';

test.describe('Post-deadline + verifier (APV-29, APV-30, APV-31)', () => {
  test.beforeEach(() => requiresTestnet());

  test('the closed page shows the tally and the verifier accepts/rejects fingerprints', async ({
    page,
  }) => {
    await page.goto('/closed');

    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(page.getByText(/votes cast/i)).toBeVisible();

    await page.getByRole('button', { name: /verify your vote was counted/i }).click();

    const knownGood = process.env.E2E_KNOWN_FINGERPRINT;
    if (knownGood) {
      await page.getByLabel(/paste your vote fingerprint/i).fill(knownGood);
      await page.getByRole('button', { name: /check/i }).click();
      await expect(
        page.getByText(/this fingerprint was counted in the vote/i),
      ).toBeVisible({ timeout: 30_000 });
    }

    await page
      .getByLabel(/paste your vote fingerprint/i)
      .fill(`0x${'0'.repeat(64)}`);
    await page.getByRole('button', { name: /check/i }).click();
    await expect(
      page.getByText(/this fingerprint was not found in the counted votes/i),
    ).toBeVisible({ timeout: 30_000 });
  });
});
