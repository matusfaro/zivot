import { useCallback, useEffect, useRef, useState } from 'react';
import { UserProfile } from '../types/user';
import { RiskCalculationResult } from '../types/risk/calculation';
import { getSharedRiskEngine } from '../engine/RiskEngine';

export function useRiskCalculation(profile: UserProfile | null) {
  const [result, setResult] = useState<RiskCalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Monotonic id so a slow calculation can never overwrite a newer result
  const calculationSeq = useRef(0);

  const calculate = useCallback(async () => {
    if (!profile) {
      return;
    }

    const seq = ++calculationSeq.current;
    try {
      setCalculating(true);
      setError(null);

      const engine = getSharedRiskEngine();
      await engine.initialize();

      const calculationResult = await engine.calculate(profile);
      if (seq === calculationSeq.current) {
        setResult(calculationResult);
      }
    } catch (err) {
      if (seq === calculationSeq.current) {
        setError(err as Error);
      }
      console.error('Risk calculation error:', err);
    } finally {
      if (seq === calculationSeq.current) {
        setCalculating(false);
      }
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      calculate();
    }
  }, [profile, calculate]);

  return {
    result,
    calculating,
    error,
    recalculate: calculate,
  };
}
