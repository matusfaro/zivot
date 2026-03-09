import { test, expect } from './fixtures/base';
import {
  setInputValue,
  setSelectValue,
  toggleCheckbox,
  waitForProfilePersistence,
  waitForRiskCalculation,
  getIndexedDBValue,
  isCheckboxChecked,
} from './helpers/test-helpers';

test.describe('Medical History Section - Conditions', () => {

  test('should persist and calculate risk when Diabetes condition is toggled', async ({ page }) => {
    // Toggle diabetes checkbox - use data-testid to avoid ambiguity with family history
    const checkbox = page.locator('[data-testid="profile-medicalHistory-conditions-type2_diabetes"]');
    await checkbox.click();

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Verify IndexedDB has the correct value (conditions stored as array)
    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    const diabetesCondition = medicalHistory?.conditions?.find((c: any) => c.conditionId === 'type2_diabetes');
    expect(diabetesCondition).toBeDefined();

    // Wait for risk calculation to complete
    await waitForRiskCalculation(page);

    // Verify checkbox is checked
    expect(await checkbox.isChecked()).toBe(true);
  });

  test('should persist and calculate risk when Heart Disease condition is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Heart Disease', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    const cvdCondition = medicalHistory?.conditions?.find((c: any) => c.conditionId === 'cvd');
    expect(cvdCondition).toBeDefined();

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when IBD condition is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'IBD', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    const ibdCondition = medicalHistory?.conditions?.find((c: any) => c.conditionId === 'ibd');
    expect(ibdCondition).toBeDefined();

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when COPD condition is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'COPD', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    const copdCondition = medicalHistory?.conditions?.find((c: any) => c.conditionId === 'copd');
    expect(copdCondition).toBeDefined();

    await waitForRiskCalculation(page);
  });

  test('should handle multiple conditions toggled', async ({ page }) => {
    // Toggle multiple conditions - use data-testid to avoid ambiguity with family history
    await page.locator('[data-testid="profile-medicalHistory-conditions-type2_diabetes"]').click();
    await page.waitForTimeout(1000);

    await toggleCheckbox(page, 'Heart Disease', true);
    await page.waitForTimeout(1000);

    await toggleCheckbox(page, 'COPD', true);
    await page.waitForTimeout(1000);

    // Verify all are persisted
    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    const diabetesCondition = medicalHistory?.conditions?.find((c: any) => c.conditionId === 'type2_diabetes');
    const cvdCondition = medicalHistory?.conditions?.find((c: any) => c.conditionId === 'cvd');
    const copdCondition = medicalHistory?.conditions?.find((c: any) => c.conditionId === 'copd');
    expect(diabetesCondition).toBeDefined();
    expect(cvdCondition).toBeDefined();
    expect(copdCondition).toBeDefined();

    await waitForRiskCalculation(page);
  });

  test('should handle toggling condition off', async ({ page }) => {
    // First toggle on - use data-testid to avoid ambiguity with family history
    const checkbox = page.locator('[data-testid="profile-medicalHistory-conditions-type2_diabetes"]');
    await checkbox.click();
    await page.waitForTimeout(1000);

    let medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    let diabetesCondition = medicalHistory?.conditions?.find((c: any) => c.conditionId === 'type2_diabetes');
    expect(diabetesCondition).toBeDefined();

    // Now toggle off
    await checkbox.click();
    await page.waitForTimeout(1000);

    medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    diabetesCondition = medicalHistory?.conditions?.find((c: any) => c.conditionId === 'type2_diabetes');
    expect(diabetesCondition).toBeUndefined();

    await waitForRiskCalculation(page);
  });
});

test.describe('Medical History Section - Family History', () => {

  test('should persist and calculate risk when CVD in Family is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'CVD in Family', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    const cvdFamily = medicalHistory?.familyHistory?.find((c: any) => c.conditionId === 'cvd');
    expect(cvdFamily).toBeDefined();

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Colorectal Cancer in Family is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Colorectal Cancer in Family', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    const colorectalFamily = medicalHistory?.familyHistory?.find((c: any) => c.conditionId === 'colorectal_cancer');
    expect(colorectalFamily).toBeDefined();

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Diabetes in Family is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Diabetes in Family', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    const diabetesFamily = medicalHistory?.familyHistory?.find((c: any) => c.conditionId === 'type2_diabetes');
    expect(diabetesFamily).toBeDefined();

    await waitForRiskCalculation(page);
  });

  test('should handle multiple family history items toggled', async ({ page }) => {
    await toggleCheckbox(page, 'CVD in Family', true);
    await page.waitForTimeout(1000);

    await toggleCheckbox(page, 'Colorectal Cancer in Family', true);
    await page.waitForTimeout(1000);

    await toggleCheckbox(page, 'Diabetes in Family', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    const cvdFamily = medicalHistory?.familyHistory?.find((c: any) => c.conditionId === 'cvd');
    const colorectalFamily = medicalHistory?.familyHistory?.find((c: any) => c.conditionId === 'colorectal_cancer');
    const diabetesFamily = medicalHistory?.familyHistory?.find((c: any) => c.conditionId === 'type2_diabetes');
    expect(cvdFamily).toBeDefined();
    expect(colorectalFamily).toBeDefined();
    expect(diabetesFamily).toBeDefined();

    await waitForRiskCalculation(page);
  });
});

