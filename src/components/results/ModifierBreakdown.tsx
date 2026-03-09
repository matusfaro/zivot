import React, { useMemo } from 'react';
import { ModifierSummary } from '../../types/risk/calculation';
import './ModifierBreakdown.css';

interface ModifierBreakdownProps {
  modifierSummary: ModifierSummary | undefined;
  totalRisk: number; // Overall 10-year mortality risk for percentage calculation
}

/**
 * ModifierBreakdown - Displays protective factors (mortality modifiers)
 * Shows how lifestyle choices like dog ownership, social connections, etc.
 * are reducing the user's mortality risk
 */
export const ModifierBreakdown: React.FC<ModifierBreakdownProps> = ({
  modifierSummary,
  totalRisk,
}) => {
  const modifiers = useMemo(() => {
    if (!modifierSummary || !modifierSummary.modifiers || modifierSummary.modifiers.length === 0) {
      return [];
    }

    // Filter to only show protective modifiers (negative contribution = reduces risk)
    // Sort by most protective first (most negative contribution)
    return modifierSummary.modifiers
      .filter((m) => m.totalContribution < 0)
      .sort((a, b) => a.totalContribution - b.totalContribution)
      .map((m) => ({
        ...m,
        percentageReduction: Math.abs((m.totalContribution / totalRisk) * 100),
        absoluteReduction: Math.abs(m.totalContribution * 100), // Convert to percentage
      }));
  }, [modifierSummary, totalRisk]);

  const totalProtectiveEffect = useMemo(() => {
    return modifiers.reduce((sum, m) => sum + m.absoluteReduction, 0);
  }, [modifiers]);

  if (modifiers.length === 0) {
    return null; // Don't show if no protective factors
  }

  // Get emoji for each modifier
  const getModifierEmoji = (modifierId: string): string => {
    switch (modifierId) {
      case 'dog_ownership':
        return '🐕';
      case 'social_connections':
        return '💚';
      case 'religious_attendance':
        return '⛪';
      case 'nature_exposure':
        return '🌳';
      case 'creative_hobbies':
        return '🎨';
      case 'volunteering':
        return '🤝';
      default:
        return '✨';
    }
  };

  // Get friendly description
  const getModifierDescription = (modifierId: string, avgHR: number): string => {
    const percentReduction = Math.round((1 - avgHR) * 100);
    switch (modifierId) {
      case 'dog_ownership':
        return `Dog ownership reduces mortality by ${percentReduction}% (Meta-analysis)`;
      case 'social_connections':
        return `Strong social connections reduce mortality by ${percentReduction}% (148 studies)`;
      case 'religious_attendance':
        return `Regular religious attendance reduces mortality by ${percentReduction}% (N=74k cohort)`;
      case 'nature_exposure':
        return `Time in nature (2+ hrs/week) reduces mortality by ${percentReduction}% (Meta-analysis)`;
      case 'creative_hobbies':
        return `Creative hobbies reduce mortality by ${percentReduction}% (N=79k cohort)`;
      case 'volunteering':
        return `Volunteering reduces mortality by ${percentReduction}% (Meta-analysis)`;
      default:
        return `Reduces mortality by ${percentReduction}%`;
    }
  };

  return (
    <div className="modifier-breakdown">
      <div className="modifier-header">
        <h3>✨ Protective Factors (Lifestyle)</h3>
        <p className="modifier-subtitle">
          These lifestyle choices are reducing your mortality risk
        </p>
      </div>

      <div className="modifier-list">
        {modifiers.map((modifier) => (
          <div key={modifier.modifierId} className="modifier-item">
            <div className="modifier-info">
              <span className="modifier-emoji">{getModifierEmoji(modifier.modifierId)}</span>
              <div className="modifier-details">
                <span className="modifier-name">{modifier.modifierName}</span>
                <span className="modifier-description">
                  {getModifierDescription(modifier.modifierId, modifier.averageHazardRatio)}
                </span>
              </div>
            </div>
            <div className="modifier-impact">
              <span className="impact-value">-{modifier.absoluteReduction.toFixed(1)}%</span>
              <span className="impact-label">
                {modifier.affectedDiseases} {modifier.affectedDiseases === 1 ? 'disease' : 'diseases'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="modifier-total">
        <span className="total-label">Total Protective Effect:</span>
        <span className="total-value">-{totalProtectiveEffect.toFixed(1)}%</span>
      </div>

      <div className="modifier-footer">
        <p className="evidence-note">
          💡 All effects based on published meta-analyses and large cohort studies
        </p>
      </div>
    </div>
  );
};
