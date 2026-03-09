import { test, expect } from './fixtures/base';
import {
  setInputValue,
  waitForProfilePersistence,
  waitForRiskCalculation,
  getIndexedDBValue,
  getInputValue,
} from './helpers/test-helpers';

test.describe('Lab Tests Section Fields', () => {

  test('should persist and calculate risk when LDL Cholesterol is changed', async ({ page }) => {
    // Set LDL to 150 mg/dL
    await setInputValue(page, 'LDL Cholesterol', '150');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const labTests = await getIndexedDBValue(page, 'labTests');
    expect(labTests.lipidPanel.ldlCholesterol.value).toBe(150);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the input shows the new value
    const currentValue = await getInputValue(page, 'LDL Cholesterol');
    expect(currentValue).toBe('150');
  });

  test('should persist and calculate risk when HDL Cholesterol is changed', async ({ page }) => {
    // Set HDL to 40 mg/dL - use data-testid to avoid ambiguity with Non-HDL
    const hdlInput = page.locator('[data-testid="profile-labTests-lipidPanel-hdlCholesterol"]');
    await hdlInput.fill('40');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const labTests = await getIndexedDBValue(page, 'labTests');
    expect(labTests.lipidPanel.hdlCholesterol.value).toBe(40);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the input shows the new value
    expect(await hdlInput.inputValue()).toBe('40');
  });

  test('should persist and calculate risk when Total Cholesterol is changed', async ({ page }) => {
    // Set Total Cholesterol to 220 mg/dL
    await setInputValue(page, 'Total Cholesterol', '220');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const labTests = await getIndexedDBValue(page, 'labTests');
    expect(labTests.lipidPanel.totalCholesterol.value).toBe(220);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the input shows the new value
    const currentValue = await getInputValue(page, 'Total Cholesterol');
    expect(currentValue).toBe('220');
  });

  test('should persist and calculate risk when Triglycerides is changed', async ({ page }) => {
    // Set Triglycerides to 200 mg/dL
    await setInputValue(page, 'Triglycerides', '200');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const labTests = await getIndexedDBValue(page, 'labTests');
    expect(labTests.lipidPanel.triglycerides.value).toBe(200);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the input shows the new value
    const currentValue = await getInputValue(page, 'Triglycerides');
    expect(currentValue).toBe('200');
  });

  test('should persist and calculate risk when Fasting Glucose is changed', async ({ page }) => {
    // Set Fasting Glucose to 110 mg/dL (prediabetic range)
    await setInputValue(page, 'Fasting Glucose', '110');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const labTests = await getIndexedDBValue(page, 'labTests');
    expect(labTests.fastingGlucose.value).toBe(110);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the input shows the new value
    const currentValue = await getInputValue(page, 'Fasting Glucose');
    expect(currentValue).toBe('110');
  });

  test('should persist and calculate risk when HbA1c is changed', async ({ page }) => {
    // Set HbA1c to 6.0% (prediabetic range)
    await setInputValue(page, 'HbA1c', '6.0');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const labTests = await getIndexedDBValue(page, 'labTests');
    expect(labTests.hba1c.value).toBe(6.0);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the input shows the new value (displays as "6.0")
    const currentValue = await getInputValue(page, 'HbA1c');
    expect(currentValue).toBe('6.0');
  });

  test('should handle multiple lab test changes in sequence', async ({ page }) => {
    // Change LDL
    await setInputValue(page, 'LDL Cholesterol', '160');
    await page.waitForTimeout(1000);

    // Change HDL - use data-testid to avoid ambiguity with Non-HDL
    const hdlInput = page.locator('[data-testid="profile-labTests-lipidPanel-hdlCholesterol"]');
    await hdlInput.fill('35');
    await page.waitForTimeout(1000);

    // Change Total Cholesterol
    await setInputValue(page, 'Total Cholesterol', '240');
    await page.waitForTimeout(1000);

    // Change Triglycerides
    await setInputValue(page, 'Triglycerides', '180');
    await page.waitForTimeout(1000);

    // Change Fasting Glucose
    await setInputValue(page, 'Fasting Glucose', '115');
    await page.waitForTimeout(1000);

    // Change HbA1c
    await setInputValue(page, 'HbA1c', '6.2');
    await page.waitForTimeout(1000);

    // Verify all values are persisted
    const labTests = await getIndexedDBValue(page, 'labTests');
    expect(labTests.lipidPanel.ldlCholesterol.value).toBe(160);
    expect(labTests.lipidPanel.hdlCholesterol.value).toBe(35);
    expect(labTests.lipidPanel.totalCholesterol.value).toBe(240);
    expect(labTests.lipidPanel.triglycerides.value).toBe(180);
    expect(labTests.fastingGlucose.value).toBe(115);
    expect(labTests.hba1c.value).toBe(6.2);

    // Wait for final risk calculation
    await waitForRiskCalculation(page);
  });

  test('should handle LDL at minimum boundary (20 mg/dL)', async ({ page }) => {
    await setInputValue(page, 'LDL Cholesterol', '20');
    await page.waitForTimeout(1000);

    const labTests = await getIndexedDBValue(page, 'labTests');
    expect(labTests.lipidPanel.ldlCholesterol.value).toBe(20);

    await waitForRiskCalculation(page);
  });

  test('should handle LDL at maximum boundary (400 mg/dL)', async ({ page }) => {
    await setInputValue(page, 'LDL Cholesterol', '400');
    await page.waitForTimeout(1000);

    const labTests = await getIndexedDBValue(page, 'labTests');
    expect(labTests.lipidPanel.ldlCholesterol.value).toBe(400);

    await waitForRiskCalculation(page);
  });

  test('should handle HbA1c with decimal value', async ({ page }) => {
    await setInputValue(page, 'HbA1c', '5.7');
    await page.waitForTimeout(1000);

    const labTests = await getIndexedDBValue(page, 'labTests');
    expect(labTests.hba1c.value).toBe(5.7);

    await waitForRiskCalculation(page);
  });

  test('should handle empty values (clearing fields)', async ({ page }) => {
    // First set a value
    await setInputValue(page, 'LDL Cholesterol', '150');
    await page.waitForTimeout(1000);

    // Verify it's set
    let labTests = await getIndexedDBValue(page, 'labTests');
    expect(labTests.lipidPanel.ldlCholesterol.value).toBe(150);

    // Now clear it
    await setInputValue(page, 'LDL Cholesterol', '');
    await page.waitForTimeout(1000);

    // Verify it's cleared in IndexedDB
    labTests = await getIndexedDBValue(page, 'labTests');
    // The lipidPanel.ldlCholesterol should be deleted when cleared
    expect(labTests.lipidPanel?.ldlCholesterol).toBeUndefined();

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Vitamin D is changed', async ({ page }) => {
    // Set Vitamin D to 25 ng/mL (low/deficient range)
    await setInputValue(page, 'Vitamin D', '25');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value (TimeSeries structure)
    const labTests = await getIndexedDBValue(page, 'labTests');
    expect(labTests.vitaminD.mostRecent.value).toBe(25);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the input shows the new value
    const currentValue = await getInputValue(page, 'Vitamin D');
    expect(currentValue).toBe('25');
  });

  test('should persist optimal Vitamin D level (40 ng/mL)', async ({ page }) => {
    // Set Vitamin D to optimal level
    await setInputValue(page, 'Vitamin D', '40');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const labTests = await getIndexedDBValue(page, 'labTests');
    expect(labTests.vitaminD.mostRecent.value).toBe(40);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);
  });
});
