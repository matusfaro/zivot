import { Page, expect } from '@playwright/test';

/**
 * Helper to access IndexedDB in the browser context
 * Gets a specific section from the user profile
 */
export async function getIndexedDBValue(
  page: Page,
  sectionName: string
): Promise<any> {
  return page.evaluate(
    async (sectionName) => {
      return new Promise((resolve, reject) => {
        // Open without version to use current version
        const request = indexedDB.open('ZivotDB');

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction('profiles', 'readonly');
          const objectStore = transaction.objectStore('profiles');

          // Use getAll() which is standard IndexedDB API
          const getRequest = objectStore.getAll();

          getRequest.onsuccess = () => {
            const profiles = getRequest.result;
            if (profiles && profiles.length > 0) {
              const profile = profiles[0];
              // Return the specific section from profile.data
              resolve(profile.data?.[sectionName]);
            } else {
              resolve(null);
            }
          };

          getRequest.onerror = () => {
            reject(getRequest.error);
          };
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    },
    sectionName
  );
}

/**
 * Helper to get a value from a nested path in an object
 */
export function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Wait for profile to be persisted to IndexedDB with the expected value
 */
export async function waitForProfilePersistence(
  page: Page,
  path: string,
  expectedValue: any,
  timeout: number = 5000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      // Get the profile section that contains this field
      const section = path.split('.')[0];
      const profileData = await getIndexedDBValue(page, section);

      if (profileData) {
        const actualValue = getNestedValue(profileData, path.substring(section.length + 1));

        // For mostRecent values, we need to access .value
        if (actualValue && typeof actualValue === 'object' && 'value' in actualValue) {
          if (actualValue.value === expectedValue) {
            return;
          }
        } else if (actualValue === expectedValue) {
          return;
        }
      }
    } catch (error) {
      // IndexedDB might not be ready yet, continue waiting
    }

    // Wait a bit before checking again
    await page.waitForTimeout(100);
  }

  throw new Error(
    `Timeout waiting for profile persistence: ${path} = ${expectedValue}`
  );
}

/**
 * Wait for risk calculation to complete
 * Checks that the "Updating..." indicator is gone and a valid risk is displayed
 */
export async function waitForRiskCalculation(page: Page, timeout: number = 5000): Promise<void> {
  // Wait for any "Updating..." text to disappear
  await page.waitForSelector('text=Updating', { state: 'hidden', timeout });

  // Verify we have a valid risk percentage displayed
  await expect(page.locator('text=/\\d+\\.\\d+%/').first()).toBeVisible({ timeout });
}

/**
 * Expand a section if it's collapsed
 */
export async function expandSection(page: Page, sectionName: string): Promise<void> {
  const sectionButton = page.locator(`button:has-text("${sectionName}")`);

  // Check if section is collapsed (has ▶)
  const isCollapsed = await sectionButton.locator('text=▶').isVisible().catch(() => false);

  if (isCollapsed) {
    await sectionButton.click();
    // Wait for section to expand
    await page.waitForTimeout(200);
  }
}

/**
 * Clear all IndexedDB data
 */
export async function clearIndexedDB(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase('ZivotDB');
      request.onsuccess = () => resolve();
      request.onerror = () => resolve(); // Resolve anyway
      request.onblocked = () => resolve(); // Resolve anyway
    });
  });
}

/**
 * Set an input field value and trigger change event
 */
export async function setInputValue(
  page: Page,
  label: string,
  value: string | number
): Promise<void> {
  const input = page.locator(`label:has-text("${label}") input`);
  await input.fill(String(value));
  // Trigger blur to ensure onChange fires
  await input.blur();
}

/**
 * Set a select field value
 */
export async function setSelectValue(
  page: Page,
  label: string,
  value: string
): Promise<void> {
  const select = page.locator(`label:has-text("${label}") select`);
  await select.selectOption(value);
}

/**
 * Toggle a checkbox
 */
export async function toggleCheckbox(
  page: Page,
  label: string,
  checked: boolean
): Promise<void> {
  const checkbox = page.locator(`label:has-text("${label}") input[type="checkbox"]`);
  const isChecked = await checkbox.isChecked();

  if (isChecked !== checked) {
    await checkbox.click();
  }
}

/**
 * Get the current value of an input field
 */
export async function getInputValue(page: Page, label: string): Promise<string> {
  const input = page.locator(`label:has-text("${label}") input`);
  return input.inputValue();
}

/**
 * Get the current value of a select field
 */
export async function getSelectValue(page: Page, label: string): Promise<string> {
  const select = page.locator(`label:has-text("${label}") select`);
  return select.inputValue();
}

/**
 * Check if a checkbox is checked
 */
export async function isCheckboxChecked(page: Page, label: string): Promise<boolean> {
  const checkbox = page.locator(`label:has-text("${label}") input[type="checkbox"]`);
  return checkbox.isChecked();
}
