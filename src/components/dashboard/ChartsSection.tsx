import React from 'react';
import { RiskCalculationResult } from '../../types/risk/calculation';
import { UserProfile } from '../../types/user';
import { MortalityRiskChart } from '../results/MortalityRiskChart';
import { DiseaseBreakdownBar } from '../results/DiseaseBreakdownBar';
import './ChartsSection.css';

interface ChartsSectionProps {
  result: RiskCalculationResult | null;
  profile: UserProfile | null;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ result, profile }) => {
  if (!result || !profile) {
    return null;
  }

  return (
    <div className="charts-section">
      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-main-column">
          <div className="chart-card">
            <div className="chart-card-header">
              <h3>Risk Over Time</h3>
              <p className="chart-subtitle">Projected mortality risk by age</p>
            </div>
            <div className="chart-card-body">
              <MortalityRiskChart result={result} profile={profile} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
