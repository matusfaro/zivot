import { DataPoint, Provenance } from '../common/datapoint';

/**
 * CRITICAL: Store ALL lab markers, even unused ones
 * This is intentionally open-ended and extensible
 */
export interface LabTests {
  // Organized by common panels, but all optional
  lipidPanel?: LipidPanel;
  metabolicPanel?: MetabolicPanel;
  cbc?: CompleteBloodCount;
  kidneyFunction?: KidneyFunction;
  liverFunction?: LiverFunction;
  psa?: {
    dataPoints?: DataPoint<number>[];
    mostRecent?: DataPoint<number>;
  };
  vitaminD?: {
    dataPoints?: DataPoint<number>[]; // ng/mL
    mostRecent?: DataPoint<number>;
  };

  // Direct marker storage - key-value for ANY lab test
  // Key format: "marker_name" e.g., "ldl_cholesterol", "hba1c"
  markers?: Record<string, LabMarker>;

  // Store entire lab reports as structured data
  reports?: LabReport[];
}

export interface LabMarker {
  value: number;
  unit: string;
  referenceRange?: {
    low: number;
    high: number;
  };
  provenance: Provenance;
  flag?: 'high' | 'low' | 'critical' | 'normal';
}

export interface LipidPanel {
  totalCholesterol?: DataPoint<number>; // mg/dL
  ldlCholesterol?: DataPoint<number>;
  hdlCholesterol?: DataPoint<number>;
  triglycerides?: DataPoint<number>;
  nonHdlCholesterol?: DataPoint<number>;
  apolipoproteinB?: DataPoint<number>;
  lipoproteinA?: DataPoint<number>;
}

export interface MetabolicPanel {
  glucose?: DataPoint<number>; // mg/dL
  hba1c?: DataPoint<number>; // %
  insulin?: DataPoint<number>;
  creatinine?: DataPoint<number>;
  eGFR?: DataPoint<number>;
  alt?: DataPoint<number>;
  ast?: DataPoint<number>;
}

export interface CompleteBloodCount {
  wbc?: DataPoint<number>;
  rbc?: DataPoint<number>;
  hemoglobin?: DataPoint<number>;
  hematocrit?: DataPoint<number>;
  platelets?: DataPoint<number>;
}

export interface LabReport {
  reportId: string;
  date: number; // timestamp
  provider: string;
  allMarkers: Record<string, LabMarker>;
  rawData?: any; // Store original PDF/data if available
}

export interface KidneyFunction {
  egfr?: {
    dataPoints?: DataPoint<number>[];
    mostRecent?: DataPoint<number>;
  };
  serumCreatinine?: {
    dataPoints?: DataPoint<number>[];
    mostRecent?: DataPoint<number>;
  };
  urineACR?: {
    dataPoints?: DataPoint<number>[];
    mostRecent?: DataPoint<number>;
  };
}

export interface LiverFunction {
  ast?: {
    dataPoints?: DataPoint<number>[];
    mostRecent?: DataPoint<number>;
  };
  alt?: {
    dataPoints?: DataPoint<number>[];
    mostRecent?: DataPoint<number>;
  };
  plateletCount?: {
    dataPoints?: DataPoint<number>[];
    mostRecent?: DataPoint<number>;
  };
  albumin?: {
    dataPoints?: DataPoint<number>[];
    mostRecent?: DataPoint<number>;
  };
}
