import { describe, it, expect } from 'vitest';
import {
  OverallMortalityAggregator,
  AppliedModifier,
  combineModifierHRs,
} from '../../src/engine/aggregators/OverallMortalityAggregator';
import { getBaselineAnnualMortality } from '../../src/engine/utils/mortalityCurve';
import { DiseaseRisk } from '../../src/types/risk/calculation';
import { UserProfile } from '../../src/types/user';
import { MortalityModifier } from '../../src/types/knowledge/mortalityModifier';
import { createUserDataPoint } from '../../src/types/common/datapoint';

const aggregator = new OverallMortalityAggregator();

function diseaseRisk(overrides: Partial<DiseaseRisk>): DiseaseRisk {
  const baselineRisk = overrides.baselineRisk ?? 0.05;
  const adjustedRisk = overrides.adjustedRisk ?? baselineRisk;
  const caseFatality = overrides.caseFatality ?? 1.0;
  return {
    diseaseId: 'test_disease',
    diseaseName: 'Test Disease',
    timeframe: 10,
    outcome: 'mortality',
    baselineRisk,
    adjustedRisk,
    absoluteRiskIncrease: adjustedRisk - baselineRisk,
    mortalityRisk: adjustedRisk * caseFatality,
    baselineMortalityRisk: baselineRisk * caseFatality,
    caseFatality,
    confidence: { level: 'moderate', score: 0.5 },
    range: [adjustedRisk * 0.8, Math.min(adjustedRisk * 1.2, 0.999)],
    factorContributions: [],
    ...overrides,
  };
}

function maleProfile(dobYear: number): UserProfile {
  return {
    profileId: 'test',
    version: '1.0.0',
    lastUpdated: Date.now(),
    demographics: {
      dateOfBirth: createUserDataPoint(`${dobYear}-01-01`),
      biologicalSex: createUserDataPoint('male'),
    },
  };
}

function lifeTableTenYearRisk(age: number, sex: string): number {
  let survival = 1;
  for (let y = 0; y < 10; y++) {
    survival *= 1 - getBaselineAnnualMortality(age + y, sex);
  }
  return 1 - survival;
}

