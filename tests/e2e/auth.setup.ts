import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Debug: Log environment variables
  console.log('🧪 Test Credentials:');
  console.log('Email:', process.env.TEST_USER_EMAIL || 'NOT SET - using test@example.com');
  console.log('Password:', process.env.TEST_USER_PASSWORD ? '***SET***' : 'NOT SET - using password123');

  // Go to login page
  await page.goto('/login');

  // Fill in authentication form using actual selectors from login form
  await page.locator('input[name="email"]').fill(process.env.TEST_USER_EMAIL || 'test@example.com');
  await page.locator('input[name="password"]').fill(process.env.TEST_USER_PASSWORD || 'password123');
  
  // Click sign in button
  await page.locator('button[type="submit"]').click();

  // Wait for successful login - adjust based on your app's behavior
  await page.waitForURL('/dashboard');
  
  // Ensure user is authenticated by looking for an element containing the user's email.
  // This is more robust than checking for the exact text which might change (e.g., with initials prepended).
  const userEmail = process.env.TEST_USER_EMAIL;
  if (!userEmail) {
    throw new Error('TEST_USER_EMAIL environment variable not set. Please check your .env.local file.');
  }
  await expect(page.locator(`button:has-text("${userEmail}")`)).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });
}); 