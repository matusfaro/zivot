import React, { useState } from 'react';
import { Card } from '../common/Card';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { DiseaseRisk } from '../../types/risk/calculation';

interface DiseaseRiskCardProps {
  risk: DiseaseRisk;
}

export const DiseaseRiskCard: React.FC<DiseaseRiskCardProps> = ({ risk }) => {
  const [showDetails, setShowDetails] = useState(false);

  const riskPercent = (risk.adjustedRisk * 100).toFixed(1);
  const baselinePercent = (risk.baselineRisk * 100).toFixed(1);
  const rangeLow = (risk.range[0] * 100).toFixed(1);
  const rangeHigh = (risk.range[1] * 100).toFixed(1);

  const getRiskColor = (riskValue: number) => {
    const percent = riskValue * 100;
    if (percent < 2) return '#22c55e'; // Green - very low
    if (percent < 5) return '#84cc16'; // Light green - low
    if (percent < 15) return '#eab308'; // Yellow - moderate
    if (percent < 30) return '#f97316'; // Orange - high
    return '#ef4444'; // Red - very high
  };

  const getRiskCategory = (riskValue: number) => {
    const percent = riskValue * 100;
    if (percent < 2) return 'Very Low';
    if (percent < 5) return 'Low';
    if (percent < 15) return 'Moderate';
    if (percent < 30) return 'High';
    return 'Very High';
  };

  // Get top 3 factor contributions
  const topFactors = risk.factorContributions
    .filter((c) => Math.abs(c.contribution) > 0.001)
    .slice(0, 3);

  return (
    <Card className="disease-risk-card">
      <div className="disease-header">
        <h3>{risk.diseaseName}</h3>
        <span className="timeframe">{risk.timeframe}-year risk</span>
      </div>

      <div className="risk-summary">
        <div className="risk-value" style={{ color: getRiskColor(risk.adjustedRisk) }}>
          <span className="risk-percent">{riskPercent}%</span>
          <span className="risk-category">{getRiskCategory(risk.adjustedRisk)}</span>
        </div>

        <div className="risk-range">
          Range: {rangeLow}% – {rangeHigh}%
        </div>
      </div>

      <ConfidenceIndicator confidence={risk.confidence} />

      {/* Comparison to baseline */}
      <div className="risk-comparison">
        <div className="comparison-item">
          <span className="label">Your risk:</span>
          <span className="value">{riskPercent}%</span>
        </div>
        <div className="comparison-item">
          <span className="label">Average for your age/sex:</span>
          <span className="value">{baselinePercent}%</span>
        </div>
        {risk.adjustedRisk !== risk.baselineRisk && (
          <div className="comparison-item difference">
            <span className="label">Difference:</span>
            <span
              className="value"
              style={{
                color: risk.adjustedRisk > risk.baselineRisk ? '#ef4444' : '#22c55e',
              }}
            >
              {risk.adjustedRisk > risk.baselineRisk ? '+' : ''}
              {((risk.adjustedRisk - risk.baselineRisk) * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Toggle details */}
      <button
        className="toggle-details"
        onClick={() => setShowDetails(!showDetails)}
        type="button"
      >
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>

      {showDetails && (
        <div className="risk-details">
          {/* Top contributing factors */}
          {topFactors.length > 0 && (
            <div className="factor-contributions">
              <h4>Key Risk Factors</h4>
              {topFactors.map((factor) => (
                <div key={factor.factorId} className="factor-item">
                  <div className="factor-header">
                    <span className="factor-name">{factor.factorName}</span>
                    {factor.modifiable && (
                      <span className="modifiable-badge">Modifiable</span>
                    )}
                  </div>
                  <div className="factor-impact">
                    <span className="hazard-ratio">HR: {factor.hazardRatio.toFixed(2)}</span>
                    <span
                      className="contribution"
                      style={{
                        color: factor.contribution > 0 ? '#ef4444' : '#22c55e',
                      }}
                    >
                      {factor.contribution > 0 ? '+' : ''}
                      {(factor.contribution * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Confidence details */}
          <div className="confidence-section">
            <h4>Data Confidence</h4>
            <ConfidenceIndicator confidence={risk.confidence} showDetails={true} />
          </div>
        </div>
      )}
    </Card>
  );
};
