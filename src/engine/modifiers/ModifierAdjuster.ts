import { UserProfile } from '../../types/user';
import {
  MortalityModifier,
  BooleanModifierMapping,
  CategoricalModifierMapping,
  ContinuousModifierMapping,
} from '../../types/knowledge/mortalityModifier';
import { getValueAtPath, calculateAge } from '../../utils/dataExtraction';

/**
 * ModifierAdjuster - Calculates hazard ratios for mortality modifiers
 *
 * Mortality modifiers are factors that affect overall mortality risk
 * independently of specific disease pathways (e.g., dog ownership, social connections).
 *
 * This class:
 * 1. Checks if a modifier is applicable to a user
 * 2. Extracts the relevant value from the user profile
 * 3. Maps that value to a hazard ratio
 */
export class ModifierAdjuster {
  /**
   * Calculate hazard ratio for a mortality modifier
   *
   * @param profile User profile data
   * @param modifier Mortality modifier definition
   * @returns Hazard ratio (null if not applicable or data missing)
   */
  calculateHazardRatio(profile: UserProfile, modifier: MortalityModifier): number | null {
    // Step 1: Check if modifier is applicable to this user
    if (!this.isApplicable(profile, modifier)) {
      return null;
    }

    // Step 2: Extract value from user profile
    const value = this.extractModifierValue(profile, modifier);
    if (value === null || value === undefined) {
      return null; // No data available
    }

    // Step 3: Map value to hazard ratio based on mapping type
    switch (modifier.mapping.type) {
      case 'boolean':
        return this.calculateBooleanHR(value as boolean, modifier.mapping);

      case 'categorical':
        return this.calculateCategoricalHR(value as string, modifier.mapping);

      case 'continuous':
        return this.calculateContinuousHR(value as number, modifier.mapping);

      default:
        console.warn(`[Modifier] Unknown mapping type for ${modifier.metadata.id}`);
        return null;
    }
  }

  /**
   * Check if a modifier is applicable to this user
   */
  private isApplicable(profile: UserProfile, modifier: MortalityModifier): boolean {
    const age = calculateAge(profile);
    const sex = profile.demographics?.biologicalSex?.value;

    // Age range check
    if (modifier.applicability.ageRange && age) {
      const [minAge, maxAge] = modifier.applicability.ageRange;
      if (age < minAge || age > maxAge) {
        console.log(
          `[Modifier] ${modifier.metadata.id} not applicable: age ${age} outside range [${minAge}, ${maxAge}]`
        );
        return false;
      }
    }

    // Sex check
    if (modifier.applicability.sex && sex && sex !== modifier.applicability.sex) {
      console.log(
        `[Modifier] ${modifier.metadata.id} not applicable: sex ${sex} != required ${modifier.applicability.sex}`
      );
      return false;
    }

    return true;
  }

  /**
   * Extract modifier value from user profile
   * Tries primary path first, then alternatives
   */
  private extractModifierValue(profile: UserProfile, modifier: MortalityModifier): number | string | boolean | null {
    // Try primary field
    const primaryField = modifier.requiredFields[0];
    if (!primaryField) {
      console.warn(`[Modifier] ${modifier.metadata.id} has no required fields defined`);
      return null;
    }

    let value = this.getValueFromPath(profile, primaryField.path);

    if (value !== null && value !== undefined) {
      return value;
    }

    // Try alternatives if primary fails
    if (primaryField.alternatives) {
      for (const altPath of primaryField.alternatives) {
        value = this.getValueFromPath(profile, altPath);
        if (value !== null && value !== undefined) {
          return value;
        }
      }
    }

    return null;
  }

  /**
   * Get value from a path, handling DataPoints and TimeSeries
   */
  private getValueFromPath(profile: UserProfile, path: string): number | string | boolean | null {
    const rawValue = getValueAtPath(profile, path);
    if (rawValue === null || rawValue === undefined) {
      return null;
    }

    // Unwrap DataPoint if needed (has .value and .provenance properties)
    if (
      typeof rawValue === 'object' &&
      rawValue !== null &&
      'value' in rawValue &&
      'provenance' in rawValue
    ) {
      const unwrapped = (rawValue as { value: unknown }).value;
      if (
        typeof unwrapped === 'number' ||
        typeof unwrapped === 'string' ||
        typeof unwrapped === 'boolean'
      ) {
        return unwrapped;
      }
      return null;
    }

    // Return if it's a primitive type
    if (
      typeof rawValue === 'number' ||
      typeof rawValue === 'string' ||
      typeof rawValue === 'boolean'
    ) {
      return rawValue;
    }

    return null;
  }

  /**
   * Calculate HR for boolean modifiers
   */
  private calculateBooleanHR(value: boolean, mapping: BooleanModifierMapping): number {
    return value ? mapping.trueHazardRatio : mapping.falseHazardRatio;
  }

  /**
   * Calculate HR for categorical modifiers
   */
  private calculateCategoricalHR(value: string, mapping: CategoricalModifierMapping): number {
    for (const category of mapping.categories) {
      const categoryValues = Array.isArray(category.value) ? category.value : [category.value];
      if (categoryValues.includes(value)) {
        return category.hazardRatio;
      }
    }

    // Default to reference category (HR = 1.0)
    const referenceCategory = mapping.categories.find(
      (cat) => cat.value === mapping.referenceCategory
    );
    return referenceCategory?.hazardRatio || 1.0;
  }

  /**
   * Calculate HR for continuous modifiers
   */
  private calculateContinuousHR(value: number, mapping: ContinuousModifierMapping): number {
    // Validate range
    if (mapping.validRange) {
      const [min, max] = mapping.validRange;
      if (value < min || value > max) {
        console.warn(
          `[Modifier] Value ${value} outside valid range [${min}, ${max}], clamping`
        );
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
        console.warn(`[Modifier] Unknown continuous strategy: ${mapping.strategy}`);
        return 1.0;
    }
  }

  /**
   * Linear hazard ratio: HR = exp(slope * value + intercept)
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
  private lookupHR(
    value: number,
    points: Array<{ value: number; hazardRatio: number }>
  ): number {
    const sorted = [...points].sort((a, b) => a.value - b.value);

    // Exact match
    const exact = sorted.find((p) => p.value === value);
    if (exact) return exact.hazardRatio;

    // Extrapolate if below minimum
    if (value <= sorted[0].value) {
      return sorted[0].hazardRatio;
    }

    // Extrapolate if above maximum
    if (value >= sorted[sorted.length - 1].value) {
      return sorted[sorted.length - 1].hazardRatio;
    }

    // Find bounding points and interpolate
    for (let i = 0; i < sorted.length - 1; i++) {
      if (value >= sorted[i].value && value <= sorted[i + 1].value) {
        const x0 = sorted[i].value;
        const x1 = sorted[i + 1].value;
        const y0 = sorted[i].hazardRatio;
        const y1 = sorted[i + 1].hazardRatio;

        // Linear interpolation
        const t = (value - x0) / (x1 - x0);
        return y0 + t * (y1 - y0);
      }
    }

    return 1.0;
  }
}
