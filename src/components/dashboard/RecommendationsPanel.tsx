import React from 'react';
import { Recommendation } from '../../types/risk/calculation';
import './RecommendationsPanel.css';

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getPriorityIcon = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'moderate':
        return '🟡';
      case 'low':
        return '🟢';
    }
  };

  const getPriorityLabel = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'critical':
        return 'Critical Priority';
      case 'high':
        return 'High Priority';
      case 'moderate':
        return 'Moderate Priority';
      case 'low':
        return 'Low Priority';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'lifestyle':
        return '🏃';
      case 'screening':
        return '🩺';
      case 'medical':
        return '💊';
      case 'preventive':
        return '🛡️';
      default:
        return '📋';
    }
  };

  // Group recommendations by priority
  const groupedRecs = {
    critical: recommendations.filter(r => r.priority === 'critical'),
    high: recommendations.filter(r => r.priority === 'high'),
    moderate: recommendations.filter(r => r.priority === 'moderate'),
    low: recommendations.filter(r => r.priority === 'low'),
  };

  return (
    <div className="recommendations-panel">
      <div className="panel-header">
        <h3>🎯 Personalized Recommendations</h3>
        <p className="panel-subtitle">
          Evidence-based actions to reduce your risk
        </p>
      </div>

      <div className="recommendations-list">
        {(['critical', 'high', 'moderate', 'low'] as const).map(priority => {
          const recs = groupedRecs[priority];
          if (recs.length === 0) return null;

          return (
            <div key={priority} className={`priority-group priority-${priority}`}>
              <div className="priority-header">
                <span className="priority-icon">{getPriorityIcon(priority)}</span>
                <span className="priority-label">{getPriorityLabel(priority)}</span>
                <span className="priority-count">({recs.length})</span>
              </div>

              {recs.map((rec, index) => (
                <div key={`${priority}-${index}`} className="recommendation-card">
                  <div className="recommendation-header">
                    <span className="category-icon">{getCategoryIcon(rec.category)}</span>
                    <span className="category-label">{rec.category}</span>
                    {rec.potentialImpact !== undefined && (
                      <span className="impact-badge">
                        -{rec.potentialImpact.toFixed(1)}% risk
                      </span>
                    )}
                  </div>
                  <div className="recommendation-text">
                    {rec.text}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="panel-footer">
        <p className="disclaimer">
          <strong>Note:</strong> These recommendations are based on statistical models and population data.
          Always consult with your healthcare provider before making significant lifestyle or medical changes.
        </p>
      </div>
    </div>
  );
};
