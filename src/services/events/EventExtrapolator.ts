/**
 * Event Extrapolator Service
 *
 * Converts discrete habit events into rolling aggregates (weekly/monthly averages).
 * Implements rolling window calculations with confidence scoring based on data completeness.
 */

import { HabitEvent, isAlcoholMetadata, isFoodMetadata, isExerciseMetadata, isSleepMetadata, isSocialMetadata } from '../../types/events/habitEvent';
import { ProfileMapping, ExtrapolationResult, ConfidenceLevel } from '../../types/events/eventGroups';

export class EventExtrapolator {
  /**
   * Calculate rolling window aggregate for a specific profile field
   */
  calculateRollingAggregate(
    events: HabitEvent[],
    mapping: ProfileMapping,
    now: number = Date.now()
  ): ExtrapolationResult {
    // 1. Filter events within rolling window
    const windowStart = now - (mapping.rollingWindow * 24 * 60 * 60 * 1000);
    const relevantEvents = events.filter(e =>
      e.timestamp >= windowStart && e.timestamp <= now
    );

    if (relevantEvents.length === 0) {
      return {
        value: null,
        confidence: 'estimated',
        dataPoints: 0,
        daysTracked: 0,
        completeness: 0
      };
    }

    // 2. Calculate based on aggregation type
    let value: number;
    switch (mapping.aggregationType) {
      case 'sum':
        value = this.calculateSum(relevantEvents);
        break;
      case 'average':
        value = this.calculateAverage(relevantEvents, mapping.rollingWindow);
        break;
      case 'count':
        value = this.countUniqueDays(relevantEvents);
        break;
      case 'latest':
        value = this.extractLatestValue(relevantEvents);
        break;
      default:
        throw new Error(`Unknown aggregation type: ${mapping.aggregationType}`);
    }

    // 3. Apply conversion factor
    if (mapping.conversionFactor) {
      value *= mapping.conversionFactor;
    }

    // 4. Calculate confidence
    const daysTracked = this.countUniqueDays(relevantEvents);
    const completeness = daysTracked / mapping.rollingWindow;
    const confidence = this.calculateConfidence(completeness, relevantEvents.length);

    return {
      value,
      confidence,
      dataPoints: relevantEvents.length,
      daysTracked,
      completeness
    };
  }

  /**
   * Calculate sum aggregation (e.g., weekly alcohol drinks)
   */
  private calculateSum(events: HabitEvent[]): number {
    return events.reduce((sum, event) => {
      const value = this.extractNumericValue(event);
      return sum + value;
    }, 0);
  }

  /**
   * Calculate average aggregation (e.g., daily vegetable servings)
   * For metrics like sleep where multiple entries per day should use the latest (not sum),
   * we group by day and take the most recent entry per day.
   */
  private calculateAverage(events: HabitEvent[], rollingWindow: number): number {
    if (events.length === 0) return 0;

    // Check if this is a "replacement" metric (like sleep) by checking event type
    const isReplacementMetric = events.length > 0 &&
      (events[0].eventType === 'sleep_night' || events[0].eventType === 'nap');

    if (isReplacementMetric) {
      // Group by day and take latest entry per day
      const latestPerDay = this.getLatestPerDay(events);
      const daysTracked = latestPerDay.size;
      if (daysTracked === 0) return 0;

      const total = Array.from(latestPerDay.values()).reduce((sum, event) => {
        return sum + this.extractNumericValue(event);
      }, 0);

      return total / daysTracked;
    } else {
      // For additive metrics (vegetables, fruit), sum all and divide by days
      const daysTracked = this.countUniqueDays(events);
      if (daysTracked === 0) return 0;

      const total = this.calculateSum(events);
      return total / daysTracked;
    }
  }

  /**
   * Group events by day and return latest event for each day
   */
  private getLatestPerDay(events: HabitEvent[]): Map<string, HabitEvent> {
    const byDay = new Map<string, HabitEvent>();

    for (const event of events) {
      const date = new Date(event.timestamp);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

      const existing = byDay.get(dayKey);
      if (!existing || event.timestamp > existing.timestamp) {
        byDay.set(dayKey, event);
      }
    }

    return byDay;
  }

  /**
   * Extract latest value (most recent event)
   */
  private extractLatestValue(events: HabitEvent[]): number {
    if (events.length === 0) return 0;

    // Sort by timestamp descending
    const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp);
    return this.extractNumericValue(sorted[0]);
  }

  /**
   * Count unique days with events
   */
  countUniqueDays(events: HabitEvent[]): number {
    const uniqueDays = new Set(
      events.map(e => {
        const date = new Date(e.timestamp);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
    );
    return uniqueDays.size;
  }

  /**
   * Calculate confidence based on tracking completeness
   *
   * High: ≥80% days tracked, ≥10 data points
   * Medium: ≥50% days tracked, ≥5 data points
   * Low: ≥30% days tracked, ≥3 data points
   * Estimated: <30% days tracked
   */
  calculateConfidence(
    completeness: number,
    dataPoints: number
  ): ConfidenceLevel {
    if (completeness >= 0.8 && dataPoints >= 10) return 'high';
    if (completeness >= 0.5 && dataPoints >= 5) return 'medium';
    if (completeness >= 0.3 && dataPoints >= 3) return 'low';
    return 'estimated';
  }

  /**
   * Extract numeric value from event metadata
   */
  extractNumericValue(event: HabitEvent): number {
    const metadata = event.metadata;

    if (isAlcoholMetadata(metadata)) {
      return metadata.drinks;
    }

    if (isFoodMetadata(metadata)) {
      return metadata.servings;
    }

    if (isExerciseMetadata(metadata)) {
      return metadata.minutes;
    }

    if (isSleepMetadata(metadata)) {
      return metadata.hours;
    }

    if (isSocialMetadata(metadata)) {
      return metadata.minutes || 0;
    }

    // Default: count as 1 (for count-based events)
    return 1;
  }

  /**
   * Get all unique days in the date range
   * Useful for calculating completeness when no events logged on some days
   */
  getDaysInRange(startTime: number, endTime: number): string[] {
    const days: string[] = [];
    const start = new Date(startTime);
    const end = new Date(endTime);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      days.push(dayKey);
    }

    return days;
  }
}

// Singleton instance
export const eventExtrapolator = new EventExtrapolator();
