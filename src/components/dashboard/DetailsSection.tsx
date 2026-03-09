import React from 'react';
import { RiskCalculationResult } from '../../types/risk/calculation';
import { ProvenanceTooltip } from '../common/ProvenanceTooltip';
import './DetailsSection.css';

interface DetailsSectionProps {
  result: RiskCalculationResult | null;
}

export const DetailsSection: React.FC<DetailsSectionProps> = ({ result }) => {
  if (!result) {
    return null;
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

  const getEffortColor = (effort: string): string => {
    switch (effort) {
      case 'low': return '#22c55e';
      case 'moderate': return '#eab308';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getEffortLabel = (effort: string): string => {
    switch (effort) {
      case 'low': return 'Easy';
      case 'moderate': return 'Moderate';
      case 'high': return 'Hard';
      default: return '';
    }
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

  // All risk information is now shown in the RiskReportCard component
  // This section is no longer needed
  return null;
};
