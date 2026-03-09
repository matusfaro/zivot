/**
 * Foundational type for all user data points
 * Supports semantic, sparse, versioned storage with provenance
 */
export interface DataPoint<T = any> {
  value: T;
  provenance: Provenance;
  confidence?: ConfidenceLevel;
  notes?: string;
}

export interface Provenance {
  source: DataSource;
  timestamp: number; // Unix timestamp
  sourceIdentifier?: string; // e.g., "Lab Corp Report #12345"
  enteredBy?: 'user' | 'import' | 'device';
  version?: string; // Schema version when recorded
}

export type DataSource =
  | 'user_entered'
  | 'lab_report'
  | 'medical_record'
  | 'device_sync'
  | 'estimated'
  | 'family_report';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'estimated';

/**
 * Time series for measurements that change over time
 */
export interface TimeSeries<T> {
  dataPoints: DataPoint<T>[];
  mostRecent?: DataPoint<T>;
}

/**
 * Helper to get the most recent valid value
 */
export function getMostRecent<T>(series: TimeSeries<T>): DataPoint<T> | undefined {
  if (series.mostRecent) return series.mostRecent;
  if (series.dataPoints.length === 0) return undefined;
  return [...series.dataPoints].sort((a, b) =>
    b.provenance.timestamp - a.provenance.timestamp
  )[0];
}

/**
 * Helper to create a DataPoint with user-entered provenance
 */
export function createUserDataPoint<T>(value: T, notes?: string): DataPoint<T> {
  return {
    value,
    provenance: {
      source: 'user_entered',
      timestamp: Date.now(),
      enteredBy: 'user',
    },
    confidence: 'high',
    notes,
  };
}

/**
 * Helper to add a data point to a time series
 */
export function addToTimeSeries<T>(
  series: TimeSeries<T> | undefined,
  dataPoint: DataPoint<T>
): TimeSeries<T> {
  const existing = series || { dataPoints: [] };
  const updated = {
    dataPoints: [...existing.dataPoints, dataPoint],
    mostRecent: dataPoint,
  };
  return updated;
}
