import { UserProfile } from '../../types/user';
import {
  RiskFactorDescriptor,
  ContinuousRiskMapping,
  CategoricalRiskMapping,
  BooleanRiskMapping,
} from '../../types/knowledge/riskFactor';
import {
  getValueAtPath,
  getDataPointValue,
  getTimeSeriesValue,
  calculateBMI,
  hasCondition,
  hasFamilyHistory,
  getFamilyHistoryCategory,
  getYearsSinceQuit,
  hasPrediabetes,
  hasHypertension,
  getDiabetesFamilyHistoryCategory,
} from '../../utils/dataExtraction';
import { ProvenanceBuilder } from '../provenance/ProvenanceBuilder';
import { ProvenanceChain, ProvenanceValue } from '../../types/risk/provenance';
import { ReferenceExtractor } from '../provenance/ReferenceExtractor';

/**
 * Result of hazard ratio calculation with provenance
 */
export interface HazardRatioResult {
  hr: number;
  inputValue: ProvenanceValue;
  provenance: ProvenanceChain;
}

export class FactorAdjuster {
  /**
   * Calculate hazard ratio for a given risk factor with full provenance
   * Returns null if data is not available
   */
  calculateHazardRatioWithProvenance(
    profile: UserProfile,
    factor: RiskFactorDescriptor
  ): HazardRatioResult | null {
    // Extract value from user profile
    const extractionResult = this.extractFactorValueWithPath(profile, factor);

    if (extractionResult.value === null || extractionResult.value === undefined) {
      return null; // Factor not available
    }

    // Map value to hazard ratio based on factor type
    const calculationId = `hr-${factor.factorId}-${Date.now()}`;
    let hr: number;
    let provenance: ProvenanceChain;

    switch (factor.mapping.type) {
      case 'continuous': {
        const result = this.calculateContinuousHRWithProvenance(
          extractionResult.value as number,
          factor.mapping as ContinuousRiskMapping,
          factor,
          calculationId,
          extractionResult.path
        );
        hr = result.hr;
        provenance = result.provenance;
        break;
      }
      case 'categorical': {
        const result = this.calculateCategoricalHRWithProvenance(
          extractionResult.value as string,
          factor.mapping as CategoricalRiskMapping,
          factor,
          calculationId,
          extractionResult.path
        );
        hr = result.hr;
        provenance = result.provenance;
        break;
      }
      case 'boolean': {
        const result = this.calculateBooleanHRWithProvenance(
          extractionResult.value as boolean,
          factor.mapping as BooleanRiskMapping,
          factor,
          calculationId,
          extractionResult.path
        );
        hr = result.hr;
        provenance = result.provenance;
        break;
      }
      case 'derived': {
        const result = this.calculateDerivedHRWithProvenance(profile, factor, calculationId);
        hr = result.hr;
        provenance = result.provenance;
        break;
      }
      default:
        return null;
    }

    // Create input value provenance
    const inputValue = ProvenanceBuilder.userInput(
      extractionResult.value,
      extractionResult.path,
      factor.name,
      this.getUnitForFactor(factor)
    );

    return { hr, inputValue, provenance };
  }

  /**
   * Calculate hazard ratio for a given risk factor (legacy method for backward compatibility)
   * Returns null if data is not available
   */
  calculateHazardRatio(profile: UserProfile, factor: RiskFactorDescriptor): number | null {
    const result = this.calculateHazardRatioWithProvenance(profile, factor);
    return result?.hr ?? null;
  }

  /**
   * Extract factor value with path information
   */
  private extractFactorValueWithPath(
    profile: UserProfile,
    factor: RiskFactorDescriptor
  ): { value: number | string | boolean | null; path: string } {
    const value = this.extractFactorValue(profile, factor);

    // Determine the path used
    let path = '';
    if (this.isSpecialFactor(factor.factorId)) {
      path = this.getSpecialFactorPath(factor.factorId);
    } else if (factor.requiredFields.length > 0) {
      path = factor.requiredFields[0].path;
    }

    return { value, path };
  }

