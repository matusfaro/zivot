import React from 'react';
import { Card } from '../common/Card';
import { ModifiableLever } from '../../types/risk/calculation';

interface TopLeversPanelProps {
  levers: ModifiableLever[];
  diseaseNames: Map<string, string>;
}

export const TopLeversPanel: React.FC<TopLeversPanelProps> = ({ levers, diseaseNames }) => {
  if (levers.length === 0) {
    return (
      <Card title="💪 What You Can Change">
        <p className="no-levers">
          Great news! Based on your current data, you don't have any major modifiable risk
          factors. Keep up the healthy habits!
        </p>
      </Card>
    );
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low':
        return '#22c55e'; // Green
      case 'moderate':
        return '#eab308'; // Yellow
      case 'high':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const getEffortLabel = (effort: string) => {
    switch (effort) {
      case 'low':
        return 'Easy';
      case 'moderate':
        return 'Moderate';
      case 'high':
        return 'Challenging';
      default:
        return 'Unknown';
    }
  };

  const getImpactLabel = (reduction: number) => {
    const reductionPercent = reduction * 100;
    if (reductionPercent > 10) return 'High Impact';
    if (reductionPercent > 5) return 'Moderate Impact';
    return 'Low Impact';
  };

  return (
    <Card title="💪 What You Can Change" className="top-levers-panel">
      <p className="panel-intro">
        These are the modifiable factors that have the biggest impact on your overall risk.
        Small changes here can make a real difference!
      </p>

      <div className="levers-list">
        {levers.map((lever, index) => {
          const reductionPercent = (lever.potentialRiskReduction * 100).toFixed(1);
          const affectedDiseases = lever.diseases
            .map((id) => diseaseNames.get(id) || id)
            .join(', ');

          return (
            <div key={lever.factorId} className="lever-card">
              <div className="lever-header">
                <div className="lever-rank">#{index + 1}</div>
                <div className="lever-title">
                  <h4>{lever.factorName}</h4>
                  <span className="impact-badge">{getImpactLabel(lever.potentialRiskReduction)}</span>
                </div>
              </div>

              <div className="lever-impact">
                <div className="impact-value">
                  <span className="label">Potential risk reduction:</span>
                  <span className="value">{reductionPercent}%</span>
                </div>
              </div>

              <div className="lever-details">
                <div className="detail-row">
                  <span className="label">Effort required:</span>
                  <span
                    className="effort-badge"
                    style={{ backgroundColor: getEffortColor(lever.effort) }}
                  >
                    {getEffortLabel(lever.effort)}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="label">Expected timeframe:</span>
                  <span className="value">{lever.timeframe}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Affects:</span>
                  <span className="value diseases">{affectedDiseases}</span>
                </div>
              </div>

              {/* Action suggestion based on factor */}
              <div className="lever-suggestion">
                {getLeverSuggestion(lever.factorName)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel-footer">
        <p className="footer-note">
          <strong>Remember:</strong> You don't need to tackle everything at once. Start
          with one or two changes that feel manageable, and build from there.
        </p>
      </div>
    </Card>
  );
};

// Helper function to provide actionable suggestions
function getLeverSuggestion(factorName: string): string {
  const suggestions: Record<string, string> = {
    'LDL Cholesterol': '💊 Talk to your doctor about statins or dietary changes to lower LDL.',
    'HDL Cholesterol': '🏃 Regular exercise can raise HDL. Aim for 30+ minutes most days.',
    'Systolic Blood Pressure': '🧘 Reduce salt intake, exercise regularly, and manage stress. Medication may help.',
    'Smoking Status': '🚭 Quitting smoking is the single best thing you can do. Talk to your doctor about cessation aids.',
    'Body Mass Index': '🍎 Small, sustainable changes to diet and activity can make a big difference.',
    'Physical Activity Level': '🚶 Start with 10-minute walks and gradually increase. Every bit counts!',
    'Smoking Pack-Years': '🚭 While you can\'t undo past smoking, quitting now still significantly reduces risk.',
    'Waist Circumference': '💪 Combine cardiovascular exercise with strength training to reduce belly fat.',
    'Fasting Glucose': '🍽️ Focus on whole grains, vegetables, and lean proteins. Limit refined carbs.',
    'Drinks per Week': '🍷 Reduce alcohol to ≤7 drinks/week (women) or ≤14 drinks/week (men).',
    'Red/Processed Meat per Week': '🥗 Swap red meat for fish, poultry, or plant proteins several times a week.',
    'Vegetable Servings per Day': '🥦 Add one vegetable serving to each meal. Aim for variety and color.',
  };

  return suggestions[factorName] || '💡 Talk to your healthcare provider about strategies to improve this factor.';
}
