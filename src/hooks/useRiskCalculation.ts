import { useState, useEffect } from 'react';
import { UserProfile } from '../types/user';
import { RiskCalculationResult } from '../types/risk/calculation';
import { RiskEngine } from '../engine/RiskEngine';

export function useRiskCalculation(profile: UserProfile | null) {
  const [result, setResult] = useState<RiskCalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (profile) {
      calculate();
    }
  }, [profile]);

  async function calculate() {
    if (!profile) {
      return;
    }

    try {
      setCalculating(true);
      setError(null);

      console.log('Calculating risk with profile:', profile);
      console.log('Demographics:', profile.demographics);
      console.log('Date of birth:', profile.demographics?.dateOfBirth);

      const engine = new RiskEngine();
      await engine.initialize();

      const calculationResult = await engine.calculate(profile);
      setResult(calculationResult);
    } catch (err) {
      setError(err as Error);
      console.error('Risk calculation error:', err);
    } finally {
      setCalculating(false);
    }
  }

  return {
    result,
    calculating,
    error,
    recalculate: calculate,
  };
}