  /**
   * Check if factor ID is a special/derived factor
   */
  private isSpecialFactor(factorId: string): boolean {
    return factorId.includes('bmi') ||
           factorId.includes('diabetes') ||
           factorId.includes('family_history') ||
           factorId === 'years_since_quit' ||
           factorId === 'prediabetes' ||
           factorId === 'hypertension_diabetes' ||
           factorId.includes('_diagnosis') ||
           factorId.includes('_history');
  }

  /**
   * Get path for special factors
   */
  private getSpecialFactorPath(factorId: string): string {
    if (factorId.includes('bmi')) return 'biometrics.weight+height';
    if (factorId.includes('diabetes')) return 'medicalHistory.conditions';
    if (factorId.includes('family_history')) return 'medicalHistory.familyHistory';
    if (factorId === 'years_since_quit') return 'lifestyle.smoking';
    if (factorId === 'prediabetes') return 'medicalHistory.conditions';
    return 'derived';
  }

  /**
   * Get unit for a factor
   */
  private getUnitForFactor(factor: RiskFactorDescriptor): string | undefined {
    if (factor.mapping.type === 'continuous') {
      const contMapping = factor.mapping as ContinuousRiskMapping;
      return contMapping.coefficients?.unit;
    }
    return undefined;
  }

  /**
   * Calculate hazard ratio with provenance (legacy method for backward compatibility)
   */
  private calculateHazardRatioOld(profile: UserProfile, factor: RiskFactorDescriptor): number | null {
    // Extract value from user profile
    const value = this.extractFactorValue(profile, factor);

    if (value === null || value === undefined) {
      return null; // Factor not available
    }

    // Map value to hazard ratio based on factor type
    switch (factor.mapping.type) {
      case 'continuous':
        if (typeof value !== 'number') return null;
        return this.calculateContinuousHR(value, factor.mapping as ContinuousRiskMapping);
      case 'categorical':
        if (typeof value !== 'string') return null;
        return this.calculateCategoricalHR(value, factor.mapping as CategoricalRiskMapping);
      case 'boolean':
        if (typeof value !== 'boolean') return null;
        return this.calculateBooleanHR(value, factor.mapping as BooleanRiskMapping);
      case 'derived':
        return this.calculateDerivedHR(profile, factor);
      default:
        return null;
    }
  }

