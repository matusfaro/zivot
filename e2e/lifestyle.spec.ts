import { test, expect } from './fixtures/base';
import {
  setInputValue,
  setSelectValue,
  toggleCheckbox,
  waitForProfilePersistence,
  waitForRiskCalculation,
  getIndexedDBValue,
  getInputValue,
  getSelectValue,
  isCheckboxChecked,
} from './helpers/test-helpers';

test.describe('Lifestyle Section Fields', () => {

  test('should persist and calculate risk when Smoking Status is changed to current', async ({ page }) => {
    // Select current smoker
    await setSelectValue(page, 'Smoking Status', 'current');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.smoking.status.value).toBe('current');

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the select shows the new value
    const currentValue = await getSelectValue(page, 'Smoking Status');
    expect(currentValue).toBe('current');

    // Verify pack-years field appears
    await expect(page.locator('label:has-text("Pack-Years")')).toBeVisible();
  });

  test('should persist and calculate risk when Pack-Years is changed', async ({ page }) => {
    // First select current smoker
    await setSelectValue(page, 'Smoking Status', 'current');
    await page.waitForTimeout(1000);

    // Now set pack-years
    await setInputValue(page, 'Pack-Years', '20');
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.smoking.packYears.value).toBe(20);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Smoking Status is changed to former', async ({ page }) => {
    // Select former smoker
    await setSelectValue(page, 'Smoking Status', 'former');
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.smoking.status.value).toBe('former');

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify pack-years field appears
    await expect(page.locator('label:has-text("Pack-Years")')).toBeVisible();

    // Verify years since quit field appears
    await expect(page.locator('label:has-text("Years Since Quit")')).toBeVisible();
  });

  test('should persist and calculate risk when Years Since Quit is changed', async ({ page }) => {
    // First select former smoker
    await setSelectValue(page, 'Smoking Status', 'former');
    await page.waitForTimeout(1000);

    // Set pack-years
    await setInputValue(page, 'Pack-Years', '15');
    await page.waitForTimeout(1000);

    // Set years since quit
    await setInputValue(page, 'Years Since Quit', '5');
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct values
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.smoking.status.value).toBe('former');
    expect(lifestyle.smoking.packYears.value).toBe(15);
    expect(lifestyle.smoking.yearsSinceQuitting.value).toBe(5);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Exercise is changed', async ({ page }) => {
    // Change exercise to 200 min/week - use data-testid to avoid ambiguity with vigorous
    const exerciseSlider = page.locator('[data-testid="profile-lifestyle-exercise-moderateMinutesPerWeek"]');
    await exerciseSlider.fill('200');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.exercise.moderateMinutesPerWeek.mostRecent.value).toBe(200);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the UI shows the new value
    await expect(page.locator('text=/Exercise: 200 min\\/week/i')).toBeVisible();
  });

  test('should persist and calculate risk when Alcohol is changed', async ({ page }) => {
    // Change alcohol to 10 drinks/week
    const alcoholSlider = page.locator('label:has-text("Alcohol:") input[type="range"]');
    await alcoholSlider.fill('10');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.alcohol.drinksPerWeek.mostRecent.value).toBe(10);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the UI shows the new value
    await expect(page.locator('text=/Alcohol: 10 drinks\\/week/i')).toBeVisible();
  });

  test('should persist and calculate risk when Vegetables is changed', async ({ page }) => {
    // Change vegetables to 5 servings/day
    const vegetablesSlider = page.locator('label:has-text("Vegetables:") input[type="range"]');
    await vegetablesSlider.fill('5');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.diet.vegetableServingsPerDay.mostRecent.value).toBe(5);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the UI shows the new value
    await expect(page.locator('text=/Vegetables: 5 servings\\/day/i')).toBeVisible();
  });

  test('should persist and calculate risk when Fruits is changed', async ({ page }) => {
    // Change fruits to 4 servings/day
    const fruitsSlider = page.locator('label:has-text("Fruits:") input[type="range"]');
    await fruitsSlider.fill('4');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.diet.fruitServingsPerDay.mostRecent.value).toBe(4);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the UI shows the new value
    await expect(page.locator('text=/Fruits: 4 servings\\/day/i')).toBeVisible();
  });

  test('should persist and calculate risk when Processed Meat is changed', async ({ page }) => {
    // Change processed meat to 5 servings/week
    const processedMeatSlider = page.locator('label:has-text("Processed Meat:") input[type="range"]');
    await processedMeatSlider.fill('5');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.diet.processedMeatServingsPerWeek.mostRecent.value).toBe(5);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the UI shows the new value
    await expect(page.locator('text=/Processed Meat: 5 servings\\/week/i')).toBeVisible();
  });

  test('should persist and calculate risk when Occupational Exposures is toggled', async ({ page }) => {
    // Toggle occupational exposures checkbox
    await toggleCheckbox(page, 'Occupational Chemical Exposures', true);

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.occupationalExposures.value).toBe(true);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify checkbox is checked
    const checked = await isCheckboxChecked(page, 'Occupational Chemical Exposures');
    expect(checked).toBe(true);

    // Toggle it back off
    await toggleCheckbox(page, 'Occupational Chemical Exposures', false);
    await page.waitForTimeout(1000);

    const lifestyle2 = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle2.occupationalExposures.value).toBe(false);
  });

  test('should handle complete lifestyle profile with all fields', async ({ page }) => {
    // Set smoking status
    await setSelectValue(page, 'Smoking Status', 'former');
    await page.waitForTimeout(1000);

    // Set pack-years
    await setInputValue(page, 'Pack-Years', '10');
    await page.waitForTimeout(1000);

    // Set years since quit
    await setInputValue(page, 'Years Since Quit', '3');
    await page.waitForTimeout(1000);

    // Set exercise - use data-testid to avoid ambiguity
    const exerciseSlider = page.locator('[data-testid="profile-lifestyle-exercise-moderateMinutesPerWeek"]');
    await exerciseSlider.fill('180');
    await page.waitForTimeout(1000);

    // Set alcohol
    const alcoholSlider = page.locator('label:has-text("Alcohol:") input[type="range"]');
    await alcoholSlider.fill('7');
    await page.waitForTimeout(1000);

    // Set vegetables
    const vegetablesSlider = page.locator('label:has-text("Vegetables:") input[type="range"]');
    await vegetablesSlider.fill('5');
    await page.waitForTimeout(1000);

    // Set fruits
    const fruitsSlider = page.locator('label:has-text("Fruits:") input[type="range"]');
    await fruitsSlider.fill('3');
    await page.waitForTimeout(1000);

    // Set processed meat
    const processedMeatSlider = page.locator('label:has-text("Processed Meat:") input[type="range"]');
    await processedMeatSlider.fill('2');
    await page.waitForTimeout(1000);

    // Toggle occupational exposures
    await toggleCheckbox(page, 'Occupational Chemical Exposures', true);
    await page.waitForTimeout(1000);

    // Verify all values are persisted
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.smoking.status.value).toBe('former');
    expect(lifestyle.smoking.packYears.value).toBe(10);
    expect(lifestyle.smoking.yearsSinceQuitting.value).toBe(3);
    expect(lifestyle.exercise.moderateMinutesPerWeek.mostRecent.value).toBe(180);
    expect(lifestyle.alcohol.drinksPerWeek.mostRecent.value).toBe(7);
    expect(lifestyle.diet.vegetableServingsPerDay.mostRecent.value).toBe(5);
    expect(lifestyle.diet.fruitServingsPerDay.mostRecent.value).toBe(3);
    expect(lifestyle.diet.processedMeatServingsPerWeek.mostRecent.value).toBe(2);
    expect(lifestyle.occupationalExposures.value).toBe(true);

    // Wait for final risk calculation
    await waitForRiskCalculation(page);
  });
});

