/**
 * Calculation Provenance Types
 *
 * This module defines types for tracking the complete provenance of risk calculations,
 * enabling full transparency by showing source values, formulas, and scientific references
 * for every calculated number in the system.
 */

/**
 * Scientific reference for a calculation step or value
 */
export interface Reference {
  /** Short citation (e.g., "Framingham 2013", "CTT Collaboration") */
  citation: string;

  /** Full citation text (optional, for detailed display) */
  fullCitation?: string;

  /** DOI identifier */
  doi?: string;

  /** URL to source */
  url?: string;

  /** Strength of evidence */
  evidenceLevel?: 'meta_analysis' | 'rct' | 'cohort' | 'case_control' | 'expert_opinion';

  /** Additional notes about the reference or how it was used */
  notes?: string;
}

/**
 * Source of a value in the calculation chain
 */
export type ValueSource =
  | {
      /** Value entered by the user */
      type: 'user_input';

      /** Path in user profile (e.g., "labTests.lipidPanel.ldlCholesterol.value") */
      path: string;

      /** When the user entered this value */
      timestamp: number;
    }
  | {
      /** Value from baseline risk curve */
      type: 'baseline_data';

      /** Which baseline curve was used */
      curveId: string;

      /** Age for which this baseline applies */
      age: number;

      /** Whether this value was interpolated between age points */
      interpolated: boolean;
    }
  | {
      /** Value from disease model (e.g., hazard ratio from mapping) */
      type: 'disease_model';

      /** Which risk factor this comes from */
      factorId: string;

      /** Type of mapping used (linear, lookup, categorical, etc.) */
      mappingType: string;
    }
  | {
      /** Value calculated in a previous step */
      type: 'calculated';

      /** Index of the step that produced this value */
      fromStep: number;
    }
  | {
      /** Constant value defined in the model */
      type: 'constant';

      /** Name/description of the constant */
      name: string;
    };

/**
 * A value with full provenance information
 */
export interface ProvenanceValue {
  /** The actual value */
  value: number | string | boolean;

  /** Where this value came from */
  source: ValueSource;

  /** Unit of measurement (e.g., "%", "mg/dL", "years", "mmHg") */
  unit?: string;

  /** Human-readable label for this value */
  label: string;

  /** Scientific reference for this value (if applicable) */
  reference?: Reference;

  /** Timestamp when this value was determined/calculated */
  timestamp?: number;
}

/**
 * Type of calculation operation
 */
export type Operation =
  | {
      /** Linear interpolation between two points */
      type: 'interpolate';

      /** Age range being interpolated between */
      between: [number, number];
    }
  | {
      /** Multiplication of multiple factors */
      type: 'multiply';

      /** Labels of values being multiplied */
      factors: string[];
    }
  | {
      /** Addition of multiple terms */
      type: 'add';

      /** Labels of values being added */
      terms: string[];
    }
  | {
      /** Complement probability (1 - p) */
      type: 'complement';

      /** Label of probability being complemented */
      probability: string;
    }
  | {
      /** Lookup value from a table */
      type: 'lookup';

      /** Name of the lookup table */
      table: string;

      /** Key used for lookup */
      key: string | number;

      /** Whether interpolation was needed */
      interpolated?: boolean;
    }
  | {
      /** Linear formula: y = slope * x + intercept */
      type: 'linear_formula';

      /** Slope coefficient */
      coefficient: number;

      /** Intercept */
      intercept: number;

      /** Reference value (for formulas like HR = exp(coef * (x - ref))) */
      referenceValue?: number;
    }
  | {
      /** Logarithmic formula: y = slope * log(x) + intercept */
      type: 'log_formula';

      /** Slope coefficient */
      coefficient: number;

      /** Intercept */
      intercept: number;
    }
  | {
      /** Exponential formula: y = exp(x) */
      type: 'exp';
    }
  | {
      /** Selection of baseline curve based on criteria */
      type: 'curve_selection';

      /** Scoring criteria used for selection */
      criteria: Record<string, number>;

      /** Curves considered with their scores */
      candidateCurves?: Array<{
        curveId: string;
        score: number;
      }>;
    }
  | {
      /** Categorical mapping (direct lookup) */
      type: 'categorical';

      /** Category selected */
      category: string;

      /** Available categories */
      categories?: string[];
    }
  | {
      /** Boolean condition */
      type: 'boolean';

      /** Condition description */
      condition: string;
    }
  | {
      /** Product of survival probabilities (competing risks) */
      type: 'competing_risks';

      /** Disease IDs whose survival probabilities are being multiplied */
      diseases: string[];
    };

/**
 * A single step in a calculation with full provenance
 */
export interface ProvenanceStep {
  /** The operation performed in this step */
  operation: Operation;

  /** Input values used in this step */
  inputs: ProvenanceValue[];

  /** Output value produced by this step */
  output: ProvenanceValue;

  /** Human-readable formula (e.g., "baseline = lower + t × (upper - lower)") */
  formula?: string;

  /** Brief explanation of what this step does */
  explanation?: string;

  /** Scientific references supporting this calculation step */
  references?: Reference[];

  /** Intermediate calculations (for complex steps) */
  intermediateValues?: Array<{
    label: string;
    value: number | string | boolean;
    formula?: string;
  }>;
}

/**
 * Complete provenance chain for a calculation
 */
export interface ProvenanceChain {
  /** Unique identifier for this calculation */
  calculationId: string;

  /** All steps in the calculation, in order */
  steps: ProvenanceStep[];

  /** The final result of the calculation chain */
  finalResult: ProvenanceValue;

  /** When this calculation was performed */
  timestamp: number;

  /** Version of the calculation engine that produced this */
  engineVersion?: string;

  /** Overall references for the calculation methodology */
  methodologyReferences?: Reference[];
}

/**
 * Provenance for a single risk factor contribution
 */
export interface FactorProvenance {
  /** The risk factor being analyzed */
  factorId: string;

  /** Provenance chain for extracting the value from user profile */
  extraction?: ProvenanceChain;

  /** Provenance chain for calculating the hazard ratio */
  hazardRatioCalculation?: ProvenanceChain;

  /** Combined provenance (extraction + HR calculation) */
  combined?: ProvenanceChain;
}

/**
 * Provenance for baseline risk calculation
 */
export interface BaselineProvenance {
  /** Provenance for curve selection */
  curveSelection: ProvenanceChain;

  /** Provenance for risk interpolation */
  interpolation: ProvenanceChain;

  /** Combined provenance */
  combined: ProvenanceChain;
}

/**
 * Provenance for overall mortality aggregation
 */
export interface AggregationProvenance {
  /** Provenance for survival probability calculation */
  survivalCalculation: ProvenanceChain;

  /** Provenance for overall mortality calculation */
  mortalityCalculation: ProvenanceChain;

  /** Provenance for disease contribution calculations */
  diseaseContributions: Array<{
    diseaseId: string;
    provenance: ProvenanceChain;
  }>;

  /** Combined provenance */
  combined: ProvenanceChain;
}
