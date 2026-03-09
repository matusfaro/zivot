/**
 * Registry type definitions for tracking relationships between
 * user profile fields, survey questions, risk factors, and disease calculations.
 */

import { RiskFactorType, EvidenceStrength } from '../knowledge/riskFactor';

export type ProfileCategory =
  | 'Demographics'
  | 'Biometrics'
  | 'LabTests'
  | 'Lifestyle'
  | 'MedicalHistory'
  | 'Social'
  | 'Interventions';

export type FieldType = 'DataPoint' | 'TimeSeries' | 'Array' | 'Derived';

export type QuestionType = 'binary' | 'slider' | 'select' | 'derived';

/**
 * Represents a single user profile field (input)
 */
export interface FieldDefinition {
  /** Unique identifier, e.g., "lifestyle.smoking.status" */
  id: string;

  /** Human-readable label, e.g., "Smoking Status" */
  label: string;

  /** JSONPath to field in UserProfile, e.g., "lifestyle.smoking.status.value" */
  path: string;

  /** Field type (DataPoint, TimeSeries, Array, Derived) */
  type: FieldType;

  /** TypeScript type name, e.g., "SmokingStatus", "number", "boolean" */
  dataType: string;

  /** Category this field belongs to */
  category: ProfileCategory;

  /** Can user modify this field? */
  modifiable: boolean;

  /** Risk factor IDs that use this field (computed) */
  usedByRiskFactors: string[];

  /** Disease IDs that use this field (aggregated, computed) */
  usedByDiseases: string[];

  /** Survey question IDs that map to this field (computed) */
  mappedFromQuestions: string[];

  /** Other field IDs this is derived from (e.g., BMI from weight + height) */
  derivedFrom?: string[];
}

/**
 * Represents a survey question
 */
export interface QuestionDefinition {
  /** Question ID from SwipeSurvey, e.g., "smoking" */
  id: string;

  /** Question text */
  question: string;

  /** Question category */
  category: string;

  /** Question type (binary, slider, select, derived) */
  type: QuestionType;

  /** Field IDs this question updates (computed) */
  mapsToFields: string[];

  /** Disease IDs affected by this question (via fields, computed) */
  affectsDiseases: string[];

  /** Risk factor IDs affected by this question (via fields, computed) */
  affectsRiskFactors: string[];
}

/**
 * Represents a disease-specific risk factor
 */
export interface RiskFactorNode {
  /** Unique ID combining disease and factor, e.g., "cvd_10year.smoking_status" */
  id: string;

  /** Factor ID from disease model, e.g., "smoking_status" */
  factorId: string;

  /** Human-readable name, e.g., "Smoking Status" */
  name: string;

  /** Disease ID this factor belongs to, e.g., "cvd_10year" */
  diseaseId: string;

  /** Risk factor type */
  type: RiskFactorType;

  /** Evidence strength */
  evidenceStrength: EvidenceStrength;

  /** Can user modify this factor? */
  modifiable: boolean;

  /** Field IDs used by this risk factor (computed) */
  usesFields: string[];

  /** Disease ID this factor contributes to */
  contributesToDisease: string;
}

/**
 * Represents a disease model
 */
export interface DiseaseNode {
  /** Disease ID, e.g., "cvd_10year" */
  id: string;

  /** Human-readable name, e.g., "Cardiovascular Disease" */
  name: string;

  /** Disease category, e.g., "cardiovascular", "cancer", "metabolic" */
  category: string;

  /** Timeframe in years (typically 10) */
  timeframe: number;

  /** Risk factor IDs used by this disease (computed) */
  usesRiskFactors: string[];

  /** Field IDs used by this disease (aggregated from risk factors, computed) */
  usesFields: string[];

  /** Contributes to overall mortality (always true) */
  contributesToOverallMortality: boolean;
}

/**
 * Complete relationship graph containing all entities and their relationships
 */
export interface RelationshipGraph {
  /** All user profile fields */
  fields: Map<string, FieldDefinition>;

  /** All survey questions */
  questions: Map<string, QuestionDefinition>;

  /** All risk factors across all diseases */
  riskFactors: Map<string, RiskFactorNode>;

  /** All disease models */
  diseases: Map<string, DiseaseNode>;

  /** Reverse lookup: disease ID → field IDs */
  fieldsByDisease: Map<string, Set<string>>;

  /** Reverse lookup: field ID → risk factor IDs */
  riskFactorsByField: Map<string, Set<string>>;

  /** Reverse lookup: field ID → disease IDs */
  diseasesByField: Map<string, Set<string>>;

  /** Reverse lookup: field ID → question IDs */
  questionsByField: Map<string, Set<string>>;
}

/**
 * Statistics about the relationship graph
 */
export interface GraphStatistics {
  /** Fields not used by any calculation */
  fieldsWithNoCalculations: FieldDefinition[];

  /** Modifiable fields with no survey question */
  fieldsWithNoQuestions: FieldDefinition[];

  /** Questions that map to multiple fields */
  questionsWithMultipleFields: QuestionDefinition[];

  /** Derived/calculated fields */
  derivedFields: FieldDefinition[];

  /** Number of fields with calculations */
  fieldsWithCalculations: number;

  /** Number of fields with questions */
  fieldsWithQuestions: number;

  /** Number of modifiable fields covered by questions */
  modifiableFieldsCovered: number;

  /** Total number of modifiable fields */
  modifiableFieldsTotal: number;
}
