/**
 * Phase 2: Test descriptors for Bayesian updates
 */
export interface TestDescriptor {
  testId: string;
  name: string;
  type: TestType;

  // Bayesian parameters
  sensitivity: number; // True positive rate
  specificity: number; // True negative rate

  // When to apply this test
  applicability?: {
    ageRange?: [number, number];
    sex?: 'male' | 'female';
  };

  // How to extract test result from user data
  dataPath: string;

  // Interpretation
  positiveImplication: string;
  negativeImplication: string;
}

export type TestType =
  | 'screening'
  | 'diagnostic'
  | 'biomarker';
