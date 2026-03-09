/**
 * ProvenanceBuilder - Fluent API for building calculation provenance chains
 *
 * Provides a clean, type-safe way to construct provenance chains during calculations.
 *
 * Example usage:
 * ```typescript
 * const provenance = new ProvenanceBuilder('baseline-calc-123')
 *   .addStep()
 *     .operation({ type: 'interpolate', between: [40, 50] })
 *     .addInput({
 *       value: 45,
 *       source: { type: 'user_input', path: 'demographics.dateOfBirth', timestamp: Date.now() },
 *       label: 'Age',
 *       unit: 'years'
 *     })
 *     .addInput({ value: 4.2, source: { type: 'baseline_data', curveId: 'white_male_us', age: 40, interpolated: false }, label: 'Risk at age 40', unit: '%' })
 *     .addInput({ value: 8.1, source: { type: 'baseline_data', curveId: 'white_male_us', age: 50, interpolated: false }, label: 'Risk at age 50', unit: '%' })
 *     .setOutput({ value: 6.15, source: { type: 'calculated', fromStep: 0 }, label: 'Baseline Risk', unit: '%' })
 *     .setFormula('baseline = 4.2% + ((45 - 40) / (50 - 40)) × (8.1% - 4.2%)')
 *     .setExplanation('Interpolated baseline risk for age 45 using linear interpolation')
 *     .addReference({ citation: 'Framingham Heart Study', doi: '10.1161/...' })
 *     .complete()
 *   .build();
 * ```
 */

import {
  ProvenanceChain,
  ProvenanceStep,
  ProvenanceValue,
  Operation,
  Reference,
} from '../../types/risk/provenance';

/**
 * Builder for a single provenance step
 */
class ProvenanceStepBuilder {
  private step: Partial<ProvenanceStep> = {
    inputs: [],
    references: [],
    intermediateValues: [],
  };

  private parentBuilder: ProvenanceBuilder;

  constructor(parentBuilder: ProvenanceBuilder) {
    this.parentBuilder = parentBuilder;
  }

  /**
   * Set the operation for this step
   */
  operation(op: Operation): this {
    this.step.operation = op;
    return this;
  }

  /**
   * Add an input value to this step
   */
  addInput(input: ProvenanceValue): this {
    this.step.inputs!.push(input);
    return this;
  }

  /**
   * Add multiple input values
   */
  addInputs(inputs: ProvenanceValue[]): this {
    this.step.inputs!.push(...inputs);
    return this;
  }

  /**
   * Set the output value of this step
   */
  setOutput(output: ProvenanceValue): this {
    this.step.output = output;
    return this;
  }

  /**
   * Set the human-readable formula for this step
   */
  setFormula(formula: string): this {
    this.step.formula = formula;
    return this;
  }

  /**
   * Set the explanation for this step
   */
  setExplanation(explanation: string): this {
    this.step.explanation = explanation;
    return this;
  }

  /**
   * Add a scientific reference for this step
   */
  addReference(reference: Reference): this {
    this.step.references!.push(reference);
    return this;
  }

  /**
   * Add multiple references
   */
  addReferences(references: Reference[]): this {
    this.step.references!.push(...references);
    return this;
  }

  /**
   * Add an intermediate value (for complex calculations)
   */
  addIntermediate(label: string, value: number | string | boolean, formula?: string): this {
    this.step.intermediateValues!.push({ label, value, formula });
    return this;
  }

  /**
   * Complete this step and return to the parent builder
   */
  complete(): ProvenanceBuilder {
    // Validate step
    if (!this.step.operation) {
      throw new Error('ProvenanceStep requires an operation');
    }
    if (!this.step.output) {
      throw new Error('ProvenanceStep requires an output value');
    }
    if (!this.step.inputs || this.step.inputs.length === 0) {
      throw new Error('ProvenanceStep requires at least one input value');
    }

    // Add completed step to parent
    this.parentBuilder.addCompletedStep(this.step as ProvenanceStep);
    return this.parentBuilder;
  }
}

/**
 * Main provenance chain builder
 */
export class ProvenanceBuilder {
  private chain: Partial<ProvenanceChain> = {
    steps: [],
    methodologyReferences: [],
  };

  constructor(calculationId: string) {
    this.chain.calculationId = calculationId;
    this.chain.timestamp = Date.now();
  }

  /**
   * Start building a new step
   */
  addStep(): ProvenanceStepBuilder {
    return new ProvenanceStepBuilder(this);
  }

  /**
   * Internal method called by step builder to add a completed step
   */
  addCompletedStep(step: ProvenanceStep): void {
    this.chain.steps!.push(step);
  }

  /**
   * Set the final result of the calculation
   */
  setFinalResult(result: ProvenanceValue): this {
    this.chain.finalResult = result;
    return this;
  }

  /**
   * Set the engine version that produced this calculation
   */
  setEngineVersion(version: string): this {
    this.chain.engineVersion = version;
    return this;
  }

  /**
   * Add a methodology reference (applies to overall calculation approach)
   */
  addMethodologyReference(reference: Reference): this {
    this.chain.methodologyReferences!.push(reference);
    return this;
  }

  /**
   * Build the final provenance chain
   */
  build(): ProvenanceChain {
    // Validate chain
    if (!this.chain.calculationId) {
      throw new Error('ProvenanceChain requires a calculationId');
    }
    if (!this.chain.steps || this.chain.steps.length === 0) {
      throw new Error('ProvenanceChain requires at least one step');
    }
    if (!this.chain.finalResult) {
      // Auto-set final result to the output of the last step
      const lastStep = this.chain.steps[this.chain.steps.length - 1];
      this.chain.finalResult = lastStep.output;
    }

    return this.chain as ProvenanceChain;
  }

