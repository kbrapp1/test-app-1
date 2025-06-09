import { Page, expect } from '@playwright/test';

/**
 * Helper functions for E2E tests
 */

export async function loginUser(page: Page, email?: string, password?: string) {
  await page.goto('/login');
  
  await page.locator('input[name="email"]').fill(email || process.env.TEST_USER_EMAIL || 'test@example.com');
  await page.locator('input[name="password"]').fill(password || process.env.TEST_USER_PASSWORD || 'password123');
  
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('/dashboard');
  
  // Check for authenticated user in sidebar - look for email
  await expect(page.getByText(email || process.env.TEST_USER_EMAIL || 'test@example.com')).toBeVisible();
}

export async function generateTestImage(page: Page, prompt: string = 'Test image') {
  await page.goto('/ai-playground/image-generator');
  
  await page.getByPlaceholder('Describe what you want to create').fill(prompt);
  await page.getByRole('button', { name: 'Create art' }).click();
  
  await expect(page.locator('img[alt="Generated image"]')).toBeVisible({ 
    timeout: 60000 
  });
  
  return prompt;
}

export async function openHistoryPanel(page: Page) {
  await page.click('[data-testid="history-panel-trigger"]');
  await expect(page.locator('[data-testid="history-panel"]')).toBeVisible();
}

export async function closeHistoryPanel(page: Page) {
  await page.click('[data-testid="close-history-panel"]');
  await expect(page.locator('[data-testid="history-panel"]')).not.toBeVisible();
}

export async function waitForImageLoad(page: Page, imageSelector: string) {
  const image = page.locator(imageSelector);
  await expect(image).toBeVisible();
  await expect(image).toHaveClass(/opacity-100/);
}

export async function verifyImageSharpness(page: Page, imageSelector: string) {
  const image = page.locator(imageSelector);
  await expect(image).toBeVisible();
  await expect(image).toHaveClass(/opacity-100/);
  await expect(image).not.toHaveClass(/opacity-0/);
  
  const imageSrc = await image.getAttribute('src');
  expect(imageSrc).toBeTruthy();
  expect(imageSrc).not.toContain('data:image'); // Should not be a blur placeholder
}

export async function createDamFolder(page: Page, folderName: string) {
  await page.goto('/dam');
  
  await page.click('[data-testid="create-folder-button"]');
  await page.fill('[data-testid="folder-name-input"]', folderName);
  await page.click('[data-testid="create-folder-confirm"]');
  
  await expect(page.locator('[data-testid="folder-item"]')).toContainText(folderName);
}

export async function searchDamAssets(page: Page, searchTerm: string) {
  await page.fill('[data-testid="dam-search-input"]', searchTerm);
  await page.click('[data-testid="search-button"]');
}

export async function clearDamSearch(page: Page) {
  await page.fill('[data-testid="dam-search-input"]', '');
  await page.click('[data-testid="search-button"]');
}

/**
 * Clean up test data after tests
 */
export async function cleanupTestData(page: Page) {
  // Clean up generated images, folders, etc.
  // This can be expanded based on your cleanup needs
  
  try {
    await page.goto('/dam');
    
    // Delete test folders
    const testFolders = page.locator('[data-testid="folder-item"]:has-text("Test"), [data-testid="folder-item"]:has-text("AI Generated")');
    const folderCount = await testFolders.count();
    
    for (let i = 0; i < folderCount; i++) {
      const folder = testFolders.nth(i);
      if (await folder.isVisible()) {
        await folder.click({ button: 'right' });
        await page.click('[data-testid="delete-folder"]');
        await page.click('[data-testid="confirm-delete"]');
      }
    }
  } catch (error) {
    // Cleanup errors shouldn't fail tests
    // console.warn('Cleanup failed:', error);
  }
} 