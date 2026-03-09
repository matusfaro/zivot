import { DiseaseModel } from '../types/knowledge/disease';
import cvdModel from './diseases/cvd.json';
import colorectalCancerModel from './diseases/colorectal-cancer.json';
import lungCancerModel from './diseases/lung-cancer.json';
import type2DiabetesModel from './diseases/type2-diabetes.json';
import strokeModel from './diseases/stroke.json';
import breastCancerModel from './diseases/breast-cancer.json';
import prostateCancerModel from './diseases/prostate-cancer.json';
import copdModel from './diseases/copd.json';
import ckdModel from './diseases/chronic-kidney-disease.json';
import pancreaticCancerModel from './diseases/pancreatic-cancer.json';
import liverDiseaseModel from './diseases/liver-disease.json';
import alzheimersModel from './diseases/alzheimers-dementia.json';
import motorVehicleCrashModel from './diseases/motor-vehicle-crash.json';
import fallsModel from './diseases/falls.json';
import influenzaPneumoniaModel from './diseases/influenza-pneumonia.json';
import drugOverdoseModel from './diseases/drug-overdose.json';
import esophagealCancerModel from './diseases/esophageal-cancer.json';
import liverCancerModel from './diseases/liver-cancer.json';
import bladderCancerModel from './diseases/bladder-cancer.json';

/**
 * Load all disease models into a Map
 * Returns a Map keyed by disease ID
 */
export async function loadDiseaseKB(): Promise<Map<string, DiseaseModel>> {
  const kb = new Map<string, DiseaseModel>();

  // Load Phase 1 diseases
  kb.set('cvd_10year', cvdModel as unknown as DiseaseModel);
  kb.set('colorectal_cancer_10year', colorectalCancerModel as unknown as DiseaseModel);
  kb.set('lung_cancer_10year', lungCancerModel as unknown as DiseaseModel);
  kb.set('type2_diabetes_10year', type2DiabetesModel as unknown as DiseaseModel);

  // Load Phase 2 diseases
  kb.set('stroke_10year', strokeModel as unknown as DiseaseModel);
  kb.set('breast_cancer_10year', breastCancerModel as unknown as DiseaseModel);
  kb.set('prostate_cancer_10year', prostateCancerModel as unknown as DiseaseModel);

  // Load Phase 3 diseases
  kb.set('copd_mortality_10year', copdModel as unknown as DiseaseModel);
  kb.set('ckd_progression_10year', ckdModel as unknown as DiseaseModel);
  kb.set('pancreatic_cancer_10year', pancreaticCancerModel as unknown as DiseaseModel);

  // Load Phase 4 diseases
  kb.set('nafld_cirrhosis_10year', liverDiseaseModel as unknown as DiseaseModel);
  kb.set('alzheimers_dementia_10year', alzheimersModel as unknown as DiseaseModel);

  // Load Phase 5 diseases (External causes & additional cancers)
  kb.set('motor_vehicle_crash_10year', motorVehicleCrashModel as unknown as DiseaseModel);
  kb.set('falls_10year', fallsModel as unknown as DiseaseModel);
  kb.set('influenza_pneumonia_10year', influenzaPneumoniaModel as unknown as DiseaseModel);
  kb.set('drug_overdose_10year', drugOverdoseModel as unknown as DiseaseModel);
  kb.set('esophageal_cancer_10year', esophagealCancerModel as unknown as DiseaseModel);
  kb.set('liver_cancer_10year', liverCancerModel as unknown as DiseaseModel);
  kb.set('bladder_cancer_10year', bladderCancerModel as unknown as DiseaseModel);

  return kb;
}

/**
 * Get a single disease model by ID (synchronous)
 */
