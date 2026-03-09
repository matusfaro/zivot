import React from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useRiskCalculation } from '../../hooks/useRiskCalculation';
import { OverallMortalityCard } from './OverallMortalityCard';
import { DiseaseRiskCard } from './DiseaseRiskCard';
import { TopLeversPanel } from './TopLeversPanel';

export const RiskDashboard: React.FC = () => {
  const { profile, loading: profileLoading } = useUserProfile();
  const { result, calculating, error } = useRiskCalculation(profile);

  // Create a map of disease IDs to friendly names
  const diseaseNames = new Map<string, string>([
    ['cvd_10year', 'Cardiovascular Disease'],
    ['colorectal_cancer_10year', 'Colorectal Cancer'],
    ['lung_cancer_10year', 'Lung Cancer'],
    ['type2_diabetes_10year', 'Type 2 Diabetes'],
  ]);

  // Loading state
  if (profileLoading) {
    return (
      <div className="risk-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  // No profile yet
  if (!profile) {
    return (
      <div className="risk-dashboard empty">
        <div className="empty-state">
          <h2>No Profile Found</h2>
          <p>
            You need to create a health profile before we can calculate your risk estimates.
          </p>
          <a href="/profile" className="button primary">
            Create Profile
          </a>
        </div>
      </div>
    );
  }

  // Calculating
  if (calculating) {
    return (
      <div className="risk-dashboard calculating">
        <div className="calculating-state">
          <div className="spinner"></div>
          <h2>Calculating Your Risk Estimates...</h2>
          <p>This will just take a moment.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="risk-dashboard error">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Calculation Error</h2>
          <p>We encountered an error while calculating your risk estimates:</p>
          <pre className="error-message">{error.message}</pre>
          <p>
            Please try updating your profile or contact support if the problem persists.
          </p>
          <a href="/profile" className="button secondary">
            Update Profile
          </a>
        </div>
      </div>
    );
  }

  // No results yet (shouldn't happen if profile exists)
  if (!result) {
    return (
      <div className="risk-dashboard empty">
        <div className="empty-state">
          <h2>No Results Available</h2>
          <p>Unable to calculate risk estimates at this time.</p>
          <a href="/profile" className="button primary">
            Update Profile
          </a>
        </div>
      </div>
    );
  }

  // Main results display
  return (
    <div className="risk-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Your Health Risk Assessment</h1>
        <p className="dashboard-intro">
          Based on your current health profile, here are your estimated disease risks over
          the next 10 years. These are statistical estimates to help you understand and
          manage your health, not predictions of your individual outcome.
        </p>
        <div className="dashboard-actions">
          <a href="/profile" className="button secondary">
            Update Profile
          </a>
        </div>
      </div>

      {/* Overall Mortality - Featured */}
      <section className="dashboard-section featured">
        <OverallMortalityCard mortality={result.overallMortality} diseaseNames={diseaseNames} />
      </section>

      {/* Individual Disease Risks */}
      <section className="dashboard-section">
        <h2 className="section-title">Individual Disease Risks</h2>
        <p className="section-intro">
          Your overall risk comes from these specific diseases. Each card shows your estimated
          10-year risk, how it compares to average, and what factors are driving your risk.
        </p>
        <div className="disease-grid">
          {result.diseaseRisks.map((diseaseRisk) => (
            <DiseaseRiskCard key={diseaseRisk.diseaseId} risk={diseaseRisk} />
          ))}
        </div>
      </section>

      {/* Top Modifiable Levers */}
      <section className="dashboard-section">
        <TopLeversPanel levers={result.topLevers} diseaseNames={diseaseNames} />
      </section>

      {/* Footer Notes */}
      <section className="dashboard-footer">
        <div className="disclaimer">
          <h3>Important Disclaimers</h3>
          <ul>
            <li>
              <strong>Not Medical Advice:</strong> These estimates are for informational and
              educational purposes only. They do not constitute medical advice, diagnosis, or
              treatment recommendations.
            </li>
            <li>
              <strong>Statistical Estimates:</strong> All risk percentages are based on
              population studies and statistical models. Your actual outcome depends on many
              factors we cannot measure.
            </li>
            <li>
              <strong>Data Limitations:</strong> The accuracy of these estimates depends on the
              completeness and accuracy of your input data. Missing or inaccurate data reduces
              confidence.
            </li>
            <li>
              <strong>Consult Your Doctor:</strong> Always discuss health concerns, test
              results, and lifestyle changes with qualified healthcare professionals who know
              your complete medical history.
            </li>
            <li>
              <strong>Privacy:</strong> All your data is stored locally in your browser. We do
              not collect, transmit, or store your health information on any server.
            </li>
          </ul>
        </div>

        <div className="data-sources">
          <h3>Data Sources & Methodology</h3>
          <p>
            Our risk calculations are based on published research and validated clinical models:
          </p>
          <ul>
            <li>
              <strong>Cardiovascular Disease:</strong> Framingham Heart Study risk equations
            </li>
            <li>
              <strong>Colorectal Cancer:</strong> SEER database and published cohort studies
            </li>
            <li>
              <strong>Lung Cancer:</strong> Smoking-based risk models from NCI
            </li>
            <li>
              <strong>Type 2 Diabetes:</strong> American Diabetes Association risk scores
            </li>
          </ul>
          <p className="methodology-note">
            All hazard ratios and baseline risks are derived from peer-reviewed scientific
            literature. Confidence intervals reflect data completeness, not inherent model
            uncertainty.
          </p>
        </div>
      </section>
    </div>
  );
};
