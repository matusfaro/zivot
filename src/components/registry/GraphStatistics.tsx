/**
 * Statistics panel for the relationship graph
 * Shows metrics, coverage, and potential issues
 */

import React, { useMemo } from 'react';
import { RelationshipGraph, GraphStatistics as Stats } from '../../types/registry';

interface GraphStatisticsProps {
  graph: RelationshipGraph;
}

export function GraphStatistics({ graph }: GraphStatisticsProps) {
  const stats = useMemo(() => calculateStats(graph), [graph]);

  return (
    <div className="graph-statistics">
      <h3>Graph Statistics</h3>

      <div className="stat-grid">
        <StatCard label="Total Input Fields" value={graph.fields.size} />
        <StatCard label="Survey Questions" value={graph.questions.size} />
        <StatCard label="Risk Factors" value={graph.riskFactors.size} />
        <StatCard label="Diseases" value={graph.diseases.size} />
      </div>

      <div className="issue-detection">
        <h4>Potential Issues</h4>
        <IssueList
          type="warning"
          count={stats.fieldsWithNoCalculations.length}
          label="Input fields not used by any calculation"
          items={stats.fieldsWithNoCalculations.map((f) => f.label)}
        />
        <IssueList
          type="warning"
          count={stats.fieldsWithNoQuestions.length}
          label="Modifiable fields with no survey question"
          items={stats.fieldsWithNoQuestions.map((f) => f.label)}
        />
        <IssueList
          type="info"
          count={stats.questionsWithMultipleFields.length}
          label="Questions that map to multiple fields"
          items={stats.questionsWithMultipleFields.map((q) => q.question)}
        />
        <IssueList
          type="info"
          count={stats.derivedFields.length}
          label="Derived/calculated fields"
          items={stats.derivedFields.map((f) => f.label)}
        />
      </div>

      <div className="coverage-metrics">
        <h4>Coverage Metrics</h4>
        <ProgressBar
          label="Fields with calculations"
          value={stats.fieldsWithCalculations}
          total={graph.fields.size}
        />
        <ProgressBar
          label="Fields with questions"
          value={stats.fieldsWithQuestions}
          total={graph.fields.size}
        />
        <ProgressBar
          label="Modifiable fields covered"
          value={stats.modifiableFieldsCovered}
          total={stats.modifiableFieldsTotal}
        />
      </div>
    </div>
  );
}

/**
 * Calculate statistics from the graph
 */
function calculateStats(graph: RelationshipGraph): Stats {
  const fieldsWithNoCalculations = Array.from(graph.fields.values()).filter(
    (f) => f.usedByRiskFactors.length === 0 && f.type !== 'Derived'
  );

  const fieldsWithNoQuestions = Array.from(graph.fields.values()).filter(
    (f) => f.mappedFromQuestions.length === 0 && f.modifiable
  );

  const questionsWithMultipleFields = Array.from(graph.questions.values()).filter(
    (q) => q.mapsToFields.length > 1
  );

  const derivedFields = Array.from(graph.fields.values()).filter((f) => f.type === 'Derived');

  const fieldsWithCalculations = Array.from(graph.fields.values()).filter(
    (f) => f.usedByRiskFactors.length > 0
  ).length;

  const fieldsWithQuestions = Array.from(graph.fields.values()).filter(
    (f) => f.mappedFromQuestions.length > 0
  ).length;

  const modifiableFields = Array.from(graph.fields.values()).filter((f) => f.modifiable);
  const modifiableFieldsCovered = modifiableFields.filter(
    (f) => f.mappedFromQuestions.length > 0
  ).length;

  return {
    fieldsWithNoCalculations,
    fieldsWithNoQuestions,
    questionsWithMultipleFields,
    derivedFields,
    fieldsWithCalculations,
    fieldsWithQuestions,
    modifiableFieldsCovered,
    modifiableFieldsTotal: modifiableFields.length,
  };
}

/**
 * Stat card component
 */
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/**
 * Issue list component
 */
function IssueList({
  type,
  count,
  label,
  items,
}: {
  type: 'warning' | 'info';
  count: number;
  label: string;
  items: string[];
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (count === 0) {
    return null;
  }

  return (
    <div className={`issue-item ${type}`}>
      <div className="issue-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="issue-icon">{type === 'warning' ? '⚠️' : 'ℹ️'}</span>
        <span className="issue-count">{count}</span>
        <span className="issue-label">{label}</span>
        <span className="issue-toggle">{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="issue-details">
          <ul>
            {items.slice(0, 10).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
            {items.length > 10 && <li>...and {items.length - 10} more</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Progress bar component
 */
function ProgressBar({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="progress-bar">
      <div className="progress-label">
        {label}: {value}/{total} ({percentage}%)
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
