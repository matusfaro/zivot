/**
 * Builds the complete relationship graph by extracting data from:
 * - Field registry (user profile fields)
 * - Survey questions (SwipeSurvey.tsx)
 * - Disease models (knowledge/diseases/*.json)
 * - Risk factors (within disease models)
 *
 * Cross-references all entities to build relationship mappings.
 */

import { loadDiseaseKB, getDiseaseModel } from '../knowledge';
import { FIELD_REGISTRY } from './fieldRegistry';
import {
  FieldDefinition,
  QuestionDefinition,
  QuestionType,
  RiskFactorNode,
  DiseaseNode,
  RelationshipGraph,
} from '../types/registry';
import { DiseaseModel } from '../types/knowledge/disease';

export class RelationshipGraphBuilder {
  private fields = new Map<string, FieldDefinition>();
  private questions = new Map<string, QuestionDefinition>();
  private riskFactors = new Map<string, RiskFactorNode>();
  private diseases = new Map<string, DiseaseNode>();

  /**
   * Build the complete relationship graph
   */
  async build(): Promise<RelationshipGraph> {
    console.log('[RelationshipGraph] Building relationship graph...');

    // Step 1: Load field definitions from registry
    this.extractFieldDefinitions();
    console.log(`[RelationshipGraph] Loaded ${this.fields.size} field definitions`);

    // Step 2: Extract question definitions (manually mapped for MVP)
    this.extractQuestionDefinitions();
    console.log(`[RelationshipGraph] Loaded ${this.questions.size} question definitions`);

    // Step 3: Extract disease models and risk factors
    await this.extractDiseaseDefinitions();
    console.log(
      `[RelationshipGraph] Loaded ${this.diseases.size} diseases, ${this.riskFactors.size} risk factors`
    );

    // Step 4: Build relationship mappings
    this.buildRelationships();
    console.log(`[RelationshipGraph] Built relationship mappings`);

    // Step 5: Create reverse lookups
    const reverseLookups = this.buildReverseLookups();
    console.log(`[RelationshipGraph] Created reverse lookups`);

    return {
      fields: this.fields,
      questions: this.questions,
      riskFactors: this.riskFactors,
      diseases: this.diseases,
      ...reverseLookups,
    };
  }

  /**
   * Load field definitions from field registry
   */
  private extractFieldDefinitions(): void {
    for (const field of FIELD_REGISTRY) {
      // Clone the field to avoid mutating the registry
      this.fields.set(field.id, { ...field });
    }
  }

