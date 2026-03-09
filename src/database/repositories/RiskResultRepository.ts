import { db } from '../db';
import { RiskCalculationResult } from '../../types/risk/calculation';
import { v4 as uuidv4 } from 'uuid';

export class RiskResultRepository {
  /**
   * Save a risk calculation result
   */
  async saveResult(result: RiskCalculationResult): Promise<void> {
    const calculationId = result.calculationId || uuidv4();

    await db.riskCalculations.put({
      calculationId,
      profileId: result.profileVersion, // Link to profile version
      timestamp: result.timestamp,
      profileVersion: result.profileVersion,
      data: { ...result, calculationId },
    });
  }

  /**
   * Get the most recent risk calculation
   */
  async getMostRecent(): Promise<RiskCalculationResult | null> {
    const record = await db.riskCalculations
      .orderBy('timestamp')
      .reverse()
      .first();

    return record?.data || null;
  }

  /**
   * Get all risk calculations (for history/trends)
   */
  async getAll(): Promise<RiskCalculationResult[]> {
    const records = await db.riskCalculations
      .orderBy('timestamp')
      .reverse()
      .toArray();

    return records.map((r) => r.data);
  }

  /**
   * Get calculations within a time range
   */
  async getByTimeRange(startTime: number, endTime: number): Promise<RiskCalculationResult[]> {
    const records = await db.riskCalculations
      .where('timestamp')
      .between(startTime, endTime)
      .reverse()
      .toArray();

    return records.map((r) => r.data);
  }

  /**
   * Clear all calculation history
   */
  async clearAll(): Promise<void> {
    await db.riskCalculations.clear();
  }

  /**
   * Delete a specific calculation
   */
  async deleteCalculation(calculationId: string): Promise<void> {
    await db.riskCalculations.delete(calculationId);
  }
}

export const riskResultRepository = new RiskResultRepository();
