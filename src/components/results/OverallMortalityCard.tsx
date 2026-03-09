import React from 'react';
import { Card } from '../common/Card';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { OverallMortalityRisk } from '../../types/risk/calculation';

interface OverallMortalityCardProps {
  mortality: OverallMortalityRisk;
  diseaseNames: Map<string, string>;
}

export const OverallMortalityCard: React.FC<OverallMortalityCardProps> = ({
  mortality,
  diseaseNames,
}) => {
  const riskPercent = (mortality.estimatedRisk * 100).toFixed(1);
  const rangeLow = (mortality.range[0] * 100).toFixed(1);
  const rangeHigh = (mortality.range[1] * 100).toFixed(1);
  const survivalPercent = ((1 - mortality.estimatedRisk) * 100).toFixed(1);

  const per100Deaths = Math.round(mortality.estimatedRisk * 100);
  const per100Survivors = 100 - per100Deaths;

  // Sort disease contributions by magnitude
  const sortedContributions = [...mortality.diseaseContributions].sort(
    (a, b) => b.contribution - a.contribution
  );

  const getRiskColor = () => {
    const percent = mortality.estimatedRisk * 100;
    if (percent < 5) return '#22c55e'; // Green
    if (percent < 10) return '#84cc16'; // Light green
    if (percent < 20) return '#eab308'; // Yellow
    if (percent < 30) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <Card className="overall-mortality-card featured-card">
      <div className="card-icon">⚕️</div>
      <h2>Overall {mortality.timeframe}-Year Mortality Risk</h2>

      <div className="mortality-summary">
        <div className="mortality-value" style={{ color: getRiskColor() }}>
          <span className="mortality-percent">{riskPercent}%</span>
        </div>

        <div className="mortality-range">
          Estimated range: {rangeLow}% – {rangeHigh}%
        </div>

        <div className="survival-rate">
          Survival probability: <strong>{survivalPercent}%</strong>
        </div>
      </div>

      <div className="mortality-interpretation">
        <p className="interpretation-text">
          If we took 100 people similar to you, about <strong>{per100Deaths}</strong> might
          not survive the next {mortality.timeframe} years, while{' '}
          <strong>{per100Survivors}</strong> would still be alive.
        </p>
      </div>

      <ConfidenceIndicator confidence={mortality.confidence} />

      {/* Disease breakdown */}
      <div className="disease-breakdown">
        <h3>Contributing Factors</h3>
        <p className="breakdown-intro">
          Your overall risk comes from these specific disease risks:
        </p>

        <div className="contribution-bars">
          {sortedContributions.map((contrib) => {
            const contributionPercent = (contrib.contribution * 100).toFixed(1);
            const diseaseName = diseaseNames.get(contrib.diseaseId) || contrib.diseaseId;

            return (
              <div key={contrib.diseaseId} className="contribution-item">
                <div className="contribution-label">
                  <span className="disease-name">{diseaseName}</span>
                  <span className="contribution-value">{contributionPercent}%</span>
                </div>
                <div className="contribution-bar-container">
                  <div
                    className="contribution-bar"
                    style={{
                      width: `${contrib.contribution * 100}%`,
                      backgroundColor: getRiskColor(),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mortality-note">
        <strong>Important:</strong> This is a statistical estimate based on population data
        and your personal risk factors. It does not predict your individual outcome, but
        helps identify areas where lifestyle changes could reduce your risk.
      </div>
    </Card>
  );
};
