# Profile Persistence Fix Using `useDebounceProp`

## Problem Summary

**Current Issue:** Profile inputs don't read back state from persisted IndexedDB - they keep state in memory only.

**Example:**
1. User fills out SwipeSurvey → data saved to IndexedDB ✅
2. User navigates to Profile Editor → inputs show OLD memory state ❌
3. Data only syncs after full page refresh

---

## Current Architecture (Broken)

### `LiveDashboard.tsx` - Current Flow

```typescript
// ❌ PROBLEM: Local state initialized ONCE, never syncs with external changes
const [localProfile, setLocalProfile] = useState<any>(null);
const initializedRef = useRef(false);

useEffect(() => {
  if (!initializedRef.current && !loading) {
    setLocalProfile(profile);  // Only runs ONCE!
    initializedRef.current = true;
  }
}, [profile, loading]);

// User edits → updates localProfile
// IndexedDB updates (from SwipeSurvey) → IGNORED by localProfile
```

**Why It Fails:**
- `initializedRef` prevents re-syncing when `profile` changes from external sources
- `localProfile` becomes stale when IndexedDB is updated elsewhere
- Only a full page refresh re-initializes the state

---

## Solution: `useDebounceProp` Hook

### How It Works

```typescript
const [value, setValue, setValueImmediate] = useDebounceProp(
  initialValue,
  (newValue) => saveToDatabase(newValue), // Debounced
  () => console.log('User started editing')
);
```

**Key Features:**
1. **Immediate UI updates**: `setValue()` updates local state instantly
2. **Debounced persistence**: External setter (DB save) is debounced
3. **Pending tracking**: Knows when saves are in progress
4. **Change detection**: Callback when editing starts

### Return Values

| Return Value | Purpose | Example |
|-------------|---------|---------|
| `value` | Current state | `profile` |
| `setValue` | Debounced setter | `setProfile(newProfile)` - saves to DB after 50ms |
| `setValueImmediate` | Immediate setter | `setProfileImmediate(newProfile)` - bypasses debounce |

---

## Refactored `LiveDashboard.tsx`

### Before (Broken)

```typescript
const [localProfile, setLocalProfile] = useState<any>(null);
const debouncedProfile = useDebounce(localProfile, 50);

useEffect(() => {
  if (!initializedRef.current && !loading) {
    setLocalProfile(profile);  // ❌ Only runs once
    initializedRef.current = true;
  }
}, [profile, loading]);

useEffect(() => {
  if (debouncedProfile) {
    // Save to IndexedDB (debounced)
    updateDemographics(debouncedProfile.demographics);
  }
}, [debouncedProfile]);

// ❌ External changes to `profile` don't update `localProfile`
```

### After (Fixed)

```typescript
const saveProfile = useCallback((updatedProfile: UserProfile) => {
  // Save all sections to IndexedDB (called with debounce by hook)
  if (updatedProfile.demographics) {
    updateDemographics(updatedProfile.demographics);
  }
  if (updatedProfile.biometrics) {
    updateBiometrics(updatedProfile.biometrics);
  }
  if (updatedProfile.lifestyle) {
    updateLifestyle(updatedProfile.lifestyle);
  }
  if (updatedProfile.labTests) {
    updateLabTests(updatedProfile.labTests);
  }
  if (updatedProfile.medicalHistory) {
    updateMedicalHistory(updatedProfile.medicalHistory);
  }
}, [updateDemographics, updateBiometrics, updateLifestyle, updateLabTests, updateMedicalHistory]);

const [localProfile, setLocalProfile] = useDebounceProp(
  profile || {
    profileId: 'default',
    version: '1.0.0',
    lastUpdated: Date.now(),
  },
  saveProfile,  // Debounced DB save
  () => console.log('[PROFILE] User started editing')
);

// ✅ External changes automatically sync to localProfile
// ✅ User edits update UI immediately
// ✅ DB saves are debounced (not on every keystroke)
```

---

## Complete Example: Refactored LiveDashboard

