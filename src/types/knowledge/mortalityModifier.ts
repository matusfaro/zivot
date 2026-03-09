import { Source, EvidenceLevel } from './disease';
import { EvidenceStrength, DataFieldRequirement, BooleanRiskMapping, CategoricalRiskMapping, ContinuousRiskMapping } from './riskFactor';

/**
 * Mortality Modifier - Factors that affect overall mortality risk
 * independent of specific disease pathways
 *
 * Examples: Dog ownership, social connections, time in nature
 * Applied to baseline mortality BEFORE disease-specific risk factors
 */
export interface MortalityModifier {
  metadata: ModifierMetadata;
  applicability: ModifierApplicability;
  effectSize: ModifierEffect;
  requiredFields: DataFieldRequirement[];
  mapping: ModifierMapping;
}

export interface ModifierMetadata {
  id: string; // e.g., "dog_ownership", "religious_attendance"
  name: string; // e.g., "Dog Ownership"
  category: ModifierCategory;
  description: string;
  version: string;
  lastUpdated: string; // ISO date
  sources: Source[]; // REQUIRED: Citations with DOI
  mechanismOfAction?: string; // Optional: How it works (e.g., "stress reduction, increased physical activity")
}

export type ModifierCategory =
  | 'social'
  | 'environmental'
  | 'cultural'
  | 'lifestyle'
  | 'other';

export interface ModifierApplicability {
  // Who this modifier applies to
  sex?: 'male' | 'female'; // Some effects may be gender-specific
  ageRange?: [number, number]; // Some modifiers only studied in certain age groups
  minimumDuration?: number; // e.g., "must own dog >1 year" (in years)
  excludedConditions?: string[]; // e.g., "not valid for terminal patients"
  notes?: string; // Additional applicability notes
}

export interface ModifierEffect {
  // Core hazard ratio data
  hazardRatio: number; // Point estimate (< 1.0 = protective, > 1.0 = harmful)
  confidenceInterval: [number, number]; // 95% CI [low, high]
  evidenceLevel: EvidenceLevel; // Quality of the study
  evidenceStrength: EvidenceStrength; // Overall strength of evidence

  // Specificity
  affectsAllCauseMortality: boolean; // true = affects overall mortality, false = disease-specific only
  primaryDiseases?: string[]; // If disease-specific, which diseases? (e.g., ["cvd_10year", "stroke_10year"])

  // Dose-response if applicable (e.g., more time outdoors = better)
  doseResponse?: DoseResponseCurve;
}

/**
 * For modifiers with dose-response relationships
 * Example: Nature exposure has optimal benefit at 120-300 min/week
 */
export interface DoseResponseCurve {
  type: 'threshold' | 'linear' | 'saturation' | 'j_shaped';
  points: DoseResponsePoint[];
  optimalDose?: number; // Recommended optimal level if known
  unit?: string; // e.g., "minutes per week", "hours per month"
}

export interface DoseResponsePoint {
  dose: number; // Amount (e.g., 120 for minutes)
  hazardRatio: number;
  confidence?: [number, number]; // Optional confidence interval
  citation?: string; // Optional citation for this specific data point
  doi?: string;
}

/**
 * Mapping types for modifiers
 * Reuse existing mapping structures for consistency
 */
export type ModifierMapping =
  | BooleanModifierMapping
  | CategoricalModifierMapping
  | ContinuousModifierMapping;

// Extend the existing boolean mapping for modifiers
export interface BooleanModifierMapping extends BooleanRiskMapping {
  type: 'boolean';
}

// Extend the existing categorical mapping for modifiers
export interface CategoricalModifierMapping extends CategoricalRiskMapping {
  type: 'categorical';
}

// Extend the existing continuous mapping for modifiers
export interface ContinuousModifierMapping extends ContinuousRiskMapping {
  type: 'continuous';
}
