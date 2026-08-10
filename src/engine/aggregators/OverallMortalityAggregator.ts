import { DiseaseRisk, OverallMortalityRisk } from '../../types/risk/calculation';
import { UserProfile } from '../../types/user';
import { MortalityModifier } from '../../types/knowledge/mortalityModifier';
import { generateMortalityCurve, getBaselineAnnualMortality } from '../utils/mortalityCurve';
import { calculateAge } from '../../utils/dataExtraction';
import { ProvenanceBuilder } from '../provenance/ProvenanceBuilder';
import { ProvenanceChain } from '../../types/risk/provenance';
import { ReferenceExtractor } from '../provenance/ReferenceExtractor';

/** A mortality modifier together with the hazard ratio computed for this user */
export interface AppliedModifier {
  modifier: MortalityModifier;
  hazardRatio: number;
}

/** Convert a 10-year risk (probability) to a cumulative hazard */
const toHazard = (risk: number): number => -Math.log(1 - Math.min(risk, 0.999));

/** Convert a cumulative hazard back to a 10-year risk */
const toRisk = (hazard: number): number => 1 - Math.exp(-hazard);

export class OverallMortalityAggregator {
  /**
   * Aggregate disease-specific risks into overall mortality.
   *
   * Methodology:
   * 1. Complement rule over the disease models (assumes independence):
   *    P(any) = 1 − ∏(1 − riskᵢ), for both personal (adjusted) and
   *    population-baseline risks.
   * 2. Life-table anchoring: the disease models mix incidence and mortality
   *    outcomes, so their raw complement-rule sum overstates all-cause death.
   *    We therefore use the models to estimate the RELATIVE hazard of this
   *    profile vs. the population baseline, and apply that relative hazard to
   *    the CDC life-table 10-year mortality for the person's age/sex:
   *      H_final = H_lifetable × (H_personal / H_baseline)
   *    (the same relative-risk-scaling methodology the lifetime curve uses).
   * 3. Mortality modifiers (all-cause factors such as social connections) are
   *    applied ONCE here on the hazard scale — not per disease — so they are
   *    not compounded across 20 disease models:
   *      risk = 1 − (1 − risk)^HRmod
   */
  aggregate(
    diseaseRisks: DiseaseRisk[],
    profile?: UserProfile,
    appliedModifiers: AppliedModifier[] = []
  ): OverallMortalityRisk {
    if (diseaseRisks.length === 0) {
      return {
        timeframe: 10,
        estimatedRisk: 0,
        range: [0, 0],
        confidence: { level: 'very_low', score: 0 },
        diseaseContributions: [],
      };
    }

    // Assume all diseases share the same timeframe (10 years)
    const timeframe = diseaseRisks[0].timeframe;

    // ---- Step 1: complement rule over the disease models ----
    let survivalProb = 1.0;
    let baselineSurvivalProb = 1.0;
    let survivalProbLow = 1.0;
    let survivalProbHigh = 1.0;

    for (const disease of diseaseRisks) {
      survivalProb *= (1 - disease.adjustedRisk);
      baselineSurvivalProb *= (1 - disease.baselineRisk);
      survivalProbLow *= (1 - disease.range[1]); // High risk = low survival
      survivalProbHigh *= (1 - disease.range[0]); // Low risk = high survival
    }

    const rawPersonalRisk = Math.min(1 - survivalProb, 0.999);
    const rawBaselineRisk = Math.min(1 - baselineSurvivalProb, 0.999);

    // ---- Step 2: relative hazard vs. population baseline ----
    const personalHazard = toHazard(rawPersonalRisk);
    const baselineHazard = toHazard(rawBaselineRisk);
    const relativeHazard = baselineHazard > 0 ? personalHazard / baselineHazard : 1.0;

    // ---- Step 3: anchor to CDC life-table 10-year mortality ----
    const age = profile ? calculateAge(profile) : null;
    const sex = profile?.demographics?.biologicalSex?.value;
    let lifeTableRisk: number | null = null;
    if (age !== null) {
      let lifeTableSurvival = 1.0;
      for (let year = 0; year < timeframe; year++) {
        lifeTableSurvival *= 1 - getBaselineAnnualMortality(age + year, sex);
      }
      lifeTableRisk = 1 - lifeTableSurvival;
    }

    const anchoredHazard =
      lifeTableRisk !== null ? toHazard(lifeTableRisk) * relativeHazard : personalHazard;

    // ---- Step 4: apply mortality modifiers once, on the hazard scale ----
    const modifierHR = appliedModifiers.reduce((acc, m) => acc * m.hazardRatio, 1.0);
    const finalHazard = anchoredHazard * modifierHR;
    const estimatedRisk = Math.min(toRisk(finalHazard), 0.999);

    // Scale the uncertainty range by the same overall hazard factor so the
    // interval stays consistent with the point estimate
    const hazardScale = personalHazard > 0 ? finalHazard / personalHazard : 1.0;
    const rawLow = Math.min(1 - survivalProbHigh, 0.999);
    const rawHigh = Math.min(1 - survivalProbLow, 0.999);
    const rangeLow = Math.min(toRisk(toHazard(rawLow) * hazardScale), 0.999);
    const rangeHigh = Math.min(toRisk(toHazard(rawHigh) * hazardScale), 0.999);

    // ---- Disease contributions (proportions of the modeled risk) ----
    // Proportions are computed on the uncalibrated complement-rule risk; the
    // calibration is a uniform scaling, so proportions are unaffected.
    const diseaseContributions = diseaseRisks.map(disease => {
      if (rawPersonalRisk <= 0) {
        return { diseaseId: disease.diseaseId, contribution: 0 };
      }
      // Marginal contribution: P(death) − P(death without this disease)
      const survivalWithoutThis = survivalProb / (1 - disease.adjustedRisk);
      const mortalityWithoutThis = 1 - survivalWithoutThis;
      const marginalContribution = rawPersonalRisk - mortalityWithoutThis;

      return {
        diseaseId: disease.diseaseId,
        contribution: marginalContribution / rawPersonalRisk, // Proportion (0-1)
      };
    });

    // ---- Confidence: contribution-weighted average, properly normalized ----
    const totalContributionWeight = diseaseContributions.reduce(
      (sum, c) => sum + Math.max(c.contribution, 0),
      0
    );
    const weightedConfidenceScore =
      totalContributionWeight > 0
        ? diseaseRisks.reduce((sum, disease, index) => {
            const weight = Math.max(diseaseContributions[index].contribution, 0);
            return sum + disease.confidence.score * weight;
          }, 0) / totalContributionWeight
        : diseaseRisks.reduce((sum, d) => sum + d.confidence.score, 0) / diseaseRisks.length;

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

    // Build provenance for the aggregation (including calibration + modifiers)
    const calculationId = `overall-mortality-${Date.now()}`;
    const provenance = this.buildAggregationProvenance(diseaseRisks, calculationId, {
      rawPersonalRisk,
      rawBaselineRisk,
      relativeHazard,
      lifeTableRisk,
      modifierHR,
      appliedModifiers,
      estimatedRisk,
    });

    // Generate mortality curve for visualization if profile available
    let mortalityCurve;
    if (profile && age !== null) {
      mortalityCurve = generateMortalityCurve(age, estimatedRisk, sex);
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
      provenance,
    };
  }