  /**
   * Extract question definitions from SwipeSurvey.tsx
   * NOTE: For MVP, this is manually mapped. In future, could parse SwipeSurvey.tsx automatically.
   */
  private extractQuestionDefinitions(): void {
    // Map of question ID → field paths it updates
    // Based on analysis of SwipeSurvey.tsx profileUpdate functions
    const questionFieldMappings: Record<string, { question: string; category: string; type: QuestionType; fields: string[] }> = {
      // Lifestyle
      smoking: {
        question: 'Do you smoke cigarettes?',
        category: 'Lifestyle',
        type: 'select',
        fields: ['lifestyle.smoking.status', 'lifestyle.smoking.packsPerDay', 'lifestyle.smoking.packYears'],
      },
      exercise: {
        question: 'Do you exercise regularly?',
        category: 'Lifestyle',
        type: 'slider',
        fields: ['lifestyle.exercise.moderateMinutesPerWeek'],
      },
      alcohol: {
        question: 'Do you drink alcohol heavily?',
        category: 'Lifestyle',
        type: 'slider',
        fields: ['lifestyle.alcohol.drinksPerWeek'],
      },
      diet: {
        question: 'Do you eat a healthy diet?',
        category: 'Lifestyle',
        type: 'slider',
        fields: ['lifestyle.diet.vegetableServingsPerDay'],
      },
      sleep: {
        question: 'Do you get enough sleep?',
        category: 'Lifestyle',
        type: 'slider',
        fields: ['lifestyle.sleep.averageHoursPerNight'],
      },

      // Demographics
      biologicalSex: {
        question: 'What is your biological sex?',
        category: 'Demographics',
        type: 'binary',
        fields: ['demographics.biologicalSex'],
      },

      // Medical Conditions (uses medicalHistory.conditions array)
      diabetes: {
        question: 'Do you have diabetes?',
        category: 'Medical Conditions',
        type: 'binary',
        fields: ['medicalHistory.conditions'],
      },
      hypertension: {
        question: 'Do you have high blood pressure?',
        category: 'Medical Conditions',
        type: 'binary',
        fields: ['medicalHistory.conditions'],
      },
      heartDisease: {
        question: 'Do you have heart disease?',
        category: 'Medical Conditions',
        type: 'binary',
        fields: ['medicalHistory.conditions'],
      },
      stroke: {
        question: 'Have you had a stroke?',
        category: 'Medical Conditions',
        type: 'binary',
        fields: ['medicalHistory.conditions'],
      },
      cancer: {
        question: 'Have you had cancer?',
        category: 'Medical Conditions',
        type: 'binary',
        fields: ['medicalHistory.conditions'],
      },
      copd: {
        question: 'Do you have COPD or emphysema?',
        category: 'Medical Conditions',
        type: 'binary',
        fields: ['medicalHistory.conditions'],
      },
      kidneyDisease: {
        question: 'Do you have kidney disease?',
        category: 'Medical Conditions',
        type: 'binary',
        fields: ['medicalHistory.conditions'],
      },
      liverDisease: {
        question: 'Do you have liver disease?',
        category: 'Medical Conditions',
        type: 'binary',
        fields: ['medicalHistory.conditions'],
      },
      depression: {
        question: 'Do you have depression?',
        category: 'Medical Conditions',
        type: 'binary',
        fields: ['medicalHistory.conditions'],
      },
      asthma: {
        question: 'Do you have asthma?',
        category: 'Medical Conditions',
        type: 'binary',
        fields: ['medicalHistory.conditions'],
      },
      anxiety: {
        question: 'Do you have anxiety disorder?',
        category: 'Mental Health',
        type: 'binary',
        fields: ['medicalHistory.conditions'],
      },
      bipolar: {
        question: 'Do you have bipolar disorder?',
        category: 'Mental Health',
        type: 'binary',
        fields: ['medicalHistory.conditions'],
      },
      ptsd: {
        question: 'Do you have PTSD?',
        category: 'Mental Health',
        type: 'binary',
        fields: ['medicalHistory.conditions'],
      },
      eatingDisorder: {
        question: 'Do you have an eating disorder?',
        category: 'Mental Health',
        type: 'binary',
        fields: ['medicalHistory.conditions'],
      },

      // Family History
      familyHeartDisease: {
        question: 'Family history of heart disease?',
        category: 'Family History',
        type: 'binary',
        fields: ['medicalHistory.familyHistory'],
      },
      familyCancer: {
        question: 'Family history of cancer?',
        category: 'Family History',
        type: 'binary',
        fields: ['medicalHistory.familyHistory'],
      },

      // Medications
      statin: {
        question: 'Are you taking a statin?',
        category: 'Medications',
        type: 'binary',
        fields: ['medicalHistory.medications.statin'],
      },
      bloodPressureMeds: {
        question: 'Taking blood pressure medication?',
        category: 'Medications',
        type: 'binary',
        fields: ['medicalHistory.medications.takesBloodPressureMeds'],
      },

      // Biometrics / Lab Tests
      obesity: {
        question: 'Are you significantly overweight?',
        category: 'Biometrics',
        type: 'binary',
        fields: ['biometrics.weight', 'biometrics.height', 'derived.bmi'],
      },
      highCholesterol: {
        question: 'Do you have high cholesterol?',
        category: 'Lab Tests',
        type: 'binary',
        fields: ['labTests.lipidPanel.totalCholesterol'],
      },
      prediabetic: {
        question: 'Are you pre-diabetic?',
        category: 'Lab Tests',
        type: 'binary',
        fields: ['labTests.metabolicPanel.hba1c', 'labTests.metabolicPanel.glucose'],
      },

      // Preventive Care (uses medicalHistory.screenings array)
      fluVaccine: {
        question: 'Do you get annual flu vaccine?',
        category: 'Preventive Care',
        type: 'binary',
        fields: ['medicalHistory.vaccinations.fluVaccineCurrentYear'],
      },
      colonoscopy: {
        question: 'Have you had a colonoscopy (if over 45)?',
        category: 'Preventive Care',
        type: 'binary',
        fields: ['medicalHistory.screenings'],
      },
      mammogram: {
        question: 'Regular mammograms (if female)?',
        category: 'Preventive Care',
        type: 'binary',
        fields: ['medicalHistory.screenings'],
      },
      dentist: {
        question: 'Do you visit dentist regularly?',
        category: 'Preventive Care',
        type: 'binary',
        fields: ['medicalHistory.screenings'],
      },
      vision: {
        question: 'Regular vision checkups?',
        category: 'Preventive Care',
        type: 'binary',
        fields: ['medicalHistory.screenings'],
      },

      // Safety Behaviors
      seatbelt: {
        question: 'Do you always wear a seatbelt?',
        category: 'Safety Behaviors',
        type: 'binary',
        fields: ['lifestyle.drivingHabits.seatBeltUse'],
      },
      texting: {
        question: 'Do you text while driving?',
        category: 'Safety Behaviors',
        type: 'binary',
        fields: ['lifestyle.drivingHabits.phoneUseWhileDriving'],
      },
      speeding: {
        question: 'Do you regularly speed?',
        category: 'Safety Behaviors',
        type: 'binary',
        fields: ['lifestyle.drivingHabits.trafficViolationsPast3Years'],
      },

      // Substance Use
      opioids: {
        question: 'Do you use opioid painkillers?',
        category: 'Substance Use',
        type: 'binary',
        fields: ['medicalHistory.substanceUse.prescribedOpioids'],
      },

      // Social & Wellbeing
      pets: {
        question: 'Do you have pets?',
        category: 'Wellbeing',
        type: 'binary',
        fields: ['social.petOwnership.ownsDog'],
      },
      dog_ownership: {
        question: 'Do you own a dog?',
        category: 'Wellbeing',
        type: 'binary',
        fields: ['social.petOwnership.ownsDog'],
      },
      volunteering: {
        question: 'Do you volunteer or help others?',
        category: 'Wellbeing',
        type: 'binary',
        fields: ['social.volunteering.active'],
      },
      hobbies: {
        question: 'Do you have engaging hobbies?',
        category: 'Wellbeing',
        type: 'binary',
        fields: ['social.hobbies.creative.engaged'],
      },
      creative_hobbies: {
        question: 'Do you engage in creative hobbies?',
        category: 'Wellbeing',
        type: 'binary',
        fields: ['social.hobbies.creative.engaged'],
      },
      religion: {
        question: 'Do you attend religious services?',
        category: 'Wellbeing',
        type: 'binary',
        fields: ['social.religiousAttendance'],
      },
      religious_attendance: {
        question: 'Do you attend religious services?',
        category: 'Wellbeing',
        type: 'binary',
        fields: ['social.religiousAttendance'],
      },
      reading: {
        question: 'Do you read books regularly?',
        category: 'Wellbeing',
        type: 'binary',
        fields: ['social.hobbies.intellectual.engaged'],
      },
      outdoorTime: {
        question: 'Do you spend time outdoors daily?',
        category: 'Wellbeing',
        type: 'slider',
        fields: ['lifestyle.outdoorTime.minutesPerWeek'],
      },
      nature: {
        question: 'Regular exposure to nature/greenspace?',
        category: 'Wellbeing',
        type: 'binary',
        fields: ['lifestyle.outdoorTime.minutesPerWeek'],
      },
      nature_exposure: {
        question: 'Time spent in nature per week?',
        category: 'Wellbeing',
        type: 'slider',
        fields: ['lifestyle.outdoorTime.minutesPerWeek'],
      },
      social_connections: {
        question: 'How strong are your social connections?',
        category: 'Social',
        type: 'select',
        fields: ['social.connections.strength'],
      },

      // Phase 3 additions
      cacScore: {
        question: 'Have you had a coronary artery calcium (CAC) scan?',
        category: 'Medical History',
        type: 'select',
        fields: ['medicalHistory.cacScore'],
      },
      suicideAttempts: {
        question: 'Have you ever had a suicide attempt?',
        category: 'Mental Health',
        type: 'binary',
        fields: ['medicalHistory.suicideAttempts'],
      },
      sleepApnea: {
        question: 'Have you been diagnosed with sleep apnea?',
        category: 'Medical History',
        type: 'binary',
        fields: ['medicalHistory.sleepApnea.diagnosis', 'medicalHistory.sleepApnea.onTreatment'],
      },
      hearingLoss: {
        question: 'Do you have hearing loss? Do you use hearing aids?',
        category: 'Medical History',
        type: 'select',
        fields: ['medicalHistory.hearingLoss.treated'],
      },
      sunburns: {
        question: 'How many severe sunburns have you had in your lifetime?',
        category: 'Medical History',
        type: 'slider',
        fields: ['medicalHistory.sunExposure.sunburns'],
      },
    };

    // Create question definitions
    for (const [id, mapping] of Object.entries(questionFieldMappings)) {
      this.questions.set(id, {
        id,
        question: mapping.question,
        category: mapping.category,
        type: mapping.type as QuestionType,
        mapsToFields: mapping.fields,
        affectsDiseases: [], // Will be computed in buildRelationships()
        affectsRiskFactors: [], // Will be computed in buildRelationships()
      });
    }
  }

