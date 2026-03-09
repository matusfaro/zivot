import React, { useMemo } from 'react';
import { RiskCalculationResult } from '../../types/risk/calculation';
import { Tooltip } from '../common/Tooltip';

interface DiseaseBreakdownBarProps {
  result: RiskCalculationResult;
}

// Disease display configuration with colors (matching stacked chart)
const DISEASE_CONFIG: Record<string, { name: string; color: string }> = {
  'cvd_10year': { name: 'Heart Disease', color: '#ef4444' },
  'stroke_10year': { name: 'Stroke', color: '#f97316' },
  'lung_cancer_10year': { name: 'Lung Cancer', color: '#eab308' },
  'colorectal_cancer_10year': { name: 'Colorectal Cancer', color: '#84cc16' },
  'type2_diabetes_10year': { name: 'Type 2 Diabetes', color: '#06b6d4' },
  'breast_cancer_10year': { name: 'Breast Cancer', color: '#ec4899' },
  'prostate_cancer_10year': { name: 'Prostate Cancer', color: '#8b5cf6' },
  'copd_mortality_10year': { name: 'COPD', color: '#6366f1' },
  'ckd_progression_10year': { name: 'Kidney Disease', color: '#14b8a6' },
  'pancreatic_cancer_10year': { name: 'Pancreatic Cancer', color: '#f59e0b' },
  'nafld_cirrhosis_10year': { name: 'Liver Disease', color: '#10b981' },
  'alzheimers_dementia_10year': { name: "Alzheimer's", color: '#a855f7' },
};

export const DiseaseBreakdownBar: React.FC<DiseaseBreakdownBarProps> = ({ result }) => {
  // Calculate disease contributions sorted by size
  const sortedContributions = useMemo(() => {
    const contributions = result.overallMortality.diseaseContributions || [];
    const totalRisk = result.overallMortality.estimatedRisk;

    // dc.contribution is a proportion (marginalContribution / estimatedRisk)
    // We need both:
    // - marginalContribution (absolute risk %) for tooltips
    // - proportion (% of overall) for bar heights
    return contributions
      .map(dc => ({
        diseaseId: dc.diseaseId,
        name: DISEASE_CONFIG[dc.diseaseId]?.name || dc.diseaseId,
        color: DISEASE_CONFIG[dc.diseaseId]?.color || '#94a3b8',
        marginalContribution: dc.contribution * totalRisk * 100, // Actual mortality risk %
        proportion: dc.contribution * 100, // % of overall risk (for bar height)
      }))
      .filter(d => d.marginalContribution > 0.01) // Filter out negligible contributions
      .sort((a, b) => b.marginalContribution - a.marginalContribution); // Sort highest to lowest
  }, [result]);

  const totalRisk = result.overallMortality.estimatedRisk * 100;

  return (
    <div className="disease-breakdown-bar">
      <h3 className="chart-title">10-Year Risk Breakdown</h3>
      <p className="chart-subtitle">
        Hover over segments to see details
      </p>

      <div className="breakdown-container">
        {/* Stacked vertical bar */}
        <div className="stacked-bar-wrapper">
          <div className="stacked-bar">
            {sortedContributions.map((disease, index) => {
              const heightPercent = disease.proportion; // Proportion (0-100) for bar height

              const tooltipContent = (
                <div className="segment-tooltip-content">
                  <div className="tooltip-name">{disease.name}</div>
                  <div className="tooltip-percentage">{disease.marginalContribution.toFixed(1)}%</div>
                  <div className="tooltip-label">10-year mortality risk</div>
                </div>
              );

              return (
                <Tooltip
                  key={disease.diseaseId}
                  content={tooltipContent}
                  placement="left"
                  delay={100}
                  maxWidth={250}
                >
                  <div
                    className="bar-segment"
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: disease.color,
                    }}
                  />
                </Tooltip>
              );
            })}
          </div>
          <div className="bar-label">{totalRisk.toFixed(1)}%</div>
        </div>
      </div>

      <style>{`
        .disease-breakdown-bar {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .chart-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #1e293b;
        }

        .chart-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 20px 0;
        }

        .breakdown-container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .stacked-bar-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .stacked-bar {
          width: 120px;
          height: 400px;
          border-radius: 8px;
          overflow: visible;
          display: flex;
          flex-direction: column-reverse;
          background: #f1f5f9;
          border: 2px solid #e2e8f0;
          position: relative;
        }

        .bar-segment {
          position: relative;
          transition: all 0.2s ease;
          cursor: pointer;
          border-top: 1px solid rgba(255, 255, 255, 0.3);
          width: 100%;
        }

        .bar-segment:first-child {
          border-top: none;
        }

        .bar-segment:hover {
          filter: brightness(1.1);
          z-index: 10;
        }

        .segment-tooltip-content {
          text-align: center;
        }

        .tooltip-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .tooltip-percentage {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .tooltip-label {
          font-size: 12px;
          color: #64748b;
        }

        .bar-label {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }
      `}</style>
    </div>
  );
};
