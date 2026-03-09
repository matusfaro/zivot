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
import { CVDCalculator } from './calculators/CVDCalculator';
import { ColorectalCancerCalculator } from './calculators/ColorectalCancerCalculator';
import { LungCancerCalculator } from './calculators/LungCancerCalculator';
import { DiabetesCalculator } from './calculators/DiabetesCalculator';
import { StrokeCalculator } from './calculators/StrokeCalculator';
import { BreastCancerCalculator } from './calculators/BreastCancerCalculator';
import { ProstateCancerCalculator } from './calculators/ProstateCancerCalculator';
import { COPDCalculator } from './calculators/COPDCalculator';
import { ChronicKidneyDiseaseCalculator } from './calculators/ChronicKidneyDiseaseCalculator';
import { PancreaticCancerCalculator } from './calculators/PancreaticCancerCalculator';
import { LiverDiseaseCalculator } from './calculators/LiverDiseaseCalculator';
import { AlzheimerCalculator } from './calculators/AlzheimerCalculator';
import { MotorVehicleCrashCalculator } from './calculators/MotorVehicleCrashCalculator';
import { FallsCalculator } from './calculators/FallsCalculator';
import { InfluenzaPneumoniaCalculator } from './calculators/InfluenzaPneumoniaCalculator';
import { DrugOverdoseCalculator } from './calculators/DrugOverdoseCalculator';
import { EsophagealCancerCalculator } from './calculators/EsophagealCancerCalculator';
import { LiverCancerCalculator } from './calculators/LiverCancerCalculator';
import { BladderCancerCalculator } from './calculators/BladderCancerCalculator';
import { SuicideCalculator } from './calculators/SuicideCalculator';
import { MelanomaCalculator } from './calculators/MelanomaCalculator';
import { BaseCalculator } from './calculators/BaseCalculator';
import { OverallMortalityAggregator } from './aggregators/OverallMortalityAggregator';
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
    const modifiers = Array.from(this.modifierKB.values());
    console.log(`[RiskEngine] Loaded ${modifiers.length} mortality modifiers`);

    // Initialize calculators for Phase 1 diseases
    const cvdModel = this.diseaseKB.get('cvd_10year');
    const crcModel = this.diseaseKB.get('colorectal_cancer_10year');
    const lungModel = this.diseaseKB.get('lung_cancer_10year');
    const diabetesModel = this.diseaseKB.get('type2_diabetes_10year');

    if (cvdModel) {
      this.calculators.set('cvd_10year', new CVDCalculator(cvdModel, modifiers));
    }
    if (crcModel) {
      this.calculators.set('colorectal_cancer_10year', new ColorectalCancerCalculator(crcModel, modifiers));
    }
    if (lungModel) {
      this.calculators.set('lung_cancer_10year', new LungCancerCalculator(lungModel, modifiers));
    }
    if (diabetesModel) {
      this.calculators.set('type2_diabetes_10year', new DiabetesCalculator(diabetesModel, modifiers));
    }

    // Initialize calculators for Phase 2 diseases
    const strokeModel = this.diseaseKB.get('stroke_10year');
    const breastCancerModel = this.diseaseKB.get('breast_cancer_10year');
    const prostateCancerModel = this.diseaseKB.get('prostate_cancer_10year');

    if (strokeModel) {
      this.calculators.set('stroke_10year', new StrokeCalculator(strokeModel, modifiers));
    }
    if (breastCancerModel) {
      this.calculators.set('breast_cancer_10year', new BreastCancerCalculator(breastCancerModel, modifiers));
    }
    if (prostateCancerModel) {
      this.calculators.set('prostate_cancer_10year', new ProstateCancerCalculator(prostateCancerModel, modifiers));
    }

    // Initialize calculators for Phase 3 diseases
    const copdModel = this.diseaseKB.get('copd_mortality_10year');
    const ckdModel = this.diseaseKB.get('ckd_progression_10year');
    const pancreaticCancerModel = this.diseaseKB.get('pancreatic_cancer_10year');

    if (copdModel) {
      this.calculators.set('copd_mortality_10year', new COPDCalculator(copdModel, modifiers));
    }
    if (ckdModel) {
      this.calculators.set('ckd_progression_10year', new ChronicKidneyDiseaseCalculator(ckdModel, modifiers));
    }
    if (pancreaticCancerModel) {
      this.calculators.set('pancreatic_cancer_10year', new PancreaticCancerCalculator(pancreaticCancerModel, modifiers));
    }

    // Initialize calculators for Phase 4 diseases
    const liverDiseaseModel = this.diseaseKB.get('nafld_cirrhosis_10year');
    const alzheimersModel = this.diseaseKB.get('alzheimers_dementia_10year');

    if (liverDiseaseModel) {
      this.calculators.set('nafld_cirrhosis_10year', new LiverDiseaseCalculator(liverDiseaseModel, modifiers));
    }
    if (alzheimersModel) {
      this.calculators.set('alzheimers_dementia_10year', new AlzheimerCalculator(alzheimersModel, modifiers));
    }

    // Initialize calculators for Phase 5 diseases (External causes & additional cancers)
    const motorVehicleModel = this.diseaseKB.get('motor_vehicle_crash_10year');
    const fallsModel = this.diseaseKB.get('falls_10year');
    const influenzaPneumoniaModel = this.diseaseKB.get('influenza_pneumonia_10year');
    const drugOverdoseModel = this.diseaseKB.get('drug_overdose_10year');
    const esophagealCancerModel = this.diseaseKB.get('esophageal_cancer_10year');
    const liverCancerModel = this.diseaseKB.get('liver_cancer_10year');
    const bladderCancerModel = this.diseaseKB.get('bladder_cancer_10year');
    const suicideModel = this.diseaseKB.get('suicide_10year');
    const melanomaModel = this.diseaseKB.get('melanoma_10year');

    if (motorVehicleModel) {
      this.calculators.set('motor_vehicle_crash_10year', new MotorVehicleCrashCalculator(motorVehicleModel, modifiers));
    }
    if (fallsModel) {
      this.calculators.set('falls_10year', new FallsCalculator(fallsModel, modifiers));
    }
    if (influenzaPneumoniaModel) {
      this.calculators.set('influenza_pneumonia_10year', new InfluenzaPneumoniaCalculator(influenzaPneumoniaModel, modifiers));
    }
    if (drugOverdoseModel) {
      this.calculators.set('drug_overdose_10year', new DrugOverdoseCalculator(drugOverdoseModel, modifiers));
    }
    if (esophagealCancerModel) {
      this.calculators.set('esophageal_cancer_10year', new EsophagealCancerCalculator(esophagealCancerModel, modifiers));
    }
    if (liverCancerModel) {
      this.calculators.set('liver_cancer_10year', new LiverCancerCalculator(liverCancerModel, modifiers));
    }
    if (bladderCancerModel) {
      this.calculators.set('bladder_cancer_10year', new BladderCancerCalculator(bladderCancerModel, modifiers));
    }
    if (suicideModel) {
      this.calculators.set('suicide_10year', new SuicideCalculator(suicideModel, modifiers));
    }
    if (melanomaModel) {
      this.calculators.set('melanoma_10year', new MelanomaCalculator(melanomaModel, modifiers));
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
        diseaseRisks.push(risk);
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

    // Aggregate into overall mortality
    const aggregator = new OverallMortalityAggregator();
    const overallMortality = aggregator.aggregate(diseaseRisks, profile);

    // Aggregate modifier contributions across all diseases
    const modifierSummary = this.aggregateModifierContributions(diseaseRisks);

    // Identify modifiable levers
    const topLevers = this.identifyTopLevers(diseaseRisks, profile);

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
   * Aggregate modifier contributions across all diseases
   */
  private aggregateModifierContributions(diseaseRisks: DiseaseRisk[]): ModifierSummary | undefined {
    const modifierMap = new Map<string, {
      totalContribution: number;
      diseaseCount: number;
      sumHR: number;
      category: string;
      name: string;
    }>();

    // Collect all modifier contributions from all diseases
    for (const disease of diseaseRisks) {
      if (!disease.modifierContributions) continue;

      for (const modifier of disease.modifierContributions) {
        const existing = modifierMap.get(modifier.modifierId);
        if (existing) {
          existing.totalContribution += modifier.contribution;
          existing.diseaseCount++;
          existing.sumHR += modifier.hazardRatio;
        } else {
          modifierMap.set(modifier.modifierId, {
            totalContribution: modifier.contribution,
            diseaseCount: 1,
            sumHR: modifier.hazardRatio,
            category: modifier.category,
            name: modifier.modifierName,
          });
        }
      }
    }

    // If no modifiers were applied, return undefined
    if (modifierMap.size === 0) {
      return undefined;
    }

    // Build summary
    const modifiers = Array.from(modifierMap.entries()).map(([id, data]) => ({
      modifierId: id,
      modifierName: data.name,
      averageHazardRatio: data.sumHR / data.diseaseCount,
      totalContribution: data.totalContribution,
      affectedDiseases: data.diseaseCount,
      category: data.category,
    }));

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

    // Disease interpretations
    const diseaseInterpretations = diseaseRisks.map(disease => {
      const percent = Math.round(disease.adjustedRisk * 100);
      let summary = `Your ${disease.timeframe}-year risk of ${disease.diseaseName} is ${percent}%`;

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

    return {
      overallSummary,
      riskCategory,
      comparisonToAverage: '', // TODO: Phase 4 - Add comparison to population average
      diseaseInterpretations,
      recommendations,
    };
  }

  /**
   * Identify top modifiable levers across all diseases
   */
  private identifyTopLevers(diseaseRisks: DiseaseRisk[], profile: UserProfile): ModifiableLever[] {
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
          leverMap.set(contrib.factorId, {
            factorId: contrib.factorId,
            factorName: contrib.factorName,
            currentValue: null, // TODO: Extract from profile
            targetValue: null, // TODO: Define target
            potentialRiskReduction: Math.abs(contrib.contribution),
            totalImpact: Math.abs(contrib.contribution),
            effort: 'moderate' as const, // TODO: Estimate based on factor type
            timeframe: '3-6 months', // TODO: Estimate
            diseases: [disease.diseaseId],
          });
        }
      }
    }

    // Sort by total impact and return top 5
    const levers = Array.from(leverMap.values())
      .sort((a, b) => b.totalImpact - a.totalImpact)
      .slice(0, 5)
      .map(({ totalImpact, ...lever }) => lever);

    return levers;
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
  async calculateForDisease(profile: UserProfile, diseaseId: string): Promise<DiseaseRisk> {
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