  /**
   * Extract factor value from user profile
   */
  private extractFactorValue(profile: UserProfile, factor: RiskFactorDescriptor): number | string | boolean | null {
    // Special handling for calculated fields
    // BMI - used by multiple diseases
    if (factor.factorId === 'bmi' || factor.factorId === 'bmi_crc' || factor.factorId === 'bmi_diabetes' ||
        factor.factorId === 'bmi_stroke' || factor.factorId === 'bmi_breast' || factor.factorId === 'bmi_prostate' ||
        factor.factorId === 'bmi_copd' || factor.factorId === 'bmi_ckd' || factor.factorId === 'bmi_pancreatic' ||
        factor.factorId === 'bmi_nafld' || factor.factorId === 'bmi_dementia') {
      return calculateBMI(profile);
    }

    // Diabetes - used by multiple diseases
    if (factor.factorId === 'diabetes' || factor.factorId === 'diabetes_crc' || factor.factorId === 'diabetes_stroke' ||
        factor.factorId === 'diabetes_pancreatic' || factor.factorId === 'diabetes_nafld' ||
        factor.factorId === 'diabetes_dementia' || factor.factorId === 'diabetes_ckd') {
      return hasCondition(profile, 'type2_diabetes') || hasCondition(profile, 'diabetes');
    }

    // Family history checks
    if (factor.factorId === 'family_history_cvd') {
      return hasFamilyHistory(profile, 'cvd', ['parent', 'sibling']);
    }

    if (factor.factorId === 'family_history_crc') {
      return getFamilyHistoryCategory(profile, 'colorectal_cancer');
    }

    if (factor.factorId === 'family_history_lung') {
      return hasFamilyHistory(profile, 'lung_cancer', ['parent', 'sibling']);
    }

    if (factor.factorId === 'family_history_diabetes') {
      return getDiabetesFamilyHistoryCategory(profile);
    }

    if (factor.factorId === 'family_history_breast') {
      // Returns "none", "one", or "two_or_more"
      return getFamilyHistoryCategory(profile, 'breast_cancer');
    }

    if (factor.factorId === 'family_history_prostate') {
      return getFamilyHistoryCategory(profile, 'prostate_cancer');
    }

    if (factor.factorId === 'family_history_pancreatic') {
      return getFamilyHistoryCategory(profile, 'pancreatic_cancer');
    }

    if (factor.factorId === 'family_history_dementia') {
      return getFamilyHistoryCategory(profile, 'dementia');
    }

    if (factor.factorId === 'years_since_quit') {
      return getYearsSinceQuit(profile);
    }

    if (factor.factorId === 'prediabetes') {
      return hasPrediabetes(profile);
    }

    if (factor.factorId === 'hypertension_diabetes') {
      return hasHypertension(profile);
    }

    if (factor.factorId === 'ibd_history') {
      return hasCondition(profile, 'ibd') || hasCondition(profile, 'crohns') || hasCondition(profile, 'ulcerative_colitis');
    }

    if (factor.factorId === 'copd_diagnosis') {
      return hasCondition(profile, 'copd') || hasCondition(profile, 'emphysema');
    }

    if (factor.factorId === 'gestational_diabetes') {
      return hasCondition(profile, 'gestational_diabetes');
    }

    if (factor.factorId === 'pcos') {
      return hasCondition(profile, 'pcos');
    }

    // Stroke-specific conditions
    if (factor.factorId === 'atrial_fibrillation') {
      return hasCondition(profile, 'atrial_fibrillation');
    }

    if (factor.factorId === 'prior_stroke_tia') {
      return hasCondition(profile, 'stroke') || hasCondition(profile, 'tia');
    }

    if (factor.factorId === 'cvd_history_stroke' || factor.factorId === 'cvd_ckd') {
      return hasCondition(profile, 'cvd') || hasCondition(profile, 'heart_attack') || hasCondition(profile, 'heart_disease');
    }

    // Pancreatic cancer specific
    if (factor.factorId === 'chronic_pancreatitis') {
      return hasCondition(profile, 'chronic_pancreatitis');
    }

    // Liver disease specific
    if (factor.factorId === 'nafld_diagnosis') {
      return hasCondition(profile, 'nafld') || hasCondition(profile, 'nash');
    }

    if (factor.factorId === 'cirrhosis_diagnosis') {
      return hasCondition(profile, 'cirrhosis');
    }

    // Try primary path
    const primary = factor.requiredFields[0];
    let value = this.getValueFromPath(profile, primary.path);

    // Debug logging for alcohol
    if (factor.factorId.includes('alcohol')) {
      console.log('[RISK CALC] Alcohol factor extraction:', {
        factorId: factor.factorId,
        path: primary.path,
        extractedValue: value,
        profileAlcohol: profile.lifestyle?.alcohol
      });
    }

    // Try alternatives if primary fails
    if (value === null && primary.alternatives) {
      for (const altPath of primary.alternatives) {
        value = this.getValueFromPath(profile, altPath);
        if (value !== null) break;
      }
    }

    return value;
  }

  /**
   * Get value from a path, handling DataPoints and TimeSeries
   */
  private getValueFromPath(profile: UserProfile, path: string): number | string | boolean | null {
    // Check if path contains "mostRecent" - indicates TimeSeries
    if (path.includes('mostRecent')) {
      const basePathParts = path.split('.mostRecent');
      const basePath = basePathParts[0];
      const remainingPath = basePathParts[1];

      const timeSeries = getValueAtPath(profile, basePath) as any;
      if (!timeSeries) return null;

      const mostRecent = timeSeries.mostRecent || (timeSeries.dataPoints && timeSeries.dataPoints[timeSeries.dataPoints.length - 1]);
      if (!mostRecent) return null;

      if (remainingPath) {
        // Continue down the path (e.g., .value.systolic)
        const nestedValue = getValueAtPath(mostRecent as UserProfile, remainingPath.substring(1));
        if (typeof nestedValue === 'number' || typeof nestedValue === 'string' || typeof nestedValue === 'boolean') {
          return nestedValue;
        }
        return null;
      }

      if (typeof mostRecent === 'object' && mostRecent !== null && 'value' in mostRecent) {
        const value = (mostRecent as { value: unknown }).value;
        if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
          return value;
        }
      }
      return null;
    }

