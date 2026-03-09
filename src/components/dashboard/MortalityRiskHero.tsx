import React from 'react';
import { RiskCalculationResult } from '../../types/risk/calculation';
import { ProvenanceTooltip } from '../common/ProvenanceTooltip';
import './MortalityRiskHero.css';

interface MortalityRiskHeroProps {
  result: RiskCalculationResult | null;
  calculating: boolean;
  error?: Error | null;
}

export const MortalityRiskHero: React.FC<MortalityRiskHeroProps> = ({ result, calculating, error }) => {
  const getRiskColor = (risk: number) => {
    const percent = risk * 100;
    if (percent < 5) return '#22c55e';
    if (percent < 10) return '#84cc16';
    if (percent < 20) return '#eab308';
    if (percent < 30) return '#f97316';
    return '#ef4444';
  };

  const getRiskLabel = (risk: number) => {
    const percent = risk * 100;
    if (percent < 5) return 'Low';
    if (percent < 15) return 'Moderate';
    if (percent < 30) return 'High';
    return 'Very High';
  };

  if (error) {
    const isAgeError = error.message.includes('Age is required');

    return (
      <div className="mortality-risk-hero error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <div className="error-text">
            <h3>Calculation Error</h3>
            <p>{error.message}</p>
            {isAgeError && (
              <p className="hint">Please enter your <strong>Date of Birth</strong> to calculate risk.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="mortality-risk-hero empty">
        <div className="empty-content">
          <div className="empty-icon">📊</div>
          <h3>Welcome to Your Mortality Risk Calculator</h3>
          <p>Enter your health information below to see your personalized risk assessment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mortality-risk-hero ${calculating ? 'calculating' : ''}`}>
      <div className="hero-content">
        <div className="hero-label">
          <h2>Your 10-Year Mortality Risk</h2>
          {calculating && (
            <span className="calculating-badge">
              <span className="pulse"></span> Calculating...
            </span>
          )}
        </div>

        <div className="hero-risk">
          <ProvenanceTooltip
            provenance={result.overallMortality.provenance}
            title="Overall Mortality Risk Calculation"
          >
            <div
              className="hero-risk-value"
              style={{ color: getRiskColor(result.overallMortality.estimatedRisk) }}
            >
              {(result.overallMortality.estimatedRisk * 100).toFixed(1)}%
            </div>
          </ProvenanceTooltip>

          <div className="hero-risk-label">
            {getRiskLabel(result.overallMortality.estimatedRisk)} Risk
          </div>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="stat-value">
              {((1 - result.overallMortality.estimatedRisk) * 100).toFixed(1)}%
            </div>
            <div className="stat-label">Survival Probability</div>
          </div>

          <div className="hero-stat">
            <div className="stat-value confidence-badge" data-level={result.overallMortality.confidence.level}>
              {result.overallMortality.confidence.level}
            </div>
            <div className="stat-label">Confidence</div>
          </div>
        </div>
      </div>
    </div>
  );
};
