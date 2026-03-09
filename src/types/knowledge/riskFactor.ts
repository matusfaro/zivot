export interface RiskFactorDescriptor {
  factorId: string;
  name: string;
  type: RiskFactorType;
  evidenceStrength: EvidenceStrength;

  // How to map user data to risk modification
  mapping: RiskMapping;

  // Data requirements
  requiredFields: DataFieldRequirement[];

  // Display/interpretation
  category?: string; // e.g., "Lipids", "Lifestyle"
  modifiable: boolean;

  // Evidence citation (REQUIRED)
  citation: string; // Full citation for the study establishing this risk factor
  doi?: string; // DOI for the primary evidence
  url?: string; // URL for the evidence if no DOI available
  evidenceLevel?: 'meta_analysis' | 'rct' | 'cohort' | 'case_control' | 'expert_opinion';
  notes?: string; // Optional notes about the evidence, limitations, etc.
}

export type RiskFactorType =
  | 'continuous' // e.g., LDL cholesterol
  | 'categorical' // e.g., smoking status
  | 'boolean' // e.g., family history
  | 'derived'; // Calculated from multiple fields

export type EvidenceStrength =
  | 'strong'
  | 'moderate'
  | 'limited'
  | 'emerging';

export interface DataFieldRequirement {
  path: string; // JSONPath to user data, e.g., "labTests.lipidPanel.ldlCholesterol"
  required: boolean;
  alternatives?: string[]; // Alternative paths if primary missing
}

/**
 * Maps user data value to hazard ratio or risk adjustment
 */
export type RiskMapping =
  | ContinuousRiskMapping
  | CategoricalRiskMapping
  | BooleanRiskMapping
  | DerivedRiskMapping;

export interface ContinuousRiskMapping {
  type: 'continuous';
  strategy: 'linear' | 'log_linear' | 'spline' | 'lookup';

  // For linear/log_linear
  coefficients?: {
    intercept?: number;
    slope: number;
    unit?: string; // e.g., "mg/dL", "mmHg"
    citation?: string; // Citation for the coefficient values
    doi?: string;
  };

  // For lookup/spline
  points?: RiskPoint[];

  // Value bounds
  validRange?: [number, number];
}

export interface CategoricalRiskMapping {
  type: 'categorical';
  categories: {
    value: string | string[]; // Possible values
    hazardRatio: number;
    confidence?: [number, number];
    citation?: string; // Citation for this specific hazard ratio
    doi?: string;
  }[];
  referenceCategory: string; // HR = 1.0
}

export interface BooleanRiskMapping {
  type: 'boolean';
  trueHazardRatio: number;
  falseHazardRatio: number; // Usually 1.0
  confidence?: [number, number];
  citation?: string; // Citation for the hazard ratio
  doi?: string;
}

export interface DerivedRiskMapping {
  type: 'derived';
  strategy?: 'has_condition' | 'bmi_lookup' | 'formula';

  // For has_condition strategy
  conditionId?: string; // Condition ID to check
  presentHR?: number; // HR when condition is present
  absentHR?: number; // HR when condition is absent

  // For bmi_lookup strategy
  points?: RiskPoint[];
  validRange?: [number, number];

  // For formula strategy (Phase 2)
  formula?: string; // JavaScript expression
  dependencies?: string[]; // Required data paths

  notes?: string;
}

export interface RiskPoint {
  value: number;
  hazardRatio: number;
  confidence?: [number, number];
  citation?: string; // Citation for this specific hazard ratio (if different from factor-level citation)
  doi?: string;
}
