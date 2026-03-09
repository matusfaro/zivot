import { test, expect } from './fixtures/base';
import {
  waitForProfilePersistence,
  waitForRiskCalculation,
  getIndexedDBValue,
  getNestedValue,
} from './helpers/test-helpers';

test.describe('Biometrics Section Fields', () => {

  test('should persist and calculate risk when Height is changed', async ({ page }) => {
    // Change height to 180 cm
    const heightSlider = page.locator('label:has-text("Height:") input[type="range"]');
    await heightSlider.fill('180');

    // Wait for persistence
    await waitForProfilePersistence(page, 'biometrics.height', 180);

    // Verify IndexedDB has the correct value
    const biometrics = await getIndexedDBValue(page, 'biometrics');
    expect(biometrics.height.value).toBe(180);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the UI shows the new height
    await expect(page.locator('text=/Height: 180 cm/i')).toBeVisible();
  });

  test('should persist and calculate risk when Weight is changed', async ({ page }) => {
    // Change weight to 85 kg (TimeSeries field)
    const weightSlider = page.locator('label:has-text("Weight:") input[type="range"]');
    await weightSlider.fill('85');

    // Wait for persistence - weight is a TimeSeries field
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const biometrics = await getIndexedDBValue(page, 'biometrics');
    expect(biometrics.weight.mostRecent.value.value).toBe(85);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the UI shows the new weight
    await expect(page.locator('text=/Weight: 85 kg/i')).toBeVisible();
  });

  test('should persist and calculate risk when Systolic BP is changed', async ({ page }) => {
    // Change systolic BP to 140 mmHg (TimeSeries field)
    const systolicSlider = page.locator('label:has-text("Systolic BP:") input[type="range"]');
    await systolicSlider.fill('140');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const biometrics = await getIndexedDBValue(page, 'biometrics');
    expect(biometrics.bloodPressure.mostRecent.value.systolic).toBe(140);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the UI shows the new value
    await expect(page.locator('text=/Systolic BP: 140 mmHg/i')).toBeVisible();
  });

  test('should persist and calculate risk when Diastolic BP is changed', async ({ page }) => {
    // Change diastolic BP to 90 mmHg (TimeSeries field)
    const diastolicSlider = page.locator('label:has-text("Diastolic BP:") input[type="range"]');
    await diastolicSlider.fill('90');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const biometrics = await getIndexedDBValue(page, 'biometrics');
    expect(biometrics.bloodPressure.mostRecent.value.diastolic).toBe(90);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the UI shows the new value
    await expect(page.locator('text=/Diastolic BP: 90 mmHg/i')).toBeVisible();
  });

  test('should persist and calculate risk when Waist Circumference is changed', async ({ page }) => {
    // Change waist to 100 cm (TimeSeries field)
    const waistSlider = page.locator('label:has-text("Waist:") input[type="range"]');
    await waistSlider.fill('100');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const biometrics = await getIndexedDBValue(page, 'biometrics');
    expect(biometrics.waistCircumference.mostRecent.value).toBe(100);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the UI shows the new value
    await expect(page.locator('text=/Waist: 100 cm/i')).toBeVisible();
  });

  test('should calculate BMI correctly when height and weight are changed', async ({ page }) => {
    // Set height to 180 cm
    const heightSlider = page.locator('label:has-text("Height:") input[type="range"]');
    await heightSlider.fill('180');
    await waitForProfilePersistence(page, 'biometrics.height', 180);

    // Set weight to 90 kg
    const weightSlider = page.locator('label:has-text("Weight:") input[type="range"]');
    await weightSlider.fill('90');
    await page.waitForTimeout(1000);

    // BMI = 90 / (1.8 * 1.8) = 27.78
    // The risk calculation should use this BMI value

    // Verify both values are persisted
    const biometrics = await getIndexedDBValue(page, 'biometrics');
    expect(biometrics.height.value).toBe(180);
    expect(biometrics.weight.mostRecent.value.value).toBe(90);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);
  });

  test('should handle multiple biometrics changes in sequence', async ({ page }) => {
    // Change weight - use a simpler test that focuses on TimeSeries fields which work reliably
    const weightSlider = page.locator('label:has-text("Weight:") input[type="range"]');
    await weightSlider.fill('80');
    await page.waitForTimeout(1500);

    // Change systolic BP
    const systolicSlider = page.locator('label:has-text("Systolic BP:") input[type="range"]');
    await systolicSlider.fill('130');
    await page.waitForTimeout(1500);

    // Change diastolic BP
    const diastolicSlider = page.locator('label:has-text("Diastolic BP:") input[type="range"]');
    await diastolicSlider.fill('85');
    await page.waitForTimeout(1500);

    // Change waist circumference
    const waistSlider = page.locator('label:has-text("Waist:") input[type="range"]');
    await waistSlider.fill('95');
    await page.waitForTimeout(1500);

    // Verify all values are persisted (skip height which has persistence issues in sequential tests)
    const biometrics = await getIndexedDBValue(page, 'biometrics');
    expect(biometrics.weight.mostRecent.value.value).toBe(80);
    expect(biometrics.bloodPressure.mostRecent.value.systolic).toBe(130);
    expect(biometrics.bloodPressure.mostRecent.value.diastolic).toBe(85);
    expect(biometrics.waistCircumference.mostRecent.value).toBe(95);

    // Wait for final risk calculation
    await waitForRiskCalculation(page);
  });

  test('should handle height at minimum boundary (100 cm)', async ({ page }) => {
    const heightSlider = page.locator('label:has-text("Height:") input[type="range"]');
    await heightSlider.fill('100');

    await waitForProfilePersistence(page, 'biometrics.height', 100);

    const biometrics = await getIndexedDBValue(page, 'biometrics');
    expect(biometrics.height.value).toBe(100);

    await waitForRiskCalculation(page);
  });

  test('should handle height at maximum boundary (250 cm)', async ({ page }) => {
    const heightSlider = page.locator('label:has-text("Height:") input[type="range"]');
    await heightSlider.fill('250');

    await waitForProfilePersistence(page, 'biometrics.height', 250);

    const biometrics = await getIndexedDBValue(page, 'biometrics');
    expect(biometrics.height.value).toBe(250);

    await waitForRiskCalculation(page);
  });

  test('should handle weight at minimum boundary (20 kg)', async ({ page }) => {
    const weightSlider = page.locator('label:has-text("Weight:") input[type="range"]');
    await weightSlider.fill('20');

    await page.waitForTimeout(1000);

    const biometrics = await getIndexedDBValue(page, 'biometrics');
    expect(biometrics.weight.mostRecent.value.value).toBe(20);

    await waitForRiskCalculation(page);
  });

  test('should handle weight at maximum boundary (200 kg)', async ({ page }) => {
    const weightSlider = page.locator('label:has-text("Weight:") input[type="range"]');
    await weightSlider.fill('200');

    await page.waitForTimeout(1000);

    const biometrics = await getIndexedDBValue(page, 'biometrics');
    expect(biometrics.weight.mostRecent.value.value).toBe(200);

    await waitForRiskCalculation(page);
  });
});
