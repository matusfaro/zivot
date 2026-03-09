import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RiskCalculationResult } from '../../types/risk/calculation';
import { calculateAge } from '../../utils/dataExtraction';
import { UserProfile } from '../../types/user';

interface MortalityRiskChartProps {
  result: RiskCalculationResult;
  profile: UserProfile;
}

// Disease display configuration with colors
const DISEASE_CONFIG = [
  { id: 'cvd_10year', name: 'Heart Disease', color: '#ef4444' },
  { id: 'stroke_10year', name: 'Stroke', color: '#f97316' },
  { id: 'lung_cancer_10year', name: 'Lung Cancer', color: '#eab308' },
  { id: 'colorectal_cancer_10year', name: 'Colorectal Cancer', color: '#84cc16' },
  { id: 'type2_diabetes_10year', name: 'Type 2 Diabetes', color: '#06b6d4' },
  { id: 'breast_cancer_10year', name: 'Breast Cancer', color: '#ec4899' },
  { id: 'prostate_cancer_10year', name: 'Prostate Cancer', color: '#8b5cf6' },
  { id: 'copd_mortality_10year', name: 'COPD', color: '#6366f1' },
  { id: 'ckd_progression_10year', name: 'Kidney Disease', color: '#14b8a6' },
  { id: 'pancreatic_cancer_10year', name: 'Pancreatic Cancer', color: '#f59e0b' },
  { id: 'nafld_cirrhosis_10year', name: 'Liver Disease', color: '#10b981' },
  { id: 'alzheimers_dementia_10year', name: "Alzheimer's", color: '#a855f7' },
];

