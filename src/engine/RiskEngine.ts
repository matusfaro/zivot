import { UserProfile } from '../types/user';
import {
  RiskCalculationResult,
  DiseaseRisk,
  OverallMortalityRisk,
  RiskInterpretation,
  ModifiableLever,
  ModifierSummary,
  RiskCategory
} from '../types/risk/calculation';
import { DiseaseModel } from '../types/knowledge/disease';
import { MortalityModifier } from '../types/knowledge/mortalityModifier';
import { loadDiseaseKB } from '../knowledge';
import { loadModifierKB } from '../knowledge/modifiers';
import { BaseCalculator } from './calculators/BaseCalculator';
import { ModifierAdjuster } from './modifiers/ModifierAdjuster';
import { OverallMortalityAggregator, AppliedModifier } from './aggregators/OverallMortalityAggregator';
import { RecommendationEngine } from './recommendations/RecommendationEngine';
import { v4 as uuidv4 } from 'uuid';

export class RiskEngine {
  private diseaseKB: Map<string, DiseaseModel> | null = null;
  private modifierKB: Map<string, MortalityModifier> | null = null;
  private calculators: Map<string, BaseCalculator> = new Map();
  private initialized = false;

  /**
   * Initialize the risk engine by loading disease models and mortality modifiers
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Load disease knowledge base
    this.diseaseKB = await loadDiseaseKB();

    // Load mortality modifiers knowledge base
    this.modifierKB = await loadModifierKB();

    // One generic calculator per registered disease model. All behaviour is
    // data-driven from the model JSON — there are no per-disease subclasses,
    // and every model in the knowledge base is automatically included.
    for (const [diseaseId, model] of this.diseaseKB) {
      this.calculators.set(diseaseId, new BaseCalculator(model));
    }

    this.initialized = true;
  }

  /**
   * Calculate all disease risks and overall mortality for a user profile
   */
  async calculate(profile: UserProfile): Promise<RiskCalculationResult> {
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize();
    }

    // Calculate risk for each disease
    const diseaseRisks: DiseaseRisk[] = [];
    const errors: string[] = [];

