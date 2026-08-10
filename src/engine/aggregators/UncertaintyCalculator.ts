import { RiskFactorDescriptor } from '../../types/knowledge/riskFactor';
import { ConfidenceScore, FactorContribution } from '../../types/risk/calculation';

export class UncertaintyCalculator {
  /**
   * Calculate confidence score based on data completeness.
   *
   * @param riskFactors        All risk factors in the disease model
   * @param availableFactorIds Factor IDs for which the FactorAdjuster actually
   *                           produced a hazard ratio. Using the adjuster's own
   *                           result (instead of re-walking profile paths)
   *                           correctly counts derived factors such as BMI,
   *                           family history, and condition checks.
   */
  calculateConfidence(
    riskFactors: RiskFactorDescriptor[],
    availableFactorIds: Set<string>
  ): ConfidenceScore {
    // Separate factors by evidence strength
    const strongFactors = riskFactors.filter(f => f.evidenceStrength === 'strong');
    const moderateFactors = riskFactors.filter(f => f.evidenceStrength === 'moderate');

    // Count how many strong factors we have data for
    const strongAvailable = strongFactors.filter(f => availableFactorIds.has(f.factorId)).length;
    const moderateAvailable = moderateFactors.filter(f => availableFactorIds.has(f.factorId)).length;

    // Calculate completeness ratios
    const strongCompleteness = strongFactors.length > 0 ? strongAvailable / strongFactors.length : 0;
    const moderateCompleteness = moderateFactors.length > 0 ? moderateAvailable / moderateFactors.length : 0;

    // Weighted score (strong factors matter more)
    const score = (strongCompleteness * 0.7) + (moderateCompleteness * 0.3);

    // Missing critical data
    const missingCriticalData: string[] = strongFactors
      .filter(f => !availableFactorIds.has(f.factorId))
      .map(f => f.name);

    // Determine confidence level
    let level: ConfidenceScore['level'];
    if (score >= 0.9) {
      level = 'very_high';
    } else if (score >= 0.7) {
      level = 'high';
    } else if (score >= 0.5) {
      level = 'moderate';
    } else if (score >= 0.3) {
      level = 'low';
    } else {
      level = 'very_low';
    }

    return {
      level,
      score,
      missingCriticalData: missingCriticalData.length > 0 ? missingCriticalData : undefined,
    };
  }

  /**
   * Calculate uncertainty range around the point estimate
   * Wider range for lower confidence
   */
  calculateRange(
    estimatedRisk: number,
    confidence: ConfidenceScore,
    contributions: FactorContribution[]
  ): [number, number] {
    // Base range multiplier based on confidence
    let rangeMultiplier: number;
    switch (confidence.level) {
      case 'very_high':
        rangeMultiplier = 0.15; // ±15%
        break;
      case 'high':
        rangeMultiplier = 0.25; // ±25%
        break;
      case 'moderate':
        rangeMultiplier = 0.40; // ±40%
        break;
      case 'low':
        rangeMultiplier = 0.60; // ±60%
        break;
      case 'very_low':
        rangeMultiplier = 0.80; // ±80%
        break;
    }

    // Adjust for volatility in factor contributions
    const hasHighImpactFactors = contributions.some(c =>
      Math.abs(c.hazardRatio - 1.0) > 2.0
    );
    if (hasHighImpactFactors) {
      rangeMultiplier *= 1.2; // Widen range if there are high-impact factors
    }

    const rangeDelta = estimatedRisk * rangeMultiplier;
    const low = Math.max(0, estimatedRisk - rangeDelta);
    const high = Math.min(1.0, estimatedRisk + rangeDelta);

    return [low, high];
  }

}
