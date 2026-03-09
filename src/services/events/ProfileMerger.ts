/**
 * Profile Merger Service
 *
 * Merges extrapolated values from habit events into the user profile with proper
 * provenance tracking. Extrapolated values use source: 'estimated' and won't
 * overwrite user-entered data.
 */

import { UserProfile } from '../../types/user';
import { DataPoint, TimeSeries } from '../../types/common/datapoint';
import { ExtrapolationResult } from '../../types/events/eventGroups';

export class ProfileMerger {
  /**
   * Merge extrapolated values into profile with proper provenance
   */
  mergeExtrapolatedData(
    profile: UserProfile,
    extrapolations: Map<string, ExtrapolationResult>
  ): UserProfile {
    const merged = { ...profile };

    for (const [path, result] of extrapolations) {
      if (result.value !== null) {
        this.setValueAtPath(
          merged,
          path,
          result.value,
          result.confidence,
          result.dataPoints,
          result.daysTracked
        );
      }
    }

    return merged;
  }

  /**
   * Set value at path with provenance tracking
   */
  private setValueAtPath(
    profile: UserProfile,
    path: string,
    value: number,
    confidence: 'high' | 'medium' | 'low' | 'estimated',
    dataPoints: number,
    daysTracked: number
  ): void {
    // Navigate to parent object
    const parts = path.split('.');
    const fieldName = parts.pop()!;
    let current: any = profile;

    for (const part of parts) {
      if (!current[part]) current[part] = {};
      current = current[part];
    }

    // Create DataPoint with 'estimated' provenance
    const dataPoint: DataPoint<number> = {
      value,
      confidence,
      provenance: {
        source: 'estimated',
        timestamp: Date.now(),
        sourceIdentifier: `events_${daysTracked}d_${dataPoints}pts`,
        enteredBy: 'import'  // System-generated
      },
      notes: `Extrapolated from ${dataPoints} logged events over ${daysTracked} days`
    };

    // Wrap in TimeSeries if path indicates it should be
    if (this.isTimeSeriesPath(path)) {
      // For TimeSeries, we update mostRecent but keep existing dataPoints
      const existingTimeSeries: TimeSeries<number> = current[fieldName] || { dataPoints: [] };

      current[fieldName] = {
        dataPoints: existingTimeSeries.dataPoints || [],
        mostRecent: dataPoint
      };
    } else {
      // For regular DataPoint fields
      current[fieldName] = dataPoint;
    }
  }

  /**
   * Check if path should be TimeSeries
   * These are the profile fields that track values over time
   */
  private isTimeSeriesPath(path: string): boolean {
    const timeSeriesPaths = [
      'lifestyle.alcohol.drinksPerWeek',
      'lifestyle.alcohol.pattern',
      'lifestyle.exercise.moderateMinutesPerWeek',
      'lifestyle.exercise.vigorousMinutesPerWeek',
      'lifestyle.exercise.strengthTrainingDaysPerWeek',
      'lifestyle.diet.vegetableServingsPerDay',
      'lifestyle.diet.fruitServingsPerDay',
      'lifestyle.diet.processedMeatServingsPerWeek',
      'lifestyle.diet.sugarSweetenedBeveragesPerWeek',
      'lifestyle.sleep.averageHoursPerNight',
      'lifestyle.sleep.sleepQuality',
      'lifestyle.outdoorTime.minutesPerWeek',
      'social.volunteering.hoursPerMonth',
      'biometrics.weight',
      'biometrics.bloodPressure',
      'biometrics.heartRate'
    ];

    return timeSeriesPaths.some(p => path.includes(p));
  }

  /**
   * Check if an existing value is user-entered (should not be overwritten)
   */
  isUserEntered(dataPoint: DataPoint<any> | undefined): boolean {
    if (!dataPoint) return false;
    return dataPoint.provenance.source === 'user_entered';
  }

  /**
   * Get value at path (for checking existing values)
   */
  getValueAtPath(profile: UserProfile, path: string): any {
    const parts = path.split('.');
    let current: any = profile;

    for (const part of parts) {
      if (!current || typeof current !== 'object') {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Merge strategy that preserves user-entered data
   * Returns true if merge should proceed, false if user data takes precedence
   */
  shouldMerge(profile: UserProfile, path: string): boolean {
    const existing = this.getValueAtPath(profile, path);

    // No existing value - safe to merge
    if (!existing) return true;

    // Check if existing is a DataPoint
    if (existing && typeof existing === 'object' && 'provenance' in existing) {
      const dataPoint = existing as DataPoint<any>;
      // Don't overwrite user-entered data
      if (this.isUserEntered(dataPoint)) {
        return false;
      }
    }

    // Check if existing is a TimeSeries
    if (existing && typeof existing === 'object' && 'mostRecent' in existing) {
      const timeSeries = existing as TimeSeries<any>;
      // Don't overwrite if mostRecent is user-entered
      if (timeSeries.mostRecent && this.isUserEntered(timeSeries.mostRecent)) {
        return false;
      }
    }

    // Safe to merge
    return true;
  }
}

// Singleton instance
export const profileMerger = new ProfileMerger();
