import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { RiskCalculationResult } from '../../types/risk/calculation';
import { calculateAge } from '../../utils/dataExtraction';
import { UserProfile } from '../../types/user';
import { MortalityCurveDataPoint } from '../../types/risk/calculation';

interface MortalityRiskChartProps {
  result: RiskCalculationResult;
  profile: UserProfile;
}

/**
 * Custom tooltip showing calculation details
 */
interface CustomTooltipProps extends TooltipProps<number, string> {
  tenYearRisk: number;
  tenYearAverage: number;
  currentAge: number;
}

const CustomMortalityTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  tenYearRisk,
  tenYearAverage,
  currentAge,
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload as MortalityCurveDataPoint;
  const age = data.age;
  const yourRisk = data.validatedRisk ?? data.extrapolatedRisk;
  const averageRisk = data.averageRisk;

  // Calculate multiplier from 10-year validated period
  const multiplier = tenYearAverage > 0 ? tenYearRisk / tenYearAverage : 1;

  const isValidated = age <= currentAge + 10;
  const riskType = isValidated ? 'Validated' : 'Extrapolated';

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '12px',
        lineHeight: '1.6',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '8px', color: '#1e293b' }}>
        Age {age}: {yourRisk?.toFixed(1)}% risk
        {!isValidated && <span style={{ color: '#94a3b8', fontSize: '11px' }}> ({riskType})</span>}
      </div>

      <div style={{ color: '#64748b', fontSize: '11px', marginLeft: '8px' }}>
        <div style={{ marginBottom: '4px' }}>
          ├─ Baseline (population): {averageRisk.toFixed(1)}%
        </div>
        <div style={{ marginBottom: '4px' }}>
          ├─ Your multiplier: {multiplier.toFixed(2)}×
        </div>
        <div style={{ marginLeft: '12px', marginBottom: '4px', fontStyle: 'italic', color: '#94a3b8' }}>
          └─ From 10-year risk: {tenYearRisk.toFixed(1)}% ÷ {tenYearAverage.toFixed(1)}%
        </div>
        {yourRisk && (
          <div>
            └─ Personal risk: {averageRisk.toFixed(1)}% × {multiplier.toFixed(2)} = {yourRisk.toFixed(1)}%
          </div>
        )}
      </div>

      {!isValidated && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>
          Extrapolated estimate (assumes constant relative risk)
        </div>
      )}
    </div>
  );
};

export const MortalityRiskChart: React.FC<MortalityRiskChartProps> = React.memo(({ result, profile }) => {
  const currentAge = calculateAge(profile);

  if (!currentAge) {
    return null;
  }

  // Use pre-computed mortality curve from calculation result
  const chartData = result.overallMortality.mortalityCurve;

  if (!chartData || chartData.length === 0) {
    return <div>Unable to generate mortality curve (missing age data)</div>;
  }

  // Get 10-year risk values for tooltip calculations
  const tenYearRisk = result.overallMortality.estimatedRisk * 100;
  const tenYearDataPoint = chartData.find(d => d.age === currentAge + 10);
  const tenYearAverage = tenYearDataPoint?.averageRisk || tenYearRisk;

  // Generate decade ticks: current age, then every 10 years up to 110
  const decadeTicks = useMemo(() => {
    const ticks = [currentAge];
    const startDecade = Math.ceil(currentAge / 10) * 10;
    for (let age = startDecade; age <= 110; age += 10) {
      ticks.push(age);
    }
    return ticks;
  }, [currentAge]);

  return (
    <div className="mortality-risk-chart">
      <h3 className="chart-title">Mortality Risk Over Time</h3>
      <p className="chart-subtitle">
        Solid line: validated 10-year prediction. Dashed line: extrapolated estimate (less certain).
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            content={
              <CustomMortalityTooltip
                tenYearRisk={tenYearRisk}
                tenYearAverage={tenYearAverage}
                currentAge={currentAge}
              />
            }
          />
          <Legend />

          {/* Average mortality (baseline for comparison) */}
          <Line
            type="monotone"
            dataKey="averageRisk"
            stroke="#94a3b8"
            strokeWidth={2}
            dot={false}
            name="Average (for your age/sex)"
            isAnimationActive={false}
          />

          {/* Your risk - validated 10-year period */}
          <Line
            type="monotone"
            dataKey="validatedRisk"
            stroke="#ef4444"
            strokeWidth={3}
            dot={false}
            name="Your Risk (validated)"
            isAnimationActive={false}
          />

          {/* Your risk - extrapolated beyond 10 years */}
          <Line
            type="monotone"
            dataKey="extrapolatedRisk"
            stroke="#ef4444"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={false}
            opacity={0.5}
            name="Your Risk (extrapolated)"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="chart-notes">
        <p className="note-item">
          <strong>Note:</strong> Extrapolated values beyond 10 years maintain your current relative risk compared to population average.
          For example, if you have 1.5× average risk now, the projection assumes you'll stay at ~1.5× average as you age.
          Actual risk depends on future lifestyle changes, medical advances, and other unpredictable factors.
        </p>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the mortality curve data changes
  return prevProps.result.overallMortality.mortalityCurve === nextProps.result.overallMortality.mortalityCurve;
});