  /**
   * Extract disease models and risk factors
   */
  private async extractDiseaseDefinitions(): Promise<void> {
    const diseaseKB = await loadDiseaseKB();

    for (const [diseaseId, model] of diseaseKB) {
      // Create disease node
      this.diseases.set(diseaseId, {
        id: diseaseId,
        name: model.metadata.name,
        category: model.metadata.category,
        timeframe: model.metadata.timeframe,
        usesRiskFactors: [],
        usesFields: [],
        contributesToOverallMortality: true,
      });

      // Extract risk factors for this disease
      for (const factor of model.riskFactors) {
        const riskFactorId = `${diseaseId}.${factor.factorId}`;

        this.riskFactors.set(riskFactorId, {
          id: riskFactorId,
          factorId: factor.factorId,
          name: factor.name,
          diseaseId,
          type: factor.type,
          evidenceStrength: factor.evidenceStrength,
          modifiable: factor.modifiable ?? true,
          usesFields: [],
          contributesToDisease: diseaseId,
        });
      }
    }
  }

  /**
   * Build relationship mappings by cross-referencing all entities
   */
  private buildRelationships(): void {
    // For each risk factor, determine which fields it uses
    for (const [riskFactorId, riskFactor] of this.riskFactors) {
      const diseaseModel = this.getDiseaseModelById(riskFactor.diseaseId);
      if (!diseaseModel) continue;

      const factorDef = diseaseModel.riskFactors.find((f) => f.factorId === riskFactor.factorId);
      if (!factorDef || !factorDef.requiredFields) continue;

      // Extract field IDs from requiredFields paths
      for (const reqField of factorDef.requiredFields) {
        const fieldId = this.pathToFieldId(reqField.path);
        if (fieldId && this.fields.has(fieldId)) {
          // Add to risk factor's usesFields
          if (!riskFactor.usesFields.includes(fieldId)) {
            riskFactor.usesFields.push(fieldId);
          }

          // Add to field's usedByRiskFactors
          const field = this.fields.get(fieldId);
          if (field && !field.usedByRiskFactors.includes(riskFactorId)) {
            field.usedByRiskFactors.push(riskFactorId);
          }

          // Add to field's usedByDiseases
          if (field && !field.usedByDiseases.includes(riskFactor.diseaseId)) {
            field.usedByDiseases.push(riskFactor.diseaseId);
          }
        }
      }
    }

    // For each disease, aggregate used risk factors and fields
    for (const [diseaseId, disease] of this.diseases) {
      const riskFactorIds = Array.from(this.riskFactors.values())
        .filter((rf) => rf.diseaseId === diseaseId)
        .map((rf) => rf.id);

      disease.usesRiskFactors = riskFactorIds;

      // Aggregate all fields used by this disease's risk factors
      const fieldIds = new Set<string>();
      for (const rfId of riskFactorIds) {
        const rf = this.riskFactors.get(rfId);
        if (rf) {
          rf.usesFields.forEach((fId) => fieldIds.add(fId));
        }
      }
      disease.usesFields = Array.from(fieldIds);
    }

    // For each question, map to fields using the mappedFromQuestions relationship
    for (const [questionId, question] of this.questions) {
      // Mark fields as mapped from this question
      for (const fieldId of question.mapsToFields) {
        const field = this.fields.get(fieldId);
        if (field && !field.mappedFromQuestions.includes(questionId)) {
          field.mappedFromQuestions.push(questionId);
        }
      }

      // Compute which diseases and risk factors this question affects
      const affectedDiseases = new Set<string>();
      const affectedRiskFactors = new Set<string>();

      for (const fieldId of question.mapsToFields) {
        const field = this.fields.get(fieldId);
        if (field) {
          field.usedByDiseases.forEach((dId) => affectedDiseases.add(dId));
          field.usedByRiskFactors.forEach((rfId) => affectedRiskFactors.add(rfId));
        }
      }

      question.affectsDiseases = Array.from(affectedDiseases);
      question.affectsRiskFactors = Array.from(affectedRiskFactors);
    }
  }

