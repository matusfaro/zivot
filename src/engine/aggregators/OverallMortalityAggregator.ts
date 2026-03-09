import { DiseaseRisk, OverallMortalityRisk } from '../../types/risk/calculation';
import { UserProfile } from '../../types/user';
import { generateMortalityCurve } from '../utils/mortalityCurve';
import { calculateAge } from '../../utils/dataExtraction';
import { ProvenanceBuilder } from '../provenance/ProvenanceBuilder';
import { ProvenanceChain, Reference } from '../../types/risk/provenance';
import { ReferenceExtractor } from '../provenance/ReferenceExtractor';

export class OverallMortalityAggregator {
  /**
   * Aggregate disease-specific risks into overall mortality
   * Uses complement rule: P(alive) = P(no CVD) × P(no cancer) × ...
   * Then: P(death) = 1 - P(alive)
   */
  aggregate(diseaseRisks: DiseaseRisk[], profile?: UserProfile): OverallMortalityRisk {
    if (diseaseRisks.length === 0) {
      return {
        timeframe: 10,
        estimatedRisk: 0,
        range: [0, 0],
        confidence: { level: 'very_low', score: 0 },
        diseaseContributions: [],
      };
    }

    // Build provenance for the aggregation
    const calculationId = `overall-mortality-${Date.now()}`;
    const provenance = this.buildAggregationProvenance(diseaseRisks, calculationId);

    // Assume all diseases have same timeframe (10 years for Phase 1)
    const timeframe = diseaseRisks[0].timeframe;

    // Calculate overall survival probability (complement rule)
    let survivalProb = 1.0;
    let survivalProbLow = 1.0;
    let survivalProbHigh = 1.0;

    for (const disease of diseaseRisks) {
      survivalProb *= (1 - disease.adjustedRisk);
      survivalProbLow *= (1 - disease.range[1]); // High risk = low survival
      survivalProbHigh *= (1 - disease.range[0]); // Low risk = high survival
    }

    // Cap all risk values at 99.9% (0.999)
    const estimatedRisk = Math.min(1 - survivalProb, 0.999);
    const rangeLow = Math.min(1 - survivalProbHigh, 0.999);
    const rangeHigh = Math.min(1 - survivalProbLow, 0.999);

    // Calculate disease contributions (proportion of overall risk)
    const diseaseContributions = diseaseRisks.map(disease => {
      // Marginal contribution: how much does this disease add to overall mortality?
      // P(death) - P(death without this disease)
      const survivalWithoutThis = survivalProb / (1 - disease.adjustedRisk);
      const mortalityWithoutThis = 1 - survivalWithoutThis;
      const marginalContribution = estimatedRisk - mortalityWithoutThis;

      return {
        diseaseId: disease.diseaseId,
        contribution: marginalContribution / estimatedRisk, // Proportion (0-1)
      };
    });

    // Aggregate confidence (use weighted average, weighted by contribution)
    const weightedConfidenceScore = diseaseRisks.reduce((sum, disease, index) => {
      const contribution = diseaseContributions[index].contribution;
      return sum + (disease.confidence.score * contribution);
    }, 0);

    // Determine confidence level
    let confidenceLevel: OverallMortalityRisk['confidence']['level'];
    if (weightedConfidenceScore >= 0.9) {
      confidenceLevel = 'very_high';
    } else if (weightedConfidenceScore >= 0.7) {
      confidenceLevel = 'high';
    } else if (weightedConfidenceScore >= 0.5) {
      confidenceLevel = 'moderate';
    } else if (weightedConfidenceScore >= 0.3) {
      confidenceLevel = 'low';
    } else {
      confidenceLevel = 'very_low';
    }

    // Collect all missing critical data across diseases
    const allMissingData = new Set<string>();
    diseaseRisks.forEach(disease => {
      disease.confidence.missingCriticalData?.forEach(data => allMissingData.add(data));
    });

    // Generate mortality curve for visualization if profile available
    let mortalityCurve;
    if (profile) {
      const currentAge = calculateAge(profile);
      const sex = profile.demographics?.biologicalSex?.value;
      if (currentAge) {
        mortalityCurve = generateMortalityCurve(currentAge, estimatedRisk, sex);
      }
    }

    return {
      timeframe,
      estimatedRisk,
      range: [rangeLow, rangeHigh],
      confidence: {
        level: confidenceLevel,
        score: weightedConfidenceScore,
        missingCriticalData: allMissingData.size > 0 ? Array.from(allMissingData) : undefined,
      },
      diseaseContributions,
      mortalityCurve,
      provenance, // NEW: Complete aggregation provenance
    };
  }

