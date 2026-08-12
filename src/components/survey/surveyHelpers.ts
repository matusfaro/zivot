// @ts-nocheck -- extracted from the legacy survey; type-safe rewrite pending
import { UserProfile, Screening } from '../../types/user';
import { TimeSeries } from '../../types/common/datapoint';
import { SwipeQuestion } from './surveyTypes';

// Helper functions to manage conditions as an array
export function hasConditionInProfile(profile: UserProfile, conditionId: string): boolean {
  const conditions = profile.medicalHistory?.conditions;
  if (!conditions) return false;

  // Support both old object format and new array format
  if (Array.isArray(conditions)) {
    return conditions.some((c: any) => c.conditionId === conditionId);
  } else {
    // Old object format: {diabetes: true/false}
    return (conditions as any)[conditionId] === true;
  }
}

export function setCondition(profile: UserProfile, conditionId: string, hasCondition: boolean): UserProfile {
  let conditions = profile.medicalHistory?.conditions || [];

  // Migrate old object format to array
  if (!Array.isArray(conditions)) {
    conditions = [];
  }

  if (hasCondition) {
    // Add condition if not already present
    const existing = conditions.find((c: any) => c.conditionId === conditionId);
    if (!existing) {
      conditions = [
        ...conditions,
        {
          conditionId,
          name: conditionId,
          status: 'active' as const,
          diagnosisDate: createUserDataPoint(Date.now())
        }
      ];
    }
  } else {
    // Remove condition
    conditions = conditions.filter((c: any) => c.conditionId !== conditionId);
  }

  return {
    ...profile,
    medicalHistory: {
      ...profile.medicalHistory,
      conditions
    }
  };
}

// Helper function to manage screenings as an array
export function updateScreeningArray(
  screenings: Screening[] | undefined,
  screeningType: string,
  outcome: 'negative' | 'positive' | 'inconclusive' | 'abnormal',
  completed: boolean
): Screening[] {
  const existing = Array.isArray(screenings) ? screenings : [];
  if (completed) {
    const alreadyExists = existing.some(s => s.screeningType === screeningType);
    if (alreadyExists) return existing;
    return [
      ...existing,
      {
        screeningType,
        date: Date.now(),
        result: { outcome }
      }
    ];
  } else {
    return existing.filter(s => s.screeningType !== screeningType);
  }
}

// Helper function to create TimeSeries from a single value
export function createTimeSeries<T>(value: T): TimeSeries<T> {
  const dataPoint = createUserDataPoint(value);
  return {
    dataPoints: [dataPoint],
    mostRecent: dataPoint
  };
}

// Helper functions to manage family history as an array
export function hasFamilyHistoryInProfile(profile: UserProfile, conditionId: string): boolean {
  const familyHistory = profile.medicalHistory?.familyHistory;
  if (!familyHistory || !Array.isArray(familyHistory)) return false;
  return familyHistory.some((c: any) => c.conditionId === conditionId);
}

export function setFamilyHistory(profile: UserProfile, conditionId: string, hasCondition: boolean): UserProfile {
  let familyHistory = profile.medicalHistory?.familyHistory || [];

  if (!Array.isArray(familyHistory)) {
    familyHistory = [];
  }

  if (hasCondition) {
    const existing = familyHistory.find((c: any) => c.conditionId === conditionId);
    if (!existing) {
      familyHistory = [
        ...familyHistory,
        {
          conditionId,
          relation: 'parent' as const,
          affected: true
        }
      ];
    }
  } else {
    familyHistory = familyHistory.filter((c: any) => c.conditionId !== conditionId);
  }

  return {
    ...profile,
    medicalHistory: {
      ...profile.medicalHistory,
      familyHistory
    }
  };
}

