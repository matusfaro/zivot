import { UserProfile } from '../../types/user';
import { DiseaseRisk, FactorContribution, ModifierContribution } from '../../types/risk/calculation';
import { DiseaseModel, BaselineRiskCurve } from '../../types/knowledge/disease';
import { MortalityModifier } from '../../types/knowledge/mortalityModifier';
import { FactorAdjuster } from '../adjusters/FactorAdjuster';
import { ModifierAdjuster } from '../modifiers/ModifierAdjuster';
import { UncertaintyCalculator } from '../aggregators/UncertaintyCalculator';
import { calculateAge } from '../../utils/dataExtraction';
import { ProvenanceBuilder, createInterpolationProvenance } from '../provenance/ProvenanceBuilder';
import { ProvenanceChain, ProvenanceValue, Reference } from '../../types/risk/provenance';
import { ReferenceExtractor } from '../provenance/ReferenceExtractor';

export class BaseCalculator {
  protected model: DiseaseModel;
  protected modifiers: MortalityModifier[];
  protected factorAdjuster: FactorAdjuster;
  protected modifierAdjuster: ModifierAdjuster;
  protected uncertaintyCalculator: UncertaintyCalculator;

  constructor(model: DiseaseModel, modifiers?: MortalityModifier[]) {
    this.model = model;
    this.modifiers = modifiers || [];
    this.factorAdjuster = new FactorAdjuster();
    this.modifierAdjuster = new ModifierAdjuster();
    this.uncertaintyCalculator = new UncertaintyCalculator();
  }

  /**
   * Main calculation method - orchestrates the risk calculation pipeline
   */
  async calculate(profile: UserProfile): Promise<DiseaseRisk> {
    const calculationId = `${this.model.metadata.id}-${Date.now()}`;
    const provenanceBuilder = new ProvenanceBuilder(calculationId);

    // Add model-level references
    const modelReferences = ReferenceExtractor.getModelReferences(this.model);
    modelReferences.forEach(ref => provenanceBuilder.addMethodologyReference(ref));

    // Step 1: Calculate baseline risk with provenance
    const baselineResult = this.calculateBaselineRiskWithProvenance(profile, calculationId);
    let baselineRisk = baselineResult.risk;
    const originalBaseline = baselineRisk; // Track for contributions

    // Step 2: Apply mortality modifiers to baseline (NEW)
    let cumulativeModifierHR = 1.0;
    const modifierContributions: ModifierContribution[] = [];

    if (this.modifiers.length > 0) {
      for (const modifier of this.modifiers) {
        const hr = this.modifierAdjuster.calculateHazardRatio(profile, modifier);
        if (hr !== null) {
          cumulativeModifierHR *= hr;
          modifierContributions.push({
            modifierId: modifier.metadata.id,
            modifierName: modifier.metadata.name,
            hazardRatio: hr,
            contribution: baselineRisk * (hr - 1),
            category: modifier.metadata.category,
          });
        }
      }

      // Apply cumulative modifier effect to baseline
      baselineRisk = originalBaseline * cumulativeModifierHR;

      if (modifierContributions.length > 0) {
        console.log(
          `[${this.model.metadata.id}] Applied ${modifierContributions.length} modifiers: baseline ${originalBaseline.toFixed(4)} → ${baselineRisk.toFixed(4)}`
        );
      }
    }

    // Step 3: Apply disease-specific risk factor adjustments with provenance
    const { adjustedRisk, contributions, hrProvenance } = this.applyFactorAdjustmentsWithProvenance(
      profile,
      baselineRisk,
      calculationId
    );

    // Step 4: Calculate confidence and uncertainty
    const confidence = this.uncertaintyCalculator.calculateConfidence(
      profile,
      this.model.riskFactors
    );

    const range = this.uncertaintyCalculator.calculateRange(
      adjustedRisk,
      confidence,
      contributions
    );

    // Build complete provenance chain
    const provenance = this.buildCompleteProvenance(
      provenanceBuilder,
      baselineResult,
      hrProvenance,
      adjustedRisk
    );

    return {
      diseaseId: this.model.metadata.id,
      diseaseName: this.model.metadata.name,
      timeframe: this.model.metadata.timeframe,
      baselineRisk: originalBaseline, // Original, unmodified baseline
      modifiedBaselineRisk: baselineRisk, // After applying modifiers
      adjustedRisk,
      absoluteRiskIncrease: adjustedRisk - originalBaseline,
      confidence,
      range,
      modifierContributions: modifierContributions.length > 0 ? modifierContributions : undefined,
      factorContributions: contributions,
      provenance, // NEW: Complete calculation provenance
    };
  }

