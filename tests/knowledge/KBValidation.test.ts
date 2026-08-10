import { describe, it, expect } from 'vitest';
import { loadDiseaseKB, validateDiseaseModel } from '../../src/knowledge';
import { loadModifierKB } from '../../src/knowledge/modifiers';

/**
 * Structural guardrails for the knowledge base. These enforce the invariants
 * the engine relies on and ratchet the citation debt downward — the counts
 * asserted here may only shrink, never grow.
 */

const VALID_SEX = ['male', 'female', undefined];
const VALID_MAPPING_TYPES = ['continuous', 'categorical', 'boolean', 'derived'];
// Only strategies the FactorAdjuster actually implements. Anything else
// would silently evaluate to HR 1.0 (this is how four redundant age factors
// went unnoticed), so unknown strategies fail the build.
const VALID_STRATEGIES = [
  'linear',
  'log_linear',
  'lookup',
  'spline',
  'has_condition',
  'bmi_lookup',
  undefined,
];

// Evaluate a mapping at its extremes to catch implausible hazard ratios
// (e.g. the former Lp(a) intercept bug that yielded HR 735).
function mappingExtremeHRs(mapping: Record<string, unknown>): number[] {
  const hrs: number[] = [];
  const points = mapping.points as Array<{ hazardRatio: number }> | undefined;
  if (points) hrs.push(...points.map(p => p.hazardRatio));
  const categories = mapping.categories as Array<{ hazardRatio: number }> | undefined;
  if (categories) hrs.push(...categories.map(c => c.hazardRatio));
  if (typeof mapping.trueHazardRatio === 'number') hrs.push(mapping.trueHazardRatio as number);
  if (typeof mapping.falseHazardRatio === 'number') hrs.push(mapping.falseHazardRatio as number);
  if (typeof mapping.presentHR === 'number') hrs.push(mapping.presentHR as number);
  if (typeof mapping.absentHR === 'number') hrs.push(mapping.absentHR as number);

  const coefficients = mapping.coefficients as { slope?: number; intercept?: number } | undefined;
  const validRange = mapping.validRange as [number, number] | undefined;
  if (coefficients?.slope !== undefined && validRange) {
    const [lo, hi] = validRange;
    const intercept = coefficients.intercept ?? 0;
    if (mapping.strategy === 'linear') {
      hrs.push(Math.exp(coefficients.slope * lo + intercept));
      hrs.push(Math.exp(coefficients.slope * hi + intercept));
    } else if (mapping.strategy === 'log_linear') {
      hrs.push(Math.exp(coefficients.slope * Math.log(Math.max(lo, 1e-9))));
      hrs.push(Math.exp(coefficients.slope * Math.log(Math.max(hi, 1e-9))));
    }
  }
  return hrs;
}

describe('Knowledge base validation', () => {
  it('every disease model passes structural validation', async () => {
    const kb = await loadDiseaseKB();
    for (const [id, model] of kb) {
      expect(validateDiseaseModel(model), id).toBeNull();
    }
  });

  it('every baseline curve has a source and a valid sex value', async () => {
    const kb = await loadDiseaseKB();
    for (const [id, model] of kb) {
      for (const curve of model.baselineRisk.curves) {
        expect(curve.source, `${id}/${curve.id} missing source`).toBeTruthy();
        expect(VALID_SEX, `${id}/${curve.id} invalid sex "${curve.applicability.sex}"`).toContain(
          curve.applicability.sex
        );
        // Risks must be probabilities, monotonically plausible
        for (const point of curve.ageRiskMapping) {
          expect(point.risk, `${id}/${curve.id}@${point.age}`).toBeGreaterThanOrEqual(0);
          expect(point.risk, `${id}/${curve.id}@${point.age}`).toBeLessThan(1);
        }
      }
      // The default curve must exist
      const defaultId = model.baselineRisk.defaultCurve;
      expect(
        model.baselineRisk.curves.some(c => c.id === defaultId),
        `${id} defaultCurve "${defaultId}" not found`
      ).toBe(true);
    }
  });

  it('every risk factor mapping uses a known type/strategy and sane hazard ratios', async () => {
    const kb = await loadDiseaseKB();
    for (const [id, model] of kb) {
      for (const factor of model.riskFactors) {
        const mapping = factor.mapping as unknown as Record<string, unknown>;
        expect(
          VALID_MAPPING_TYPES,
          `${id}/${factor.factorId} mapping type "${mapping.type}"`
        ).toContain(mapping.type);
        expect(
          VALID_STRATEGIES,
          `${id}/${factor.factorId} strategy "${mapping.strategy}"`
        ).toContain(mapping.strategy);

        for (const hr of mappingExtremeHRs(mapping)) {
          expect(hr, `${id}/${factor.factorId} HR ${hr} out of plausible range`).toBeGreaterThan(0.005);
          expect(hr, `${id}/${factor.factorId} HR ${hr} out of plausible range`).toBeLessThan(100);
        }
      }
    }
  });

  it('citation debt does not grow (ratchet: 67 uncited factors as of 2026-08)', async () => {
    const kb = await loadDiseaseKB();
    let total = 0;
    let uncited = 0;
    for (const [, model] of kb) {
      for (const factor of model.riskFactors) {
        total += 1;
        const f = factor as unknown as { citation?: string; doi?: string; url?: string };
        if (!f.citation && !f.doi && !f.url) {
          uncited += 1;
        }
      }
    }
    expect(total).toBeGreaterThan(100);
    // CLAUDE.md mandates citations on every factor. 67 legacy factors are
    // still missing them — backfill is an open task. New factors must be
    // cited, so this number may only go down.
    expect(uncited).toBeLessThanOrEqual(67);
  });

  it('every modifier has cited sources and a bounded hazard ratio', async () => {
    const modifiers = await loadModifierKB();
    expect(modifiers.size).toBeGreaterThanOrEqual(6);
    for (const [id, modifier] of modifiers) {
      expect(modifier.metadata.sources?.length, `${id} missing sources`).toBeGreaterThan(0);
      const hrs = mappingExtremeHRs(modifier.mapping as unknown as Record<string, unknown>);
      expect(hrs.length, `${id} has no hazard ratios`).toBeGreaterThan(0);
      for (const hr of hrs) {
        expect(hr, `${id} HR ${hr}`).toBeGreaterThan(0.3);
        expect(hr, `${id} HR ${hr}`).toBeLessThan(3);
      }
    }
  });
});
