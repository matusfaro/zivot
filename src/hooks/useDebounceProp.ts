import { useEffect, useRef, useState } from 'react';

/**
 * Simple ref wrapper for mutable values
 */
class Bag<T> {
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  get(): T {
    return this.value;
  }

  set(value: T): void {
    this.value = value;
  }
}

/**
 * Simple debounce implementation
 */
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Default debounce delay (50ms for profile updates)
 */
const DEFAULT_UPDATE_DELAY = 50;

/**
 * Similar to {@link React.useState}, but debounces setter. The new value is available immediately, but the provided
 * setter is debounced. Also syncs with external value changes when not actively editing.
 *
 * @param externalValue External value to sync with (e.g., from IndexedDB)
 * @param setter Setter function to be debounced (e.g., save to IndexedDB)
 * @param onAboutToChange Optional callback when changes are about to start
 * @param delay Debounce delay in milliseconds (default: 50ms)
 * @param editingTimeout Time to wait after last edit before syncing external changes (default: 2000ms)
 * @returns Tuple of [value, debouncedSetter, immediateSetter]
 *
 * @example
 * ```typescript
 * const [profile, setProfile, setProfileImmediate] = useDebounceProp(
 *   profileFromDB,  // Syncs when this changes (but not while editing)
 *   (p) => saveToDatabase(p),  // Debounced
 *   () => console.log('Starting edits')
 * );
 *
 * // User types: immediate UI update, debounced DB save
 * setProfile(newProfile);
 *
 * // External change (from SwipeSurvey): syncs after 2s of no edits
 * // profileFromDB changes → automatically synced to local state
 *
 * // Emergency: force immediate save without debounce
 * setProfileImmediate(newProfile);
 * ```
 */
export const useDebounceProp = <T,>(
  externalValue: T | (() => T),
  setter: (val: T) => void,
  onAboutToChange?: () => void,
  delay: number = DEFAULT_UPDATE_DELAY,
  editingTimeout: number = 2000
): [T, (val: T) => void, (val: T) => void] => {
  // Track how many updates are pending
  const inProgressCounter = useRef(new Bag<number>(0));

  // Track if user is actively editing
  const [isEditing, setIsEditing] = useState(false);
  const editingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track the last value we saved to distinguish our saves from external changes
  const lastSavedValue = useRef<string | null>(null);

  // Local state for immediate updates
  const [val, setVal] = useState<T>(externalValue);

  // Create debounced setter that decrements counter when it fires
  const setterDebouncedRef = useRef(setter);
  useEffect(() => {
    // In E2E test mode, use 0ms delay for deterministic tests
    const isE2ETestMode = import.meta.env.VITE_E2E_TEST_MODE === 'true';
    const effectiveDelay = isE2ETestMode ? 0 : delay;

    setterDebouncedRef.current = debounce((val: T) => {
      inProgressCounter.current.set(0);
      // Track what we're saving (excluding metadata)
      const stripMetadata = (obj: any) => {
        if (!obj || typeof obj !== 'object') return obj;
        const { lastUpdated, version, profileId, ...rest } = obj;
        return rest;
      };
      lastSavedValue.current = JSON.stringify(stripMetadata(val));
      setter(val);
    }, effectiveDelay);
  }, [setter, delay]);

  // Sync external value changes when not actively editing
  // Use JSON comparison to avoid syncing identical objects with different references
  // Exclude metadata fields that change on every save (lastUpdated, version, profileId)
  // Don't sync if the external value is just our own save coming back from the DB
  useEffect(() => {
    if (!isEditing) {
      const stripMetadata = (obj: any) => {
        if (!obj || typeof obj !== 'object') return obj;
        const { lastUpdated, version, profileId, ...rest } = obj;
        return rest;
      };

      const externalJSON = JSON.stringify(stripMetadata(externalValue));
      const localJSON = JSON.stringify(stripMetadata(val));

      // Don't sync if external value matches what we last saved (our own save coming back)
      if (externalJSON === lastSavedValue.current) {
        return;
      }

      if (externalJSON !== localJSON) {
        console.log('[useDebounceProp] Syncing external value change (not editing)');
        setVal(externalValue as T);
      }
    }
  }, [externalValue, isEditing, val]);

  // Debounced setter: updates local state immediately, debounces external setter
  const debouncedSetter = (newVal: T) => {
    // Mark as editing
    setIsEditing(true);

    // Clear previous editing timeout
    if (editingTimeoutRef.current) {
      clearTimeout(editingTimeoutRef.current);
    }

    // Set timeout to mark as not editing after period of inactivity
    editingTimeoutRef.current = setTimeout(() => {
      setIsEditing(false);
    }, editingTimeout);

    // Increment pending counter
    const currentCount = inProgressCounter.current.get() || 0;
    inProgressCounter.current.set(currentCount + 1);

    // Call onAboutToChange callback when first edit starts
    if (currentCount === 0) {
      onAboutToChange?.();
    }

    // Update local state immediately (no lag)
    setVal(newVal);

    // Call debounced setter (will fire after delay)
    setterDebouncedRef.current(newVal);
  };

  return [
    val,             // Current value
    debouncedSetter, // Setter with debounced external call + editing tracking
    setVal,          // Immediate setter (bypasses debounce)
  ];
};