  /**
   * Calculate baseline risk from age/sex/ethnicity
   */
  protected calculateBaselineRisk(profile: UserProfile): number {
    // Extract age and sex
    const age = calculateAge(profile);
    const sex = profile.demographics?.biologicalSex?.value;

    if (!age) {
      throw new Error(`${this.model.metadata.name}: Age is required for risk calculation`);
    }

    // Find applicable baseline curve
    const curve = this.findApplicableCurve(profile, sex, age);

    // Interpolate risk at given age
    return this.interpolateRisk(curve.ageRiskMapping, age);
  }

  /**
   * Apply risk factor adjustments using multiplicative hazard ratios
   */
  protected applyFactorAdjustments(
    profile: UserProfile,
    baselineRisk: number
  ): { adjustedRisk: number; contributions: FactorContribution[] } {
    const contributions: FactorContribution[] = [];
    let cumulativeHR = 1.0;

    for (const factorDesc of this.model.riskFactors) {
      const hr = this.factorAdjuster.calculateHazardRatio(profile, factorDesc);

      if (hr !== null) {
        cumulativeHR *= hr;

        contributions.push({
          factorId: factorDesc.factorId,
          factorName: factorDesc.name,
          hazardRatio: hr,
          contribution: baselineRisk * (hr - 1), // Absolute risk increase from this factor
          modifiable: factorDesc.modifiable,
          category: factorDesc.category || 'Other',
        });
      }
    }

    const adjustedRisk = baselineRisk * cumulativeHR;

    // Sort contributions by absolute magnitude (biggest impact first)
    contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    return { adjustedRisk, contributions };
  }

  /**
   * Find the most applicable baseline risk curve
   */
  private findApplicableCurve(profile: UserProfile, sex?: string, age?: number): BaselineRiskCurve {
    const ethnicity = profile.demographics?.ethnicity?.value;
    const region = profile.demographics?.country?.value || profile.demographics?.region?.value;

    // Score each curve by how well it matches
    const scoredCurves = this.model.baselineRisk.curves.map(curve => {
      let score = 0;

      // Sex match (high priority)
      if (curve.applicability.sex === sex) {
        score += 100;
      } else if (!curve.applicability.sex) {
        score += 50; // Generic curve
      }

      // Ethnicity match
      if (ethnicity && curve.applicability.ethnicity?.includes(ethnicity)) {
        score += 30;
      } else if (!curve.applicability.ethnicity) {
        score += 15; // Generic
      }

      // Region match
      if (region && curve.applicability.region?.includes(region)) {
        score += 20;
      } else if (!curve.applicability.region) {
        score += 10; // Generic
      }

      // Age range match
      if (age && curve.applicability.ageRange) {
        const [minAge, maxAge] = curve.applicability.ageRange;
        if (age >= minAge && age <= maxAge) {
          score += 10;
        }
      }

      return { curve, score };
    });

    // Sort by score (highest first)
    scoredCurves.sort((a, b) => b.score - a.score);

    // Return best match
    if (scoredCurves.length > 0 && scoredCurves[0].score > 0) {
      return scoredCurves[0].curve;
    }

    // Fallback to default curve
    const defaultId = this.model.baselineRisk.defaultCurve;
    const defaultCurve = this.model.baselineRisk.curves.find(c => c.id === defaultId);

    if (defaultCurve) {
      return defaultCurve;
    }

    // Last resort: use first curve
    return this.model.baselineRisk.curves[0];
  }

