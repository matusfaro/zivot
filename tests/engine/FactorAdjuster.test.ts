import { describe, it, expect } from 'vitest';
import { FactorAdjuster } from '../../src/engine/adjusters/FactorAdjuster';
import { RiskFactorDescriptor } from '../../src/types/knowledge/riskFactor';
import { UserProfile } from '../../src/types/user';
import { createUserDataPoint } from '../../src/types/common/datapoint';

const adjuster = new FactorAdjuster();

function profileWith(partial: Partial<UserProfile>): UserProfile {
  return {
    profileId: 'test',
    version: '1.0.0',
    lastUpdated: Date.now(),
    ...partial,
  };
}

function factor(overrides: Partial<RiskFactorDescriptor>): RiskFactorDescriptor {
  return {
    factorId: 'test_factor',
    name: 'Test Factor',
    type: 'continuous',
    evidenceStrength: 'strong',
    modifiable: true,
    citation: 'Test citation',
    requiredFields: [{ path: 'labTests.lipidPanel.ldlCholesterol.value', required: false }],
    mapping: { type: 'continuous', strategy: 'linear', coefficients: { slope: 0.01 } },
    ...overrides,
  } as RiskFactorDescriptor;
}

describe('FactorAdjuster', () => {
  describe('missing data', () => {
    it('returns null when the profile has no value at the path', () => {
      const hr = adjuster.calculateHazardRatio(profileWith({}), factor({}));
      expect(hr).toBeNull();
    });

    it('falls back to alternative paths', () => {
      const f = factor({
        requiredFields: [
          {
            path: 'labTests.lipidPanel.nonexistent.value',
            required: false,
            alternatives: ['labTests.lipidPanel.ldlCholesterol.value'],
          },
        ],
      });
      const p = profileWith({
        labTests: { lipidPanel: { ldlCholesterol: createUserDataPoint(100) } },
      });
      expect(adjuster.calculateHazardRatio(p, f)).toBeCloseTo(Math.exp(0.01 * 100), 6);
    });
  });

  describe('linear strategy', () => {
    it('computes HR = exp(slope × value)', () => {
      const p = profileWith({
        labTests: { lipidPanel: { ldlCholesterol: createUserDataPoint(150) } },
      });
      expect(adjuster.calculateHazardRatio(p, factor({}))).toBeCloseTo(Math.exp(1.5), 6);
    });

    it('clamps values to validRange before mapping', () => {
      const f = factor({
        mapping: {
          type: 'continuous',
          strategy: 'linear',
          coefficients: { slope: 0.01 },
          validRange: [0, 200],
        },
      });
      const p = profileWith({
        labTests: { lipidPanel: { ldlCholesterol: createUserDataPoint(5000) } },
      });
      expect(adjuster.calculateHazardRatio(p, f)).toBeCloseTo(Math.exp(0.01 * 200), 6);
    });
  });

  describe('log_linear strategy', () => {
    it('computes HR = value^slope', () => {
      const f = factor({
        mapping: { type: 'continuous', strategy: 'log_linear', coefficients: { slope: 0.5 } },
      });
      const p = profileWith({
        labTests: { lipidPanel: { ldlCholesterol: createUserDataPoint(100) } },
      });
      expect(adjuster.calculateHazardRatio(p, f)).toBeCloseTo(Math.exp(0.5 * Math.log(100)), 6);
    });
  });

  describe('lookup strategy', () => {
    const lookupFactor = factor({
      mapping: {
        type: 'continuous',
        strategy: 'lookup',
        points: [
          { value: 10, hazardRatio: 1.0 },
          { value: 20, hazardRatio: 2.0 },
          { value: 40, hazardRatio: 4.0 },
        ],
        validRange: [0, 100],
      },
    });

    const withValue = (v: number) =>
      profileWith({ labTests: { lipidPanel: { ldlCholesterol: createUserDataPoint(v) } } });

    it('returns exact point values', () => {
      expect(adjuster.calculateHazardRatio(withValue(20), lookupFactor)).toBe(2.0);
    });

    it('interpolates linearly between points', () => {
      expect(adjuster.calculateHazardRatio(withValue(15), lookupFactor)).toBeCloseTo(1.5, 6);
      expect(adjuster.calculateHazardRatio(withValue(30), lookupFactor)).toBeCloseTo(3.0, 6);
    });

    it('clamps to first/last point outside the table', () => {
      expect(adjuster.calculateHazardRatio(withValue(5), lookupFactor)).toBe(1.0);
      expect(adjuster.calculateHazardRatio(withValue(80), lookupFactor)).toBe(4.0);
    });
  });

  describe('categorical strategy', () => {
    const catFactor = factor({
      type: 'categorical',
      requiredFields: [{ path: 'lifestyle.smoking.status.value', required: false }],
      mapping: {
        type: 'categorical',
        categories: [
          { value: 'never', hazardRatio: 1.0 },
          { value: 'former', hazardRatio: 1.2 },
          { value: ['current', 'heavy'], hazardRatio: 2.0 },
        ],
      },
    });

    const withStatus = (s: string) =>
      profileWith({
        lifestyle: { smoking: { status: createUserDataPoint(s as never) } },
      });

    it('maps single category values', () => {
      expect(adjuster.calculateHazardRatio(withStatus('former'), catFactor)).toBe(1.2);
    });

    it('matches values inside array categories', () => {
      expect(adjuster.calculateHazardRatio(withStatus('current'), catFactor)).toBe(2.0);
      expect(adjuster.calculateHazardRatio(withStatus('heavy'), catFactor)).toBe(2.0);
    });

    it('defaults to HR 1.0 for unknown categories', () => {
      expect(adjuster.calculateHazardRatio(withStatus('vaping'), catFactor)).toBe(1.0);
    });
  });

  describe('TimeSeries path extraction', () => {
    const tsFactor = factor({
      requiredFields: [
        { path: 'lifestyle.exercise.moderateMinutesPerWeek.mostRecent.value', required: false },
      ],
      mapping: { type: 'continuous', strategy: 'linear', coefficients: { slope: -0.001 } },
    });

    it('reads mostRecent.value from a TimeSeries', () => {
      const p = profileWith({
        lifestyle: {
          exercise: {
            moderateMinutesPerWeek: {
              dataPoints: [createUserDataPoint(60)],
              mostRecent: createUserDataPoint(150),
            },
          },
        },
      });
      expect(adjuster.calculateHazardRatio(p, tsFactor)).toBeCloseTo(Math.exp(-0.15), 6);
    });

    it('falls back to the last dataPoint when mostRecent is unset', () => {
      const p = profileWith({
        lifestyle: {
          exercise: {
            moderateMinutesPerWeek: {
              dataPoints: [createUserDataPoint(60), createUserDataPoint(120)],
            },
          },
        },
      });
      expect(adjuster.calculateHazardRatio(p, tsFactor)).toBeCloseTo(Math.exp(-0.12), 6);
    });
  });

  describe('derived factors', () => {
    it('computes BMI from weight + height', () => {
      const bmiFactor = factor({
        factorId: 'bmi',
        type: 'derived',
        requiredFields: [{ path: 'biometrics.weight.mostRecent.value.value', required: false }],
        mapping: {
          type: 'continuous',
          strategy: 'lookup',
          points: [
            { value: 20, hazardRatio: 1.0 },
            { value: 30, hazardRatio: 2.0 },
          ],
          validRange: [15, 50],
        },
      });
      const p = profileWith({
        biometrics: {
          height: createUserDataPoint(200),
          weight: {
            dataPoints: [],
            mostRecent: createUserDataPoint({ value: 100, unit: 'kg' as const }),
          },
        },
      });
      // BMI = 100 / 2.0^2 = 25 → interpolated HR 1.5
      expect(adjuster.calculateHazardRatio(p, bmiFactor)).toBeCloseTo(1.5, 6);
    });
  });
});
