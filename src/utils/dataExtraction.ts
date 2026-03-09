import { UserProfile } from '../types/user';
import { DataPoint, getMostRecent, TimeSeries } from '../types/common/datapoint';

/**
 * Extract a value from user profile using a JSONPath-like string
 * Examples:
 *   "demographics.dateOfBirth.value"
 *   "labTests.lipidPanel.ldlCholesterol.value"
 *   "biometrics.bloodPressure.mostRecent.value.systolic"
 */
export function getValueAtPath(profile: UserProfile, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = profile;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return null;
    }

    // Handle array indices
    if (part.match(/^\d+$/)) {
      const index = parseInt(part, 10);
      if (Array.isArray(current)) {
        current = current[index];
      } else {
        return null;
      }
    } else {
      // Type guard: ensure current is an object before indexing
      if (typeof current !== 'object' || current === null) {
        return null;
      }
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current;
}

/**
 * Extract a DataPoint value (automatically unwraps .value)
 */
export function getDataPointValue<T>(profile: UserProfile, path: string): T | null {
  const dataPoint = getValueAtPath(profile, path);

  if (dataPoint === null || dataPoint === undefined) {
    return null;
  }

  // If it's already a primitive, return it
  if (typeof dataPoint !== 'object') {
    return dataPoint as T;
  }

  // If it's a DataPoint, unwrap the value
  if ('value' in dataPoint && 'provenance' in dataPoint) {
    return (dataPoint as DataPoint<T>).value;
  }

  return dataPoint as T;
}

/**
 * Extract the most recent value from a TimeSeries
 */