  /**
   * Interpolate risk at a specific age from age-risk mapping
   */
  private interpolateRisk(points: Array<{ age: number; risk: number }>, age: number): number {
    const sorted = [...points].sort((a, b) => a.age - b.age);

    // Exact match
    const exact = sorted.find(p => p.age === age);
    if (exact) return exact.risk;

    // Find bounding points
    let lower = sorted[0];
    let upper = sorted[sorted.length - 1];

    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].age <= age && sorted[i + 1].age >= age) {
        lower = sorted[i];
        upper = sorted[i + 1];
        break;
      }
    }

    // Extrapolate if outside range (with warning)
    if (age < sorted[0].age) {
      console.warn(`Age ${age} below minimum age ${sorted[0].age}, using minimum risk`);
      return sorted[0].risk;
    }
    if (age > sorted[sorted.length - 1].age) {
      console.warn(`Age ${age} above maximum age ${sorted[sorted.length - 1].age}, using maximum risk`);
      return sorted[sorted.length - 1].risk;
    }

    // Linear interpolation
    const t = (age - lower.age) / (upper.age - lower.age);
    return lower.risk + t * (upper.risk - lower.risk);
  }

  // ========================================
  // Provenance-emitting methods
  // ========================================

  /**
   * Calculate baseline risk with full provenance
   */
  private calculateBaselineRiskWithProvenance(
    profile: UserProfile,
    calculationId: string
  ): { risk: number; provenance: ProvenanceChain; curve: BaselineRiskCurve } {
    // Extract age and sex
    const age = calculateAge(profile);
    const sex = profile.demographics?.biologicalSex?.value;

    if (!age) {
      throw new Error(`${this.model.metadata.name}: Age is required for risk calculation`);
    }

    // Find applicable baseline curve with scoring
    const { curve, scoredCurves } = this.findApplicableCurveWithScoring(profile, sex, age);

    // Get reference for the curve
    const curveReference = ReferenceExtractor.getBaselineReference(curve);

    // Interpolate risk at given age
    const risk = this.interpolateRisk(curve.ageRiskMapping, age);

    // Build provenance for curve selection + interpolation
    const builder = new ProvenanceBuilder(`${calculationId}-baseline`);

    // Step 1: Curve selection
    builder
      .addStep()
      .operation({
        type: 'curve_selection',
        criteria: {
          sex: sex ? 100 : 0,
          ethnicity: profile.demographics?.ethnicity?.value ? 30 : 0,
          region: profile.demographics?.country?.value || profile.demographics?.region?.value ? 20 : 0,
        },
        candidateCurves: scoredCurves.map(sc => ({ curveId: sc.curve.id, score: sc.score })),
      })
      .addInput(
        ProvenanceBuilder.userInput(age, 'demographics.dateOfBirth', 'Age', 'years')
      )
      .addInput(
        ProvenanceBuilder.userInput(sex || 'unknown', 'demographics.biologicalSex', 'Sex')
      )
      .setOutput({
        value: curve.id,
        source: { type: 'baseline_data', curveId: curve.id, age, interpolated: false },
        label: 'Selected Baseline Curve',
        reference: curveReference,
      })
      .setFormula(`Selected curve "${curve.id}" (score: ${scoredCurves[0]?.score || 0})`)
      .setExplanation(`Selected most applicable baseline risk curve based on demographics`)
      .addReferences(curveReference ? [curveReference] : [])
      .complete();

    // Step 2: Risk interpolation
    const sorted = [...curve.ageRiskMapping].sort((a, b) => a.age - b.age);
    const exact = sorted.find(p => p.age === age);

    if (exact) {
      // Exact match - no interpolation needed
      builder
        .addStep()
        .operation({ type: 'lookup', table: curve.id, key: age, interpolated: false })
        .addInput(ProvenanceBuilder.userInput(age, 'demographics.dateOfBirth', 'Age', 'years'))
        .setOutput(
          ProvenanceBuilder.baselineData(exact.risk, curve.id, age, 'Baseline Risk', false, curveReference)
        )
        .setFormula(`Baseline risk = ${(exact.risk * 100).toFixed(2)}% (exact match for age ${age})`)
        .setExplanation(`Direct lookup in baseline risk curve`)
        .addReferences(curveReference ? [curveReference] : [])
        .complete();
    } else {
      // Interpolation needed
      let lower = sorted[0];
      let upper = sorted[sorted.length - 1];

      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].age <= age && sorted[i + 1].age >= age) {
          lower = sorted[i];
          upper = sorted[i + 1];
          break;
        }
      }

      const t = (age - lower.age) / (upper.age - lower.age);

      builder
        .addStep()
        .operation({ type: 'interpolate', between: [lower.age, upper.age] })
        .addInput(ProvenanceBuilder.userInput(age, 'demographics.dateOfBirth', 'Age', 'years'))
        .addInput(
          ProvenanceBuilder.baselineData(
            lower.risk,
            curve.id,
            lower.age,
            `Risk at age ${lower.age}`,
            false,
            curveReference
          )
        )
        .addInput(
          ProvenanceBuilder.baselineData(
            upper.risk,
            curve.id,
            upper.age,
            `Risk at age ${upper.age}`,
            false,
            curveReference
          )
        )
        .setOutput(
          ProvenanceBuilder.baselineData(risk, curve.id, age, 'Baseline Risk', true, curveReference)
        )
        .setFormula(
          `Baseline = ${(lower.risk * 100).toFixed(2)}% + ((${age} - ${lower.age}) / (${upper.age} - ${lower.age})) × (${(upper.risk * 100).toFixed(2)}% - ${(lower.risk * 100).toFixed(2)}%) = ${(risk * 100).toFixed(2)}%`
        )
        .setExplanation(`Linear interpolation of baseline risk for age ${age}`)
        .addIntermediate('Interpolation weight (t)', t, `(${age} - ${lower.age}) / (${upper.age} - ${lower.age})`)
        .addIntermediate('Risk difference', (upper.risk - lower.risk) * 100, `${(upper.risk * 100).toFixed(2)}% - ${(lower.risk * 100).toFixed(2)}%`)
        .addReferences(curveReference ? [curveReference] : [])
        .complete();
    }

    const provenance = builder.build();

    return { risk, provenance, curve };
  }

  /**
   * Find applicable curve with scoring information
   */
  private findApplicableCurveWithScoring(
    profile: UserProfile,
    sex?: string,
    age?: number
  ): { curve: BaselineRiskCurve; scoredCurves: Array<{ curve: BaselineRiskCurve; score: number }> } {
    const ethnicity = profile.demographics?.ethnicity?.value;
    const region = profile.demographics?.country?.value || profile.demographics?.region?.value;

    // Score each curve by how well it matches
    const scoredCurves = this.model.baselineRisk.curves.map(curve => {
      let score = 0;

      // Sex match (high priority)
      if (curve.applicability.sex === sex) {
        score += 100;
      } else if (!curve.applicability.sex) {
        score += 50; // Generic curve
      }

      // Ethnicity match
      if (ethnicity && curve.applicability.ethnicity?.includes(ethnicity)) {
        score += 30;
      } else if (!curve.applicability.ethnicity) {
        score += 15; // Generic
      }

      // Region match
      if (region && curve.applicability.region?.includes(region)) {
        score += 20;
      } else if (!curve.applicability.region) {
        score += 10; // Generic
      }

      // Age range match
      if (age && curve.applicability.ageRange) {
        const [minAge, maxAge] = curve.applicability.ageRange;
        if (age >= minAge && age <= maxAge) {
          score += 10;
        }
      }

      return { curve, score };
    });

    // Sort by score (highest first)
    scoredCurves.sort((a, b) => b.score - a.score);

    // Return best match
    if (scoredCurves.length > 0 && scoredCurves[0].score > 0) {
      return { curve: scoredCurves[0].curve, scoredCurves };
    }

    // Fallback to default curve
    const defaultId = this.model.baselineRisk.defaultCurve;
    const defaultCurve = this.model.baselineRisk.curves.find(c => c.id === defaultId);

    if (defaultCurve) {
      return { curve: defaultCurve, scoredCurves };
    }

    // Last resort: use first curve
    return { curve: this.model.baselineRisk.curves[0], scoredCurves };
  }

  /**
   * Apply factor adjustments with provenance
   */
  private applyFactorAdjustmentsWithProvenance(
    profile: UserProfile,
    baselineRisk: number,
    calculationId: string
  ): {
    adjustedRisk: number;
    contributions: FactorContribution[];
    hrProvenance: Array<{ factorId: string; provenance: ProvenanceChain }>;
  } {
    const contributions: FactorContribution[] = [];
    const hrProvenance: Array<{ factorId: string; provenance: ProvenanceChain }> = [];
    let cumulativeHR = 1.0;

    for (const factorDesc of this.model.riskFactors) {
      const result = this.factorAdjuster.calculateHazardRatioWithProvenance(profile, factorDesc);

      if (result) {
        cumulativeHR *= result.hr;

        contributions.push({
          factorId: factorDesc.factorId,
          factorName: factorDesc.name,
          hazardRatio: result.hr,
          contribution: baselineRisk * (result.hr - 1), // Absolute risk increase from this factor
          modifiable: factorDesc.modifiable,
          category: factorDesc.category || 'Other',
          inputValue: result.inputValue,
          provenance: result.provenance,
        });

        hrProvenance.push({
          factorId: factorDesc.factorId,
          provenance: result.provenance,
        });
      }
    }

    const adjustedRisk = baselineRisk * cumulativeHR;

    // Sort contributions by absolute magnitude (biggest impact first)
    contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    return { adjustedRisk, contributions, hrProvenance };
  }

  /**
   * Build complete provenance chain combining baseline and HR calculations
   */
  private buildCompleteProvenance(
    builder: ProvenanceBuilder,
    baselineResult: { risk: number; provenance: ProvenanceChain },
    hrProvenance: Array<{ factorId: string; provenance: ProvenanceChain }>,
    finalRisk: number
  ): ProvenanceChain {
    // Merge all provenance steps
    baselineResult.provenance.steps.forEach(step => builder.addCompletedStep(step));

    hrProvenance.forEach(hp => {
      hp.provenance.steps.forEach(step => builder.addCompletedStep(step));
    });

    // Add final multiplication step if there are risk factors
    if (hrProvenance.length > 0) {
      const hrValues = hrProvenance.map((hp, idx) => ({
        factorId: hp.factorId,
        hr: hp.provenance.finalResult.value as number,
      }));

      const cumulativeHR = hrValues.reduce((acc, hv) => acc * hv.hr, 1.0);

      builder
        .addStep()
        .operation({
          type: 'multiply',
          factors: ['Baseline', ...hrValues.map(hv => hv.factorId)],
        })
        .addInput(
          ProvenanceBuilder.calculated(baselineResult.risk, 0, 'Baseline Risk', '%')
        )
        .addInputs(
          hrValues.map((hv, idx) =>
            ProvenanceBuilder.calculated(hv.hr, idx + 1, `HR (${hv.factorId})`)
          )
        )
        .setOutput(ProvenanceBuilder.calculated(finalRisk, hrProvenance.length + 1, 'Adjusted Risk', '%'))
        .setFormula(
          `Adjusted = ${(baselineResult.risk * 100).toFixed(2)}% × ${hrValues.map(hv => hv.hr.toFixed(2)).join(' × ')} = ${(finalRisk * 100).toFixed(2)}%`
        )
        .setExplanation(`Multiply baseline risk by all hazard ratios`)
        .addIntermediate('Cumulative HR', cumulativeHR, hrValues.map(hv => hv.hr.toFixed(2)).join(' × '))
        .complete();
    }

    builder.setFinalResult(
      ProvenanceBuilder.calculated(finalRisk, builder['chain'].steps!.length - 1, 'Final Risk', '%')
    );

    return builder.build();
  }
}
