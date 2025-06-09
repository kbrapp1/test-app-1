import { test, expect } from '@playwright/test';

test.describe('Manual - Image History Panel', () => {
  test.use({ storageState: 'tests/playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-playground/image-generator');
    await expect(page.getByPlaceholder('Describe what you want to create')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create art' })).toBeVisible();
  });

  test('History panel loading, scrolling, and caching behavior', async ({ page }) => {
        // --- Initial Load ---
    await page.getByRole('button', { name: 'Toggle image history' }).click();
    await expect(page.getByText('Recent Generations')).toBeVisible();

    const historyPanel = page.locator('div').filter({ has: page.getByRole('heading', { name: 'Recent Generations' }) });
    const scrollableContainer = historyPanel.locator('div.flex-1.overflow-y-auto');
    const historyImages = scrollableContainer.locator('img');

    // Assert that the first 20 images are loaded "instantly".
    // We give it a generous network timeout to appear, but the sharpness check is immediate.
    await expect(historyImages).toHaveCount(20, { timeout: 10000 });
    for (let i = 0; i < 20; i++) {
      await expect(historyImages.nth(i), `Initial image ${i + 1} should be sharp instantly`).toHaveAttribute('src', /^(?!data:image)/, { timeout: 500 });
    }

    // --- Infinite Scroll ---
    await scrollableContainer.hover();
    await page.mouse.wheel(0, 4000);

    // Assert that the next 20 images appear within 5 seconds.
    await expect(historyImages).toHaveCount(40, { timeout: 5000 });
    for (let i = 20; i < 40; i++) {
      const image = historyImages.nth(i);
      await image.scrollIntoViewIfNeeded();
      // Use the same immediate sharpness check as other parts of the test, per user request.
      await expect(image, `Scrolled image ${i + 1} should be sharp`).toHaveAttribute('src', /^(?!data:image)/, { timeout: 500 });
    }
    const countAfterScroll = await historyImages.count();

    // --- Cache Test ---
    await page.locator('.fixed.inset-0.bg-black').click();
    await expect(page.getByText('Recent Generations')).not.toBeVisible();

    await page.getByRole('button', { name: 'Toggle image history' }).click();
    await expect(page.getByText('Recent Generations')).toBeVisible();

    // Assert all 40 images are present "instantly" from the cache.
    const finalImageCount = await historyImages.count();
    expect(finalImageCount).toBeGreaterThanOrEqual(countAfterScroll);

    for (let i = 0; i < countAfterScroll; i++) {
      await expect(historyImages.nth(i), `Cached image ${i + 1} should be sharp instantly`).toHaveAttribute('src', /^(?!data:image)/, { timeout: 500 });
    }
  });
}); 