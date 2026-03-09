/**
 * Phase 2: Interventions that reduce risk
 */
export interface InterventionDescriptor {
  interventionId: string;
  name: string;
  type: InterventionType;

  // Risk reduction
  relativeRiskReduction: number; // 0-1 (e.g., 0.25 = 25% reduction)
  confidence?: [number, number];

  // Applicability
  applicableTo?: {
    ageRange?: [number, number];
    sex?: 'male' | 'female';
    baselineRiskThreshold?: number;
  };

  // How to detect if user is on this intervention
  detectionPath: string; // JSONPath to user data
  detectionCriteria?: any;

  // Evidence
  sources: string[];
  evidenceStrength: 'strong' | 'moderate' | 'limited';
}

export type InterventionType =
  | 'medication'
  | 'lifestyle_change'
  | 'procedure'
  | 'program';