  /**
   * Create reverse lookup maps for performance
   */
  private buildReverseLookups() {
    const fieldsByDisease = new Map<string, Set<string>>();
    const riskFactorsByField = new Map<string, Set<string>>();
    const diseasesByField = new Map<string, Set<string>>();
    const questionsByField = new Map<string, Set<string>>();

    // Build fieldsByDisease
    for (const [diseaseId, disease] of this.diseases) {
      fieldsByDisease.set(diseaseId, new Set(disease.usesFields));
    }

    // Build riskFactorsByField
    for (const [fieldId, field] of this.fields) {
      riskFactorsByField.set(fieldId, new Set(field.usedByRiskFactors));
    }

    // Build diseasesByField
    for (const [fieldId, field] of this.fields) {
      diseasesByField.set(fieldId, new Set(field.usedByDiseases));
    }

    // Build questionsByField
    for (const [fieldId, field] of this.fields) {
      questionsByField.set(fieldId, new Set(field.mappedFromQuestions));
    }

    return {
      fieldsByDisease,
      riskFactorsByField,
      diseasesByField,
      questionsByField,
    };
  }

  /**
   * Convert a JSONPath to a field ID
   * e.g., "lifestyle.smoking.status.value" → "lifestyle.smoking.status"
   * e.g., "biometrics.weight.mostRecent.value" → "biometrics.weight"
   */
  private pathToFieldId(path: string): string | null {
    // Remove .value suffix
    let fieldId = path.replace(/\.value$/, '');

    // Remove .mostRecent suffix (for TimeSeries)
    fieldId = fieldId.replace(/\.mostRecent$/, '');

    // Special case: blood pressure has nested structure
    if (fieldId.includes('bloodPressure')) {
      return fieldId; // Keep as-is (e.g., biometrics.bloodPressure.systolic)
    }

    // Check if this field ID exists in our registry
    if (this.fields.has(fieldId)) {
      return fieldId;
    }

    // Try without last segment (for complex paths)
    const segments = fieldId.split('.');
    if (segments.length > 1) {
      const parentId = segments.slice(0, -1).join('.');
      if (this.fields.has(parentId)) {
        return parentId;
      }
    }

    return null;
  }

  /**
   * Get disease model by ID (from loaded KB)
   */
  private getDiseaseModelById(diseaseId: string): DiseaseModel | null {
    // Use the imported getDiseaseModel function
    return getDiseaseModel(diseaseId);
  }
}

// Export singleton instance
let graphInstance: RelationshipGraph | null = null;

export async function getRelationshipGraph(): Promise<RelationshipGraph> {
  if (!graphInstance) {
    const builder = new RelationshipGraphBuilder();
    graphInstance = await builder.build();
  }
  return graphInstance;
}

export function clearRelationshipGraphCache(): void {
  graphInstance = null;
}