export const MortalityRiskChart: React.FC<MortalityRiskChartProps> = React.memo(({ result, profile }) => {
  const currentAge = calculateAge(profile);

  if (!currentAge) {
    return null;
  }

  const sex = profile.demographics?.biologicalSex?.value;

  // Memoize chart data generation
  const chartData = useMemo(
    () => generateStackedMortalityData(currentAge, result, sex),
    [currentAge, result, sex]
  );

  // Generate decade ticks
  const decadeTicks = useMemo(() => {
    const ticks = [currentAge];
    const startDecade = Math.ceil(currentAge / 10) * 10;
    for (let age = startDecade; age <= 110; age += 10) {
      ticks.push(age);
    }
    return ticks;
  }, [currentAge]);

  // Get active diseases (those present in the result)
  const activeDiseases = useMemo(() => {
    const diseaseIds = new Set(result.diseaseRisks.map(d => d.diseaseId));
    return DISEASE_CONFIG.filter(d => diseaseIds.has(d.id));
  }, [result.diseaseRisks]);

  return (
    <div className="mortality-risk-chart">
      <h3 className="chart-title">Mortality Risk Over Time (Stacked by Disease)</h3>
      <p className="chart-subtitle">
        Each colored area shows that disease's contribution to your overall mortality risk.
        Solid areas: validated 10-year prediction. Transparent areas: extrapolated estimate (less certain).
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            {/* Create gradient definitions for each disease (solid → transparent at year 10) */}
            {activeDiseases.map(disease => (
              <linearGradient key={`gradient-${disease.id}`} id={`gradient-${disease.id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={disease.color} stopOpacity={1} />
                <stop offset="100%" stopColor={disease.color} stopOpacity={0.3} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="age"
            type="number"
            scale="linear"
            domain={[currentAge, 110]}
            ticks={decadeTicks}
            label={{ value: 'Age (years)', position: 'insideBottom', offset: -5 }}
            stroke="#64748b"
          />
          <YAxis
            domain={[0, 100]}
            label={{ value: 'Cumulative Mortality Risk (%)', angle: -90, position: 'insideLeft' }}
            stroke="#64748b"
          />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
            formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(1)}%` : ''}
          />
          <Legend />

          {/* Render stacked areas for each disease */}
          {activeDiseases.map((disease, index) => (
            <Area
              key={disease.id}
              type="monotone"
              dataKey={disease.id}
              stackId="1"
              stroke={disease.color}
              fill={disease.color}
              fillOpacity={0.8}
              name={disease.name}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      <div className="chart-notes">
        <p className="note-item">
          <strong>How to read this chart:</strong> Each colored band represents a disease's contribution to your mortality risk.
          The total height shows your overall risk. For example, at age 70, if the chart shows 25% total height with
          Heart Disease taking up 10%, Stroke 6%, and Cancer 5%, this means your overall 70-year mortality risk is 25%,
          with Heart Disease contributing 10 percentage points of that risk.
        </p>
        <p className="note-item">
          <strong>Note:</strong> Values beyond 10 years are extrapolated estimates based on current risk factors.
          Actual risk depends on future lifestyle changes, medical advances, and other factors.
        </p>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  const prevAge = calculateAge(prevProps.profile);
  const nextAge = calculateAge(nextProps.profile);
  const prevRisk = prevProps.result.overallMortality.estimatedRisk;
  const nextRisk = nextProps.result.overallMortality.estimatedRisk;
  const prevSex = prevProps.profile.demographics?.biologicalSex?.value;
  const nextSex = nextProps.profile.demographics?.biologicalSex?.value;

  return prevAge === nextAge && prevRisk === nextRisk && prevSex === nextSex;
});

/**
 * Generate stacked mortality data - each disease contributes its portion
 */
function generateStackedMortalityData(
  currentAge: number,
  result: RiskCalculationResult,
  sex?: string
): Array<any> {
  const data: Array<any> = [];

  // Get disease-specific contributions
  const diseaseContributions = result.overallMortality.diseaseContributions || [];

  // Calculate total 10-year risk
  const totalTenYearRisk = result.overallMortality.estimatedRisk;

  // Create a map of disease ID to its proportional contribution
  const diseaseProportions = new Map<string, number>();
  diseaseContributions.forEach(dc => {
    // Each disease's contribution as a proportion of total risk (already 0-1, not 0-100)
    diseaseProportions.set(dc.diseaseId, dc.contribution);
  });

  // Get baseline mortality for calculating curves
  let cumulativeTotal = 0;

  // Generate data points from current age to 110
  for (let age = currentAge; age <= 110; age++) {
    const yearOffset = age - currentAge;

    // Determine if we should include this age in the chart (same logic as original)
    let shouldInclude = false;
    if (yearOffset <= 10) {
      shouldInclude = true;
    } else if (yearOffset <= 30) {
      shouldInclude = age % 2 === 0;
    } else {
      shouldInclude = age % 5 === 0;
    }

    if (!shouldInclude && yearOffset !== 0) {
      // Calculate but don't add to chart
      const avgRate = getBaselineAnnualMortality(age, sex);
      const multiplier = calculateRiskMultiplier(totalTenYearRisk, currentAge, sex);
      const personalRate = Math.min(avgRate * multiplier, 1.0);
      cumulativeTotal += personalRate * (1 - cumulativeTotal);
      continue;
    }

    // Build data point with all disease contributions
    const dataPoint: any = { age };

    if (yearOffset === 0) {
      // Starting point - all diseases at 0
      DISEASE_CONFIG.forEach(disease => {
        dataPoint[disease.id] = 0;
      });
    } else {
      // Calculate cumulative risk for this age
      const avgRate = getBaselineAnnualMortality(age, sex);
      const multiplier = calculateRiskMultiplier(totalTenYearRisk, currentAge, sex);
      const personalRate = Math.min(avgRate * multiplier, 1.0);
      cumulativeTotal += personalRate * (1 - cumulativeTotal);
      cumulativeTotal = Math.min(cumulativeTotal, 0.999);

      // Distribute total risk across diseases based on their proportional contributions
      const totalRiskPercent = cumulativeTotal * 100;

      diseaseProportions.forEach((proportion, diseaseId) => {
        dataPoint[diseaseId] = totalRiskPercent * proportion;
      });

      // Fill in zeros for diseases not present
      DISEASE_CONFIG.forEach(disease => {
        if (!(disease.id in dataPoint)) {
          dataPoint[disease.id] = 0;
        }
      });
    }

    data.push(dataPoint);
  }

  return data;
}

/**
 * Calculate the risk multiplier using same methodology as original chart
 */
function calculateRiskMultiplier(
  tenYearRisk: number,
  currentAge: number,
  sex?: string
): number {
  // Calculate average 10-year risk
  let survivalProb = 1.0;
  for (let year = 0; year < 10; year++) {
    const ageAtYear = currentAge + year;
    const annualRate = getBaselineAnnualMortality(ageAtYear, sex);
    survivalProb *= (1 - annualRate);
  }
  const averageTenYearRisk = 1 - survivalProb;

  // Initial multiplier
  const initialMultiplier = averageTenYearRisk > 0
    ? tenYearRisk / averageTenYearRisk
    : 1.0;

  // Calibrate
  let testCumulative = 0;
  for (let year = 0; year < 10; year++) {
    const testAge = currentAge + year;
    const baselineRate = getBaselineAnnualMortality(testAge, sex);
    const testRate = Math.min(baselineRate * initialMultiplier, 1.0);
    testCumulative += testRate * (1 - testCumulative);
  }

  const calibrationFactor = testCumulative > 0 ? tenYearRisk / testCumulative : 1.0;
  return initialMultiplier * calibrationFactor;
}

/**
 * Get baseline annual mortality rate (copied from original)
 */
function getBaselineAnnualMortality(age: number, sex?: string): number {
  const maleRates: Record<number, number> = {
    20: 0.0012, 25: 0.0013, 30: 0.0014, 35: 0.0016, 40: 0.0020,
    45: 0.0030, 50: 0.0046, 55: 0.0070, 60: 0.0106, 65: 0.0162,
    70: 0.0252, 75: 0.0398, 80: 0.0637, 85: 0.1028, 90: 0.1680
  };

  const femaleRates: Record<number, number> = {
    20: 0.0005, 25: 0.0005, 30: 0.0006, 35: 0.0008, 40: 0.0011,
    45: 0.0017, 50: 0.0027, 55: 0.0042, 60: 0.0066, 65: 0.0104,
    70: 0.0169, 75: 0.0279, 80: 0.0471, 85: 0.0809, 90: 0.1418
  };

  const rates = sex === 'female' ? femaleRates : maleRates;

  const ages = Object.keys(rates).map(Number).sort((a, b) => a - b);
  let closestAge = ages[0];

  for (const tableAge of ages) {
    if (age >= tableAge) {
      closestAge = tableAge;
    } else {
      break;
    }
  }

  const nextAge = ages[ages.indexOf(closestAge) + 1];
  if (nextAge && age > closestAge && age < nextAge) {
    const weight = (age - closestAge) / (nextAge - closestAge);
    return rates[closestAge] * (1 - weight) + rates[nextAge] * weight;
  }

  return rates[closestAge] || 0.001;
}
