import { UserProfile } from '../../types/user';
import { RiskFactorDescriptor } from '../../types/knowledge/riskFactor';
import { ConfidenceScore, FactorContribution } from '../../types/risk/calculation';

export class UncertaintyCalculator {
  /**
   * Calculate confidence score based on data completeness
   *
   * Confidence is based on:
   * 1. How many high-impact factors are known
   * 2. Quality of data sources (lab vs user-entered)
   * 3. Recency of data
   */
  calculateConfidence(
    profile: UserProfile,
    riskFactors: RiskFactorDescriptor[]
  ): ConfidenceScore {
    // Separate factors by evidence strength
    const strongFactors = riskFactors.filter(f => f.evidenceStrength === 'strong');
    const moderateFactors = riskFactors.filter(f => f.evidenceStrength === 'moderate');

    // Count how many strong factors we have data for
    const strongAvailable = strongFactors.filter(f => this.hasFactorData(profile, f)).length;
    const moderateAvailable = moderateFactors.filter(f => this.hasFactorData(profile, f)).length;

    // Calculate completeness ratios
    const strongCompleteness = strongFactors.length > 0 ? strongAvailable / strongFactors.length : 0;
    const moderateCompleteness = moderateFactors.length > 0 ? moderateAvailable / moderateFactors.length : 0;

    // Weighted score (strong factors matter more)
    const score = (strongCompleteness * 0.7) + (moderateCompleteness * 0.3);

    // Missing critical data
    const missingCriticalData: string[] = strongFactors
      .filter(f => !this.hasFactorData(profile, f))
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

  /**
   * Check if we have data for a specific factor
   */
  private hasFactorData(profile: UserProfile, factor: RiskFactorDescriptor): boolean {
    // For now, simplified check
    // In production, would use FactorAdjuster to actually try extracting
    const primaryPath = factor.requiredFields[0]?.path;
    if (!primaryPath) return false;

    // Basic check: does the path exist?
    const parts = primaryPath.split('.');
    let current: unknown = profile;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return false;
      }
      if (typeof current !== 'object') {
        return false;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current !== null && current !== undefined;
  }

  /**
   * Assess data quality issues (e.g., old data, user-entered vs lab)
   */
  assessDataQuality(profile: UserProfile): string[] {
    const issues: string[] = [];

    // Check for missing critical demographics
    if (!profile.demographics?.dateOfBirth) {
      issues.push('Missing date of birth');
    }
    if (!profile.demographics?.biologicalSex) {
      issues.push('Missing biological sex');
    }

    // Check data recency (simplified)
    const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);

    // Check if blood pressure is recent
    const bpRecent = profile.biometrics?.bloodPressure?.mostRecent;
    if (bpRecent && bpRecent.provenance.timestamp < oneYearAgo) {
      issues.push('Blood pressure data is over 1 year old');
    }

    // Check if lab tests are recent
    const labTests = profile.labTests;
    if (labTests?.lipidPanel?.ldlCholesterol) {
      if (labTests.lipidPanel.ldlCholesterol.provenance.timestamp < oneYearAgo) {
        issues.push('Cholesterol data is over 1 year old');
      }
    }

    return issues;
  }
}