test.describe('Medical History Section - Vaccinations', () => {

  test('should persist and calculate risk when Flu Vaccine is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Flu vaccine this year', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.vaccinations.fluVaccineCurrentYear.value).toBe(true);

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Pneumococcal Vaccine is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Pneumococcal vaccine', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.vaccinations.pneumococcalVaccine.value).toBe(true);

    await waitForRiskCalculation(page);
  });
});

test.describe('Medical History Section - Medications', () => {

  test('should persist and calculate risk when Total Number of Medications is changed', async ({ page }) => {
    await setInputValue(page, 'Total Number of Medications', '5');
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.medications.totalMedicationCount.value).toBe(5);

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Blood Pressure Medications is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Takes Blood Pressure Medications', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.medications.takesBloodPressureMeds.value).toBe(true);

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Prescribed Benzodiazepines is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Prescribed Benzodiazepines', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.medications.prescribedBenzodiazepines.value).toBe(true);

    await waitForRiskCalculation(page);
  });
});

test.describe('Medical History Section - Mental Health', () => {

  test('should persist and calculate risk when Depression Diagnosis is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Depression Diagnosis', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.mentalHealth.depressionDiagnosis.value).toBe(true);

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Anxiety Diagnosis is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Anxiety Diagnosis', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.mentalHealth.anxietyDiagnosis.value).toBe(true);

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Currently in Treatment is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Currently in Treatment', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.mentalHealth.currentlyInTreatment.value).toBe(true);

    await waitForRiskCalculation(page);
  });
});

test.describe('Medical History Section - Substance Use', () => {

  test('should persist and calculate risk when Prescribed Opioids is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Prescribed Opioids', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.substanceUse.prescribedOpioids.value).toBe(true);

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Opioid Daily Dose is changed', async ({ page }) => {
    await setInputValue(page, 'Daily Dose (MME)', '50');
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.substanceUse.opioidDailyDose.value).toBe(50);

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Substance Abuse History is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Substance Abuse History', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.substanceUse.substanceAbuseHistory.value).toBe(true);

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Prior Overdose is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Prior Overdose', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.substanceUse.priorOverdose.value).toBe(true);

    await waitForRiskCalculation(page);
  });
});

test.describe('Medical History Section - GI History', () => {

  test('should persist and calculate risk when GERD Diagnosis is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'GERD Diagnosis', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.gastrointestinalHistory.gerdDiagnosis.value).toBe(true);

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Barrett\'s Esophagus is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Barrett\'s Esophagus', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.gastrointestinalHistory.barretsEsophagus.value).toBe(true);

    await waitForRiskCalculation(page);
  });
});

test.describe('Medical History Section - Hepatitis & Immune Status', () => {

  test('should persist and calculate risk when Hepatitis B is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Hepatitis B', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.hepatitisHistory.hepatitisB.value).toBe(true);

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Hepatitis C is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Hepatitis C', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.hepatitisHistory.hepatitisC.value).toBe(true);

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Immune Status is changed', async ({ page }) => {
    await setSelectValue(page, 'Immune Status', 'immunocompromised');
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.immuneStatus.value).toBe('immunocompromised');

    await waitForRiskCalculation(page);
  });
});

