import React from 'react';
import { RiskCalculationResult } from '../../types/risk/calculation';
import { ProvenanceTooltip } from '../common/ProvenanceTooltip';

interface HeaderProps {
  onLogoDoubleClick?: () => void;
  result?: RiskCalculationResult | null;
  calculating?: boolean;
  error?: Error | null;
  onResetProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoDoubleClick, result, calculating, error, onResetProfile }) => {
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

  return (
    <header className="app-header sticky-header">
      <div className="header-content">
        <div className="logo">
          <h1 onDoubleClick={onLogoDoubleClick} style={{ userSelect: 'none' }}>
            Zivot
          </h1>
        </div>

        {error ? (
          <div className="header-risk-display header-error">
            <div className="header-error-icon">⚠️</div>
            <div className="header-error-content">
              <div className="header-error-title">Calculation Error</div>
              <div className="header-error-message">
                {error.message.includes('Age is required')
                  ? 'Please enter your Date of Birth in Demographics'
                  : error.message}
              </div>
            </div>
          </div>
        ) : result && result.diseaseRisks.length > 0 ? (
          <div className="header-risk-display">
            <div className="header-risk-label">
              10-Year Mortality Risk
              {calculating && <span className="calculating-dot"></span>}
            </div>
            <ProvenanceTooltip
              provenance={result.overallMortality.provenance}
              title="Overall Mortality Risk Calculation"
            >
              <div
                className="header-risk-value"
                style={{ color: getRiskColor(result.overallMortality.estimatedRisk) }}
              >
                {(result.overallMortality.estimatedRisk * 100).toFixed(1)}%
              </div>
            </ProvenanceTooltip>
          </div>
        ) : null}

        {onResetProfile && (
          <button
            onClick={onResetProfile}
            className="reset-button header-reset-button"
            title="Reset entire profile"
          >
            RESET ALL
          </button>
        )}
      </div>
    </header>
  );
};
