import { DiseaseModel } from '../types/knowledge/disease';

/**
 * Disease knowledge base.
 *
 * Every JSON file in ./diseases/ is auto-discovered and registered under its
 * metadata.id — dropping a new model file into that directory is all that is
 * needed to include it in risk calculations. Duplicate or missing ids fail
 * loudly at module load so a model can never be silently excluded.
 */
const diseaseModules = import.meta.glob('./diseases/*.json', { eager: true }) as Record<
  string,
  { default: unknown }
>;

const diseaseKB = new Map<string, DiseaseModel>();

for (const [path, module] of Object.entries(diseaseModules)) {
  const model = module.default as DiseaseModel;
  if (!model?.metadata?.id) {
    throw new Error(`Disease model ${path} is missing metadata.id`);
  }
  if (diseaseKB.has(model.metadata.id)) {
    throw new Error(`Duplicate disease model id "${model.metadata.id}" in ${path}`);
  }
  diseaseKB.set(model.metadata.id, model);
}

/**
 * Load all disease models into a Map keyed by disease ID.
 * (Async for historical API compatibility; models are bundled statically.)
 */
export async function loadDiseaseKB(): Promise<Map<string, DiseaseModel>> {
  return new Map(diseaseKB);
}

/**
 * Get a single disease model by ID (synchronous)
 */
export function getDiseaseModel(diseaseId: string): DiseaseModel | null {
  return diseaseKB.get(diseaseId) ?? null;
}

/**
 * Get all available disease IDs
 */
export function getAvailableDiseaseIds(): string[] {
  return Array.from(diseaseKB.keys());
}

/**
 * Get disease models by category
 */
export async function getDiseasesByCategory(category: string): Promise<DiseaseModel[]> {
  return Array.from(diseaseKB.values()).filter(m => m.metadata.category === category);
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
    if (!factor.factorId || !factor.name) {
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
  const results: Record<string, string | null> = {};
  for (const [id, model] of diseaseKB) {
    results[id] = validateDiseaseModel(model);
  }
  return results;
}