export function getDiseaseModel(diseaseId: string): DiseaseModel | null {
  switch (diseaseId) {
    case 'cvd_10year':
      return cvdModel as unknown as DiseaseModel;
    case 'colorectal_cancer_10year':
      return colorectalCancerModel as unknown as DiseaseModel;
    case 'lung_cancer_10year':
      return lungCancerModel as unknown as DiseaseModel;
    case 'type2_diabetes_10year':
      return type2DiabetesModel as unknown as DiseaseModel;
    case 'stroke_10year':
      return strokeModel as unknown as DiseaseModel;
    case 'breast_cancer_10year':
      return breastCancerModel as unknown as DiseaseModel;
    case 'prostate_cancer_10year':
      return prostateCancerModel as unknown as DiseaseModel;
    case 'copd_mortality_10year':
      return copdModel as unknown as DiseaseModel;
    case 'ckd_progression_10year':
      return ckdModel as unknown as DiseaseModel;
    case 'pancreatic_cancer_10year':
      return pancreaticCancerModel as unknown as DiseaseModel;
    case 'nafld_cirrhosis_10year':
      return liverDiseaseModel as unknown as DiseaseModel;
    case 'alzheimers_dementia_10year':
      return alzheimersModel as unknown as DiseaseModel;
    case 'motor_vehicle_crash_10year':
      return motorVehicleCrashModel as unknown as DiseaseModel;
    case 'falls_10year':
      return fallsModel as unknown as DiseaseModel;
    case 'influenza_pneumonia_10year':
      return influenzaPneumoniaModel as unknown as DiseaseModel;
    case 'drug_overdose_10year':
      return drugOverdoseModel as unknown as DiseaseModel;
    case 'esophageal_cancer_10year':
      return esophagealCancerModel as unknown as DiseaseModel;
    case 'liver_cancer_10year':
      return liverCancerModel as unknown as DiseaseModel;
    case 'bladder_cancer_10year':
      return bladderCancerModel as unknown as DiseaseModel;
    default:
      return null;
  }
}

/**
 * Get all available disease IDs
 */
export function getAvailableDiseaseIds(): string[] {
  return [
    'cvd_10year',
    'colorectal_cancer_10year',
    'lung_cancer_10year',
    'type2_diabetes_10year',
    'stroke_10year',
    'breast_cancer_10year',
    'prostate_cancer_10year',
    'copd_mortality_10year',
    'ckd_progression_10year',
    'pancreatic_cancer_10year',
    'nafld_cirrhosis_10year',
    'alzheimers_dementia_10year',
    'motor_vehicle_crash_10year',
    'falls_10year',
    'influenza_pneumonia_10year',
    'drug_overdose_10year',
    'esophageal_cancer_10year',
    'liver_cancer_10year',
    'bladder_cancer_10year',
  ];
}

/**
 * Get disease models by category
 */
export async function getDiseasesByCategory(category: string): Promise<DiseaseModel[]> {
  const kb = await loadDiseaseKB();
  const diseases: DiseaseModel[] = [];

  for (const [, model] of kb) {
    if (model.metadata.category === category) {
      diseases.push(model);
    }
  }

  return diseases;
}

/**
 * Validate a disease model against the schema
 * Returns null if valid, or error message if invalid
 */
export function validateDiseaseModel(model: DiseaseModel): string | null {
  // Basic validation
  if (!model.metadata?.id) {
    return 'Missing metadata.id';
  }

  if (!model.baselineRisk?.curves || model.baselineRisk.curves.length === 0) {
    return 'Missing baseline risk curves';
  }

  if (!model.riskFactors || model.riskFactors.length === 0) {
    return 'Missing risk factors';
  }

  // Validate each baseline curve has age-risk mappings
  for (const curve of model.baselineRisk.curves) {
    if (!curve.ageRiskMapping || curve.ageRiskMapping.length === 0) {
      return `Curve ${curve.id} missing age-risk mapping`;
    }
  }

  // Validate each risk factor has required fields
  for (const factor of model.riskFactors) {
    if (!factor.factorId || !factor.name || !factor.type) {
      return `Risk factor missing required fields: ${factor.factorId}`;
    }

    if (!factor.mapping) {
      return `Risk factor ${factor.factorId} missing mapping`;
    }

    if (!factor.requiredFields || factor.requiredFields.length === 0) {
      return `Risk factor ${factor.factorId} missing required fields`;
    }
  }

  return null; // Valid
}

/**
 * Validate all loaded disease models
 */
export async function validateAllModels(): Promise<Record<string, string | null>> {
  const kb = await loadDiseaseKB();
  const results: Record<string, string | null> = {};

  for (const [id, model] of kb) {
    results[id] = validateDiseaseModel(model);
  }

  return results;
}
