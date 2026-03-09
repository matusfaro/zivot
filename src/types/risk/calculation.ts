import { ProvenanceChain, ProvenanceValue } from './provenance';

export interface RiskCalculationResult {
  calculationId: string;
  timestamp: number;
  profileVersion: string; // Version of user data used

  diseaseRisks: DiseaseRisk[];
  overallMortality: OverallMortalityRisk;

  // Mortality modifier summary
  modifierSummary?: ModifierSummary;

  // Human-readable interpretation
  interpretation: RiskInterpretation;

  // Top modifiable levers
  topLevers: ModifiableLever[];
}

export interface DiseaseRisk {
  diseaseId: string;
  diseaseName: string;
  timeframe: number; // years

  // The risk calculation breakdown
  baselineRisk: number; // Original baseline (before modifiers)
  modifiedBaselineRisk?: number; // Baseline after applying mortality modifiers
  adjustedRisk: number;
  absoluteRiskIncrease: number; // adjustedRisk - baselineRisk

  // Confidence and uncertainty
  confidence: ConfidenceScore;
  range: [number, number]; // [low, high] estimate

  // Contribution breakdown
  modifierContributions?: ModifierContribution[]; // Mortality modifiers
  factorContributions: FactorContribution[]; // Disease-specific risk factors
  testUpdates?: TestContribution[]; // Phase 2
  interventionEffects?: InterventionEffect[]; // Phase 2

  // Calculation provenance (NEW)
  provenance?: ProvenanceChain; // Complete calculation trace with source values and formulas
}

export interface FactorContribution {
  factorId: string;
  factorName: string;
  hazardRatio: number;
  contribution: number; // How much this factor increased/decreased risk
  modifiable: boolean;
  category: string;

  // Provenance (NEW)
  inputValue?: ProvenanceValue; // The user input value that generated this HR
  provenance?: ProvenanceChain; // Complete calculation trace for this factor
}

export interface TestContribution {
  testId: string;
  testName: string;
  result: string;
  priorRisk: number;
  posteriorRisk: number;
  updateMagnitude: number;
}

export interface InterventionEffect {
  interventionId: string;
  interventionName: string;
  relativeRiskReduction: number;
  absoluteRiskReduction: number;
}

export interface OverallMortalityRisk {
  timeframe: number;
  estimatedRisk: number;
  range: [number, number];
  confidence: ConfidenceScore;

  // Breakdown by disease
  diseaseContributions: {
    diseaseId: string;
    contribution: number;
  }[];

  // Mortality curve data for visualization (pre-computed)
  mortalityCurve?: MortalityCurveDataPoint[];

  // Calculation provenance (NEW)
  provenance?: ProvenanceChain; // Complete calculation trace for overall mortality aggregation
}

export interface MortalityCurveDataPoint {
  age: number;
  validatedRisk: number | null;  // % (0-100) for validated 10-year period
  extrapolatedRisk: number | null;  // % (0-100) beyond 10 years
  averageRisk: number;  // % (0-100) for population average
}

export interface ConfidenceScore {
  level: 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
  score: number; // 0-1
  missingCriticalData?: string[];
  dataQualityIssues?: string[];
}

export interface RiskInterpretation {
  overallSummary: string;
  riskCategory: RiskCategory;
  comparisonToAverage: string;

  diseaseInterpretations: DiseaseInterpretation[];

  recommendations: Recommendation[];
}

export type RiskCategory =
  | 'very_low'
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high';

export interface DiseaseInterpretation {
  diseaseId: string;
  summary: string;
  riskCategory: RiskCategory;
  keyDrivers: string[]; // Top 3 factors
  clinicalContext?: string;
}

export interface Recommendation {
  priority: 'critical' | 'high' | 'moderate' | 'low';
  category: string; // e.g., "Screening", "Lifestyle", "Medical"
  text: string;
  potentialImpact?: number; // Estimated risk reduction
}

export interface ModifiableLever {
  factorId: string;
  factorName: string;
  currentValue: number | string | boolean | null;
  targetValue: number | string | boolean | null;
  potentialRiskReduction: number;
  effort: 'low' | 'moderate' | 'high';
  timeframe: string; // e.g., "3-6 months"
  diseases: string[]; // Which diseases this would affect
}

/**
 * Mortality Modifier Contribution
 * Tracks how a modifier (e.g., dog ownership, social connections) affects risk
 */
export interface ModifierContribution {
  modifierId: string;
  modifierName: string;
  hazardRatio: number; // < 1.0 = protective, > 1.0 = harmful
  contribution: number; // Absolute risk change from this modifier
  category: string; // e.g., "social", "environmental"
}

/**
 * Summary of all mortality modifiers across all diseases
 */
export interface ModifierSummary {
  modifiers: Array<{
    modifierId: string;
    modifierName: string;
    averageHazardRatio: number;
    totalContribution: number; // Summed across all diseases
    affectedDiseases: number; // Count of diseases this modifier affected
    category: string;
  }>;
}
