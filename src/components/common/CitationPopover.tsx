/**
 * CitationPopover - Display scientific references with hover details
 *
 * Shows abbreviated citation with full details on hover:
 * - Complete citation text
 * - DOI and URL links
 * - Evidence level badge
 * - Notes and methodology details
 */

import React from 'react';
import { Reference } from '../../types/risk/provenance';
import { Tooltip } from './Tooltip';

interface CitationPopoverProps {
  /** The scientific reference to display */
  reference: Reference;

  /** Display mode: inline (compact badge) or full (complete citation) */
  mode?: 'inline' | 'full';

  /** Optional custom className */
  className?: string;
}

export const CitationPopover: React.FC<CitationPopoverProps> = ({
  reference,
  mode = 'inline',
  className = '',
}) => {
  if (mode === 'full') {
    // Full mode: display complete citation without popover
    return (
      <div className={`citation-full ${className}`}>
        <div className="citation-text">{reference.fullCitation || reference.citation}</div>
        {reference.evidenceLevel && (
          <EvidenceLevelBadge level={reference.evidenceLevel} />
        )}
        {reference.doi && (
          <a
            href={`https://doi.org/${reference.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="citation-link"
          >
            DOI: {reference.doi}
          </a>
        )}
        {reference.url && !reference.doi && (
          <a
            href={reference.url}
            target="_blank"
            rel="noopener noreferrer"
            className="citation-link"
          >
            View Source
          </a>
        )}
        {reference.notes && (
          <div className="citation-notes">{reference.notes}</div>
        )}

        <style>{`
          .citation-full {
            font-size: 12px;
            color: #475569;
            padding: 8px;
            background: #f8fafc;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }

          .citation-text {
            margin-bottom: 6px;
            line-height: 1.4;
          }

          .citation-link {
            display: inline-block;
            color: #0ea5e9;
            text-decoration: none;
            font-size: 11px;
            margin-top: 4px;
          }

          .citation-link:hover {
            text-decoration: underline;
          }

          .citation-notes {
            margin-top: 6px;
            font-size: 11px;
            color: #64748b;
            font-style: italic;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
          }
        `}</style>
      </div>
    );
  }

  // Inline mode: show abbreviated badge with popover on hover
  const abbreviatedCitation = getAbbreviatedCitation(reference.citation);

  const popoverContent = (
    <div className="citation-popover-content" onClick={(e) => e.stopPropagation()}>
      <div className="citation-header">
        <span className="citation-title">Reference</span>
        {reference.evidenceLevel && (
          <EvidenceLevelBadge level={reference.evidenceLevel} />
        )}
      </div>

      <div className="citation-content">
        <div className="citation-text">
          {reference.fullCitation || reference.citation}
        </div>

        {reference.doi && (
          <a
            href={`https://doi.org/${reference.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="citation-link"
            onClick={(e) => e.stopPropagation()}
          >
            DOI: {reference.doi}
          </a>
        )}

        {reference.url && !reference.doi && (
          <a
            href={reference.url}
            target="_blank"
            rel="noopener noreferrer"
            className="citation-link"
            onClick={(e) => e.stopPropagation()}
          >
            View Source
          </a>
        )}

        {reference.notes && (
          <div className="citation-notes">{reference.notes}</div>
        )}
      </div>

      <style>{`
        .citation-popover-content {
          min-width: 280px;
        }

        .citation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid #e2e8f0;
        }

        .citation-title {
          font-weight: 600;
          color: #1e293b;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .citation-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .citation-text {
          color: #475569;
          line-height: 1.4;
          font-size: 12px;
        }

        .citation-link {
          color: #0ea5e9;
          text-decoration: none;
          font-size: 11px;
          margin-top: 2px;
          display: inline-block;
        }

        .citation-link:hover {
          text-decoration: underline;
        }

        .citation-notes {
          margin-top: 4px;
          font-size: 11px;
          color: #64748b;
          font-style: italic;
          padding-top: 6px;
          border-top: 1px solid #e2e8f0;
        }
      `}</style>
    </div>
  );

  return (
    <Tooltip
      content={popoverContent}
      maxWidth={400}
      delay={200}
    >
      <span className={`citation-inline ${className}`}>
        <span className="citation-badge">
          [{abbreviatedCitation}]
        </span>

        <style>{`
          .citation-inline {
            display: inline-block;
            cursor: pointer;
          }

          .citation-badge {
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
            border: 1px solid #bae6fd;
            transition: all 0.2s;
          }

          .citation-badge:hover {
            background: #bae6fd;
            border-color: #7dd3fc;
          }
        `}</style>
      </span>
    </Tooltip>
  );
};

/**
 * Evidence level badge with color coding
 */
interface EvidenceLevelBadgeProps {
  level: Reference['evidenceLevel'];
}

const EvidenceLevelBadge: React.FC<EvidenceLevelBadgeProps> = ({ level }) => {
  if (!level) return null;

  const config = getEvidenceLevelConfig(level);

  return (
    <span className={`evidence-badge evidence-${level}`}>
      {config.label}
      <style>{`
        .evidence-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .evidence-meta_analysis {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #86efac;
        }

        .evidence-rct {
          background: #dbeafe;
          color: #1e40af;
          border: 1px solid #93c5fd;
        }

        .evidence-cohort {
          background: #e0e7ff;
          color: #4338ca;
          border: 1px solid #a5b4fc;
        }

        .evidence-case_control {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }

        .evidence-expert_opinion {
          background: #f3f4f6;
          color: #4b5563;
          border: 1px solid #d1d5db;
        }
      `}</style>
    </span>
  );
};

/**
 * Get abbreviated citation (first author + year)
 * E.g., "Framingham Heart Study 2013" → "Framingham 2013"
 */
function getAbbreviatedCitation(citation: string): string {
  // Try to extract first word + year (e.g., "Framingham 2013")
  const yearMatch = citation.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : '';

  // Get first word or first two words
  const words = citation.split(/\s+/);
  const firstWord = words[0];

  // If first word is very short, include second word
  const prefix = firstWord.length <= 3 && words[1]
    ? `${firstWord} ${words[1]}`
    : firstWord;

  if (year) {
    return `${prefix} ${year}`;
  }

  // If no year found, just use first word(s) and ellipsis if needed
  return prefix.length > 20 ? `${prefix.substring(0, 17)}...` : prefix;
}

/**
 * Get evidence level configuration
 */
function getEvidenceLevelConfig(level: Reference['evidenceLevel']): {
  label: string;
  description: string;
} {
  switch (level) {
    case 'meta_analysis':
      return {
        label: 'Meta-Analysis',
        description: 'Systematic review of multiple studies',
      };
    case 'rct':
      return {
        label: 'RCT',
        description: 'Randomized Controlled Trial',
      };
    case 'cohort':
      return {
        label: 'Cohort Study',
        description: 'Observational cohort study',
      };
    case 'case_control':
      return {
        label: 'Case-Control',
        description: 'Case-control study',
      };
    case 'expert_opinion':
      return {
        label: 'Expert Opinion',
        description: 'Expert consensus or opinion',
      };
    default:
      return {
        label: 'Unknown',
        description: 'Evidence level not specified',
      };
  }
}