  // ========================================
  // Provenance-emitting methods
  // ========================================

  /**
   * Build complete provenance for overall mortality aggregation
   */
  private buildAggregationProvenance(
    diseaseRisks: DiseaseRisk[],
    calculationId: string,
    extras: {
      rawPersonalRisk: number;
      rawBaselineRisk: number;
      relativeHazard: number;
      lifeTableRisk: number | null;
      modifierHR: number;
      appliedModifiers: AppliedModifier[];
      estimatedRisk: number;
    }
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

    // Step 5: Life-table calibration (relative-hazard anchoring)
    if (extras.lifeTableRisk !== null) {
      const lifeTableRef = {
        citation:
          'CDC/NCHS National Vital Statistics System, U.S. Life Tables (age/sex-specific annual mortality rates)',
        url: 'https://www.cdc.gov/nchs/products/life_tables.htm',
      };
      const calibratedRisk = toRisk(toHazard(extras.lifeTableRisk) * extras.relativeHazard);
      builder
        .addStep()
        .operation({ type: 'multiply', factors: ['life_table_hazard', 'relative_hazard'] })
        .addInput(
          ProvenanceBuilder.calculated(extras.rawPersonalRisk, 0, 'Modeled personal risk', '%')
        )
        .addInput(
          ProvenanceBuilder.calculated(extras.rawBaselineRisk, 1, 'Modeled population-baseline risk', '%')
        )
        .addInput(
          ProvenanceBuilder.constant(extras.lifeTableRisk, 'life_table_10yr', 'CDC life-table 10-year mortality')
        )
        .setOutput(
          ProvenanceBuilder.calculated(calibratedRisk, 2, 'Calibrated 10-Year Mortality Risk', '%')
        )
        .setFormula(
          `Calibrated = 1 − exp(−H_lifetable × RR), where RR = H_personal / H_baseline = ${extras.relativeHazard.toFixed(3)}`
        )
        .setExplanation(
          'The disease models mix incidence and mortality outcomes, so their raw sum overstates all-cause death. ' +
            'The models are used to estimate the relative hazard vs. the population baseline, which is applied to ' +
            'CDC life-table mortality for this age/sex.'
        )
        .addIntermediate('Relative hazard (RR)', extras.relativeHazard)
        .addIntermediate('Life-table 10-year mortality', extras.lifeTableRisk)
        .addReferences([lifeTableRef])
        .complete();
    }

    // Step 6: All-cause mortality modifiers (applied once, hazard scale)
    if (extras.appliedModifiers.length > 0) {
      builder
        .addStep()
        .operation({
          type: 'multiply',
          factors: extras.appliedModifiers.map(m => m.modifier.metadata.id),
        })
        .addInputs(
          extras.appliedModifiers.map((m, idx) =>
            ProvenanceBuilder.calculated(m.hazardRatio, idx, `HR (${m.modifier.metadata.name})`)
          )
        )
        .setOutput(
          ProvenanceBuilder.calculated(extras.estimatedRisk, extras.appliedModifiers.length, 'Final 10-Year Mortality Risk', '%')
        )
        .setFormula(
          `Final = 1 − (1 − calibrated)^HRmod, HRmod = ${extras.appliedModifiers
            .map(m => m.hazardRatio.toFixed(2))
            .join(' × ')} = ${extras.modifierHR.toFixed(3)}`
        )
        .setExplanation(
          'All-cause mortality modifiers (social, environmental, cultural) applied once at the overall level on the ' +
            'hazard scale. Note: these modifiers are correlated lifestyle measures; multiplying them treats them as ' +
            'independent and likely overstates their combined effect.'
        )
        .complete();
    }

    // Set final result
    builder.setFinalResult(
      ProvenanceBuilder.calculated(
        extras.estimatedRisk,
        builder['chain'].steps!.length - 1,
        'Overall 10-Year Mortality Risk',
        '%'
      )
    );

    return builder.build();
  }
}