// Check if a question has already been answered in the profile
export function isQuestionAnswered(question: SwipeQuestion, profile: UserProfile): boolean {
  switch (question.id) {
    case 'smoking':
      return !!profile.lifestyle?.smoking?.status;
    case 'exercise':
      return profile.lifestyle?.exercise?.moderateMinutesPerWeek !== undefined;
    case 'alcohol':
      return profile.lifestyle?.alcohol?.drinksPerWeek !== undefined;
    case 'diet':
      return profile.lifestyle?.diet?.vegetableServingsPerDay !== undefined;
    case 'sleep':
      return profile.lifestyle?.sleep?.averageHoursPerNight !== undefined;
    case 'biologicalSex':
      return !!profile.demographics?.biologicalSex?.value;
    case 'diabetes':
      return hasConditionInProfile(profile, 'diabetes');
    case 'hypertension':
      return hasConditionInProfile(profile, 'hypertension');
    case 'familyHeartDisease':
      return hasFamilyHistoryInProfile(profile, 'cvd');
    case 'familyCancer':
      return hasFamilyHistoryInProfile(profile, 'cancer');
    case 'statin':
      return profile.medicalHistory?.medications?.statin !== undefined;
    case 'bloodPressureMeds':
      return profile.medicalHistory?.medications?.takesBloodPressureMeds !== undefined;
    // REMOVED: Aspirin - no mortality benefit
    // case 'aspirin':
    //   return profile.medicalHistory?.medications?.aspirin !== undefined;
    case 'highCholesterol':
      return profile.labTests?.lipidPanel?.totalCholesterol !== undefined;
    case 'prediabetic':
      return profile.labTests?.metabolicPanel?.fastingGlucose !== undefined || profile.labTests?.metabolicPanel?.hba1c !== undefined;
    case 'obesity':
      return profile.biometrics?.weight !== undefined && profile.biometrics?.height !== undefined;
    case 'stress':
      return false; // Field not in type system
    case 'socialConnection':
      return profile.social?.volunteering !== undefined || profile.social?.petOwnership !== undefined;
    case 'sunExposure':
      return profile.medicalHistory?.sunExposure !== undefined;
    case 'occupationalHazards':
      return profile.lifestyle?.occupationalExposures !== undefined;
    case 'depression':
      return hasConditionInProfile(profile, "depression");
    case 'cancer':
      return hasConditionInProfile(profile, "cancer");
    case 'heartDisease':
      return hasConditionInProfile(profile, "heartDisease");
    case 'stroke':
      return hasConditionInProfile(profile, "stroke");
    case 'kidneyDisease':
      return hasConditionInProfile(profile, "kidneyDisease");
    case 'liverDisease':
      return hasConditionInProfile(profile, "liverDisease");
    case 'copd':
      return hasConditionInProfile(profile, "copd");
    case 'asthma':
      return hasConditionInProfile(profile, "asthma");
    case 'fluVaccine':
      return profile.medicalHistory?.vaccinations?.fluVaccineCurrentYear !== undefined;
    case 'colonoscopy':
      return profile.medicalHistory?.screenings?.some((s: any) => s.screeningType === 'colonoscopy') || false;
    case 'mammogram':
      return profile.medicalHistory?.screenings?.some((s: any) => s.screeningType === 'mammogram') || false;
    case 'seatbelt':
      return profile.lifestyle?.drivingHabits?.seatBeltUse !== undefined;
    case 'texting':
      return profile.lifestyle?.drivingHabits?.phoneUseWhileDriving !== undefined;
    case 'speeding':
      return profile.lifestyle?.drivingHabits?.trafficViolationsPast3Years !== undefined;
    case 'helmet':
      return false; // Field not in type system
    case 'drugs':
      return false; // Field not in type system
    case 'opioids':
      return profile.medicalHistory?.substanceUse?.prescribedOpioids !== undefined;
    case 'marijuana':
      return false; // Field not in type system
    case 'airQuality':
      return false; // Field not in type system
    // REMOVED: Water Quality - too heterogeneous
    // case 'waterQuality':
    //   return profile.lifestyle?.waterQuality !== undefined;
    case 'pesticides':
      return false; // Field not in type system
    case 'radiation':
      return false; // Field not in type system
    case 'anxiety':
      return hasConditionInProfile(profile, "anxiety");
    case 'bipolar':
      return hasConditionInProfile(profile, "bipolar");
    case 'ptsd':
      return hasConditionInProfile(profile, "ptsd");
    case 'eatingDisorder':
      return hasConditionInProfile(profile, "eatingDisorder");
    case 'pregnancy':
      return profile.medicalHistory?.reproductiveHistory?.currentlyPregnant !== undefined;
    case 'breastfeeding':
      return (profile.medicalHistory?.reproductiveHistory as any)?.breastfeedingMonths !== undefined;
    case 'menopause':
      return (profile.medicalHistory?.reproductiveHistory as any)?.menopauseStatus !== undefined;
    case 'hrt':
      return false; // Field not in current Medications interface
    case 'contraception':
      return (profile.medicalHistory?.reproductiveHistory as any)?.oralContraceptiveUse !== undefined;
    case 'teeth':
      return false; // Field not in type system
    case 'floss':
      return false; // Field not in type system
    case 'dentist':
      return profile.medicalHistory?.screenings?.some((s: any) => s.screeningType === 'dental') || false;
    case 'vision':
      return profile.medicalHistory?.screenings?.some((s: any) => s.screeningType === 'vision') || false;
    case 'hearing':
      return profile.medicalHistory?.screenings?.some((s: any) => s.screeningType === 'hearing') || false;
    // REMOVED: Blood Donation - healthy donor bias
    // case 'bloodDonation':
    //   return profile.lifestyle?.bloodDonation !== undefined;
    case 'volunteering':
      return profile.social?.volunteering?.active?.value !== undefined;
    case 'dog_ownership':
      return profile.social?.petOwnership?.ownsDog?.value !== undefined;
    case 'social_connections':
      return (profile.social as any)?.socialEngagement !== undefined;
    case 'creative_hobbies':
      return profile.social?.hobbies?.creative?.engaged?.value !== undefined;
    case 'religious_attendance':
      return profile.social?.religiousAttendance?.value !== undefined;
    case 'music':
      return (profile.lifestyle as any)?.musicListening !== undefined;
    case 'reading':
      return (profile.lifestyle as any)?.reading !== undefined;
    case 'gaming':
      return (profile.lifestyle as any)?.gaming !== undefined;
    case 'screenTime':
      return (profile.lifestyle as any)?.screenTime !== undefined;
    case 'nature_exposure':
      return profile.lifestyle?.outdoorTime?.minutesPerWeek !== undefined;
    case 'pollution':
      return (profile.lifestyle as any)?.pollutionExposure !== undefined;
    case 'noise':
      return (profile.lifestyle as any)?.noiseExposure !== undefined;
    case 'mold':
      return (profile.lifestyle as any)?.moldExposure !== undefined;
    case 'leadPaint':
      return (profile.lifestyle as any)?.leadExposure !== undefined;
    case 'asbestos':
      return profile.customFields?.asbestosExposure !== undefined;
    // PHASE 3 ADDITIONS
    case 'cacScore':
      return profile.medicalHistory?.cacScore !== undefined;
    case 'suicideAttempts':
      return profile.medicalHistory?.suicideAttempts !== undefined;
    case 'sleepApnea':
      return profile.medicalHistory?.sleepApnea?.diagnosis !== undefined;
    case 'hearingLoss':
      return profile.medicalHistory?.hearingLoss?.treated !== undefined;
    case 'sunburns':
      return profile.medicalHistory?.sunExposure?.sunburns !== undefined;
    default:
      return false;
  }
}
