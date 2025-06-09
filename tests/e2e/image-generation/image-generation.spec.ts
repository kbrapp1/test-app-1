import { test, expect } from '@playwright/test';

test.describe('Image Generation', () => {
  test.use({ storageState: 'tests/playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-playground/image-generator');
    await expect(page.getByPlaceholder('Describe what you want to create')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create art' })).toBeVisible();
  });

  test('Generate image, verify history, and test blur fix', async ({ page }) => {
    const prompt = 'A futuristic city at sunset';
    await page.getByPlaceholder('Describe what you want to create').fill(prompt);
    await page.getByRole('button', { name: 'Create art' }).click();

    await expect(page.getByText('Creating your image')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('img[alt="Generated image"]')).toBeVisible({ timeout: 60000 });

    await page.getByRole('button', { name: 'Toggle image history' }).click();
    await expect(page.getByText('Recent Generations')).toBeVisible();

    const historyImage = page.locator(`img[alt*="${prompt.substring(0, 20)}"]`).first();
    await expect(historyImage).toBeVisible({ timeout: 5000 });

    const imageSrc = await historyImage.getAttribute('src');
    expect(imageSrc).not.toContain('data:image');

    await page.locator('.fixed.inset-0.bg-black').click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Toggle image history' }).click();
    await expect(page.getByText('Recent Generations')).toBeVisible();

    const historyAfterReopen = page.locator(`img[alt*="${prompt.substring(0, 20)}"]`).first();
    await expect(historyAfterReopen).toBeVisible();

    const sharpImageSrc = await historyAfterReopen.getAttribute('src');
    expect(sharpImageSrc).not.toContain('data:image');
  });
}); 