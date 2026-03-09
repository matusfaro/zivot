/**
 * Custom node component for overall mortality
 */

import React from 'react';
import { Handle, Position } from 'reactflow';

interface MortalityNodeData {
  label: string;
}

export function MortalityNode({ data }: { data: MortalityNodeData }) {
  return (
    <div className="mortality-node">
      <div className="node-icon">⚠️</div>
      <div className="node-label">{data.label}</div>

      {/* Target handle (left) - receives from all diseases */}
      <Handle type="target" position={Position.Left} id="left" />

      {/* No source handle - this is the final output */}
    </div>
  );
}