export function getTimeSeriesValue<T>(profile: UserProfile, path: string): T | null {
  const timeSeries = getValueAtPath(profile, path) as TimeSeries<T> | null;

  if (!timeSeries) {
    return null;
  }

  const mostRecent = getMostRecent(timeSeries);
  return mostRecent?.value ?? null;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(profile: UserProfile): number | null {
  const dobDataPoint = profile.demographics?.dateOfBirth;
  if (!dobDataPoint) {
    return null;
  }

  const dob = new Date(dobDataPoint.value);
  const now = new Date();

  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Calculate BMI from height and weight
 */
export function calculateBMI(profile: UserProfile): number | null {
  const heightCm = profile.biometrics?.height?.value;
  if (!heightCm) {
    return null;
  }

  const weightData = profile.biometrics?.weight;
  if (!weightData) {
    return null;
  }

  const mostRecentWeight = getMostRecent(weightData);
  if (!mostRecentWeight) {
    return null;
  }

  let weightKg = mostRecentWeight.value.value;

  // Convert lbs to kg if needed
  if (mostRecentWeight.value.unit === 'lbs') {
    weightKg = weightKg * 0.453592;
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  return Math.round(bmi * 10) / 10; // Round to 1 decimal
}

/**
 * Check if user has a specific condition
 */
export function hasCondition(profile: UserProfile, conditionId: string): boolean {
  const conditions = profile.medicalHistory?.conditions;
  if (!conditions) {
    return false;
  }

  // Defensive check: ensure conditions is an array
  if (!Array.isArray(conditions)) {
    console.warn('[hasCondition] conditions is not an array:', typeof conditions, conditions);
    return false;
  }

  return conditions.some(c =>
    c.conditionId === conditionId && c.status === 'active'
  );
}

/**
 * Check if user has family history of a condition
 */
export function hasFamilyHistory(
  profile: UserProfile,
  conditionId: string,
  relations?: string[]
): boolean {
  const familyHistory = profile.medicalHistory?.familyHistory;
  if (!familyHistory) {
    return false;
  }

  // Defensive check: ensure familyHistory is an array
  if (!Array.isArray(familyHistory)) {
    console.warn('[hasFamilyHistory] familyHistory is not an array:', typeof familyHistory, familyHistory);
    return false;
  }

  return familyHistory.some(fh => {
    const matchesCondition = fh.conditionId === conditionId;
    const matchesRelation = !relations || relations.includes(fh.relation);
    return matchesCondition && matchesRelation;
  });
}

/**
 * Get family history category for a condition
 * Returns: 'none', 'one_first_degree', 'multiple_first_degree', 'early_onset_family'
 */
export function getFamilyHistoryCategory(
  profile: UserProfile,
  conditionId: string
): string {
  const familyHistory = profile.medicalHistory?.familyHistory;
  if (!familyHistory) {
    return 'none';
  }

  // Defensive check: ensure familyHistory is an array
  if (!Array.isArray(familyHistory)) {
    console.warn('[getFamilyHistoryCategory] familyHistory is not an array:', typeof familyHistory, familyHistory);
    return 'none';
  }

  const firstDegreeRelations = ['parent', 'sibling', 'child'];
  const matches = familyHistory.filter(fh => fh.conditionId === conditionId);

  if (matches.length === 0) {
    return 'none';
  }

  const firstDegreeMatches = matches.filter(fh =>
    firstDegreeRelations.includes(fh.relation)
  );

  if (firstDegreeMatches.length === 0) {
    return 'none';
  }

  // Check for early onset (diagnosed before age 50)
  const earlyOnset = firstDegreeMatches.some(fh =>
    fh.ageAtDiagnosis && fh.ageAtDiagnosis < 50
  );

  if (earlyOnset) {
    return 'early_onset_family';
  }

  if (firstDegreeMatches.length >= 2) {
    return 'multiple_first_degree';
  }

  return 'one_first_degree';
}

/**
 * Calculate years since quitting smoking
 */
export function getYearsSinceQuit(profile: UserProfile): number | null {
  const quitDate = profile.lifestyle?.smoking?.quitDate?.value;
  if (!quitDate) {
    return null;
  }

  const quit = new Date(quitDate);
  const now = new Date();
  const diffYears = (now.getTime() - quit.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  return Math.max(0, diffYears);
}

/**
 * Check if user has prediabetes (fasting glucose 100-125 mg/dL)
 */
export function hasPrediabetes(profile: UserProfile): boolean {
  const glucose = profile.labTests?.metabolicPanel?.glucose?.value;
  if (!glucose) {
    return false;
  }

  return glucose >= 100 && glucose < 126;
}

/**
 * Check if user has hypertension (BP >= 130/80)
 */
export function hasHypertension(profile: UserProfile): boolean {
  const bp = profile.biometrics?.bloodPressure;
  if (!bp) {
    return false;
  }

  const mostRecent = getMostRecent(bp);
  if (!mostRecent) {
    return false;
  }

  return mostRecent.value.systolic >= 130 || mostRecent.value.diastolic >= 80;
}

/**
 * Get diabetes family history category
 */
export function getDiabetesFamilyHistoryCategory(profile: UserProfile): string {
  const familyHistory = profile.medicalHistory?.familyHistory;
  if (!familyHistory) {
    return 'none';
  }

  // Defensive check: ensure familyHistory is an array
  if (!Array.isArray(familyHistory)) {
    console.warn('[getDiabetesFamilyHistoryCategory] familyHistory is not an array:', typeof familyHistory, familyHistory);
    return 'none';
  }

  const diabetesMatches = familyHistory.filter(fh =>
    fh.conditionId.includes('diabetes') || fh.conditionId === 'type2_diabetes'
  );

  if (diabetesMatches.length === 0) {
    return 'none';
  }

  const parents = diabetesMatches.filter(fh => fh.relation === 'parent');
  if (parents.length >= 2) {
    return 'both_parents';
  }
  if (parents.length === 1) {
    return 'one_parent';
  }

  const siblings = diabetesMatches.filter(fh => fh.relation === 'sibling');
  if (siblings.length > 0) {
    return 'sibling';
  }

  return 'none';
}
