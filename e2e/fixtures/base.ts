import { test as base } from '@playwright/test';
import { clearIndexedDB } from '../helpers/test-helpers';

/**
 * Extended test fixture that automatically clears IndexedDB before each test
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for app to be ready - look for the profile editor section which should always be present
    await page.waitForSelector('.profile-section', { timeout: 15000 });

    // Clear IndexedDB before each test
    await clearIndexedDB(page);

    // Reload to start with fresh state
    await page.reload();
    await page.waitForSelector('.profile-section', { timeout: 15000 });

    // Use the page in the test
    await use(page);

    // Cleanup after test if needed
    await clearIndexedDB(page);
  },
});

export { expect } from '@playwright/test';
