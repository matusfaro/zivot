/**
 * Legend for the relationship graph
 * Explains node types and edge types
 */

import React from 'react';

export function GraphLegend() {
  return (
    <div className="graph-legend">
      <h3>Legend</h3>

      <div className="legend-section">
        <h4>Node Types</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-icon question-node-icon">❓</div>
            <span>Survey Question</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon field-node-icon">📌</div>
            <span>Input Field</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon risk-factor-node-icon">⚙️</div>
            <span>Risk Factor</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon disease-node-icon">🏥</div>
            <span>Disease</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon mortality-node-icon">⚠️</div>
            <span>Overall Mortality</span>
          </div>
        </div>
      </div>

      <div className="legend-section">
        <h4>Edge Types</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-line" style={{ borderColor: '#3b82f6' }} />
            <span>Question → Field</span>
          </div>
          <div className="legend-item">
            <div className="legend-line dashed" style={{ borderColor: '#10b981' }} />
            <span>Field → Risk Factor</span>
          </div>
          <div className="legend-item">
            <div className="legend-line" style={{ borderColor: '#f59e0b' }} />
            <span>Risk Factor → Disease</span>
          </div>
          <div className="legend-item">
            <div className="legend-line thick" style={{ borderColor: '#8b5cf6' }} />
            <span>Disease → Mortality</span>
          </div>
        </div>
      </div>

      <div className="legend-section">
        <h4>Evidence Strength (Risk Factors)</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: '#10b981' }} />
            <span>Strong</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: '#f59e0b' }} />
            <span>Moderate</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: '#ef4444' }} />
            <span>Limited</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: '#6366f1' }} />
            <span>Emerging</span>
          </div>
        </div>
      </div>
    </div>
  );
}