    // Regular path extraction
    const value = getValueAtPath(profile, path);

    // Unwrap DataPoint if needed
    if (value && typeof value === 'object' && 'value' in value && 'provenance' in value) {
      const unwrapped = (value as { value: unknown }).value;
      if (typeof unwrapped === 'number' || typeof unwrapped === 'string' || typeof unwrapped === 'boolean') {
        return unwrapped;
      }
      return null;
    }

    // Return if it's a primitive type
    if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
      return value;
    }

    return null;
  }

  /**
   * Calculate HR for continuous factors
   */
  private calculateContinuousHR(value: number, mapping: ContinuousRiskMapping): number {
    // Validate range
    if (mapping.validRange) {
      const [min, max] = mapping.validRange;
      if (value < min || value > max) {
        console.warn(`Value ${value} outside valid range [${min}, ${max}], clamping`);
        value = Math.max(min, Math.min(max, value));
      }
    }

    switch (mapping.strategy) {
      case 'linear':
        return this.linearHR(value, mapping.coefficients!);
      case 'log_linear':
        return this.logLinearHR(value, mapping.coefficients!);
      case 'lookup':
      case 'spline':
        return this.lookupHR(value, mapping.points!);
      default:
        return 1.0;
    }
  }

  /**
   * Linear hazard ratio: HR = exp(slope * value)
   */
  private linearHR(value: number, coef: { slope: number; intercept?: number }): number {
    const logHR = coef.slope * value + (coef.intercept || 0);
    return Math.exp(logHR);
  }

  /**
   * Log-linear hazard ratio: HR = exp(slope * log(value))
   */
  private logLinearHR(value: number, coef: { slope: number }): number {
    if (value <= 0) return 1.0;
    const logHR = coef.slope * Math.log(value);
    return Math.exp(logHR);
  }

  /**
   * Lookup/interpolate HR from points
   */
  private lookupHR(value: number, points: Array<{ value: number; hazardRatio: number }>): number {
    const sorted = [...points].sort((a, b) => a.value - b.value);

    // Exact match
    const exact = sorted.find(p => p.value === value);
    if (exact) return exact.hazardRatio;

    // Find bounding points
    let lower = sorted[0];
    let upper = sorted[sorted.length - 1];

    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].value <= value && sorted[i + 1].value >= value) {
        lower = sorted[i];
        upper = sorted[i + 1];
        break;
      }
    }

    // Extrapolate if outside range
    if (value < sorted[0].value) {
      return sorted[0].hazardRatio;
    }
    if (value > sorted[sorted.length - 1].value) {
      return sorted[sorted.length - 1].hazardRatio;
    }

    // Linear interpolation
    const t = (value - lower.value) / (upper.value - lower.value);
    return lower.hazardRatio + t * (upper.hazardRatio - lower.hazardRatio);
  }

  /**
   * Calculate HR for categorical factors
   */
  private calculateCategoricalHR(value: string, mapping: CategoricalRiskMapping): number {
    const category = mapping.categories.find(cat => {
      if (Array.isArray(cat.value)) {
        return cat.value.includes(value);
      }
      return cat.value === value;
    });

    return category?.hazardRatio || 1.0;
  }

  /**
   * Calculate HR for boolean factors
   */
  private calculateBooleanHR(value: boolean, mapping: BooleanRiskMapping): number {
    return value ? mapping.trueHazardRatio : mapping.falseHazardRatio;
  }

  /**
   * Calculate HR for derived factors
   */
  private calculateDerivedHR(profile: UserProfile, factor: RiskFactorDescriptor): number {
    const mapping = factor.mapping as any; // DerivedRiskMapping with strategy

    switch (mapping.strategy) {
      case 'has_condition': {
        const hasIt = hasCondition(profile, mapping.conditionId);
        return hasIt ? mapping.presentHR : mapping.absentHR;
      }
      case 'bmi_lookup': {
        const bmi = calculateBMI(profile);
        if (bmi === null) return 1.0;
        return this.lookupHR(bmi, mapping.points);
      }
      case 'formula':
        // Placeholder for Phase 2
        return 1.0;
      default:
        return 1.0;
    }
  }

  // ========================================
  // Provenance-emitting methods
  // ========================================

  /**
   * Calculate continuous HR with full provenance
   */
  private calculateContinuousHRWithProvenance(
    value: number,
    mapping: ContinuousRiskMapping,
    factor: RiskFactorDescriptor,
    calculationId: string,
    inputPath: string
  ): { hr: number; provenance: ProvenanceChain } {
    // Validate and clamp range
    let clampedValue = value;
    if (mapping.validRange) {
      const [min, max] = mapping.validRange;
      if (value < min || value > max) {
        console.warn(`Value ${value} outside valid range [${min}, ${max}], clamping`);
        clampedValue = Math.max(min, Math.min(max, value));
      }
    }

    const references = ReferenceExtractor.getFactorReferences(factor);

    switch (mapping.strategy) {
      case 'linear':
        return this.linearHRWithProvenance(clampedValue, mapping.coefficients!, factor, calculationId, inputPath, references);
      case 'log_linear':
        return this.logLinearHRWithProvenance(clampedValue, mapping.coefficients!, factor, calculationId, inputPath, references);
      case 'lookup':
      case 'spline':
        return this.lookupHRWithProvenance(clampedValue, mapping.points!, factor, calculationId, inputPath, references);
      default:
        // Fallback to no provenance
        return {
          hr: 1.0,
          provenance: new ProvenanceBuilder(calculationId)
            .addStep()
            .operation({ type: 'boolean', condition: 'Unknown mapping strategy' })
            .addInput(ProvenanceBuilder.userInput(value, inputPath, factor.name, mapping.coefficients?.unit))
            .setOutput(ProvenanceBuilder.constant(1.0, 'default_hr', 'Hazard Ratio'))
            .setFormula('HR = 1.0 (default)')
            .complete()
            .build()
        };
    }
  }

  /**
   * Linear HR with provenance: HR = exp(slope * value + intercept)
   */
  private linearHRWithProvenance(
    value: number,
    coef: { slope: number; intercept?: number; unit?: string; citation?: string; doi?: string },
    factor: RiskFactorDescriptor,
    calculationId: string,
    inputPath: string,
    references: any[]
  ): { hr: number; provenance: ProvenanceChain } {
    const intercept = coef.intercept || 0;
    const logHR = coef.slope * value + intercept;
    const hr = Math.exp(logHR);

    const builder = new ProvenanceBuilder(calculationId);

    // Add coefficient reference if available
    if (coef.citation) {
      references.push({
        citation: coef.citation,
        doi: coef.doi,
        notes: `Coefficient values: slope=${coef.slope}, intercept=${intercept}`
      });
    }

    const formula = intercept === 0
      ? `HR = exp(${coef.slope} × ${value}) = exp(${logHR.toFixed(4)}) = ${hr.toFixed(4)}`
      : `HR = exp(${coef.slope} × ${value} + ${intercept}) = exp(${logHR.toFixed(4)}) = ${hr.toFixed(4)}`;

    builder
      .addStep()
      .operation({ type: 'linear_formula', coefficient: coef.slope, intercept })
      .addInput(ProvenanceBuilder.userInput(value, inputPath, factor.name, coef.unit))
      .addInput(ProvenanceBuilder.constant(coef.slope, 'slope', 'Slope coefficient'))
      .addInput(ProvenanceBuilder.constant(intercept, 'intercept', 'Intercept'))
      .setOutput(ProvenanceBuilder.diseaseModel(hr, factor.factorId, 'linear', 'Hazard Ratio'))
      .setFormula(formula)
      .setExplanation(`Calculate hazard ratio using linear formula`)
      .addIntermediate('log(HR)', logHR, `${coef.slope} × ${value} + ${intercept}`)
      .addReferences(references)
      .complete();

    return { hr, provenance: builder.build() };
  }

  /**
   * Log-linear HR with provenance: HR = exp(slope * log(value))
   */
  private logLinearHRWithProvenance(
    value: number,
    coef: { slope: number; unit?: string; citation?: string; doi?: string },
    factor: RiskFactorDescriptor,
    calculationId: string,
    inputPath: string,
    references: any[]
  ): { hr: number; provenance: ProvenanceChain } {
    if (value <= 0) {
      return {
        hr: 1.0,
        provenance: new ProvenanceBuilder(calculationId)
          .addStep()
          .operation({ type: 'boolean', condition: 'Value <= 0, using HR = 1.0' })
          .addInput(ProvenanceBuilder.userInput(value, inputPath, factor.name, coef.unit))
          .setOutput(ProvenanceBuilder.constant(1.0, 'default_hr', 'Hazard Ratio'))
          .setFormula('HR = 1.0 (value <= 0)')
          .complete()
          .build()
      };
    }

    const logValue = Math.log(value);
    const logHR = coef.slope * logValue;
    const hr = Math.exp(logHR);

    const builder = new ProvenanceBuilder(calculationId);

    const formula = `HR = exp(${coef.slope} × log(${value})) = exp(${coef.slope} × ${logValue.toFixed(4)}) = ${hr.toFixed(4)}`;

    builder
      .addStep()
      .operation({ type: 'log_formula', coefficient: coef.slope, intercept: 0 })
      .addInput(ProvenanceBuilder.userInput(value, inputPath, factor.name, coef.unit))
      .addInput(ProvenanceBuilder.constant(coef.slope, 'slope', 'Slope coefficient'))
      .setOutput(ProvenanceBuilder.diseaseModel(hr, factor.factorId, 'log_linear', 'Hazard Ratio'))
      .setFormula(formula)
      .setExplanation(`Calculate hazard ratio using log-linear formula`)
      .addIntermediate('log(value)', logValue, `log(${value})`)
      .addIntermediate('log(HR)', logHR, `${coef.slope} × ${logValue.toFixed(4)}`)
      .addReferences(references)
      .complete();

    return { hr, provenance: builder.build() };
  }

  /**
   * Lookup HR with provenance (with interpolation if needed)
   */
  private lookupHRWithProvenance(
    value: number,
    points: Array<{ value: number; hazardRatio: number; citation?: string; doi?: string }>,
    factor: RiskFactorDescriptor,
    calculationId: string,
    inputPath: string,
    references: any[]
  ): { hr: number; provenance: ProvenanceChain } {
    const sorted = [...points].sort((a, b) => a.value - b.value);

    // Check for exact match
    const exact = sorted.find(p => p.value === value);
    if (exact) {
      const builder = new ProvenanceBuilder(calculationId);
      builder
        .addStep()
        .operation({ type: 'lookup', table: `${factor.factorId}_table`, key: value, interpolated: false })
        .addInput(ProvenanceBuilder.userInput(value, inputPath, factor.name))
        .setOutput(ProvenanceBuilder.diseaseModel(exact.hazardRatio, factor.factorId, 'lookup', 'Hazard Ratio'))
        .setFormula(`HR = ${exact.hazardRatio} (exact match for value ${value})`)
        .setExplanation(`Direct lookup in hazard ratio table`)
        .addReferences(references)
        .complete();

      return { hr: exact.hazardRatio, provenance: builder.build() };
    }

    // Find bounding points for interpolation
    let lower = sorted[0];
    let upper = sorted[sorted.length - 1];
    let interpolated = true;

    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].value <= value && sorted[i + 1].value >= value) {
        lower = sorted[i];
        upper = sorted[i + 1];
        break;
      }
    }

    // Extrapolate if outside range
    if (value < sorted[0].value) {
      const hr = sorted[0].hazardRatio;
      return {
        hr,
        provenance: new ProvenanceBuilder(calculationId)
          .addStep()
          .operation({ type: 'lookup', table: `${factor.factorId}_table`, key: value, interpolated: false })
          .addInput(ProvenanceBuilder.userInput(value, inputPath, factor.name))
          .setOutput(ProvenanceBuilder.diseaseModel(hr, factor.factorId, 'lookup', 'Hazard Ratio'))
          .setFormula(`HR = ${hr} (extrapolated, value below minimum)`)
          .setExplanation(`Value ${value} below minimum ${sorted[0].value}, using minimum HR`)
          .addReferences(references)
          .complete()
          .build()
      };
    }

    if (value > sorted[sorted.length - 1].value) {
      const hr = sorted[sorted.length - 1].hazardRatio;
      return {
        hr,
        provenance: new ProvenanceBuilder(calculationId)
          .addStep()
          .operation({ type: 'lookup', table: `${factor.factorId}_table`, key: value, interpolated: false })
          .addInput(ProvenanceBuilder.userInput(value, inputPath, factor.name))
          .setOutput(ProvenanceBuilder.diseaseModel(hr, factor.factorId, 'lookup', 'Hazard Ratio'))
          .setFormula(`HR = ${hr} (extrapolated, value above maximum)`)
          .setExplanation(`Value ${value} above maximum ${upper.value}, using maximum HR`)
          .addReferences(references)
          .complete()
          .build()
      };
    }

    // Linear interpolation
    const t = (value - lower.value) / (upper.value - lower.value);
    const hr = lower.hazardRatio + t * (upper.hazardRatio - lower.hazardRatio);

    const builder = new ProvenanceBuilder(calculationId);
    const formula = `HR = ${lower.hazardRatio} + ${t.toFixed(4)} × (${upper.hazardRatio} - ${lower.hazardRatio}) = ${hr.toFixed(4)}`;

    builder
      .addStep()
      .operation({ type: 'lookup', table: `${factor.factorId}_table`, key: value, interpolated: true })
      .addInput(ProvenanceBuilder.userInput(value, inputPath, factor.name))
      .addInput(ProvenanceBuilder.diseaseModel(lower.hazardRatio, factor.factorId, 'lookup_point', `HR at ${lower.value}`))
      .addInput(ProvenanceBuilder.diseaseModel(upper.hazardRatio, factor.factorId, 'lookup_point', `HR at ${upper.value}`))
      .setOutput(ProvenanceBuilder.diseaseModel(hr, factor.factorId, 'lookup_interpolated', 'Hazard Ratio'))
      .setFormula(formula)
      .setExplanation(`Linear interpolation between ${lower.value} and ${upper.value}`)
      .addIntermediate('Interpolation weight (t)', t, `(${value} - ${lower.value}) / (${upper.value} - ${lower.value})`)
      .addIntermediate('HR difference', upper.hazardRatio - lower.hazardRatio)
      .addReferences(references)
      .complete();

    return { hr, provenance: builder.build() };
  }

  /**
   * Categorical HR with provenance
   */
  private calculateCategoricalHRWithProvenance(
    value: string,
    mapping: CategoricalRiskMapping,
    factor: RiskFactorDescriptor,
    calculationId: string,
    inputPath: string
  ): { hr: number; provenance: ProvenanceChain } {
    const references = ReferenceExtractor.getFactorReferences(factor);

    const category = mapping.categories.find(cat => {
      if (Array.isArray(cat.value)) {
        return cat.value.includes(value);
      }
      return cat.value === value;
    });

    const hr = category?.hazardRatio || 1.0;
    const categoryValue = category?.value || 'unknown';
    const categoryStr = Array.isArray(categoryValue) ? categoryValue.join(', ') : categoryValue;

    // Add category-specific reference if available
    if (category?.citation) {
      references.push({
        citation: category.citation,
        doi: category.doi,
        notes: `Category "${categoryStr}": HR=${hr}`
      });
    }

    const builder = new ProvenanceBuilder(calculationId);
    builder
      .addStep()
      .operation({ type: 'categorical', category: value, categories: mapping.categories.map(c => Array.isArray(c.value) ? c.value.join(', ') : c.value as string) })
      .addInput(ProvenanceBuilder.userInput(value, inputPath, factor.name))
      .setOutput(ProvenanceBuilder.diseaseModel(hr, factor.factorId, 'categorical', 'Hazard Ratio'))
      .setFormula(`HR = ${hr} (category: "${value}")`)
      .setExplanation(`Direct lookup for categorical value`)
      .addReferences(references)
      .complete();

    return { hr, provenance: builder.build() };
  }

  /**
   * Boolean HR with provenance
   */
  private calculateBooleanHRWithProvenance(
    value: boolean,
    mapping: BooleanRiskMapping,
    factor: RiskFactorDescriptor,
    calculationId: string,
    inputPath: string
  ): { hr: number; provenance: ProvenanceChain } {
    const references = ReferenceExtractor.getFactorReferences(factor);
    const hr = value ? mapping.trueHazardRatio : mapping.falseHazardRatio;

    const builder = new ProvenanceBuilder(calculationId);
    builder
      .addStep()
      .operation({ type: 'boolean', condition: value ? 'true' : 'false' })
      .addInput(ProvenanceBuilder.userInput(value, inputPath, factor.name))
      .setOutput(ProvenanceBuilder.diseaseModel(hr, factor.factorId, 'boolean', 'Hazard Ratio'))
      .setFormula(`HR = ${hr} (${value ? 'true' : 'false'})`)
      .setExplanation(`Boolean factor: ${value ? 'present' : 'absent'}`)
      .addReferences(references)
      .complete();

    return { hr, provenance: builder.build() };
  }

  /**
   * Derived HR with provenance
   */
  private calculateDerivedHRWithProvenance(
    profile: UserProfile,
    factor: RiskFactorDescriptor,
    calculationId: string
  ): { hr: number; provenance: ProvenanceChain } {
    const mapping = factor.mapping as any; // DerivedRiskMapping with strategy
    const references = ReferenceExtractor.getFactorReferences(factor);
    const builder = new ProvenanceBuilder(calculationId);

    switch (mapping.strategy) {
      case 'has_condition': {
        const hasIt = hasCondition(profile, mapping.conditionId);
        const hr = hasIt ? mapping.presentHR : mapping.absentHR;

        builder
          .addStep()
          .operation({ type: 'boolean', condition: hasIt ? 'present' : 'absent' })
          .addInput(ProvenanceBuilder.userInput(hasIt, 'medicalHistory.conditions', `Has ${mapping.conditionId}`))
          .setOutput(ProvenanceBuilder.diseaseModel(hr, factor.factorId, 'has_condition', 'Hazard Ratio'))
          .setFormula(`HR = ${hr} (condition ${hasIt ? 'present' : 'absent'})`)
          .setExplanation(`Check if user has condition: ${mapping.conditionId}`)
          .addReferences(references)
          .complete();

        return { hr, provenance: builder.build() };
      }
      case 'bmi_lookup': {
        const bmi = calculateBMI(profile);
        if (bmi === null) {
          return {
            hr: 1.0,
            provenance: builder
              .addStep()
              .operation({ type: 'boolean', condition: 'BMI not available' })
              .setOutput(ProvenanceBuilder.constant(1.0, 'default_hr', 'Hazard Ratio'))
              .setFormula('HR = 1.0 (BMI missing)')
              .complete()
              .build()
          };
        }

        return this.lookupHRWithProvenance(bmi, mapping.points, factor, calculationId, 'biometrics.weight+height', references);
      }
      case 'formula':
      default: {
        // Placeholder for Phase 2
        const hr = 1.0;
        builder
          .addStep()
          .operation({ type: 'boolean', condition: 'Derived formula (not implemented)' })
          .addInput(ProvenanceBuilder.constant('placeholder', 'derived_input', 'Derived input'))
          .setOutput(ProvenanceBuilder.constant(hr, 'derived_hr', 'Hazard Ratio'))
          .setFormula('HR = 1.0 (derived - not yet implemented)')
          .complete();

        return { hr, provenance: builder.build() };
      }
    }
  }
}
