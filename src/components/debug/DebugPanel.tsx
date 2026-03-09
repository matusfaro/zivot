import React, { useState, useEffect } from 'react';
import { RiskCalculationResult } from '../../types/risk/calculation';
import { UserProfile } from '../../types/user';

interface DebugPanelProps {
  profile: UserProfile | null;
  result: RiskCalculationResult | null;
  onClose: () => void;
  onProfileUpdate?: (profile: UserProfile) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ profile, result, onClose, onProfileUpdate }) => {
  const [profileJson, setProfileJson] = useState(JSON.stringify(profile, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync profileJson with profile prop changes
  useEffect(() => {
    setProfileJson(JSON.stringify(profile, null, 2));
  }, [profile]);

  // Prepare chart data (the actual numbers the charts receive)
  const chartData = result ? {
    mortalityRiskChart: {
      // Pre-computed mortality curve data points
      curveData: result.overallMortality.mortalityCurve || [],
      dataPointCount: result.overallMortality.mortalityCurve?.length || 0,
      // Show sample of first and last few points
      samplePoints: {
        first5: result.overallMortality.mortalityCurve?.slice(0, 5) || [],
        last5: result.overallMortality.mortalityCurve?.slice(-5) || [],
      }
    },
    diseaseBreakdownBar: {
      totalRisk: result.overallMortality.estimatedRisk * 100,
      contributions: result.overallMortality.diseaseContributions?.map(dc => ({
        diseaseId: dc.diseaseId,
        contribution: dc.contribution,
        percentage: dc.contribution * result.overallMortality.estimatedRisk * 100,
      })).sort((a, b) => b.percentage - a.percentage) || [],
    },
  } : null;

  const handleCopyAll = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      profile,
      calculations: result,
      chartData,
    };

    navigator.clipboard.writeText(JSON.stringify(debugData, null, 2))
      .then(() => alert('Debug data copied to clipboard!'))
      .catch(err => alert('Failed to copy: ' + err.message));
  };

  const handleProfileJsonChange = (newJson: string) => {
    setProfileJson(newJson);
    try {
      const parsed = JSON.parse(newJson);
      setJsonError(null);
      // Optionally auto-apply if valid
    } catch (err) {
      setJsonError((err as Error).message);
    }
  };

  const handleApplyProfile = () => {
    try {
      const parsed = JSON.parse(profileJson);
      setJsonError(null);
      if (onProfileUpdate) {
        onProfileUpdate(parsed);
        alert('Profile updated!');
      }
    } catch (err) {
      setJsonError((err as Error).message);
      alert('Invalid JSON: ' + (err as Error).message);
    }
  };

  return (
    <div className="debug-panel-overlay" onClick={onClose}>
      <div className="debug-panel" onClick={(e) => e.stopPropagation()}>
        <div className="debug-header">
          <h2>🐛 Debug Panel</h2>
          <div className="debug-actions">
            <button onClick={handleCopyAll} className="debug-button">
              📋 Copy All to Clipboard
            </button>
            <button onClick={onClose} className="debug-button close">
              ✕ Close
            </button>
          </div>
        </div>

        <div className="debug-content">
          {/* User Profile - Editable */}
          <section className="debug-section">
            <h3>User Profile (Editable)</h3>
            <div className="json-editor-container">
              <textarea
                className={`json-editor ${jsonError ? 'error' : ''}`}
                value={profileJson}
                onChange={(e) => handleProfileJsonChange(e.target.value)}
                spellCheck={false}
              />
              {jsonError && <div className="json-error">❌ {jsonError}</div>}
              <button
                onClick={handleApplyProfile}
                className="debug-button apply"
                disabled={!!jsonError}
              >
                Apply Profile Changes
              </button>
            </div>
          </section>

          {/* Calculation Results - Readonly */}
          <section className="debug-section">
            <h3>Calculation Results (Readonly)</h3>
            <pre className="json-display">{JSON.stringify(result, null, 2)}</pre>
          </section>

          {/* Chart Data - What the charts actually receive */}
          <section className="debug-section">
            <h3>Chart Display Data (Numbers Only)</h3>
            <div className="chart-data-grid">
              <div>
                <h4>Mortality Risk Chart Data</h4>
                <pre className="json-display">{JSON.stringify(chartData?.mortalityRiskChart, null, 2)}</pre>
              </div>
              <div>
                <h4>Disease Breakdown Bar Data</h4>
                <pre className="json-display">{JSON.stringify(chartData?.diseaseBreakdownBar, null, 2)}</pre>
              </div>
            </div>
          </section>
        </div>

        <style>{`
          .debug-panel-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .debug-panel {
            background: white;
            border-radius: 12px;
            width: 95%;
            max-width: 1400px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }

          .debug-header {
            padding: 20px;
            border-bottom: 2px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8fafc;
            border-radius: 12px 12px 0 0;
          }

          .debug-header h2 {
            margin: 0;
            font-size: 24px;
            color: #1e293b;
          }

          .debug-actions {
            display: flex;
            gap: 12px;
          }

          .debug-button {
            padding: 8px 16px;
            border: 2px solid #3b82f6;
            background: white;
            color: #3b82f6;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s;
          }

          .debug-button:hover {
            background: #3b82f6;
            color: white;
          }

          .debug-button.close {
            border-color: #ef4444;
            color: #ef4444;
          }

          .debug-button.close:hover {
            background: #ef4444;
            color: white;
          }

          .debug-button.apply {
            width: 100%;
            margin-top: 8px;
            border-color: #10b981;
            color: #10b981;
          }

          .debug-button.apply:hover:not(:disabled) {
            background: #10b981;
            color: white;
          }

          .debug-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .debug-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .debug-section {
            background: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }

          .debug-section h3 {
            margin: 0 0 12px 0;
            font-size: 18px;
            color: #1e293b;
            font-weight: 600;
          }

          .debug-section h4 {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: #475569;
            font-weight: 600;
          }

          .json-editor-container {
            display: flex;
            flex-direction: column;
          }

          .json-editor {
            width: 100%;
            min-height: 300px;
            padding: 12px;
            font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
            font-size: 13px;
            border: 2px solid #cbd5e1;
            border-radius: 6px;
            background: white;
            resize: vertical;
          }

          .json-editor.error {
            border-color: #ef4444;
          }

          .json-error {
            margin-top: 8px;
            padding: 8px 12px;
            background: #fee2e2;
            color: #991b1b;
            border-radius: 4px;
            font-size: 13px;
          }

          .json-display {
            background: white;
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
            font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.5;
            border: 1px solid #cbd5e1;
            margin: 0;
            max-height: 400px;
            overflow-y: auto;
          }

          .chart-data-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          @media (max-width: 1024px) {
            .chart-data-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </div>
  );
};
