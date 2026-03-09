import React from 'react';
import { ConfidenceScore } from '../../types/risk/calculation';

interface ConfidenceIndicatorProps {
  confidence: ConfidenceScore;
  showDetails?: boolean;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  showDetails = false,
}) => {
  const getConfidenceColor = (level: ConfidenceScore['level']) => {
    switch (level) {
      case 'very_high':
        return '#22c55e'; // Green
      case 'high':
        return '#84cc16'; // Light green
      case 'moderate':
        return '#eab308'; // Yellow
      case 'low':
        return '#f97316'; // Orange
      case 'very_low':
        return '#ef4444'; // Red
    }
  };

  const getConfidenceLabel = (level: ConfidenceScore['level']) => {
    switch (level) {
      case 'very_high':
        return 'Very High';
      case 'high':
        return 'High';
      case 'moderate':
        return 'Moderate';
      case 'low':
        return 'Low';
      case 'very_low':
        return 'Very Low';
    }
  };

  const getConfidenceDescription = (level: ConfidenceScore['level']) => {
    switch (level) {
      case 'very_high':
        return 'We have comprehensive data for an accurate estimate.';
      case 'high':
        return 'We have most key data for a reliable estimate.';
      case 'moderate':
        return 'We have some key data, but more would improve accuracy.';
      case 'low':
        return 'Limited data available. Consider adding more information.';
      case 'very_low':
        return 'Minimal data available. This is a rough estimate only.';
    }
  };

  return (
    <div className="confidence-indicator">
      <div className="confidence-header">
        <span className="confidence-label">Confidence:</span>
        <span
          className="confidence-level"
          style={{ color: getConfidenceColor(confidence.level) }}
        >
          {getConfidenceLabel(confidence.level)}
        </span>
        <span className="confidence-score">({Math.round(confidence.score * 100)}%)</span>
      </div>

      {showDetails && (
        <div className="confidence-details">
          <p className="confidence-description">
            {getConfidenceDescription(confidence.level)}
          </p>

          {confidence.missingCriticalData && confidence.missingCriticalData.length > 0 && (
            <div className="missing-data">
              <strong>Missing key data:</strong>
              <ul>
                {confidence.missingCriticalData.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="help-text">
                Adding this information would improve the accuracy of your risk estimate.
              </p>
            </div>
          )}

          {confidence.dataQualityIssues && confidence.dataQualityIssues.length > 0 && (
            <div className="data-quality-issues">
              <strong>Data quality notes:</strong>
              <ul>
                {confidence.dataQualityIssues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