```typescript
import React, { useState, useCallback } from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useRiskCalculation } from '../../hooks/useRiskCalculation';
import { useDebounceProp } from '../../hooks/useDebounceProp';

export const LiveDashboard: React.FC = () => {
  const {
    profile,
    loading,
    updateDemographics,
    updateBiometrics,
    updateLifestyle,
    updateLabTests,
    updateMedicalHistory
  } = useUserProfile();

  // Debounced save function
  const saveProfile = useCallback((updatedProfile: UserProfile) => {
    console.log('[PROFILE] Saving to IndexedDB (debounced)');

    if (updatedProfile.demographics) {
      updateDemographics(updatedProfile.demographics);
    }
    if (updatedProfile.biometrics) {
      updateBiometrics(updatedProfile.biometrics);
    }
    if (updatedProfile.lifestyle) {
      updateLifestyle(updatedProfile.lifestyle);
    }
    if (updatedProfile.labTests) {
      updateLabTests(updatedProfile.labTests);
    }
    if (updatedProfile.medicalHistory) {
      updateMedicalHistory(updatedProfile.medicalHistory);
    }
  }, [updateDemographics, updateBiometrics, updateLifestyle, updateLabTests, updateMedicalHistory]);

  // Use useDebounceProp for automatic sync + debounced saves
  const [localProfile, setLocalProfile] = useDebounceProp(
    profile || {
      profileId: 'default',
      version: '1.0.0',
      lastUpdated: Date.now(),
    },
    saveProfile,
    () => console.log('[PROFILE] User started editing')
  );

  // Risk calculation uses localProfile (always up-to-date)
  const { result, calculating } = useRiskCalculation(localProfile);

  return (
    <div>
      <CompactProfileEditor
        profile={localProfile}
        onProfileChange={setLocalProfile}  // ✅ Immediate UI update + debounced save
      />

      <RiskReportCard result={result} calculating={calculating} />
    </div>
  );
};
```

---

## Benefits of This Approach

### ✅ **Solves Sync Issues**
- External changes (from SwipeSurvey) automatically update `localProfile`
- No more stale state after navigation

### ✅ **Smooth UX**
- Typing feels instant (no lag)
- Database saves are debounced (performance)

### ✅ **Simpler Code**
- No `initializedRef` hacks
- No manual debounce management
- No complex sync logic

### ✅ **Pending State Tracking**
- Hook internally tracks pending saves
- Can extend to show "Saving..." indicator

---

## Migration Steps

1. **Replace state management** in `LiveDashboard.tsx`:
   ```typescript
   // Remove:
   const [localProfile, setLocalProfile] = useState<any>(null);
   const debouncedProfile = useDebounce(localProfile, 50);
   const initializedRef = useRef(false);

   // Add:
   const [localProfile, setLocalProfile] = useDebounceProp(profile, saveProfile);
   ```

2. **Remove complex useEffect sync logic**:
   ```typescript
   // Delete entire initialization useEffect
   // Delete debounced save useEffect
   ```

3. **Create saveProfile callback**:
   ```typescript
   const saveProfile = useCallback((p: UserProfile) => {
     // All IndexedDB saves here
   }, [dependencies]);
   ```

4. **Test thoroughly**:
   - Fill out SwipeSurvey → navigate to Profile Editor → verify inputs show correct values
   - Type in Profile Editor → verify no lag + saves work
   - Reload page → verify data persists

---

## Alternative: Add External Sync to Current Hook

If you want to keep the current architecture but fix the sync issue:

```typescript
// Add this to LiveDashboard
useEffect(() => {
  // Sync external changes when not actively editing
  if (profile && !calculating) {
    setLocalProfile(profile);
  }
}, [profile, calculating]);
```

**Pros:** Minimal change
**Cons:** May cause cursor jumping, less elegant

---

## Recommendation

**Use `useDebounceProp`** - it's the cleanest solution that:
- Eliminates all sync issues
- Provides better UX
- Simplifies the codebase
- Was designed exactly for this use case
