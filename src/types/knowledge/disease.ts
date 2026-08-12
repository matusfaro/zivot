import { RiskFactorDescriptor } from './riskFactor';
import { TestDescriptor } from './test';
import { InterventionDescriptor } from './intervention';

export interface DiseaseModel {
  metadata: DiseaseMetadata;
  baselineRisk: BaselineRiskCurves;
  riskFactors: RiskFactorDescriptor[];
  tests?: TestDescriptor[]; // Phase 2
  interventions?: InterventionDescriptor[]; // Phase 2
}

export interface DiseaseMetadata {
  id: string; // e.g., "cvd_10year"
  name: string; // e.g., "Cardiovascular Disease (10-year)"
  category: DiseaseCategory;
  timeframe: number; // years
  version: string;
  lastUpdated: string; // ISO date
  sources: Source[];
  description?: string;

  /**
   * What the model's baseline curves actually predict:
   * - 'mortality': risk of DYING from the cause (e.g., COPD mortality, falls)
   * - 'incidence': risk of DEVELOPING the disease (e.g., diabetes, most cancers)
   * Incidence models must carry caseFatality10yr so the aggregator can
   * convert to a mortality contribution.
   */
  outcome: 'incidence' | 'mortality';

  /**
   * For incidence models: fraction of diagnosed individuals who die within
   * ~10 years (1 − relative survival for cancers; documented derivations
   * otherwise). Multiplied into adjustedRisk for the overall-mortality
   * aggregation. A value of 0 means the disease's mortality is intentionally
   * attributed to other modeled diseases (e.g., diabetes → CVD/CKD/stroke).
   */
  caseFatality10yr?: {
    value: number; // 0-1
    basis: string;
    citation: string;
    url?: string;
    doi?: string;
    notes?: string;
  };
}

export type DiseaseCategory =
  | 'cardiovascular'
  | 'cancer'
  | 'metabolic'
  | 'respiratory'
  | 'injury'
  | 'infectious'
  | 'external'
  | 'other';

export interface Source {
  citation: string;
  url?: string;
  doi?: string;
  evidenceLevel: EvidenceLevel;
}

export type EvidenceLevel =
  | 'meta_analysis'
  | 'rct'
  | 'cohort'
  | 'case_control'
  | 'expert_opinion';

/**
 * Baseline risk curves stratified by demographics
 */
export interface BaselineRiskCurves {
  curves: BaselineRiskCurve[];
  defaultCurve?: string; // ID of curve to use if no match
}

export interface BaselineRiskCurve {
  id: string;
  applicability: Applicability;
  ageRiskMapping: AgeRiskPoint[];

  // Evidence citation (REQUIRED)
  source: string; // Citation for the population study
  doi?: string; // DOI for the epidemiological data
  url?: string; // URL if no DOI available
  notes?: string; // Optional notes about data source, limitations, etc.
}

export interface Applicability {
  sex?: 'male' | 'female';
  ethnicity?: string[];
  region?: string[];
  ageRange?: [number, number];
}

export interface AgeRiskPoint {
  age: number;
  risk: number; // Decimal (e.g., 0.05 = 5%)
  confidence?: [number, number]; // [low, high] range
  citation?: string; // Optional: citation if this specific data point is from a different source
  doi?: string;
}
