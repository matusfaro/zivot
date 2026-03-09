import React, { useState, useEffect } from 'react';
import { RiskCalculationResult } from '../../types/risk/calculation';
import { UserProfile } from '../../types/user';
import { MortalityRiskChart } from '../results/MortalityRiskChart';
import { DiseaseBreakdownBar } from '../results/DiseaseBreakdownBar';
import { RiskReportCard } from '../results/RiskReportCard';
import { ProvenanceTooltip } from '../common/ProvenanceTooltip';
import { RecommendationsPanel } from './RecommendationsPanel';

interface CompactRiskDisplayProps {
  result: RiskCalculationResult | null;
  calculating: boolean;
  error?: Error | null;
  profile: UserProfile | null;
}

export const CompactRiskDisplay: React.FC<CompactRiskDisplayProps> = ({ result, calculating, error, profile }) => {
  const [showDimming, setShowDimming] = useState(false);

  useEffect(() => {
    if (calculating) {
      // Only show dimming if calculation takes longer than 150ms
      const timer = setTimeout(() => {
        setShowDimming(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      // Immediately remove dimming when calculation completes
      setShowDimming(false);
    }
  }, [calculating]);
  if (error) {
    // Check if it's an age-related error
    const isAgeError = error.message.includes('Age is required');

    return (
      <div className="compact-risk-display">
        <div className="error-banner">
          <div className="error-banner-title">⚠️ Calculation Error</div>
          <div className="error-banner-message">{error.message}</div>
        </div>
        <div className="empty-message">
          {isAgeError ? (
            <p className="hint">Please enter your <strong>Date of Birth</strong> in the Demographics section to calculate risk.</p>
          ) : (
            <p className="hint">There was a problem calculating your risk. Try resetting your profile or check your data.</p>
          )}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="compact-risk-display empty">
        <div className="empty-message">
          <p>Enter your health information to see your risk assessment.</p>
          <p className="hint">Start with demographics and biometrics for basic calculations.</p>
        </div>
      </div>
    );
  }

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

  const diseaseNames = {
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
    nafld_cirrhosis_10year: 'Liver Disease',
    alzheimers_dementia_10year: "Alzheimer's / Dementia",
    motor_vehicle_crash_10year: 'Motor Vehicle Crash',
    falls_10year: 'Falls',
    influenza_pneumonia_10year: 'Flu / Pneumonia',
    drug_overdose_10year: 'Drug Overdose',
    esophageal_cancer_10year: 'Esophageal Cancer',
    liver_cancer_10year: 'Liver Cancer',
    bladder_cancer_10year: 'Bladder Cancer',
  };

  return (
    <div className={`compact-risk-display ${showDimming ? 'calculating' : ''}`}>
      {/* Overall Mortality - Featured */}
      <div className="risk-card featured">
        <div className="risk-card-header">
          <h3>10-Year Mortality Risk</h3>
        </div>
        <div className="risk-card-body">
          <ProvenanceTooltip
            provenance={result.overallMortality.provenance}
            title="Overall Mortality Risk Calculation"
          >
            <div
              className="risk-value-large"
              style={{ color: getRiskColor(result.overallMortality.estimatedRisk) }}
            >
              {(result.overallMortality.estimatedRisk * 100).toFixed(1)}%
            </div>
          </ProvenanceTooltip>
          <div className="risk-label">
            {getRiskLabel(result.overallMortality.estimatedRisk)} Risk
          </div>
          <div className="survival-stat">
            {((1 - result.overallMortality.estimatedRisk) * 100).toFixed(1)}% survival probability
          </div>
          <div className="confidence-mini">
            Confidence: <span className="confidence-value">{result.overallMortality.confidence.level}</span>
          </div>
        </div>
      </div>

      {/* Risk Report Card - Compact table showing all risks and protective factors */}
      <RiskReportCard result={result} />

      {/* Mortality Risk Chart and Breakdown */}
      {profile && (
        <div className="charts-container">
          <div className="chart-main">
            <MortalityRiskChart result={result} profile={profile} />
          </div>
          <div className="chart-sidebar">
            <DiseaseBreakdownBar result={result} />
          </div>
        </div>
      )}

      {/* Personalized Recommendations */}
      {result.interpretation?.recommendations && result.interpretation.recommendations.length > 0 && (
        <RecommendationsPanel recommendations={result.interpretation.recommendations} />
      )}
    </div>
  );
};
