/**
 * Custom node component for survey questions
 */

import React from 'react';
import { Handle, Position } from 'reactflow';

interface QuestionNodeData {
  label: string;
  questionId: string;
}

export function QuestionNode({ data }: { data: QuestionNodeData }) {
  return (
    <div className="question-node">
      <div className="node-icon">❓</div>
      <div className="node-label">{data.label}</div>
      <div className="node-id">{data.questionId}</div>

      {/* Target handle (left) - questions don't have inputs */}
      {/* Source handle (right) - connects to fields */}
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}