function ageOf(profile: UserProfile): number {
  const dob = new Date(profile.demographics!.dateOfBirth!.value as string);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

describe('OverallMortalityAggregator', () => {
  it('returns zero risk for no diseases', () => {
    const result = aggregator.aggregate([]);
    expect(result.estimatedRisk).toBe(0);
    expect(result.diseaseContributions).toEqual([]);
  });

  it('uses the complement rule without a profile (no calibration possible)', () => {
    const risks = [diseaseRisk({ adjustedRisk: 0.1, baselineRisk: 0.1 }), diseaseRisk({ adjustedRisk: 0.2, baselineRisk: 0.2 })];
    const result = aggregator.aggregate(risks);
    // 1 - 0.9 × 0.8 = 0.28
    expect(result.estimatedRisk).toBeCloseTo(0.28, 6);
  });

  it('anchors a baseline-only profile exactly to life-table mortality', () => {
    const profile = maleProfile(1960);
    const age = ageOf(profile);
    const risks = [
      diseaseRisk({ diseaseId: 'a', baselineRisk: 0.15, adjustedRisk: 0.15 }),
      diseaseRisk({ diseaseId: 'b', baselineRisk: 0.25, adjustedRisk: 0.25 }),
    ];
    const result = aggregator.aggregate(risks, profile);
    expect(result.estimatedRisk).toBeCloseTo(lifeTableTenYearRisk(age, 'male'), 6);
  });

  it('scales the life-table anchor by the relative hazard of the profile', () => {
    const profile = maleProfile(1975);
    const age = ageOf(profile);
    const risks = [diseaseRisk({ baselineRisk: 0.1, adjustedRisk: 0.2 })];
    const result = aggregator.aggregate(risks, profile);

    const lifeTable = lifeTableTenYearRisk(age, 'male');
    const rr = Math.log(1 - 0.2) / Math.log(1 - 0.1); // hazard ratio of the products
    const expected = 1 - Math.pow(1 - lifeTable, rr);
    expect(result.estimatedRisk).toBeCloseTo(expected, 6);
    expect(result.estimatedRisk).toBeGreaterThan(lifeTable);
  });

  it('applies mortality modifiers once, on the hazard scale', () => {
    const profile = maleProfile(1960);
    const risks = [diseaseRisk({ baselineRisk: 0.2, adjustedRisk: 0.2 })];

    const withoutModifier = aggregator.aggregate(risks, profile);

    const modifier = { metadata: { id: 'test_mod', name: 'Test', category: 'social' } } as MortalityModifier;
    const applied: AppliedModifier[] = [{ modifier, hazardRatio: 0.8 }];
    const withModifier = aggregator.aggregate(risks, profile, applied);

    const expected = 1 - Math.pow(1 - withoutModifier.estimatedRisk, 0.8);
    expect(withModifier.estimatedRisk).toBeCloseTo(expected, 6);
    expect(withModifier.estimatedRisk).toBeLessThan(withoutModifier.estimatedRisk);
  });

  it('never produces a risk above 99.9% even for extreme inputs', () => {
    const risks = Array.from({ length: 10 }, (_, i) =>
      diseaseRisk({ diseaseId: `d${i}`, baselineRisk: 0.05, adjustedRisk: 0.999, range: [0.9, 0.999] })
    );
    const modifier = { metadata: { id: 'm', name: 'M', category: 'social' } } as MortalityModifier;
    const result = aggregator.aggregate(risks, maleProfile(1950), [{ modifier, hazardRatio: 3 }]);
    expect(result.estimatedRisk).toBeLessThanOrEqual(0.999);
    expect(result.range[1]).toBeLessThanOrEqual(0.999);
  });

  it('keeps range ordered around the point estimate', () => {
    const risks = [diseaseRisk({ baselineRisk: 0.1, adjustedRisk: 0.15, range: [0.1, 0.2] })];
    const result = aggregator.aggregate(risks, maleProfile(1970));
    expect(result.range[0]).toBeLessThanOrEqual(result.estimatedRisk);
    expect(result.range[1]).toBeGreaterThanOrEqual(result.estimatedRisk);
  });

  it('reports contribution proportions that sum to ~1', () => {
    const risks = [
      diseaseRisk({ diseaseId: 'a', adjustedRisk: 0.1, baselineRisk: 0.1 }),
      diseaseRisk({ diseaseId: 'b', adjustedRisk: 0.05, baselineRisk: 0.05 }),
      diseaseRisk({ diseaseId: 'c', adjustedRisk: 0.02, baselineRisk: 0.02 }),
    ];
    const result = aggregator.aggregate(risks);
    const total = result.diseaseContributions.reduce((s, c) => s + c.contribution, 0);
    expect(total).toBeGreaterThan(0.9);
    expect(total).toBeLessThanOrEqual(1.05);
    // Larger risks contribute more
    const byId = Object.fromEntries(result.diseaseContributions.map(c => [c.diseaseId, c.contribution]));
    expect(byId.a).toBeGreaterThan(byId.b);
    expect(byId.b).toBeGreaterThan(byId.c);
  });

  it('scales incidence models by case fatality on the mortality scale', () => {
    // 20% incidence with 5% case fatality (e.g., melanoma-like) should
    // contribute like a 1% mortality risk, not a 20% one
    const incidence = diseaseRisk({
      diseaseId: 'melanoma_like',
      outcome: 'incidence',
      baselineRisk: 0.2,
      adjustedRisk: 0.2,
      caseFatality: 0.05,
      mortalityRisk: 0.01,
      baselineMortalityRisk: 0.01,
    });
    const result = aggregator.aggregate([incidence]);
    expect(result.estimatedRisk).toBeCloseTo(0.01, 6);
  });

  it('gives high-fatality diseases larger contributions than high-incidence/low-fatality ones', () => {
    const prostateLike = diseaseRisk({
      diseaseId: 'prostate_like',
      outcome: 'incidence',
      baselineRisk: 0.15,
      adjustedRisk: 0.15,
      caseFatality: 0.02,
      mortalityRisk: 0.003,
      baselineMortalityRisk: 0.003,
    });
    const pancreaticLike = diseaseRisk({
      diseaseId: 'pancreatic_like',
      outcome: 'incidence',
      baselineRisk: 0.02,
      adjustedRisk: 0.02,
      caseFatality: 0.86,
      mortalityRisk: 0.0172,
      baselineMortalityRisk: 0.0172,
    });
    const result = aggregator.aggregate([prostateLike, pancreaticLike]);
    const byId = Object.fromEntries(result.diseaseContributions.map(c => [c.diseaseId, c.contribution]));
    // 2% incidence at 86% fatality kills more people than 15% incidence at 2%
    expect(byId.pancreatic_like).toBeGreaterThan(byId.prostate_like);
  });

  it('combines correlated modifiers with attenuation instead of raw multiplication', () => {
    const social = (id: string, hr: number): AppliedModifier => ({
      modifier: { metadata: { id, name: id, category: 'social' } } as MortalityModifier,
      hazardRatio: hr,
    });
    // Raw product would be 0.76 × 0.78 × 0.67 = 0.397; the rule applies the
    // strongest (0.67) fully and attenuates the rest 50% in log space
    const combined = combineModifierHRs([
      social('dog', 0.76),
      social('volunteer', 0.78),
      social('religion', 0.67),
    ]);
    const expected = Math.exp(Math.log(0.67) + 0.5 * (Math.log(0.78) + Math.log(0.76)));
    expect(combined).toBeCloseTo(Math.max(expected, 1 / 1.91), 6);
    expect(combined).toBeGreaterThan(0.76 * 0.78 * 0.67);
    // And the floor holds no matter how many protective social factors stack
    const many = combineModifierHRs([
      social('a', 0.67), social('b', 0.67), social('c', 0.67),
      social('d', 0.67), social('e', 0.67),
    ]);
    expect(many).toBeGreaterThanOrEqual(1 / 1.91 - 1e-9);
  });

  it('normalizes the contribution-weighted confidence score', () => {
    const risks = [
      diseaseRisk({ diseaseId: 'a', adjustedRisk: 0.5, baselineRisk: 0.5, confidence: { level: 'high', score: 0.8 } }),
      diseaseRisk({ diseaseId: 'b', adjustedRisk: 0.5, baselineRisk: 0.5, confidence: { level: 'high', score: 0.8 } }),
    ];
    const result = aggregator.aggregate(risks);
    // Both diseases score 0.8 — a weighted average must also be 0.8, not depressed
    expect(result.confidence.score).toBeCloseTo(0.8, 2);
  });
});
