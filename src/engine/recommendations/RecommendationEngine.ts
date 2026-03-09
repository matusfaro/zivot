import { UserProfile } from '../../types/user';
import { DiseaseRisk, Recommendation, ModifiableLever } from '../../types/risk/calculation';
import { getValueAtPath, calculateAge } from '../../utils/dataExtraction';

/**
 * Recommendation Engine
 *
 * Generates personalized, evidence-based recommendations to reduce mortality risk
 * based on disease risks and modifiable risk factors.
 *
 * Strategy:
 * 1. Identify top modifiable risk factors
 * 2. Extract current values from profile
 * 3. Define evidence-based target values
 * 4. Estimate effort and timeframe
 * 5. Prioritize by potential impact
 * 6. Generate actionable text
 */
export class RecommendationEngine {

  /**
   * Generate recommendations from disease risks and modifiable levers
   */
  generateRecommendations(
    diseaseRisks: DiseaseRisk[],
    modifiableLevers: ModifiableLever[],
    profile: UserProfile
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Enrich levers with current/target values
    const enrichedLevers = modifiableLevers.map(lever =>
      this.enrichLever(lever, profile)
    );

    // Generate recommendations from top levers
    for (const lever of enrichedLevers.slice(0, 5)) { // Top 5 levers
      const recommendation = this.leverToRecommendation(lever, profile);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Add screening recommendations based on age/risk
    const screeningRecs = this.generateScreeningRecommendations(diseaseRisks, profile);
    recommendations.push(...screeningRecs);

    // Sort by priority and potential impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Within same priority, sort by potential impact
      return (b.potentialImpact || 0) - (a.potentialImpact || 0);
    });
  }

  /**
   * Enrich a modifiable lever with current and target values
   */
  private enrichLever(lever: ModifiableLever, profile: UserProfile): ModifiableLever {
    const { currentValue, targetValue } = this.extractValues(lever, profile);

    return {
      ...lever,
      currentValue,
      targetValue,
    };
  }

  /**
   * Extract current and target values for a modifiable lever
   */
  private extractValues(lever: ModifiableLever, profile: UserProfile): {
    currentValue: number | string | boolean | null;
    targetValue: number | string | boolean | null;
  } {
    // Map factor IDs to profile paths and target values
    const factorMap: Record<string, {
      path: string;
      target: number | string | boolean;
      currentExtractor?: (profile: UserProfile) => any;
    }> = {
      'smoking_status': {
        path: 'lifestyle.smoking.status.value',
        target: 'never',
      },
      'pack_years': {
        path: 'lifestyle.smoking.packYears.value',
        target: 0,
      },
      'bmi': {
        path: 'biometrics',
        target: 23, // Optimal BMI
        currentExtractor: (p) => this.calculateBMI(p),
      },
      'physical_activity': {
        path: 'lifestyle.exercise.moderateMinutesPerWeek.mostRecent.value',
        target: 150, // WHO recommendation
      },
      'alcohol_drinks_per_week': {
        path: 'lifestyle.alcohol.drinksPerWeek.mostRecent.value',
        target: 7, // Moderate drinking (1/day for women, 2 for men)
      },
      'vegetable_servings': {
        path: 'lifestyle.diet.vegetableServingsPerDay.mostRecent.value',
        target: 5, // 5-a-day recommendation
      },
      'fruit_servings': {
        path: 'lifestyle.diet.fruitServingsPerDay.mostRecent.value',
        target: 3,
      },
      'processed_meat_servings': {
        path: 'lifestyle.diet.processedMeatServingsPerWeek.mostRecent.value',
        target: 0, // Avoid processed meat
      },
      'ldl_cholesterol': {
        path: 'labTests.lipidPanel.ldlCholesterol.value',
        target: 100, // < 100 mg/dL optimal
      },
      'systolic_bp': {
        path: 'biometrics.bloodPressure.mostRecent.value.systolic',
        target: 120, // < 120 mmHg optimal
      },
      'hba1c': {
        path: 'labTests.metabolicPanel.hba1c.value',
        target: 5.0, // < 5.7% normal
      },
      'sleep_hours': {
        path: 'lifestyle.sleep.averageHoursPerNight.mostRecent.value',
        target: 7.5, // Optimal 7-8 hours
      },
    };

    const config = factorMap[lever.factorId];
    if (!config) {
      return { currentValue: null, targetValue: null };
    }

    // Extract current value
    let currentValue: any = null;
    if (config.currentExtractor) {
      currentValue = config.currentExtractor(profile);
    } else {
      currentValue = getValueAtPath(profile, config.path);
    }

    return {
      currentValue,
      targetValue: config.target,
    };
  }

  /**
   * Calculate BMI from profile
   */
  private calculateBMI(profile: UserProfile): number | null {
    const height = profile.biometrics?.height?.value;
    const weight = profile.biometrics?.weight?.mostRecent?.value?.value;

    if (!height || !weight) return null;

    // Convert to cm and kg if needed
    const heightCm = typeof height === 'number' ? height : parseFloat(height as any);
    const weightKg = typeof weight === 'number' ? weight : parseFloat(weight as any);

    if (!heightCm || !weightKg) return null;

    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  }

  /**
   * Convert a modifiable lever to a recommendation
   */
  private leverToRecommendation(lever: ModifiableLever, profile: UserProfile): Recommendation | null {
    if (lever.currentValue === null || lever.targetValue === null) {
      return null; // Can't make recommendation without current/target
    }

    // Determine priority based on potential impact and current state
    let priority: Recommendation['priority'];
    const impactPercent = lever.potentialRiskReduction * 100;

    if (impactPercent >= 5) {
      priority = 'critical';
    } else if (impactPercent >= 3) {
      priority = 'high';
    } else if (impactPercent >= 1) {
      priority = 'moderate';
    } else {
      priority = 'low';
    }

    // Generate recommendation text
    const text = this.generateRecommendationText(lever);

    // Determine category
    const category = this.determineCategory(lever.factorId);

    return {
      priority,
      category,
      text,
      potentialImpact: lever.potentialRiskReduction * 100, // Convert to percentage
    };
  }

  /**
   * Generate human-readable recommendation text
   */
  private generateRecommendationText(lever: ModifiableLever): string {
    const { factorId, factorName, currentValue, targetValue, potentialRiskReduction, effort, timeframe, diseases } = lever;

    const impactPercent = (potentialRiskReduction * 100).toFixed(1);
    const diseaseNames = this.formatDiseaseNames(diseases);

    // Factor-specific templates
    const templates: Record<string, string> = {
      'smoking_status': `Quit smoking. Current: Active smoker. This could reduce your 10-year mortality risk by ${impactPercent}%. Smoking affects your risk for ${diseaseNames}. Effort: ${effort}. Timeframe: ${timeframe}.`,
      'pack_years': `Quit smoking to reduce cumulative tobacco exposure. Current pack-years: ${currentValue}. Quitting now could reduce risk by ${impactPercent}%.`,
      'bmi': `Reach a healthy weight (BMI ${targetValue}). Current BMI: ${typeof currentValue === 'number' ? currentValue.toFixed(1) : currentValue}. Weight loss could reduce your risk by ${impactPercent}%. Affects ${diseaseNames}. Effort: ${effort}. Timeframe: ${timeframe}.`,
      'physical_activity': `Increase physical activity to ${targetValue} minutes/week of moderate exercise. Current: ${currentValue} minutes/week. Could reduce risk by ${impactPercent}%. Protects against ${diseaseNames}. Effort: ${effort}. Timeframe: ${timeframe}.`,
      'alcohol_drinks_per_week': `Reduce alcohol consumption to ≤${targetValue} drinks/week. Current: ${currentValue} drinks/week. Could reduce risk by ${impactPercent}%. Affects ${diseaseNames}.`,
      'vegetable_servings': `Increase vegetable intake to ${targetValue} servings/day. Current: ${currentValue} servings/day. Could reduce risk by ${impactPercent}%. Protective against ${diseaseNames}.`,
      'ldl_cholesterol': `Lower LDL cholesterol to <${targetValue} mg/dL (current: ${currentValue} mg/dL). Discuss statin therapy with your doctor. Could reduce risk by ${impactPercent}%.`,
      'systolic_bp': `Lower blood pressure to <${targetValue} mmHg systolic (current: ${currentValue} mmHg). Lifestyle changes and/or medication may be needed. Could reduce risk by ${impactPercent}%.`,
      'hba1c': `Improve blood sugar control (target HbA1c <${targetValue}%, current: ${currentValue}%). Could reduce risk by ${impactPercent}%. Key for preventing diabetes and cardiovascular disease.`,
      'sleep_hours': `Optimize sleep duration to ${targetValue} hours/night (current: ${currentValue} hours). Could reduce risk by ${impactPercent}%. Affects cognitive health and metabolism.`,
    };

    return templates[factorId] || `Improve ${factorName}: Change from ${currentValue} to ${targetValue}. Potential risk reduction: ${impactPercent}%. Effort: ${effort}. Timeframe: ${timeframe}.`;
  }

  /**
   * Determine recommendation category from factor ID
   */
  private determineCategory(factorId: string): string {
    if (factorId.includes('screening') || factorId.includes('colonoscopy') || factorId.includes('mammogram')) {
      return 'Screening';
    }
    if (factorId.includes('smoking') || factorId.includes('exercise') || factorId.includes('alcohol') ||
        factorId.includes('diet') || factorId.includes('sleep') || factorId.includes('bmi')) {
      return 'Lifestyle';
    }
    if (factorId.includes('cholesterol') || factorId.includes('bp') || factorId.includes('hba1c') ||
        factorId.includes('glucose')) {
      return 'Medical';
    }
    return 'Preventive';
  }

  /**
   * Format disease names for display
   */
  private formatDiseaseNames(diseases: string[]): string {
    const nameMap: Record<string, string> = {
      'cvd_10year': 'heart disease',
      'stroke_10year': 'stroke',
      'lung_cancer_10year': 'lung cancer',
      'colorectal_cancer_10year': 'colorectal cancer',
      'type2_diabetes_10year': 'diabetes',
      'copd_mortality_10year': 'COPD',
      'alzheimers_dementia_10year': 'dementia',
    };

    const names = diseases.slice(0, 3).map(d => nameMap[d] || d.replace('_10year', '').replace(/_/g, ' '));

    if (names.length === 0) return 'multiple conditions';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names[0]}, ${names[1]}, and others`;
  }

  /**
   * Generate screening recommendations based on age and risk
   */
  private generateScreeningRecommendations(
    diseaseRisks: DiseaseRisk[],
    profile: UserProfile
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const age = calculateAge(profile);
    const sex = profile.demographics?.biologicalSex?.value;

    if (!age) return recommendations;

    // Colorectal cancer screening (age 45-75)
    if (age >= 45 && age <= 75) {
      const lastColonoscopy = profile.medicalHistory?.screenings?.find(s => s.screeningType === 'colonoscopy');
      const yearsSinceColonoscopy = lastColonoscopy
        ? (Date.now() - lastColonoscopy.date) / (1000 * 60 * 60 * 24 * 365)
        : Infinity;

      if (yearsSinceColonoscopy > 10) {
        recommendations.push({
          priority: 'high',
          category: 'Screening',
          text: `Schedule a colonoscopy (recommended every 10 years for ages 45-75). Early detection significantly improves colorectal cancer outcomes.`,
          potentialImpact: 2.5, // Screening impact estimate
        });
      }
    }

    // Mammogram screening (women 40-74)
    if (sex === 'female' && age >= 40 && age <= 74) {
      const lastMammogram = profile.medicalHistory?.screenings?.find(s => s.screeningType === 'mammogram');
      const yearsSinceMammogram = lastMammogram
        ? (Date.now() - lastMammogram.date) / (1000 * 60 * 60 * 24 * 365)
        : Infinity;

      if (yearsSinceMammogram > 2) {
        recommendations.push({
          priority: 'high',
          category: 'Screening',
          text: `Schedule a mammogram (recommended every 1-2 years for women ages 40-74). Early detection significantly improves breast cancer outcomes.`,
          potentialImpact: 2.0,
        });
      }
    }

    // PSA screening consideration (men 55-69)
    if (sex === 'male' && age >= 55 && age <= 69) {
      const prostateRisk = diseaseRisks.find(d => d.diseaseId === 'prostate_cancer_10year');
      if (prostateRisk && prostateRisk.adjustedRisk > 0.03) {
        recommendations.push({
          priority: 'moderate',
          category: 'Screening',
          text: `Consider discussing PSA screening with your doctor (ages 55-69, shared decision-making recommended). Your prostate cancer risk is ${(prostateRisk.adjustedRisk * 100).toFixed(1)}%.`,
          potentialImpact: 1.0,
        });
      }
    }

    // Lung cancer screening (high-risk smokers)
    if (age >= 50 && age <= 80) {
      const packYears = profile.lifestyle?.smoking?.packYears?.value;
      const smokingStatus = profile.lifestyle?.smoking?.status?.value;

      if (packYears && packYears >= 20 && (smokingStatus === 'current' || smokingStatus === 'former')) {
        recommendations.push({
          priority: 'high',
          category: 'Screening',
          text: `Consider annual low-dose CT lung cancer screening (ages 50-80 with ≥20 pack-year history). Early detection improves survival.`,
          potentialImpact: 2.5,
        });
      }
    }

    return recommendations;
  }
}
