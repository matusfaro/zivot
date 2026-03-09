/**
 * ProvenanceTooltip - Display calculation provenance on hover
 *
 * Shows complete calculation trace with:
 * - Source values (from user profile or disease model)
 * - Mathematical formulas
 * - Intermediate calculation steps
 * - Scientific references
 */

import React, { useState } from 'react';
import { ProvenanceChain, ProvenanceStep, Reference } from '../../types/risk/provenance';
import { CitationPopover } from './CitationPopover';
import { Tooltip } from './Tooltip';

interface ProvenanceTooltipProps {
  /** The provenance chain to display */
  provenance?: ProvenanceChain;

  /** The content to wrap (what the user hovers over) */
  children: React.ReactNode;

  /** Display mode: inline (compact hover) or popup (detailed modal) */
  mode?: 'inline' | 'popup';

  /** Optional title for the tooltip */
  title?: string;

  /** Whether to show the tooltip */
  disabled?: boolean;
}

export const ProvenanceTooltip: React.FC<ProvenanceTooltipProps> = ({
  provenance,
  children,
  mode = 'inline',
  title,
  disabled = false,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  // Don't show tooltip if disabled or no provenance
  if (disabled || !provenance) {
    return <>{children}</>;
  }

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  const tooltipContent = (
    <div className="provenance-tooltip-content" onClick={(e) => e.stopPropagation()}>
      {title && <div className="provenance-tooltip-title">{title}</div>}

      <div className="provenance-steps">
        {provenance.steps.map((step, index) => (
          <ProvenanceStepDisplay
            key={index}
            step={step}
            stepNumber={index + 1}
            isExpanded={expandedSteps.has(index)}
            onToggle={() => toggleStep(index)}
          />
        ))}
      </div>

      {provenance.methodologyReferences && provenance.methodologyReferences.length > 0 && (
        <div className="provenance-methodology">
          <div className="methodology-label">Methodology:</div>
          {provenance.methodologyReferences.map((ref, idx) => (
            <CitationPopover key={idx} reference={ref} mode="full" />
          ))}
        </div>
      )}

      <style>{`
        .provenance-tooltip-content {
          min-width: 320px;
        }

        .provenance-tooltip-title {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        }

        .provenance-steps {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .provenance-methodology {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          font-size: 12px;
        }

        .methodology-label {
          font-weight: 600;
          color: #64748b;
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );

  return (
    <Tooltip
      content={tooltipContent}
      maxWidth={500}
      maxHeight={500}
      delay={100}
    >
      <div className="provenance-tooltip-trigger" style={{ display: 'inline-block', cursor: 'help' }}>
        {children}

        <style>{`
          .provenance-tooltip-trigger {
            border-bottom: 1px dotted #94a3b8;
          }
        `}</style>
      </div>
    </Tooltip>
  );
};

interface ProvenanceStepDisplayProps {
  step: ProvenanceStep;
  stepNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const ProvenanceStepDisplay: React.FC<ProvenanceStepDisplayProps> = ({
  step,
  stepNumber,
  isExpanded,
  onToggle,
}) => {
  return (
    <div className="provenance-step">
      <div className="step-header" onClick={onToggle}>
        <span className="step-number">Step {stepNumber}</span>
        <span className="step-toggle">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {step.explanation && (
        <div className="step-explanation">{step.explanation}</div>
      )}

      {step.formula && (
        <div className="step-formula">
          <code>{step.formula}</code>
        </div>
      )}

      {isExpanded && (
        <div className="step-details">
          {/* Input values */}
          {step.inputs.length > 0 && (
            <div className="step-inputs">
              <div className="detail-label">Inputs:</div>
              {step.inputs.map((input, idx) => (
                <div key={idx} className="input-value">
                  <span className="value-label">{input.label}:</span>
                  <span className="value-data">
                    {formatValue(input.value)}
                    {input.unit && <span className="value-unit"> {input.unit}</span>}
                  </span>
                  {input.source.type === 'user_input' && (
                    <span className="value-source">(from profile)</span>
                  )}
                  {input.reference && (
                    <CitationPopover reference={input.reference} mode="full" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Intermediate values */}
          {step.intermediateValues && step.intermediateValues.length > 0 && (
            <div className="step-intermediates">
              <div className="detail-label">Intermediate:</div>
              {step.intermediateValues.map((intermediate, idx) => (
                <div key={idx} className="intermediate-value">
                  {intermediate.label}: {formatValue(intermediate.value)}
                  {intermediate.formula && (
                    <span className="intermediate-formula"> = {intermediate.formula}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Output value */}
          <div className="step-output">
            <div className="detail-label">Output:</div>
            <div className="output-value">
              <span className="value-label">{step.output.label}:</span>
              <span className="value-data value-highlight">
                {formatValue(step.output.value)}
                {step.output.unit && <span className="value-unit"> {step.output.unit}</span>}
              </span>
            </div>
          </div>

          {/* References */}
          {step.references && step.references.length > 0 && (
            <div className="step-references">
              <div className="detail-label">References:</div>
              {step.references.map((ref, idx) => (
                <CitationPopover key={idx} reference={ref} mode="full" />
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .provenance-step {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px;
        }

        .step-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          user-select: none;
          padding: 4px;
          margin: -4px;
        }

        .step-header:hover {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .step-number {
          font-weight: 600;
          color: #475569;
          font-size: 12px;
        }

        .step-toggle {
          color: #94a3b8;
          font-size: 10px;
        }

        .step-explanation {
          color: #64748b;
          font-size: 12px;
          margin-top: 4px;
          font-style: italic;
        }

        .step-formula {
          margin-top: 6px;
          padding: 6px 8px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 11px;
          overflow-x: auto;
        }

        .step-formula code {
          color: #0f172a;
          background: none;
        }

        .step-details {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-label {
          font-weight: 600;
          color: #475569;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .step-inputs,
        .step-intermediates,
        .step-output,
        .step-references {
          font-size: 12px;
        }

        .input-value,
        .intermediate-value,
        .output-value {
          padding: 4px 8px;
          background: white;
          border-radius: 4px;
          margin-bottom: 4px;
        }

        .value-label {
          color: #64748b;
          margin-right: 4px;
        }

        .value-data {
          color: #0f172a;
          font-weight: 500;
        }

        .value-highlight {
          color: #0ea5e9;
          font-weight: 600;
        }

        .value-unit {
          color: #94a3b8;
          font-size: 11px;
        }

        .value-source {
          color: #94a3b8;
          font-size: 11px;
          margin-left: 4px;
          font-style: italic;
        }

        .intermediate-formula {
          color: #64748b;
          font-size: 11px;
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        }

        .step-references {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
      `}</style>
    </div>
  );
};

/**
 * Format a value for display
 */
function formatValue(value: number | string | boolean): string {
  if (typeof value === 'number') {
    // Format numbers with appropriate precision
    if (value === 0) return '0';
    if (Math.abs(value) < 0.01) return value.toExponential(2);
    if (Math.abs(value) < 1) return value.toFixed(4);
    if (Math.abs(value) < 100) return value.toFixed(2);
    return value.toFixed(1);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}
