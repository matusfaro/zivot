import React from 'react';
import { RiskCalculationResult } from '../../types/risk/calculation';

interface SurvivalHeroProps {
  result: RiskCalculationResult | null;
  calculating?: boolean;
}

/**
 * Overview hero: the headline 10-year survival estimate, framed positively,
 * with the population comparison, uncertainty range, and confidence.
 */
export const SurvivalHero: React.FC<SurvivalHeroProps> = ({ result, calculating }) => {
  if (!result) {
    return (
      <section className="hero" aria-label="Survival estimate">
        <div className="hero-main">
          <div className="hero-kicker">10-year survival</div>
          <div className="hero-number hero-empty">{calculating ? '…' : '—'}</div>
          <p className="hero-sub">Answer a few questions in the Survey tab to personalize your estimate.</p>
        </div>
      </section>
    );
  }

  const om = result.overallMortality;
  const survival = (1 - om.estimatedRisk) * 100;
  const [mLow, mHigh] = om.range;
  const survivalRange: [number, number] = [(1 - mHigh) * 100, (1 - mLow) * 100];
  const avgSurvival =
    om.populationBaselineRisk !== undefined ? (1 - om.populationBaselineRisk) * 100 : null;
  const vsAverage = avgSurvival !== null ? survival - avgSurvival : null;
  const confidence = om.confidence.level.replace('_', ' ');

  return (
    <section className="hero" aria-label="Survival estimate">
      <div className="hero-main">
        <div className="hero-kicker">10-year survival</div>
        <div className="hero-number">
          {survival.toFixed(1)}<small>%</small>
        </div>
        <p className="hero-sub">
          Likely range {survivalRange[0].toFixed(1)}–{survivalRange[1].toFixed(1)}% · confidence: {confidence}
        </p>
      </div>

      <div className="hero-facts">
        {avgSurvival !== null && (
          <div className="hero-fact">
            <div className="fact-label">Average for your age &amp; sex</div>
            <div className="fact-value">{avgSurvival.toFixed(1)}%</div>
          </div>
        )}
        {vsAverage !== null && (
          <div className="hero-fact">
            <div className="fact-label">You vs. average</div>
            <div className={`fact-value ${vsAverage >= 0 ? 'good' : 'bad'}`}>
              {vsAverage >= 0 ? '+' : ''}{vsAverage.toFixed(1)} pts
            </div>
          </div>
        )}
        {om.relativeHazard !== undefined && (
          <div className="hero-fact">
            <div className="fact-label">Relative hazard</div>
            <div className={`fact-value ${om.relativeHazard <= 1 ? 'good' : 'bad'}`}>
              {om.relativeHazard.toFixed(2)}×
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
