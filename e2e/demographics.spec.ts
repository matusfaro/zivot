import { test, expect } from './fixtures/base';
import {
  setSelectValue,
  getSelectValue,
  getIndexedDBValue,
  waitForRiskCalculation,
} from './helpers/test-helpers';

test.describe('Demographics Section Fields', () => {

  test('should persist and calculate risk when Age is changed', async ({ page }) => {
    // Change age to 55
    const ageSlider = page.locator('[data-testid="profile-demographics-dateOfBirth"]');
    await ageSlider.fill('55');

    // Wait for persistence (0ms debounce in test mode + some processing time)
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value (age 55 means birth year is current year - 55)
    const demographics = await getIndexedDBValue(page, 'demographics');
    const birthYear = new Date().getFullYear() - 55;
    expect(demographics?.dateOfBirth?.value).toBe(`${birthYear}-01-01`);

    // Verify the UI shows the new age
    await expect(page.locator('text=/Age: 55 years/i')).toBeVisible();

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Biological Sex is changed', async ({ page }) => {
    // Select female
    await setSelectValue(page, 'Biological Sex', 'female');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const demographics = await getIndexedDBValue(page, 'demographics');
    expect(demographics?.biologicalSex?.value).toBe('female');

    // Verify the select shows the new value
    const currentValue = await getSelectValue(page, 'Biological Sex');
    expect(currentValue).toBe('female');

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Ethnicity is changed', async ({ page }) => {
    // Select Asian ethnicity
    await setSelectValue(page, 'Ethnicity', 'asian');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const demographics = await getIndexedDBValue(page, 'demographics');
    expect(demographics?.ethnicity?.value).toBe('asian');

    // Verify the select shows the new value
    const currentValue = await getSelectValue(page, 'Ethnicity');
    expect(currentValue).toBe('asian');

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Education Level is changed', async ({ page }) => {
    // Select bachelor's degree
    await setSelectValue(page, 'Education Level', 'bachelors');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const demographics = await getIndexedDBValue(page, 'demographics');
    expect(demographics?.educationLevel?.value).toBe('bachelors');

    // Verify the select shows the new value
    const currentValue = await getSelectValue(page, 'Education Level');
    expect(currentValue).toBe('bachelors');

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);
  });

  test('should handle multiple demographics changes in sequence', async ({ page }) => {
    // Change age
    const ageSlider = page.locator('[data-testid="profile-demographics-dateOfBirth"]');
    await ageSlider.fill('60');
    await page.waitForTimeout(500);

    // Change sex
    await setSelectValue(page, 'Biological Sex', 'male');
    await page.waitForTimeout(500);

    // Change ethnicity
    await setSelectValue(page, 'Ethnicity', 'black');
    await page.waitForTimeout(500);

    // Change education
    await setSelectValue(page, 'Education Level', 'graduate');
    await page.waitForTimeout(1000);

    // Verify all values are persisted in IndexedDB
    const demographics = await getIndexedDBValue(page, 'demographics');
    const birthYear = new Date().getFullYear() - 60;
    expect(demographics?.dateOfBirth?.value).toBe(`${birthYear}-01-01`);
    expect(demographics?.biologicalSex?.value).toBe('male');
    expect(demographics?.ethnicity?.value).toBe('black');
    expect(demographics?.educationLevel?.value).toBe('graduate');

    // Verify UI shows updated values
    await expect(page.locator('text=/Age: 60 years/i')).toBeVisible();
    expect(await getSelectValue(page, 'Biological Sex')).toBe('male');
    expect(await getSelectValue(page, 'Ethnicity')).toBe('black');
    expect(await getSelectValue(page, 'Education Level')).toBe('graduate');

    // Wait for final risk calculation
    await waitForRiskCalculation(page);
  });

  test('should handle age at minimum boundary (18)', async ({ page }) => {
    const ageSlider = page.locator('[data-testid="profile-demographics-dateOfBirth"]');
    await ageSlider.fill('18');

    await page.waitForTimeout(1000);

    const demographics = await getIndexedDBValue(page, 'demographics');
    const birthYear = new Date().getFullYear() - 18;
    expect(demographics?.dateOfBirth?.value).toBe(`${birthYear}-01-01`);

    await expect(page.locator('text=/Age: 18 years/i')).toBeVisible();
    await waitForRiskCalculation(page);
  });

  test('should handle age at maximum boundary (120)', async ({ page }) => {
    const ageSlider = page.locator('[data-testid="profile-demographics-dateOfBirth"]');
    await ageSlider.fill('120');

    await page.waitForTimeout(1000);

    const demographics = await getIndexedDBValue(page, 'demographics');
    const birthYear = new Date().getFullYear() - 120;
    expect(demographics?.dateOfBirth?.value).toBe(`${birthYear}-01-01`);

    await expect(page.locator('text=/Age: 120 years/i')).toBeVisible();
    await waitForRiskCalculation(page);
  });
});
