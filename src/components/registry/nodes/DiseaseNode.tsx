/**
 * Custom node component for diseases
 */

import React from 'react';
import { Handle, Position } from 'reactflow';

interface DiseaseNodeData {
  label: string;
  diseaseId: string;
  category: string;
  riskFactorCount: number;
}

export function DiseaseNode({ data }: { data: DiseaseNodeData }) {
  return (
    <div className={`disease-node ${data.category}`}>
      <div className="node-label">{data.label}</div>
      <div className="node-meta">{data.riskFactorCount} risk factors</div>

      {/* Target handle (left) - receives from risk factors */}
      <Handle type="target" position={Position.Left} id="left" />

      {/* Source handle (right) - connects to overall mortality */}
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}
