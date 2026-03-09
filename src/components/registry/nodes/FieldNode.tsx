/**
 * Custom node component for user profile fields (inputs)
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import { FieldType, ProfileCategory } from '../../../types/registry';

interface FieldNodeData {
  label: string;
  fieldId: string;
  type: FieldType;
  category: ProfileCategory;
}

const typeIcons: Record<FieldType, string> = {
  DataPoint: '📌',
  TimeSeries: '📈',
  Array: '📋',
  Derived: '🔢',
};

export function FieldNode({ data }: { data: FieldNodeData }) {
  return (
    <div className={`field-node ${data.category.toLowerCase()}`}>
      <div className="node-icon">{typeIcons[data.type]}</div>
      <div className="node-label">{data.label}</div>
      <div className="node-category">{data.category}</div>

      {/* Target handle (left) - receives from questions */}
      <Handle type="target" position={Position.Left} id="left" />

      {/* Source handle (right) - connects to risk factors */}
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}
