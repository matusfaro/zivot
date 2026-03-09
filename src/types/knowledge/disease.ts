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
}

export type DiseaseCategory =
  | 'cardiovascular'
  | 'cancer'
  | 'metabolic'
  | 'respiratory'
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
