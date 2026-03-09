import { test, expect } from './fixtures/base';
import {
  setSelectValue,
  toggleCheckbox,
  waitForProfilePersistence,
  waitForRiskCalculation,
  getIndexedDBValue,
  getSelectValue,
  isCheckboxChecked,
} from './helpers/test-helpers';

test.describe('Social & Wellbeing Section Fields', () => {

  test('should persist and calculate risk when Dog Owner is checked', async ({ page }) => {
    // Check the dog owner checkbox
    await toggleCheckbox(page, 'Dog Owner', true);

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const social = await getIndexedDBValue(page, 'social');
    expect(social.petOwnership.ownsDog.value).toBe(true);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the checkbox is checked
    const isChecked = await isCheckboxChecked(page, 'Dog Owner');
    expect(isChecked).toBe(true);
  });

  test('should persist and calculate risk when Dog Owner is unchecked', async ({ page }) => {
    // First check it
    await toggleCheckbox(page, 'Dog Owner', true);
    await page.waitForTimeout(1000);

    // Then uncheck it
    await toggleCheckbox(page, 'Dog Owner', false);
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const social = await getIndexedDBValue(page, 'social');
    expect(social.petOwnership.ownsDog.value).toBe(false);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the checkbox is unchecked
    const isChecked = await isCheckboxChecked(page, 'Dog Owner');
    expect(isChecked).toBe(false);
  });

  test('should persist and calculate risk when Social Connection Strength is changed to strong', async ({ page }) => {
    // Select strong social connections
    await setSelectValue(page, 'Social Connection Strength', 'strong');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const social = await getIndexedDBValue(page, 'social');
    expect(social.connections.strength.value).toBe('strong');

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the select shows the new value
    const currentValue = await getSelectValue(page, 'Social Connection Strength');
    expect(currentValue).toBe('strong');
  });

  test('should persist and calculate risk when Social Connection Strength is changed to very_strong', async ({ page }) => {
    // Select very strong social connections
    await setSelectValue(page, 'Social Connection Strength', 'very_strong');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const social = await getIndexedDBValue(page, 'social');
    expect(social.connections.strength.value).toBe('very_strong');

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the select shows the new value
    const currentValue = await getSelectValue(page, 'Social Connection Strength');
    expect(currentValue).toBe('very_strong');
  });

  test('should persist and calculate risk when Currently Volunteer is checked', async ({ page }) => {
    // Check the volunteering checkbox
    await toggleCheckbox(page, 'Currently Volunteer', true);

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const social = await getIndexedDBValue(page, 'social');
    expect(social.volunteering.active.value).toBe(true);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the checkbox is checked
    const isChecked = await isCheckboxChecked(page, 'Currently Volunteer');
    expect(isChecked).toBe(true);
  });

  test('should persist and calculate risk when Currently Volunteer is unchecked', async ({ page }) => {
    // First check it
    await toggleCheckbox(page, 'Currently Volunteer', true);
    await page.waitForTimeout(1000);

    // Then uncheck it
    await toggleCheckbox(page, 'Currently Volunteer', false);
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const social = await getIndexedDBValue(page, 'social');
    expect(social.volunteering.active.value).toBe(false);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the checkbox is unchecked
    const isChecked = await isCheckboxChecked(page, 'Currently Volunteer');
    expect(isChecked).toBe(false);
  });

  test('should persist and calculate risk when Religious Service Attendance is changed to weekly', async ({ page }) => {
    // Select weekly attendance
    await setSelectValue(page, 'Religious Service Attendance', 'weekly');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const social = await getIndexedDBValue(page, 'social');
    expect(social.religiousAttendance.value).toBe('weekly');

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the select shows the new value
    const currentValue = await getSelectValue(page, 'Religious Service Attendance');
    expect(currentValue).toBe('weekly');
  });

  test('should persist and calculate risk when Religious Service Attendance is changed to daily', async ({ page }) => {
    // Select daily attendance
    await setSelectValue(page, 'Religious Service Attendance', 'daily');

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const social = await getIndexedDBValue(page, 'social');
    expect(social.religiousAttendance.value).toBe('daily');

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the select shows the new value
    const currentValue = await getSelectValue(page, 'Religious Service Attendance');
    expect(currentValue).toBe('daily');
  });

  test('should persist and calculate risk when Engage in Creative Hobbies is checked', async ({ page }) => {
    // Check the creative hobbies checkbox
    await toggleCheckbox(page, 'Engage in Creative Hobbies', true);

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const social = await getIndexedDBValue(page, 'social');
    expect(social.hobbies.creative.engaged.value).toBe(true);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the checkbox is checked
    const isChecked = await isCheckboxChecked(page, 'Engage in Creative Hobbies');
    expect(isChecked).toBe(true);
  });

  test('should persist and calculate risk when Engage in Creative Hobbies is unchecked', async ({ page }) => {
    // First check it
    await toggleCheckbox(page, 'Engage in Creative Hobbies', true);
    await page.waitForTimeout(1000);

    // Then uncheck it
    await toggleCheckbox(page, 'Engage in Creative Hobbies', false);
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value
    const social = await getIndexedDBValue(page, 'social');
    expect(social.hobbies.creative.engaged.value).toBe(false);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify the checkbox is unchecked
    const isChecked = await isCheckboxChecked(page, 'Engage in Creative Hobbies');
    expect(isChecked).toBe(false);
  });

  test('should persist multiple social fields together', async ({ page }) => {
    // Set multiple fields
    await toggleCheckbox(page, 'Dog Owner', true);
    await page.waitForTimeout(500);

    await setSelectValue(page, 'Social Connection Strength', 'strong');
    await page.waitForTimeout(500);

    await toggleCheckbox(page, 'Currently Volunteer', true);
    await page.waitForTimeout(500);

    await setSelectValue(page, 'Religious Service Attendance', 'weekly');
    await page.waitForTimeout(500);

    await toggleCheckbox(page, 'Engage in Creative Hobbies', true);
    await page.waitForTimeout(1000);

    // Verify all fields are persisted correctly
    const social = await getIndexedDBValue(page, 'social');
    expect(social.petOwnership.ownsDog.value).toBe(true);
    expect(social.connections.strength.value).toBe('strong');
    expect(social.volunteering.active.value).toBe(true);
    expect(social.religiousAttendance.value).toBe('weekly');
    expect(social.hobbies.creative.engaged.value).toBe(true);

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify all UI fields show the correct values
    expect(await isCheckboxChecked(page, 'Dog Owner')).toBe(true);
    expect(await getSelectValue(page, 'Social Connection Strength')).toBe('strong');
    expect(await isCheckboxChecked(page, 'Currently Volunteer')).toBe(true);
    expect(await getSelectValue(page, 'Religious Service Attendance')).toBe('weekly');
    expect(await isCheckboxChecked(page, 'Engage in Creative Hobbies')).toBe(true);
  });
});