test.describe('Safety & Injury Risk Section (Driving Habits)', () => {

  test('should persist and calculate risk when Miles Per Year is changed', async ({ page }) => {
    await setInputValue(page, 'Miles Driven Per Year', '15000');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value (stored in lifestyle section)
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.drivingHabits.milesPerYear.value).toBe(15000);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Seat Belt Use is changed', async ({ page }) => {
    await setSelectValue(page, 'Seat Belt Use', 'usually');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.drivingHabits.seatBeltUse.value).toBe('usually');

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Traffic Violations is changed', async ({ page }) => {
    await setInputValue(page, 'Traffic Violations (Past 3 Years)', '2');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.drivingHabits.trafficViolationsPast3Years.value).toBe(2);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Phone Use While Driving is changed', async ({ page }) => {
    await setSelectValue(page, 'Phone Use While Driving', 'rare');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.drivingHabits.phoneUseWhileDriving.value).toBe('rare');

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Driving Environment is changed', async ({ page }) => {
    await setSelectValue(page, 'Driving Environment', 'suburban');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.drivingHabits.drivingSetting.value).toBe('suburban');

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);
  });

  test('should handle complete driving habits profile', async ({ page }) => {
    // Set miles per year
    await setInputValue(page, 'Miles Driven Per Year', '20000');
    await page.waitForTimeout(1000);

    // Set seat belt use
    await setSelectValue(page, 'Seat Belt Use', 'always');
    await page.waitForTimeout(1000);

    // Set traffic violations
    await setInputValue(page, 'Traffic Violations (Past 3 Years)', '0');
    await page.waitForTimeout(1000);

    // Set phone use
    await setSelectValue(page, 'Phone Use While Driving', 'never');
    await page.waitForTimeout(1000);

    // Set driving environment
    await setSelectValue(page, 'Driving Environment', 'mixed');
    await page.waitForTimeout(1000);

    // Verify all values are persisted
    const lifestyle = await getIndexedDBValue(page, 'lifestyle');
    expect(lifestyle.drivingHabits.milesPerYear.value).toBe(20000);
    expect(lifestyle.drivingHabits.seatBeltUse.value).toBe('always');
    expect(lifestyle.drivingHabits.trafficViolationsPast3Years.value).toBe(0);
    expect(lifestyle.drivingHabits.phoneUseWhileDriving.value).toBe('never');
    expect(lifestyle.drivingHabits.drivingSetting.value).toBe('mixed');

    // Wait for final risk calculation
    await waitForRiskCalculation(page);
  });
});