test.describe('Medical History Section - Complete Profile', () => {

  test('should handle complex medical history with multiple fields', async ({ page }) => {
    // Toggle some conditions - use data-testid to avoid ambiguity
    await page.locator('[data-testid="profile-medicalHistory-conditions-type2_diabetes"]').click();
    await page.waitForTimeout(1000);
    await toggleCheckbox(page, 'Heart Disease', true);
    await page.waitForTimeout(1000);

    // Add family history
    await toggleCheckbox(page, 'CVD in Family', true);
    await page.waitForTimeout(1000);
    await page.locator('[data-testid="profile-medicalHistory-familyHistory-type2_diabetes"]').click();
    await page.waitForTimeout(1000);

    // Add vaccinations
    await toggleCheckbox(page, 'Flu vaccine this year', true);
    await page.waitForTimeout(1000);

    // Add medications
    await setInputValue(page, 'Total Number of Medications', '3');
    await page.waitForTimeout(1000);
    await toggleCheckbox(page, 'Takes Blood Pressure Medications', true);
    await page.waitForTimeout(1000);

    // Add mental health
    await toggleCheckbox(page, 'Depression Diagnosis', true);
    await page.waitForTimeout(1000);

    // Set immune status
    await setSelectValue(page, 'Immune Status', 'normal');
    await page.waitForTimeout(1000);

    // Verify all values are persisted
    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    const diabetesCondition = medicalHistory?.conditions?.find((c: any) => c.conditionId === 'type2_diabetes');
    const cvdCondition = medicalHistory?.conditions?.find((c: any) => c.conditionId === 'cvd');
    const cvdFamily = medicalHistory?.familyHistory?.find((c: any) => c.conditionId === 'cvd');
    const diabetesFamily = medicalHistory?.familyHistory?.find((c: any) => c.conditionId === 'type2_diabetes');
    expect(diabetesCondition).toBeDefined();
    expect(cvdCondition).toBeDefined();
    expect(cvdFamily).toBeDefined();
    expect(diabetesFamily).toBeDefined();
    expect(medicalHistory.vaccinations.fluVaccineCurrentYear.value).toBe(true);
    expect(medicalHistory.medications.totalMedicationCount.value).toBe(3);
    expect(medicalHistory.medications.takesBloodPressureMeds.value).toBe(true);
    expect(medicalHistory.mentalHealth.depressionDiagnosis.value).toBe(true);
    expect(medicalHistory.immuneStatus.value).toBe('normal');

    await waitForRiskCalculation(page);
  });
});

test.describe('Medical History Section - Phase 3 New Fields', () => {

  test('should persist and calculate risk when Statin medication is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Takes Statin (Cholesterol Medication)', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.medications.statin.value).toBe(true);

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when CAC Score is changed', async ({ page }) => {
    await setSelectValue(page, 'CAC Score (Coronary Artery Calcium)', '101-400');
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.cacScore.value).toBe('101-400');

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Prior Suicide Attempt is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Prior Suicide Attempt', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.suicideAttempts.value).toBe(true);

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Sleep Apnea Diagnosis is toggled', async ({ page }) => {
    await toggleCheckbox(page, 'Sleep Apnea Diagnosis', true);
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.sleepApnea.diagnosis.value).toBe(true);

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Hearing Loss Status is changed', async ({ page }) => {
    await setSelectValue(page, 'Hearing Loss Status', 'untreated_moderate_severe');
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.hearingLoss.treated.value).toBe('untreated_moderate_severe');

    await waitForRiskCalculation(page);
  });

  test('should persist and calculate risk when Lifetime Severe Sunburns is changed', async ({ page }) => {
    await setInputValue(page, 'Lifetime Severe Sunburns (count)', '8');
    await page.waitForTimeout(1000);

    const medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.sunExposure.sunburns.value).toBe(8);

    await waitForRiskCalculation(page);
  });

  test('should handle clearing/toggling off Phase 3 fields', async ({ page }) => {
    // First set values
    await toggleCheckbox(page, 'Takes Statin (Cholesterol Medication)', true);
    await page.waitForTimeout(1000);
    await setInputValue(page, 'Lifetime Severe Sunburns (count)', '5');
    await page.waitForTimeout(1000);

    let medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.medications.statin.value).toBe(true);
    expect(medicalHistory.sunExposure.sunburns.value).toBe(5);

    // Now toggle statin off
    await toggleCheckbox(page, 'Takes Statin (Cholesterol Medication)', false);
    await page.waitForTimeout(1000);

    // Clear sunburns
    await setInputValue(page, 'Lifetime Severe Sunburns (count)', '');
    await page.waitForTimeout(1000);

    medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.medications.statin.value).toBe(false);
    // sunExposure may be empty object {} when cleared, which is acceptable
    expect(medicalHistory.sunExposure === undefined || Object.keys(medicalHistory.sunExposure || {}).length === 0).toBe(true);

    await waitForRiskCalculation(page);
  });

  test('should handle boundary values for Sunburns', async ({ page }) => {
    // Test minimum value
    await setInputValue(page, 'Lifetime Severe Sunburns (count)', '0');
    await page.waitForTimeout(1000);

    let medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.sunExposure.sunburns.value).toBe(0);

    // Test maximum reasonable value
    await setInputValue(page, 'Lifetime Severe Sunburns (count)', '100');
    await page.waitForTimeout(1000);

    medicalHistory = await getIndexedDBValue(page, 'medicalHistory');
    expect(medicalHistory.sunExposure.sunburns.value).toBe(100);

    await waitForRiskCalculation(page);
  });
});
