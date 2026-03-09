import { DataPoint } from '../common/datapoint';

/**
 * Phase 2: Medications and interventions that modify risk
 */
export interface Interventions {
  medications?: Medication[];
  lifestylePrograms?: LifestyleProgram[];
  surgeries?: Surgery[];
}

export interface Medication {
  medicationId: string;
  name: string;
  class: MedicationClass;
  startDate: DataPoint<number>;
  endDate?: DataPoint<number>;
  dosage?: string;
  adherence?: DataPoint<number>; // 0-1 scale
}

export type MedicationClass =
  | 'statin'
  | 'ace_inhibitor'
  | 'arb'
  | 'beta_blocker'
  | 'calcium_channel_blocker'
  | 'diuretic'
  | 'antiplatelet'
  | 'metformin'
  | 'other';

export interface LifestyleProgram {
  programType: 'diabetes_prevention' | 'cardiac_rehab' | 'smoking_cessation' | 'other';
  startDate: number;
  endDate?: number;
  completed?: boolean;
}

export interface Surgery {
  surgeryType: string;
  date: number;
  indication?: string;
}