  /**
   * Format overall risk for human interpretation
   * E.g., "If we took 100 people like you, about 18 might die in the next 10 years"
   */
  formatOverallRisk(risk: OverallMortalityRisk): string {
    const percent = Math.round(risk.estimatedRisk * 100);
    const per100 = Math.round(risk.estimatedRisk * 100);
    const survivors = 100 - per100;

    const rangeLowPer100 = Math.round(risk.range[0] * 100);
    const rangeHighPer100 = Math.round(risk.range[1] * 100);

    let message = `Your estimated ${risk.timeframe}-year mortality risk is ${percent}% `;
    message += `(range: ${rangeLowPer100}%–${rangeHighPer100}%). `;
    message += `In other words, if we took 100 people similar to you, about ${per100} might not survive the next ${risk.timeframe} years, `;
    message += `while ${survivors} would still be alive.`;

    return message;
  }

  /**
   * Identify the top disease contributors to overall mortality
   */
  getTopContributors(risk: OverallMortalityRisk, count: number = 3): Array<{
    diseaseId: string;
    contribution: number;
  }> {
    return [...risk.diseaseContributions]
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, count);
  }

  // ========================================
  // Provenance-emitting methods
  // ========================================

  /**
   * Build complete provenance for overall mortality aggregation
   */
  private buildAggregationProvenance(
    diseaseRisks: DiseaseRisk[],
    calculationId: string
  ): ProvenanceChain {
    const builder = new ProvenanceBuilder(calculationId);

    // Add methodology reference
    const competingRisksRef = ReferenceExtractor.getCompetingRisksReference();
    builder.addMethodologyReference(competingRisksRef);

    // Calculate survival probabilities for all diseases
    const survivalProbs = diseaseRisks.map((disease) => ({
      diseaseId: disease.diseaseId,
      diseaseName: disease.diseaseName,
      risk: disease.adjustedRisk,
      survivalProb: 1 - disease.adjustedRisk,
    }));

    // Overall survival probability
    const overallSurvival = survivalProbs.reduce((acc, sp) => acc * sp.survivalProb, 1.0);
    const overallMortality = Math.min(1 - overallSurvival, 0.999);

    // Step 1: Convert individual disease risks to survival probabilities (grouped)
    builder
      .addStep()
      .operation({ type: 'complement', probability: 'disease_risks' })
      .addInputs(
        survivalProbs.map((sp, idx) =>
          ProvenanceBuilder.calculated(
            sp.risk,
            idx,
            sp.diseaseName,
            '%'
          )
        )
      )
      .setOutput(
        ProvenanceBuilder.calculated(
          survivalProbs.length,
          0,
          'Survival probabilities',
          ''
        )
      )
      .setFormula(
        `P(survive disease) = 1 - disease_risk`
      )
      .setExplanation(
        `Convert each disease risk to survival probability (e.g., 2% CVD risk → 98% survival)`
      )
      .addIntermediate(
        'Calculated survival probabilities',
        survivalProbs.length,
        survivalProbs
          .slice(0, 5)
          .map(sp => `${sp.diseaseName}: ${(sp.survivalProb * 100).toFixed(2)}%`)
          .join(', ') + (survivalProbs.length > 5 ? ` + ${survivalProbs.length - 5} more` : '')
      )
      .complete();

    // Step 2: Multiply all survival probabilities (competing risks)
    const diseaseIds = diseaseRisks.map(d => d.diseaseId);
    const survivalProbsFormattedShort = survivalProbs.length > 3
      ? `${survivalProbs.slice(0, 3).map(sp => `${(sp.survivalProb * 100).toFixed(2)}%`).join(' × ')} × ... (${survivalProbs.length} total)`
      : survivalProbs.map(sp => `${(sp.survivalProb * 100).toFixed(2)}%`).join(' × ');

    builder
      .addStep()
      .operation({
        type: 'competing_risks',
        diseases: diseaseIds,
      })
      .addInputs(
        survivalProbs.map((sp, idx) =>
          ProvenanceBuilder.calculated(
            sp.survivalProb,
            diseaseRisks.length + idx,
            `P(survive ${sp.diseaseName})`,
            ''
          )
        )
      )
      .setOutput(
        ProvenanceBuilder.calculated(
          overallSurvival,
          diseaseRisks.length * 2,
          'P(survive all diseases)',
          ''
        )
      )
      .setFormula(
        `P(survive all) = ${survivalProbsFormattedShort} = ${(overallSurvival * 100).toFixed(2)}%`
      )
      .setExplanation(
        `Multiply survival probabilities using competing risks methodology (assumes independence)`
      )
      .addIntermediate(
        'Product of all survival probabilities',
        overallSurvival,
        `${diseaseRisks.length} diseases multiplied together`
      )
      .addReferences([competingRisksRef])
      .complete();

    // Step 3: Calculate overall mortality (complement of survival)
    builder
      .addStep()
      .operation({ type: 'complement', probability: 'overall_survival' })
      .addInput(
        ProvenanceBuilder.calculated(
          overallSurvival,
          diseaseRisks.length * 2,
          'P(survive all diseases)',
          ''
        )
      )
      .setOutput(
        ProvenanceBuilder.calculated(
          overallMortality,
          diseaseRisks.length * 2 + 1,
          'Overall 10-Year Mortality Risk',
          '%'
        )
      )
      .setFormula(
        `Overall mortality = 1 - ${(overallSurvival * 100).toFixed(2)}% = ${(overallMortality * 100).toFixed(2)}%`
      )
      .setExplanation(`Overall mortality is the complement of surviving all diseases`)
      .complete();

    // Step 4: Calculate top disease contributions (show only top 5)
    const contributionsData = diseaseRisks.map((disease, idx) => {
      const survivalWithoutThis = overallSurvival / (1 - disease.adjustedRisk);
      const mortalityWithoutThis = 1 - survivalWithoutThis;
      const marginalContribution = overallMortality - mortalityWithoutThis;
      const proportionalContribution = marginalContribution / overallMortality;

      return {
        disease,
        idx,
        survivalWithoutThis,
        mortalityWithoutThis,
        marginalContribution,
        proportionalContribution,
      };
    });

    // Sort by contribution and take top 5
    const topContributions = [...contributionsData]
      .sort((a, b) => b.proportionalContribution - a.proportionalContribution)
      .slice(0, 5);

    // Add a single step showing top contributors
    builder
      .addStep()
      .operation({
        type: 'add',
        terms: ['overall_mortality', 'disease_contributions'],
      })
      .addInput(
        ProvenanceBuilder.calculated(overallMortality, diseaseRisks.length * 2 + 1, 'Overall Mortality', '%')
      )
      .setOutput(
        ProvenanceBuilder.calculated(
          topContributions.length,
          diseaseRisks.length * 2 + 2,
          'Disease contributions',
          ''
        )
      )
      .setFormula(
        `Contribution = (overall_mortality - mortality_without_disease) / overall_mortality`
      )
      .setExplanation(
        `Calculate each disease's marginal contribution (how much risk it adds). Top ${topContributions.length} shown.`
      )
      .addIntermediate(
        'Top contributors',
        topContributions.length,
        topContributions
          .map(c => `${c.disease.diseaseName}: ${(c.proportionalContribution * 100).toFixed(1)}%`)
          .join(', ')
      )
      .complete();

    // Set final result
    builder.setFinalResult(
      ProvenanceBuilder.calculated(
        overallMortality,
        builder['chain'].steps!.length - 1,
        'Overall 10-Year Mortality Risk',
        '%'
      )
    );

    return builder.build();
  }
}
