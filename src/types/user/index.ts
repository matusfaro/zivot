import { Demographics } from './demographics';
import { Biometrics } from './biometrics';
import { LabTests } from './labTests';
import { Lifestyle } from './lifestyle';
import { MedicalHistory } from './medicalHistory';
import { Interventions } from './interventions';
import { Social } from './social';

/**
 * Complete user profile - the semantic, sparse data store
 * ALL fields are optional - handles extremely sparse input
 */
export interface UserProfile {
  profileId: string;
  version: string; // Schema version
  lastUpdated: number; // timestamp

  demographics?: Demographics;
  biometrics?: Biometrics;
  labTests?: LabTests;
  lifestyle?: Lifestyle;
  medicalHistory?: MedicalHistory;
  interventions?: Interventions;
  social?: Social;

  // Phase 2+: Additional domains
  mentalHealth?: any; // TODO: Define in Phase 2
  socialFactors?: any; // DEPRECATED: Use 'social' instead
  deviceData?: any; // Phase 3

  // Extensibility: Store any additional data
  customFields?: Record<string, any>;
}

export * from './demographics';
export * from './biometrics';
export * from './labTests';
export * from './lifestyle';
export * from './medicalHistory';
export * from './interventions';
export * from './social';
