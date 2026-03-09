import { DataPoint } from '../common/datapoint';

export interface MedicalHistory {
  conditions?: Condition[];
  familyHistory?: FamilyCondition[];
  screenings?: Screening[];
  reproductiveHistory?: ReproductiveHistory;
  urinaryHistory?: UrinaryHistory;
  respiratoryHistory?: RespiratoryHistory;
  geneticFactors?: GeneticFactors;
  fallHistory?: FallHistory;
  medications?: Medications;
  vaccinations?: Vaccinations;
  mentalHealth?: MentalHealth;
  substanceUse?: SubstanceUse;
  gastrointestinalHistory?: GastrointestinalHistory;
  hepatitisHistory?: HepatitisHistory;
  immuneStatus?: DataPoint<ImmuneStatus>;
  suicideAttempts?: DataPoint<boolean>;
  sunExposure?: SunExposure;
  cacScore?: DataPoint<CACScore>;
  sleepApnea?: SleepApnea;
  hearingLoss?: HearingLoss;
}

export interface Condition {
  conditionId: string; // ICD-10 or custom
  name: string;
  diagnosisDate?: DataPoint<number>; // timestamp
  status: 'active' | 'resolved' | 'managed';
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface FamilyCondition {
  conditionId: string;
  relation: FamilyRelation;
  ageAtDiagnosis?: number;
  deceased?: boolean;
  ageAtDeath?: number;
}

export type FamilyRelation =
  | 'parent'
  | 'sibling'
  | 'grandparent'
  | 'aunt_uncle'
  | 'child';

export interface Screening {
  screeningType: string;
  date: number; // timestamp
  result: ScreeningResult;
  details?: any; // Flexible storage
}

export interface ScreeningResult {
  outcome: 'negative' | 'positive' | 'inconclusive' | 'abnormal';
  followUpNeeded?: boolean;
  findings?: string;
}

export interface ReproductiveHistory {
  ageAtMenarche?: DataPoint<number>;
  ageAtFirstBirth?: DataPoint<string>; // "never", "under_20", "20_24", "25_29", "30_34", "35_plus"
  breastBiopsies?: DataPoint<number>;
  atypicalHyperplasia?: DataPoint<boolean>;
}

export interface UrinaryHistory {
  priorNegativeBiopsy?: DataPoint<boolean>;
}

export interface RespiratoryHistory {
  fev1Percent?: DataPoint<number>;
  dyspneaSeverity?: DataPoint<DyspneaSeverity>;
  exacerbationsPerYear?: DataPoint<number>;
}

export type DyspneaSeverity =
  | 'none'
  | 'mild'
  | 'moderate'
  | 'severe'
  | 'very_severe';

export interface GeneticFactors {
  apoeE4Status?: DataPoint<ApoeE4Status>;
}

export type ApoeE4Status =
  | 'unknown'
  | 'none'
  | 'one_copy'
  | 'two_copies';

export interface FallHistory {
  fallsPastYear?: DataPoint<number>;
  fallWithInjury?: DataPoint<boolean>;
  balanceProblems?: DataPoint<boolean>;
  dizzinessWhenStanding?: DataPoint<boolean>;
}

export interface Medications {
  totalMedicationCount?: DataPoint<number>;
  takesBloodPressureMeds?: DataPoint<boolean>;
  prescribedBenzodiazepines?: DataPoint<boolean>;
  statin?: DataPoint<boolean>;
}

export interface Vaccinations {
  fluVaccineCurrentYear?: DataPoint<boolean>;
  pneumococcalVaccine?: DataPoint<boolean>;
  lastFluVaccine?: DataPoint<number>; // timestamp
  lastPneumococcalVaccine?: DataPoint<number>; // timestamp
}

export interface MentalHealth {
  depressionDiagnosis?: DataPoint<boolean>;
  anxietyDiagnosis?: DataPoint<boolean>;
  currentlyInTreatment?: DataPoint<boolean>;
}

export interface SubstanceUse {
  prescribedOpioids?: DataPoint<boolean>;
  opioidDailyDose?: DataPoint<number>; // MME (morphine milligram equivalent)
  illicitDrugUse?: DataPoint<boolean>;
  substanceAbuseHistory?: DataPoint<boolean>;
  priorOverdose?: DataPoint<boolean>;
}

export interface GastrointestinalHistory {
  gerdDiagnosis?: DataPoint<boolean>;
  barretsEsophagus?: DataPoint<boolean>;
}

export interface HepatitisHistory {
  hepatitisB?: DataPoint<boolean>;
  hepatitisC?: DataPoint<boolean>;
}

export type ImmuneStatus = 'normal' | 'immunocompromised';

export interface SunExposure {
  sunburns?: DataPoint<number>; // Lifetime severe sunburns count
  sunscreenUse?: DataPoint<'never' | 'rarely' | 'sometimes' | 'often' | 'always'>;
}

export type CACScore = '0' | '1-100' | '101-400' | '>400';

export interface SleepApnea {
  diagnosis?: DataPoint<boolean>;
  onTreatment?: DataPoint<boolean>; // CPAP or other treatment
  severity?: DataPoint<'mild' | 'moderate' | 'severe'>;
}

export interface HearingLoss {
  treated?: DataPoint<HearingLossTreated>;
  severity?: DataPoint<'mild' | 'moderate' | 'severe'>;
}

export type HearingLossTreated =
  | 'none_or_treated'
  | 'untreated_mild'
  | 'untreated_moderate_severe';
