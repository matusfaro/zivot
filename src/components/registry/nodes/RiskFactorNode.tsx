/**
 * Custom node component for risk factors
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import { EvidenceStrength } from '../../../types/knowledge/riskFactor';

interface RiskFactorNodeData {
  label: string;
  factorId: string;
  diseaseId: string;
  evidenceStrength: EvidenceStrength;
}

const strengthColors: Record<EvidenceStrength, string> = {
  strong: '#10b981',
  moderate: '#f59e0b',
  limited: '#ef4444',
  emerging: '#6366f1',
};

export function RiskFactorNode({ data }: { data: RiskFactorNodeData }) {
  return (
    <div className="risk-factor-node">
      <div
        className="node-strength-indicator"
        style={{ backgroundColor: strengthColors[data.evidenceStrength] }}
        title={`Evidence: ${data.evidenceStrength}`}
      />
      <div className="node-label">{data.label}</div>
      <div className="node-disease">{data.diseaseId.replace('_10year', '')}</div>

      {/* Target handle (left) - receives from fields */}
      <Handle type="target" position={Position.Left} id="left" />

      {/* Source handle (right) - connects to diseases */}
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}
