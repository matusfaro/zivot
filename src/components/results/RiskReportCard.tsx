import React, { useMemo } from 'react';
import { RiskCalculationResult } from '../../types/risk/calculation';
import { Tooltip } from '../common/Tooltip';
import './RiskReportCard.css';

interface RiskReportCardProps {
  result: RiskCalculationResult;
}

const DISEASE_NAMES: Record<string, string> = {
  cvd_10year: 'Heart Disease',
  colorectal_cancer_10year: 'Colorectal Cancer',
  lung_cancer_10year: 'Lung Cancer',
  type2_diabetes_10year: 'Type 2 Diabetes',
  stroke_10year: 'Stroke',
  breast_cancer_10year: 'Breast Cancer',
  prostate_cancer_10year: 'Prostate Cancer',
  copd_mortality_10year: 'COPD',
  ckd_progression_10year: 'Chronic Kidney Disease',
  pancreatic_cancer_10year: 'Pancreatic Cancer',
  nafld_cirrhosis_10year: 'Liver Disease (Cirrhosis)',
  alzheimers_dementia_10year: "Alzheimer's Disease",
  motor_vehicle_crash_10year: 'Motor Vehicle Crash',
  falls_10year: 'Falls',
  influenza_pneumonia_10year: 'Flu / Pneumonia',
  drug_overdose_10year: 'Drug Overdose',
  esophageal_cancer_10year: 'Esophageal Cancer',
  liver_cancer_10year: 'Liver Cancer',
  bladder_cancer_10year: 'Bladder Cancer',
};

export const RiskReportCard: React.FC<RiskReportCardProps> = ({ result }) => {
  // Prepare all factors (diseases/causes + protective factors)
  const allFactors = useMemo(() => {
    const risks = result.diseaseRisks.map((dr) => ({
      name: DISEASE_NAMES[dr.diseaseId] || dr.diseaseName,
      yourRisk: dr.adjustedRisk * 100,
      avgRisk: dr.baselineRisk * 100,
      status: dr.adjustedRisk > dr.baselineRisk ? 'elevated' : dr.adjustedRisk < dr.baselineRisk ? 'reduced' : 'average',
      isProtective: false,
    }));

    const protective = result.modifierSummary?.modifiers
      ?.filter((m) => m.totalContribution < 0)
      .map((m) => ({
        name: m.modifierName,
        yourRisk: Math.abs(m.totalContribution * 100), // Show as positive reduction
        avgRisk: 0,
        status: 'protective' as const,
        isProtective: true,
      })) || [];

    return [...risks, ...protective].sort((a, b) => b.yourRisk - a.yourRisk);
  }, [result.diseaseRisks, result.modifierSummary]);

  const overallRisk = result.overallMortality.estimatedRisk * 100;

  const getRiskColor = (risk: number) => {
    if (risk < 5) return '#22c55e'; // Green
    if (risk < 10) return '#84cc16'; // Light green
    if (risk < 20) return '#eab308'; // Yellow
    if (risk < 30) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getStatusIcon = (status: string) => {
    if (status === 'elevated') return '↑';
    if (status === 'reduced') return '↓';
    if (status === 'protective') return '↓';
    return '−';
  };

  const getTooltipContent = (factor: typeof allFactors[0]) => {
    if (factor.isProtective) {
      return (
        <div>
          <strong>{factor.name}</strong>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
            This lifestyle factor is reducing your overall mortality risk by <strong>{factor.yourRisk.toFixed(1)}%</strong> over 10 years.
          </p>
        </div>
      );
    }

    const statusText = factor.status === 'elevated'
      ? `higher than population average (${factor.avgRisk.toFixed(1)}%)`
      : factor.status === 'reduced'
      ? `lower than population average (${factor.avgRisk.toFixed(1)}%)`
      : `similar to population average (${factor.avgRisk.toFixed(1)}%)`;

    return (
      <div>
        <strong>{factor.name}</strong>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
          Your 10-year risk: <strong>{factor.yourRisk.toFixed(1)}%</strong>
        </p>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
          This is {statusText}.
        </p>
      </div>
    );
  };

  return (
    <div className="risk-report-card">
      <div className="report-header">
        <h3>10-Year Mortality Risk Report</h3>
        <p className="report-date">Risk Assessment</p>
      </div>

      {/* All Factors Section */}
      <div className="report-section">
        <div className="section-header">MORTALITY RISK FACTORS</div>
        <div className="report-table-wrapper">
          {allFactors.map((factor) => (
            <Tooltip
              key={factor.name}
              content={getTooltipContent(factor)}
              placement="top"
              delay={100}
              maxWidth={250}
            >
              <div className="risk-factor-item">
                <div className="risk-factor-row">
                  <span className="factor-name">{factor.name}</span>
                  <span className="factor-value" style={{ color: factor.isProtective ? '#22c55e' : getRiskColor(factor.yourRisk) }}>
                    {factor.isProtective ? '−' : ''}{factor.yourRisk.toFixed(1)}%
                  </span>
                  <span className={`status-badge status-${factor.status}`}>
                    {getStatusIcon(factor.status)}
                  </span>
                </div>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Overall Risk Section */}
      <div className="report-section report-summary">
        <div className="summary-content">
          <span className="summary-label">OVERALL 10-YEAR MORTALITY RISK</span>
          <span className="summary-value" style={{ color: getRiskColor(overallRisk) }}>
            {overallRisk.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};