    for (const [diseaseId, calculator] of this.calculators) {
      try {
        const risk = await calculator.calculate(profile);
        // null = the disease model does not apply to this profile
        // (e.g., no sex-compatible baseline curve)
        if (risk !== null) {
          diseaseRisks.push(risk);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Failed to calculate risk for ${diseaseId}:`, errorMessage);
        errors.push(`${diseaseId}: ${errorMessage}`);
        // Continue with other diseases
      }
    }

    if (diseaseRisks.length === 0) {
      throw new Error(`No disease risks could be calculated. Errors: ${errors.join('; ')}`);
    }

    // Compute all-cause mortality modifiers once for this profile. They are
    // applied at the overall-mortality level (not per disease) so a single
    // lifestyle factor is never compounded across 20 disease models.
    const appliedModifiers = this.computeAppliedModifiers(profile);

    // Aggregate into overall mortality (life-table anchored, modifier-adjusted)
    const aggregator = new OverallMortalityAggregator();
    const overallMortality = aggregator.aggregate(diseaseRisks, profile, appliedModifiers);

    // Summarize modifier effects for display
    const modifierSummary = this.buildModifierSummary(
      appliedModifiers,
      overallMortality.estimatedRisk,
      diseaseRisks.length
    );

    // Identify modifiable levers
    const topLevers = this.identifyTopLevers(diseaseRisks);

    // Generate interpretation (Phase 1: basic, Phase 4+: with recommendations)
    const interpretation = this.generateInterpretation(diseaseRisks, overallMortality, profile, topLevers);

    return {
      calculationId: uuidv4(),
      timestamp: Date.now(),
      profileVersion: profile.version,
      diseaseRisks,
      overallMortality,
      modifierSummary,
      interpretation,
      topLevers,
    };
  }

  /**
   * Compute the hazard ratio of every applicable mortality modifier for this
   * profile (null results — inapplicable or missing data — are skipped).
   */
  private computeAppliedModifiers(profile: UserProfile): AppliedModifier[] {
    if (!this.modifierKB) return [];
    const adjuster = new ModifierAdjuster();
    const applied: AppliedModifier[] = [];

    for (const modifier of this.modifierKB.values()) {
      const hr = adjuster.calculateHazardRatio(profile, modifier);
      if (hr !== null) {
        applied.push({ modifier, hazardRatio: hr });
      }
    }
    return applied;
  }

  /**
   * Summarize modifier effects on the overall mortality estimate.
   * Contribution is leave-one-out on the hazard scale: how much would the
   * final risk change if this modifier were removed?
   */
  private buildModifierSummary(
    appliedModifiers: AppliedModifier[],
    estimatedRisk: number,
    diseaseCount: number
  ): ModifierSummary | undefined {
    if (appliedModifiers.length === 0) {
      return undefined;
    }

    const modifiers = appliedModifiers.map(({ modifier, hazardRatio }) => {
      // Risk without this modifier: undo its hazard-scale effect
      const riskWithout = 1 - Math.pow(1 - estimatedRisk, 1 / hazardRatio);
      const totalContribution = estimatedRisk - riskWithout;

      return {
        modifierId: modifier.metadata.id,
        modifierName: modifier.metadata.name,
        averageHazardRatio: hazardRatio,
        totalContribution,
        affectedDiseases: diseaseCount, // applied once at the overall level
        category: modifier.metadata.category,
      };
    });

    // Sort by total contribution (most protective first)
    modifiers.sort((a, b) => a.totalContribution - b.totalContribution);

    return { modifiers };
  }

  /**
   * Generate human-readable interpretation
   */
  private generateInterpretation(
    diseaseRisks: DiseaseRisk[],
    overallMortality: OverallMortalityRisk,
    profile: UserProfile,
    topLevers: ModifiableLever[]
  ): RiskInterpretation {
    // Categorize overall risk
    const riskPercent = overallMortality.estimatedRisk * 100;
    let riskCategory: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
    let overallSummary: string;

    if (riskPercent < 5) {
      riskCategory = 'very_low';
      overallSummary = 'Your overall mortality risk is very low.';
    } else if (riskPercent < 10) {
      riskCategory = 'low';
      overallSummary = 'Your overall mortality risk is low.';
    } else if (riskPercent < 20) {
      riskCategory = 'moderate';
      overallSummary = 'Your overall mortality risk is moderate.';
    } else if (riskPercent < 30) {
      riskCategory = 'high';
      overallSummary = 'Your overall mortality risk is elevated.';
    } else {
      riskCategory = 'very_high';
      overallSummary = 'Your overall mortality risk is high.';
    }

    // Disease interpretations — label incidence vs mortality outcomes honestly
    const diseaseInterpretations = diseaseRisks.map(disease => {
      const percent = Math.round(disease.adjustedRisk * 100);
      const verb = disease.outcome === 'mortality' ? 'dying from' : 'developing';
      const summary = `Your ${disease.timeframe}-year risk of ${verb} ${disease.diseaseName} is ${percent}%`;

      // Identify top drivers
      const keyDrivers = disease.factorContributions
        .filter(c => Math.abs(c.contribution) > 0.005) // 0.5% absolute impact
        .slice(0, 3)
        .map(c => c.factorName);

      const category = percent < 2 ? 'very_low' : percent < 5 ? 'low' : percent < 15 ? 'moderate' : percent < 30 ? 'high' : 'very_high';

      return {
        diseaseId: disease.diseaseId,
        summary,
        riskCategory: category as RiskCategory,
        keyDrivers,
      };
    });

    // Generate personalized recommendations using RecommendationEngine
    const recommendationEngine = new RecommendationEngine();
    const recommendations = recommendationEngine.generateRecommendations(
      diseaseRisks,
      topLevers,
      profile
    );

    // Comparison to the population average (CDC life-table anchor)
    let comparisonToAverage = '';
    if (overallMortality.populationBaselineRisk !== undefined) {
      const avgPercent = (overallMortality.populationBaselineRisk * 100).toFixed(1);
      const ratio = overallMortality.relativeHazard ?? 1;
      if (ratio > 1.1) {
        comparisonToAverage = `That is about ${ratio.toFixed(1)}× the average ${avgPercent}% for your age and sex.`;
      } else if (ratio < 0.9) {
        comparisonToAverage = `That is below the average ${avgPercent}% for your age and sex (about ${ratio.toFixed(1)}× the population hazard).`;
      } else {
        comparisonToAverage = `That is close to the average ${avgPercent}% for your age and sex.`;
      }
    }

    return {
      overallSummary,
      riskCategory,
      comparisonToAverage,
      diseaseInterpretations,
      recommendations,
    };
  }

  /**
   * Effort/timeframe guidance by factor category. These are UX guidance
   * heuristics for prioritizing behavior change, not clinical claims: e.g.
   * smoking cessation and sustained weight change are long-horizon,
   * lab-driven factors are typically clinician-assisted and faster.
   */
  private leverGuidance(factorId: string, category: string): { effort: ModifiableLever['effort']; timeframe: string } {
    const id = factorId.toLowerCase();
    const cat = category.toLowerCase();
    if (id.includes('smoking') || id.includes('pack_years')) {
      return { effort: 'high', timeframe: '6-12 months' };
    }
    if (id.includes('bmi') || id.includes('weight') || id.includes('obesity')) {
      return { effort: 'high', timeframe: '6-12 months' };
    }
    if (id.includes('alcohol') || id.includes('opioid') || id.includes('benzo')) {
      return { effort: 'high', timeframe: '3-6 months' };
    }
    if (cat.includes('lipid') || cat.includes('lab') || id.includes('cholesterol') || id.includes('bp') || id.includes('blood_pressure') || id.includes('systolic')) {
      return { effort: 'low', timeframe: '3-6 months' };
    }
    if (cat.includes('psychosocial') || cat.includes('social') || id.includes('insomnia') || id.includes('sleep')) {
      return { effort: 'moderate', timeframe: '1-3 months' };
    }
    return { effort: 'moderate', timeframe: '3-6 months' };
  }

  /**
   * The value of this factor that minimizes risk, read from the model's own
   * mapping (lowest-HR point/category, or the low/high end of a linear range).
   */
  private optimalValueForFactor(diseaseId: string, factorId: string): number | string | boolean | null {
    const model = this.diseaseKB?.get(diseaseId);
    const factor = model?.riskFactors.find(f => f.factorId === factorId);
    if (!factor) return null;
    const mapping = factor.mapping as unknown as {
      points?: Array<{ value: number; hazardRatio: number }>;
      categories?: Array<{ value: string | string[]; hazardRatio: number }>;
      trueHazardRatio?: number;
      falseHazardRatio?: number;
      presentHR?: number;
      absentHR?: number;
      coefficients?: { slope?: number };
      validRange?: [number, number];
    };
    if (mapping.points?.length) {
      const best = mapping.points.reduce((a, b) => (b.hazardRatio < a.hazardRatio ? b : a));
      return best.value;
    }
    if (mapping.categories?.length) {
      const best = mapping.categories.reduce((a, b) => (b.hazardRatio < a.hazardRatio ? b : a));
      return Array.isArray(best.value) ? best.value[0] : best.value;
    }
    if (mapping.trueHazardRatio !== undefined && mapping.falseHazardRatio !== undefined) {
      return mapping.trueHazardRatio < mapping.falseHazardRatio;
    }
    if (mapping.presentHR !== undefined && mapping.absentHR !== undefined) {
      return mapping.presentHR < mapping.absentHR;
    }
    if (mapping.coefficients?.slope !== undefined && mapping.validRange) {
      return mapping.coefficients.slope > 0 ? mapping.validRange[0] : mapping.validRange[1];
    }
    return null;
  }

  /**
   * Identify top modifiable levers across all diseases
   */
  private identifyTopLevers(diseaseRisks: DiseaseRisk[]): ModifiableLever[] {
    // Collect all modifiable factors with their impact across diseases
    interface LeverData extends ModifiableLever {
      totalImpact: number;
    }
    const leverMap = new Map<string, LeverData>();

    for (const disease of diseaseRisks) {
      for (const contrib of disease.factorContributions) {
        if (!contrib.modifiable) continue;
        if (contrib.hazardRatio <= 1.05 && contrib.hazardRatio >= 0.95) continue; // Negligible impact

        const existing = leverMap.get(contrib.factorId);
        if (existing) {
          existing.diseases.push(disease.diseaseId);
          existing.totalImpact += Math.abs(contrib.contribution);
          existing.potentialRiskReduction += Math.abs(contrib.contribution);
        } else {
          const guidance = this.leverGuidance(contrib.factorId, contrib.category);
          const rawInput = contrib.inputValue?.value;
          const currentValue =
            typeof rawInput === 'number' || typeof rawInput === 'string' || typeof rawInput === 'boolean'
              ? rawInput
              : null;
          leverMap.set(contrib.factorId, {
            factorId: contrib.factorId,
            factorName: contrib.factorName,
            currentValue,
            targetValue: this.optimalValueForFactor(disease.diseaseId, contrib.factorId),
            potentialRiskReduction: Math.abs(contrib.contribution),
            totalImpact: Math.abs(contrib.contribution),
            effort: guidance.effort,
            timeframe: guidance.timeframe,
            diseases: [disease.diseaseId],
          });
        }
      }
    }

    // Sort by total impact and return top 5
    return Array.from(leverMap.values())
      .sort((a, b) => b.totalImpact - a.totalImpact)
      .slice(0, 5)
      .map(lever => ({
        factorId: lever.factorId,
        factorName: lever.factorName,
        currentValue: lever.currentValue,
        targetValue: lever.targetValue,
        potentialRiskReduction: lever.potentialRiskReduction,
        effort: lever.effort,
        timeframe: lever.timeframe,
        diseases: lever.diseases,
      }));
  }

  /**
   * Get available disease calculators
   */
  getAvailableDiseases(): string[] {
    return Array.from(this.calculators.keys());
  }

  /**
   * Calculate risk for a single disease
   */
  async calculateForDisease(profile: UserProfile, diseaseId: string): Promise<DiseaseRisk | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    const calculator = this.calculators.get(diseaseId);
    if (!calculator) {
      throw new Error(`No calculator found for disease: ${diseaseId}`);
    }

    return calculator.calculate(profile);
  }
}

/**
 * Shared application-wide engine instance. Initialization is idempotent and
 * the knowledge base is static, so every consumer (dashboard, hooks, survey
 * previews) should use this instead of constructing its own engine.
 */
let sharedEngine: RiskEngine | null = null;

export function getSharedRiskEngine(): RiskEngine {
  if (!sharedEngine) {
    sharedEngine = new RiskEngine();
  }
  return sharedEngine;
}