  /**
   * Helper: Create a provenance value from user input
   */
  static userInput(
    value: number | string | boolean,
    path: string,
    label: string,
    unit?: string,
    timestamp?: number
  ): ProvenanceValue {
    return {
      value,
      source: {
        type: 'user_input',
        path,
        timestamp: timestamp || Date.now(),
      },
      label,
      unit,
      timestamp: timestamp || Date.now(),
    };
  }

  /**
   * Helper: Create a provenance value from baseline data
   */
  static baselineData(
    value: number,
    curveId: string,
    age: number,
    label: string,
    interpolated: boolean = false,
    reference?: Reference
  ): ProvenanceValue {
    return {
      value,
      source: {
        type: 'baseline_data',
        curveId,
        age,
        interpolated,
      },
      label,
      unit: '%',
      reference,
    };
  }

  /**
   * Helper: Create a provenance value from disease model
   */
  static diseaseModel(
    value: number,
    factorId: string,
    mappingType: string,
    label: string,
    unit?: string,
    reference?: Reference
  ): ProvenanceValue {
    return {
      value,
      source: {
        type: 'disease_model',
        factorId,
        mappingType,
      },
      label,
      unit,
      reference,
    };
  }

  /**
   * Helper: Create a provenance value from a calculated result
   */
  static calculated(
    value: number | string | boolean,
    fromStep: number,
    label: string,
    unit?: string
  ): ProvenanceValue {
    return {
      value,
      source: {
        type: 'calculated',
        fromStep,
      },
      label,
      unit,
    };
  }

  /**
   * Helper: Create a provenance value from a constant
   */
  static constant(
    value: number | string | boolean,
    name: string,
    label: string,
    unit?: string,
    reference?: Reference
  ): ProvenanceValue {
    return {
      value,
      source: {
        type: 'constant',
        name,
      },
      label,
      unit,
      reference,
    };
  }
}

/**
 * Helper function to create a simple linear interpolation provenance
 */
export function createInterpolationProvenance(
  calculationId: string,
  age: number,
  lowerAge: number,
  lowerRisk: number,
  upperAge: number,
  upperRisk: number,
  result: number,
  curveId: string,
  reference?: Reference
): ProvenanceChain {
  const t = (age - lowerAge) / (upperAge - lowerAge);

  return new ProvenanceBuilder(calculationId)
    .addStep()
    .operation({ type: 'interpolate', between: [lowerAge, upperAge] })
    .addInput(
      ProvenanceBuilder.userInput(age, 'demographics.dateOfBirth', 'Age', 'years')
    )
    .addInput(
      ProvenanceBuilder.baselineData(
        lowerRisk,
        curveId,
        lowerAge,
        `Risk at age ${lowerAge}`,
        false,
        reference
      )
    )
    .addInput(
      ProvenanceBuilder.baselineData(
        upperRisk,
        curveId,
        upperAge,
        `Risk at age ${upperAge}`,
        false,
        reference
      )
    )
    .setOutput(
      ProvenanceBuilder.baselineData(result, curveId, age, 'Baseline Risk', true, reference)
    )
    .setFormula(
      `baseline = ${lowerRisk}% + ((${age} - ${lowerAge}) / (${upperAge} - ${lowerAge})) × (${upperRisk}% - ${lowerRisk}%)`
    )
    .setExplanation(`Linear interpolation of baseline risk for age ${age}`)
    .addIntermediate('Interpolation weight (t)', t, `t = (${age} - ${lowerAge}) / (${upperAge} - ${lowerAge})`)
    .addIntermediate('Risk difference', upperRisk - lowerRisk, `${upperRisk}% - ${lowerRisk}%`)
    .addIntermediate('Interpolated amount', t * (upperRisk - lowerRisk), `${t.toFixed(4)} × ${(upperRisk - lowerRisk).toFixed(2)}%`)
    .addReferences(reference ? [reference] : [])
    .complete()
    .build();
}

/**
 * Helper function to create hazard ratio multiplication provenance
 */
export function createHRMultiplicationProvenance(
  calculationId: string,
  baselineRisk: number,
  hazardRatios: Array<{ factorId: string; hr: number; label: string; reference?: Reference }>,
  result: number
): ProvenanceChain {
  const builder = new ProvenanceBuilder(calculationId);

  // Add baseline as input
  const inputs: ProvenanceValue[] = [
    ProvenanceBuilder.calculated(baselineRisk, 0, 'Baseline Risk', '%'),
  ];

  // Add each HR as input
  const factorLabels: string[] = [];
  hazardRatios.forEach((hr) => {
    inputs.push({
      value: hr.hr,
      source: { type: 'disease_model', factorId: hr.factorId, mappingType: 'HR' },
      label: `HR (${hr.label})`,
      reference: hr.reference,
    });
    factorLabels.push(hr.label);
  });

  // Calculate cumulative HR
  const cumulativeHR = hazardRatios.reduce((acc, hr) => acc * hr.hr, 1.0);

  // Build formula string
  const hrTerms = hazardRatios.map((hr) => hr.hr.toFixed(2)).join(' × ');
  const formula = `adjusted = ${baselineRisk.toFixed(2)}% × ${hrTerms} = ${result.toFixed(2)}%`;

  builder
    .addStep()
    .operation({ type: 'multiply', factors: ['Baseline', ...factorLabels] })
    .addInputs(inputs)
    .setOutput(ProvenanceBuilder.calculated(result, 0, 'Adjusted Risk', '%'))
    .setFormula(formula)
    .setExplanation(`Multiply baseline risk by cumulative hazard ratios from risk factors`)
    .addIntermediate('Cumulative HR', cumulativeHR, hrTerms)
    .complete();

  return builder.build();
}
